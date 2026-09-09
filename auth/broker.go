package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"net/url"
	"path"
	"strings"
	"sync"
	"time"
)

// Preview login: production as an identity provider for preview instances.
//
// A preview instance (one Fly app per pull request) starts from a snapshot
// of the production database, so the users in it are production's users.
// To let someone use a preview as themselves without registering every
// preview hostname with Google, production brokers the login: the preview
// sends the browser here, production confirms who the user is (signing
// them in first if necessary) and asks their consent, then hands the
// preview a one-shot code that the preview redeems, over a back channel,
// for the user's external identities. The preview then treats those
// exactly like a login at the original provider would have.
//
// Trust runs one way. Previews learn who the user is; nothing a preview
// receives is usable against production, and production never accepts
// anything from a preview except the code it minted itself. Three checks
// keep the code from being redeemed by anyone but the intended preview:
//
//   - The redirect URI must be the callback of an allowed preview host
//     (https://<app>.fly.dev, app matching AppPattern), so codes only ever
//     travel to previews.
//   - Fly app names are global, so someone could register a free
//     crossme-pr-N. Redeeming a code therefore also requires a client
//     assertion: the preview Machine's own Fly OIDC token, which only a
//     Machine in our Fly organization can obtain, and whose app_name must
//     be the app the code was issued to.
//   - Codes are single-use, bound to their redirect URI, and expire after
//     a minute.
//
// The consent step keeps a preview from learning who is browsing it
// without the user actively agreeing.

// The wire format of a successful token exchange. The preview trusts it
// because it arrived over TLS from production's own origin, the same way
// a Google code exchange is trusted; no signing needed.
type brokerTokenResponse struct {
	User       brokerUser       `json:"user"`
	Identities []brokerIdentity `json:"identities"`
}

type brokerUser struct {
	Id          string `json:"id"`
	Email       string `json:"email"`
	DisplayName string `json:"display_name"`
	AvatarURL   string `json:"avatar_url"`
}

type brokerIdentity struct {
	Provider string `json:"provider"`
	Subject  string `json:"subject"`
}

const (
	brokerAuthorizePath = "/api/auth/preview/authorize"
	brokerTokenPath     = "/api/auth/preview/token"

	// previewCallbackPath is where a preview receives the code: the
	// callback of its CrossMe provider.
	previewCallbackPath = "/api/auth/" + CrossMeProviderName + "/callback"

	defaultCodeLifetime = time.Minute
)

// A ClientVerifier authenticates a preview instance redeeming a code, from
// the client assertion it presents, and reports which Fly app it is.
// fly.Verifier is the real one.
type ClientVerifier interface {
	VerifyClient(ctx context.Context, assertion string) (appName string, err error)
}

// BrokerConfig configures production's side of preview login.
type BrokerConfig struct {
	// BaseURL is production's own external base URL (https://crossme.app).
	// It is the audience preview assertions must carry, and the only
	// Origin the consent form is accepted from.
	BaseURL string
	// AppPattern is a path.Match pattern the Fly app name of a preview must
	// match, e.g. "crossme-pr-*". Its public host is <app>.fly.dev.
	AppPattern string
	// Clients verifies the assertion a preview presents when redeeming a
	// code.
	Clients ClientVerifier
	// CodeLifetime bounds how long a minted code stays redeemable; zero
	// means a minute.
	CodeLifetime time.Duration
}

// A Broker serves the preview-login endpoints on production.
type Broker struct {
	h   *Handler
	cfg BrokerConfig

	mu    sync.Mutex
	codes map[string]issuedCode
	now   func() time.Time
}

type issuedCode struct {
	userID      string
	redirectURI string
	expires     time.Time
}

// NewBroker builds the Broker for this Handler, which must have at least
// one real provider to sign users in with.
func (h *Handler) NewBroker(cfg BrokerConfig) (*Broker, error) {
	if cfg.Clients == nil {
		return nil, errors.New("preview login: no client verifier")
	}
	if _, err := path.Match(cfg.AppPattern, ""); err != nil || cfg.AppPattern == "" {
		return nil, fmt.Errorf("preview login: bad app pattern %q", cfg.AppPattern)
	}
	u, err := url.Parse(cfg.BaseURL)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return nil, fmt.Errorf("preview login: bad base URL %q", cfg.BaseURL)
	}
	if h.signInProvider() == nil {
		return nil, errors.New("preview login: no login provider to sign users in with")
	}
	if cfg.CodeLifetime == 0 {
		cfg.CodeLifetime = defaultCodeLifetime
	}
	return &Broker{
		h:     h,
		cfg:   cfg,
		codes: make(map[string]issuedCode),
		now:   time.Now,
	}, nil
}

// signInProvider is the provider to send a signed-out user through
// before they can authorize a preview: the first that is not itself
// preview login.
func (h *Handler) signInProvider() Provider {
	for _, name := range h.ProviderNames() {
		if name != CrossMeProviderName {
			return h.providers[name]
		}
	}
	return nil
}

