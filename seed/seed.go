// Package seed populates a fresh preview instance's database from a
// snapshot in Google Cloud Storage.
//
// Preview instances run on Fly.io with no durable storage, so the first
// thing a new one does is download a (sanitized) copy of the production
// database. Authentication is keyless: Fly hands every Machine a short-lived
// OIDC token describing itself, and Google Cloud's Workload Identity
// Federation trusts those tokens, so the exchange goes
//
//	Fly local socket  ->  OIDC JWT (aud = Audience)
//	Google STS        ->  federated access token for the identity provider
//	GCS JSON API      ->  the object, streamed straight into the db file
//
// Nothing here is Fly-specific beyond where the OIDC token comes from.
package seed

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/klauspost/compress/zstd"
)

// Defaults, overridable through Options for tests.
const (
	DefaultAudience = "crossme-preview"
	flySocket       = "/.fly/api"
	flyTokenURL     = "http://localhost/v1/tokens/oidc"
	stsURL          = "https://sts.googleapis.com/v1/token"
	storageURL      = "https://storage.googleapis.com"
	storageScope    = "https://www.googleapis.com/auth/devstorage.read_only"

	// sqliteHeader is the magic string every SQLite database starts with;
	// we check for it so a wrong object (or an error page) fails here
	// instead of as a baffling "file is not a database" later.
	sqliteHeader = "SQLite format 3\x00"
)

// Options says where the snapshot is and how to prove who we are.
type Options struct {
	// Source is the snapshot's location, as gs://bucket/path/to/object. An
	// object whose name ends in .zst is decompressed on the way down.
	Source string
	// IdentityProvider is the full resource name of the Workload Identity
	// Federation provider that trusts Fly's tokens:
	// //iam.googleapis.com/projects/N/locations/global/workloadIdentityPools/P/providers/Q
	IdentityProvider string
	// Audience is the aud claim requested for the Fly token, which must be
	// one of the provider's allowed audiences. Empty means DefaultAudience.
	Audience string

	// Test hooks: the Fly agent's unix socket, the STS and storage
	// endpoints. Empty means the real thing.
	FlySocket  string
	STSURL     string
	StorageURL string
}

// Ensure makes sure the database at dbPath exists, downloading the snapshot
// described by opts if it doesn't. An existing file is left alone, so a
// preview keeps its state across restarts while the file survives.
func Ensure(ctx context.Context, dbPath string, opts Options) error {
	if _, err := os.Stat(dbPath); err == nil {
		log.Printf("seed: %s already exists, not seeding", dbPath)
		return nil
	} else if !errors.Is(err, os.ErrNotExist) {
		return fmt.Errorf("stat %s: %w", dbPath, err)
	}

	bucket, object, err := parseGSURL(opts.Source)
	if err != nil {
		return err
	}
	if opts.IdentityProvider == "" {
		return errors.New("seed: no identity provider configured")
	}

	flyToken, err := fetchFlyToken(ctx, opts)
	if err != nil {
		return fmt.Errorf("getting Fly OIDC token: %w", err)
	}
	accessToken, err := exchangeToken(ctx, opts, flyToken)
	if err != nil {
		return fmt.Errorf("exchanging Fly token with Google STS: %w", err)
	}

	log.Printf("seed: downloading %s to %s", opts.Source, dbPath)
	if err := download(ctx, opts, bucket, object, accessToken, dbPath); err != nil {
		return fmt.Errorf("downloading %s: %w", opts.Source, err)
	}
	log.Printf("seed: done")
	return nil
}

func parseGSURL(s string) (bucket, object string, err error) {
	u, err := url.Parse(s)
	if err != nil || u.Scheme != "gs" || u.Host == "" || len(u.Path) < 2 {
		return "", "", fmt.Errorf("seed: source %q is not a gs://bucket/object URL", s)
	}
	return u.Host, strings.TrimPrefix(u.Path, "/"), nil
}

