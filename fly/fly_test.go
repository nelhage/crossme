package fly

import (
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"net"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// fakeIssuer stands in for https://oidc.fly.io/<org>: it publishes a
// discovery document and a JWKS, and mints RS256 tokens like Fly's.
type fakeIssuer struct {
	*httptest.Server
	key *rsa.PrivateKey
}

func newFakeIssuer(t *testing.T) *fakeIssuer {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		t.Fatal(err)
	}
	f := &fakeIssuer{key: key}
	mux := http.NewServeMux()
	mux.HandleFunc("/.well-known/openid-configuration", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]any{
			"issuer":                                f.URL,
			"jwks_uri":                              f.URL + "/.well-known/jwks",
			"id_token_signing_alg_values_supported": []string{"RS256"},
		})
	})
	mux.HandleFunc("/.well-known/jwks", func(w http.ResponseWriter, r *http.Request) {
		json.NewEncoder(w).Encode(map[string]any{
			"keys": []map[string]string{{
				"kty": "RSA", "kid": "k1", "use": "sig", "alg": "RS256",
				"n": base64.RawURLEncoding.EncodeToString(key.N.Bytes()),
				"e": base64.RawURLEncoding.EncodeToString(big.NewInt(int64(key.E)).Bytes()),
			}},
		})
	})
	f.Server = httptest.NewServer(mux)
	t.Cleanup(f.Close)
	return f
}

// mint signs a token with the given claims (iss defaults to this issuer).
func (f *fakeIssuer) mint(t *testing.T, claims map[string]any) string {
	t.Helper()
	if _, ok := claims["iss"]; !ok {
		claims["iss"] = f.URL
	}
	header, _ := json.Marshal(map[string]string{"alg": "RS256", "typ": "JWT", "kid": "k1"})
	payload, _ := json.Marshal(claims)
	signing := base64.RawURLEncoding.EncodeToString(header) + "." + base64.RawURLEncoding.EncodeToString(payload)
	digest := sha256.Sum256([]byte(signing))
	sig, err := rsa.SignPKCS1v15(rand.Reader, f.key, crypto.SHA256, digest[:])
	if err != nil {
		t.Fatal(err)
	}
	return signing + "." + base64.RawURLEncoding.EncodeToString(sig)
}

func flyClaims(app, aud string) map[string]any {
	now := time.Now()
	return map[string]any{
		"sub":        "my-org:" + app + ":e28465efd7e089",
		"aud":        aud,
		"exp":        now.Add(time.Hour).Unix(),
		"iat":        now.Unix(),
		"app_name":   app,
		"org_name":   "my-org",
		"machine_id": "e28465efd7e089",
	}
}

func TestVerifier(t *testing.T) {
	issuer := newFakeIssuer(t)
	ctx := context.Background()
	v := NewVerifier(issuer.URL, "https://crossme.test")

	app, err := v.VerifyClient(ctx, issuer.mint(t, flyClaims("crossme-pr-42", "https://crossme.test")))
	if err != nil || app != "crossme-pr-42" {
		t.Errorf("good token: app %q, err %v", app, err)
	}

	bad := map[string]func(map[string]any){
		"wrong audience": func(c map[string]any) { c["aud"] = "crossme-preview" },
		"expired":        func(c map[string]any) { c["exp"] = time.Now().Add(-time.Minute).Unix() },
		"other issuer":   func(c map[string]any) { c["iss"] = "https://oidc.fly.io/someone-else" },
		"no app_name":    func(c map[string]any) { delete(c, "app_name") },
	}
	for name, mutate := range bad {
		claims := flyClaims("crossme-pr-42", "https://crossme.test")
		mutate(claims)
		if app, err := v.VerifyClient(ctx, issuer.mint(t, claims)); err == nil {
			t.Errorf("%s: accepted as %q", name, app)
		}
	}

	// A token signed by someone else's key, even with perfect claims.
	other := newFakeIssuer(t)
	claims := flyClaims("crossme-pr-42", "https://crossme.test")
	claims["iss"] = issuer.URL
	if app, err := v.VerifyClient(ctx, other.mint(t, claims)); err == nil {
		t.Errorf("forged signature: accepted as %q", app)
	}
	if _, err := v.VerifyClient(ctx, "not.a.jwt"); err == nil {
		t.Errorf("garbage: accepted")
	}
	if _, err := v.VerifyClient(ctx, ""); err == nil {
		t.Errorf("empty: accepted")
	}
}

// Discovery happens on first use and is retried after a failure, so an
// issuer that was unreachable at startup doesn't stay broken.
func TestVerifierDiscoversLazily(t *testing.T) {
	issuer := newFakeIssuer(t)
	down := true
	front := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if down {
			http.Error(w, "outage", http.StatusBadGateway)
			return
		}
		// Serve the issuer's documents as our own.
		if r.URL.Path == "/.well-known/openid-configuration" {
			json.NewEncoder(w).Encode(map[string]any{
				"issuer":   frontURL(r),
				"jwks_uri": issuer.URL + "/.well-known/jwks",
			})
			return
		}
		http.NotFound(w, r)
	}))
	defer front.Close()

	ctx := context.Background()
	v := NewVerifier(front.URL, "aud")
	claims := flyClaims("crossme-pr-1", "aud")
	claims["iss"] = front.URL
	token := issuer.mint(t, claims)

	if _, err := v.VerifyClient(ctx, token); err == nil || !strings.Contains(err.Error(), "discovering") {
		t.Errorf("during outage: %v", err)
	}
	down = false
	if app, err := v.VerifyClient(ctx, token); err != nil || app != "crossme-pr-1" {
		t.Errorf("after outage: app %q, err %v", app, err)
	}
}

func frontURL(r *http.Request) string {
	return "http://" + r.Host
}

func TestOIDCToken(t *testing.T) {
	socket := filepath.Join(t.TempDir(), "fly.sock")
	ln, err := net.Listen("unix", socket)
	if err != nil {
		t.Fatal(err)
	}
	var gotAud string
	srv := &http.Server{Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/v1/tokens/oidc" {
			http.NotFound(w, r)
			return
		}
		var body struct{ Aud string }
		json.NewDecoder(r.Body).Decode(&body)
		gotAud = body.Aud
		if body.Aud == "quoted" {
			fmt.Fprint(w, `"a.b.c"`)
			return
		}
		if body.Aud == "broken" {
			http.Error(w, "nope", http.StatusInternalServerError)
			return
		}
		fmt.Fprint(w, "a.b.c")
	})}
	go srv.Serve(ln)
	defer srv.Close()

	ctx := context.Background()
	tok, err := OIDCToken(ctx, socket, "https://crossme.test")
	if err != nil || tok != "a.b.c" || gotAud != "https://crossme.test" {
		t.Errorf("token %q, aud %q, err %v", tok, gotAud, err)
	}
	if tok, err := OIDCToken(ctx, socket, "quoted"); err != nil || tok != "a.b.c" {
		t.Errorf("quoted token %q, err %v", tok, err)
	}
	if _, err := OIDCToken(ctx, socket, "broken"); err == nil || !strings.Contains(err.Error(), "nope") {
		t.Errorf("agent error: %v", err)
	}
	if _, err := OIDCToken(ctx, filepath.Join(t.TempDir(), "missing"), "x"); err == nil {
		t.Errorf("missing socket: no error")
	}
}