// Register installs the endpoints. Like the login routes they are plain
// HTTP under /api/.
func (b *Broker) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET "+brokerAuthorizePath, b.authorizeForm)
	mux.HandleFunc("POST "+brokerAuthorizePath, b.authorizeDecision)
	mux.HandleFunc("POST "+brokerTokenPath, b.token)
}

// previewApp validates a redirect URI and returns the Fly app it belongs
// to. Only the exact callback URL of an allowed preview passes.
func (b *Broker) previewApp(redirectURI string) (string, error) {
	u, err := url.Parse(redirectURI)
	if err != nil {
		return "", fmt.Errorf("unparseable redirect_uri")
	}
	app, ok := strings.CutSuffix(u.Host, ".fly.dev")
	if !ok || app == "" || strings.Contains(app, ".") {
		return "", fmt.Errorf("redirect_uri host %q is not a fly.dev app", u.Host)
	}
	if matched, _ := path.Match(b.cfg.AppPattern, app); !matched {
		return "", fmt.Errorf("app %q is not a preview", app)
	}
	if u.Scheme != "https" || u.User != nil || u.Path != previewCallbackPath ||
		u.RawQuery != "" || u.Fragment != "" {
		return "", fmt.Errorf("redirect_uri %q is not a preview callback", redirectURI)
	}
	return app, nil
}

// authRequest is what both halves of the authorize endpoint need from the
// request: a validated redirect target and the state to echo.
type authRequest struct {
	app         string
	redirectURI string
	state       string
}

func (b *Broker) parseAuthRequest(w http.ResponseWriter, values url.Values) (*authRequest, bool) {
	redirectURI := values.Get("redirect_uri")
	app, err := b.previewApp(redirectURI)
	if err != nil {
		http.Error(w, "preview login: "+err.Error(), http.StatusBadRequest)
		return nil, false
	}
	state := values.Get("state")
	if state == "" {
		http.Error(w, "preview login: missing state", http.StatusBadRequest)
		return nil, false
	}
	return &authRequest{app: app, redirectURI: redirectURI, state: state}, true
}