// fetchFlyToken asks the Fly agent, listening on a unix socket inside every
// Machine, for an OIDC token identifying this Machine to the given audience.
// The response body is the bare JWT.
func fetchFlyToken(ctx context.Context, opts Options) (string, error) {
	socket := opts.FlySocket
	if socket == "" {
		socket = flySocket
	}
	aud := opts.Audience
	if aud == "" {
		aud = DefaultAudience
	}
	client := &http.Client{
		Transport: &http.Transport{
			DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
				var d net.Dialer
				return d.DialContext(ctx, "unix", socket)
			},
		},
	}

	body, _ := json.Marshal(map[string]string{"aud": aud})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, flyTokenURL, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%s: %s", resp.Status, strings.TrimSpace(string(raw)))
	}
	// Be tolerant of the token arriving as a JSON string rather than bare.
	token := strings.TrimSpace(string(raw))
	if strings.HasPrefix(token, `"`) {
		if err := json.Unmarshal([]byte(token), &token); err != nil {
			return "", fmt.Errorf("unexpected token response %q", token)
		}
	}
	if strings.Count(token, ".") != 2 {
		return "", errors.New("response does not look like a JWT")
	}
	return token, nil
}

// exchangeToken trades the Fly JWT for a Google access token via the
// Security Token Service, the standard Workload Identity Federation step.
func exchangeToken(ctx context.Context, opts Options, subjectToken string) (string, error) {
	endpoint := opts.STSURL
	if endpoint == "" {
		endpoint = stsURL
	}
	body, _ := json.Marshal(map[string]string{
		"audience":           opts.IdentityProvider,
		"grantType":          "urn:ietf:params:oauth:grant-type:token-exchange",
		"requestedTokenType": "urn:ietf:params:oauth:token-type:access_token",
		"scope":              storageScope,
		"subjectTokenType":   "urn:ietf:params:oauth:token-type:jwt",
		"subjectToken":       subjectToken,
	})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	raw, err := io.ReadAll(io.LimitReader(resp.Body, 1<<20))
	if err != nil {
		return "", err
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("%s: %s", resp.Status, strings.TrimSpace(string(raw)))
	}
	var parsed struct {
		AccessToken string `json:"access_token"`
	}
	if err := json.Unmarshal(raw, &parsed); err != nil {
		return "", fmt.Errorf("parsing STS response: %w", err)
	}
	if parsed.AccessToken == "" {
		return "", errors.New("STS response has no access_token")
	}
	return parsed.AccessToken, nil
}

// download streams the object into dbPath, decompressing zstd if the object
// name says so. It writes to a temporary file alongside and renames at the
// end, so a failed download never leaves a truncated database behind.
func download(ctx context.Context, opts Options, bucket, object, accessToken, dbPath string) error {
	base := opts.StorageURL
	if base == "" {
		base = storageURL
	}
	// The JSON API wants the object name as a single path segment, so the
	// slashes in it must be escaped.
	endpoint := fmt.Sprintf("%s/storage/v1/b/%s/o/%s?alt=media",
		base, url.PathEscape(bucket), url.PathEscape(object))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, endpoint, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		msg, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
		return fmt.Errorf("%s: %s", resp.Status, strings.TrimSpace(string(msg)))
	}

	var body io.Reader = resp.Body
	if strings.HasSuffix(object, ".zst") {
		dec, err := zstd.NewReader(resp.Body)
		if err != nil {
			return err
		}
		defer dec.Close()
		body = dec
	}

	tmp, err := os.CreateTemp(filepath.Dir(dbPath), filepath.Base(dbPath)+".seed-*")
	if err != nil {
		return err
	}
	defer func() {
		tmp.Close()
		os.Remove(tmp.Name()) // no-op once renamed
	}()

	header := make([]byte, len(sqliteHeader))
	if _, err := io.ReadFull(body, header); err != nil {
		return fmt.Errorf("reading header: %w", err)
	}
	if string(header) != sqliteHeader {
		return errors.New("snapshot is not a SQLite database")
	}
	if _, err := tmp.Write(header); err != nil {
		return err
	}
	if _, err := io.Copy(tmp, body); err != nil {
		return err
	}
	if err := tmp.Sync(); err != nil {
		return err
	}
	if err := tmp.Close(); err != nil {
		return err
	}
	return os.Rename(tmp.Name(), dbPath)
}
