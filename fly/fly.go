// Package fly talks to the Fly.io Machine identity system.
//
// Every Fly Machine can obtain a short-lived OIDC token describing itself
// (app, org, machine) from the Fly agent listening on a unix socket inside
// the Machine, and Fly publishes the keys to verify those tokens per
// organization at https://oidc.fly.io/<org-slug>. That gives a Machine a
// keyless way to prove who it is to anyone who trusts Fly: the seed package
// uses it towards Google Cloud, and the auth package uses it so a preview
// instance can prove to production which preview it is.
package fly

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
)

const (
	// DefaultSocket is where the Fly agent listens inside a Machine.
	DefaultSocket = "/.fly/api"
	tokenURL      = "http://localhost/v1/tokens/oidc"
)

// OIDCToken asks the Fly agent on socket (DefaultSocket if empty) for an
// OIDC token identifying this Machine to audience. The result is the bare
// JWT.
func OIDCToken(ctx context.Context, socket, audience string) (string, error) {
	if socket == "" {
		socket = DefaultSocket
	}
	client := &http.Client{
		Transport: &http.Transport{
			DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
				var d net.Dialer
				return d.DialContext(ctx, "unix", socket)
			},
		},
	}

	body, _ := json.Marshal(map[string]string{"aud": audience})
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, tokenURL, bytes.NewReader(body))
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

// A Verifier checks Machine tokens issued by one Fly organization for one
// audience, using the org's published keys.
type Verifier struct {
	issuer   string
	audience string

	mu       sync.Mutex
	verifier *oidc.IDTokenVerifier // nil until discovery succeeds
}

// NewVerifier prepares to verify tokens from issuer, an organization's
// issuer URL like https://oidc.fly.io/my-org, minted for audience. The
// issuer's configuration and keys are fetched on first use, not here, so
// that a Fly outage can't keep a server from starting.
func NewVerifier(issuer, audience string) *Verifier {
	return &Verifier{issuer: issuer, audience: audience}
}

// load returns the underlying verifier, discovering the issuer's
// configuration if that hasn't succeeded yet.
func (v *Verifier) load(ctx context.Context) (*oidc.IDTokenVerifier, error) {
	v.mu.Lock()
	defer v.mu.Unlock()
	if v.verifier != nil {
		return v.verifier, nil
	}
	// The provider keeps this context for its later key fetches too, so it
	// must outlive the request; the client's timeout bounds each fetch.
	ctx = oidc.ClientContext(context.WithoutCancel(ctx), &http.Client{Timeout: 15 * time.Second})
	provider, err := oidc.NewProvider(ctx, v.issuer)
	if err != nil {
		return nil, fmt.Errorf("discovering Fly OIDC config at %s: %w", v.issuer, err)
	}
	v.verifier = provider.Verifier(&oidc.Config{ClientID: v.audience})
	return v.verifier, nil
}

// VerifyClient checks that token is a valid, unexpired Machine token from
// the verifier's organization for its audience, and returns the name of
// the Fly app the Machine belongs to.
func (v *Verifier) VerifyClient(ctx context.Context, token string) (appName string, err error) {
	verifier, err := v.load(ctx)
	if err != nil {
		return "", err
	}
	idToken, err := verifier.Verify(ctx, token)
	if err != nil {
		return "", fmt.Errorf("verifying Fly token: %w", err)
	}
	var claims struct {
		AppName string `json:"app_name"`
	}
	if err := idToken.Claims(&claims); err != nil {
		return "", fmt.Errorf("parsing Fly token claims: %w", err)
	}
	if claims.AppName == "" {
		return "", errors.New("Fly token has no app_name claim")
	}
	return claims.AppName, nil
}