func (b *Broker) authorizeForm(w http.ResponseWriter, req *http.Request) {
	ar, ok := b.parseAuthRequest(w, req.URL.Query())
	if !ok {
		return
	}
	user := b.h.currentUser(req)
	if user == nil {
		// Sign in first, then come back here to the same question.
		http.Redirect(w, req, loginURL(b.h.signInProvider(), req.URL.RequestURI()), http.StatusFound)
		return
	}

	// The page is tiny and self-contained; say so, so that whatever CSP
	// the front proxy adds for the SPA doesn't matter.
	w.Header().Set("Content-Security-Policy",
		"default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Header().Set("Cache-Control", "no-store")
	who := user.DisplayName
	if who == "" {
		who = user.Email
	}
	err := consentPage.Execute(w, map[string]any{
		"App":         ar.app,
		"Host":        ar.app + ".fly.dev",
		"RedirectURI": ar.redirectURI,
		"State":       ar.state,
		"Who":         who,
		"Email":       user.Email,
	})
	if err != nil {
		log.Printf("auth: rendering consent page: %v", err)
	}
}

func (b *Broker) authorizeDecision(w http.ResponseWriter, req *http.Request) {
	// The consent form must be posted by our own page. SameSite=Lax
	// already keeps the session cookie off cross-site POSTs; checking the
	// Origin as well makes the intent explicit and covers older browsers.
	if origin := req.Header.Get("Origin"); origin == "" || !sameOrigin(origin, b.cfg.BaseURL) {
		http.Error(w, "preview login: cross-origin form post", http.StatusForbidden)
		return
	}
	if err := req.ParseForm(); err != nil {
		http.Error(w, "bad form", http.StatusBadRequest)
		return
	}
	ar, ok := b.parseAuthRequest(w, req.PostForm)
	if !ok {
		return
	}
	user := b.h.currentUser(req)
	if user == nil {
		http.Error(w, "preview login: not signed in", http.StatusUnauthorized)
		return
	}
	if req.PostForm.Get("decision") != "allow" {
		http.Redirect(w, req, "/", http.StatusFound)
		return
	}

	code := b.issue(user.Id, ar.redirectURI)
	dest, _ := url.Parse(ar.redirectURI)
	dest.RawQuery = url.Values{"code": {code}, "state": {ar.state}}.Encode()
	http.Redirect(w, req, dest.String(), http.StatusFound)
}

func sameOrigin(origin, base string) bool {
	o, err1 := url.Parse(origin)
	b, err2 := url.Parse(base)
	return err1 == nil && err2 == nil && o.Scheme == b.Scheme && o.Host == b.Host
}

// issue mints a code for user, redeemable once at redirectURI.
func (b *Broker) issue(userID, redirectURI string) string {
	code := newState()
	now := b.now()
	b.mu.Lock()
	defer b.mu.Unlock()
	for k, c := range b.codes {
		if !now.Before(c.expires) {
			delete(b.codes, k)
		}
	}
	b.codes[code] = issuedCode{
		userID:      userID,
		redirectURI: redirectURI,
		expires:     now.Add(b.cfg.CodeLifetime),
	}
	return code
}

// redeem consumes a code, returning the user it was issued for.
func (b *Broker) redeem(code, redirectURI string) (string, bool) {
	b.mu.Lock()
	defer b.mu.Unlock()
	c, ok := b.codes[code]
	if !ok {
		return "", false
	}
	delete(b.codes, code)
	if !b.now().Before(c.expires) || c.redirectURI != redirectURI {
		return "", false
	}
	return c.userID, true
}

func (b *Broker) token(w http.ResponseWriter, req *http.Request) {
	if err := req.ParseForm(); err != nil {
		http.Error(w, "bad form", http.StatusBadRequest)
		return
	}
	redirectURI := req.PostForm.Get("redirect_uri")
	app, err := b.previewApp(redirectURI)
	if err != nil {
		http.Error(w, "preview login: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Who is asking? Verify the client before touching the code, so a
	// guessed code can't be probed without a real preview's assertion.
	clientApp, err := b.cfg.Clients.VerifyClient(req.Context(), req.PostForm.Get("client_assertion"))
	if err != nil {
		log.Printf("auth: preview login: rejecting client for %s: %v", app, err)
		http.Error(w, "preview login: invalid client assertion", http.StatusUnauthorized)
		return
	}
	if clientApp != app {
		log.Printf("auth: preview login: app %s tried to redeem a code for %s", clientApp, app)
		http.Error(w, "preview login: assertion is for a different app", http.StatusUnauthorized)
		return
	}

	userID, ok := b.redeem(req.PostForm.Get("code"), redirectURI)
	if !ok {
		http.Error(w, "preview login: invalid or expired code", http.StatusBadRequest)
		return
	}
	user, err := b.h.repo.UserById(userID)
	if err != nil {
		log.Printf("auth: preview login: loading user %s: %v", userID, err)
		http.Error(w, "preview login: no such user", http.StatusBadRequest)
		return
	}
	idents, err := b.h.repo.IdentitiesByUser(userID)
	if err != nil {
		log.Printf("auth: preview login: loading identities for %s: %v", userID, err)
		http.Error(w, "preview login: lookup failed", http.StatusInternalServerError)
		return
	}
	resp := brokerTokenResponse{
		User: brokerUser{
			Id:          user.Id,
			Email:       user.Email,
			DisplayName: user.DisplayName,
			AvatarURL:   user.AvatarUrl,
		},
		Identities: make([]brokerIdentity, 0, len(idents)),
	}
	for _, id := range idents {
		resp.Identities = append(resp.Identities, brokerIdentity{Provider: id.Provider, Subject: id.Subject})
	}
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Cache-Control", "no-store")
	json.NewEncoder(w).Encode(resp)
	log.Printf("auth: preview login: %s signed in to %s", user.Id, app)
}

var consentPage = template.Must(template.New("consent").Parse(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in to {{.App}} · CrossMe</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 30rem; margin: 4rem auto; padding: 0 1rem; color: #222; }
  h1 { font-size: 1.4rem; }
  code { background: #f2f2f2; padding: 0.1em 0.3em; border-radius: 3px; }
  form { display: flex; gap: 0.75rem; margin-top: 1.5rem; }
  button { font: inherit; padding: 0.5rem 1.2rem; border-radius: 4px; border: 1px solid #888; background: #fff; cursor: pointer; }
  button.primary { background: #0d6efd; border-color: #0d6efd; color: #fff; }
  p.muted { color: #666; font-size: 0.9rem; }
</style>
</head>
<body>
<h1>Sign in to the preview <code>{{.App}}</code>?</h1>
<p>The preview at <code>{{.Host}}</code> is asking who you are. Continuing tells it
that you are <strong>{{.Who}}</strong>{{if and .Email (ne .Email .Who)}} ({{.Email}}){{end}},
so it can sign you in there as the same account.</p>
<p class="muted">The preview gets no access to your account here; it only learns
which account you are. Previews are built from open pull requests and start from a
copy of this site's data.</p>
<form method="post" action="/api/auth/preview/authorize">
  <input type="hidden" name="redirect_uri" value="{{.RedirectURI}}">
  <input type="hidden" name="state" value="{{.State}}">
  <button class="primary" type="submit" name="decision" value="allow">Continue</button>
  <button type="submit" name="decision" value="deny">Cancel</button>
</form>
</body>
</html>
`))
