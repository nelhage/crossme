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
	verifier *oidc.IDTokenVerifier
}

// NewVerifier discovers the signing keys for issuer, an organization's
// issuer URL like https://oidc.fly.io/my-org, and accepts only tokens
// minted for audience.
func NewVerifier(ctx context.Context, issuer, audience string) (*Verifier, error) {
	provider, err := oidc.NewProvider(ctx, issuer)
	if err != nil {
		return nil, fmt.Errorf("discovering Fly OIDC config at %s: %w", issuer, err)
	}
	return &Verifier{
		issuer:   issuer,
		verifier: provider.Verifier(&oidc.Config{ClientID: audience}),
	}, nil
}

// VerifyClient checks that token is a valid, unexpired Machine token from
// the verifier's organization for its audience, and returns the name of
// the Fly app the Machine belongs to.
func (v *Verifier) VerifyClient(ctx context.Context, token string) (appName string, err error) {
	idToken, err := v.verifier.Verify(ctx, token)
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
