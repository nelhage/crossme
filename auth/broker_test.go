package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"testing"
	"time"

	"crossme.app/src/pb"
	"crossme.app/src/repo"
)

const (
	testApp         = "crossme-pr-42"
	testRedirect    = "https://" + testApp + ".fly.dev/api/auth/crossme/callback"
	testProdBaseURL = "https://crossme.test"
)

// fakeVerifier accepts assertions of the form "app:<name>" and reports
// that app; anything else is rejected.
type fakeVerifier struct{}

func (fakeVerifier) VerifyClient(ctx context.Context, assertion string) (string, error) {
	app, ok := strings.CutPrefix(assertion, "app:")
	if !ok {
		return "", errors.New("bogus assertion")
	}
	return app, nil
}

func fakeTokens(app string) TokenSource {
	return func(ctx context.Context, audience string) (string, error) {
		if audience != testProdBaseURL {
			return "", fmt.Errorf("unexpected audience %q", audience)
		}
		return "app:" + app, nil
	}
}

type testBroker struct {
	*testAuth
	broker *Broker
	// A signed-in production user and their session cookie.
	user    *pb.User
	session *http.Cookie
}

func newTestBroker(t *testing.T) *testBroker {
	t.Helper()
	ta := newTestAuth(t)
	broker, err := ta.handler.NewBroker(BrokerConfig{
		BaseURL:    testProdBaseURL,
		AppPattern: "crossme-pr-*",
		Clients:    fakeVerifier{},
	})
	if err != nil {
		t.Fatal(err)
	}
	broker.Register(ta.mux)

	user, err := ta.repo.LoginUser("fake", "sub-1", &pb.User{
		Email: "ada@example.com", DisplayName: "Ada Lovelace",
	})
	if err != nil {
		t.Fatal(err)
	}
	token, err := ta.repo.NewSession(user.Id)
	if err != nil {
		t.Fatal(err)
	}
	return &testBroker{
		testAuth: ta,
		broker:   broker,
		user:     user,
		session:  &http.Cookie{Name: sessionCookie, Value: token},
	}
}

func authorizeQuery(redirect, state string) string {
	return url.Values{"redirect_uri": {redirect}, "state": {state}}.Encode()
}

// consent posts the consent form as the browser would, returning the
// response.
func (tb *testBroker) consent(redirect, state, decision string, signedIn bool) *httptest.ResponseRecorder {
	form := url.Values{"redirect_uri": {redirect}, "state": {state}, "decision": {decision}}
	req := httptest.NewRequest("POST", brokerAuthorizePath, strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Origin", testProdBaseURL)
	if signedIn {
		req.AddCookie(tb.session)
	}
	return tb.do(req)
}

// codeFor runs the consent flow and extracts the code production issued.
func (tb *testBroker) codeFor(t *testing.T, redirect string) string {
	t.Helper()
	w := tb.consent(redirect, "st", "allow", true)
	if w.Code != http.StatusFound {
		t.Fatalf("consent: status %d: %s", w.Code, w.Body)
	}
	loc, err := url.Parse(w.Header().Get("Location"))
	if err != nil {
		t.Fatal(err)
	}
	if got := loc.Scheme + "://" + loc.Host + loc.Path; got != redirect {
		t.Fatalf("redirected to %q, want %q", got, redirect)
	}
	if loc.Query().Get("state") != "st" {
		t.Errorf("state not echoed: %q", loc.RawQuery)
	}
	code := loc.Query().Get("code")
	if code == "" {
		t.Fatalf("no code in redirect %q", loc)
	}
	return code
}

func (tb *testBroker) redeem(code, redirect, assertion string) *httptest.ResponseRecorder {
	form := url.Values{"code": {code}, "redirect_uri": {redirect}, "client_assertion": {assertion}}
	req := httptest.NewRequest("POST", brokerTokenPath, strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	return tb.do(req)
}

func TestBrokerRejectsBadRedirects(t *testing.T) {
	t.Parallel()
	tb := newTestBroker(t)
	bad := []string{
		"",
		"http://crossme-pr-42.fly.dev/api/auth/crossme/callback",       // not https
		"https://crossme-pr-42.fly.dev/api/auth/google/callback",       // wrong callback
		"https://crossme-pr-42.fly.dev/api/auth/crossme/callback?x=1",  // query
		"https://crossme-pr-42.fly.dev/api/auth/crossme/callback#frag", // fragment
		"https://evil.example/api/auth/crossme/callback",               // not fly.dev
		"https://crossme-pr-42.fly.dev.evil.example/api/auth/crossme/callback",
		"https://other-app.fly.dev/api/auth/crossme/callback", // not a preview
		"https://crossme-pr-42.evil.fly.dev/api/auth/crossme/callback",
		"https://user@crossme-pr-42.fly.dev/api/auth/crossme/callback",
		"https://.fly.dev/api/auth/crossme/callback",
	}
	for _, r := range bad {
		w := tb.do(httptest.NewRequest("GET", brokerAuthorizePath+"?"+authorizeQuery(r, "st"), nil))
		if w.Code != http.StatusBadRequest {
			t.Errorf("redirect_uri %q: status %d, want 400", r, w.Code)
		}
	}
	// A good one without state is also refused.
	w := tb.do(httptest.NewRequest("GET", brokerAuthorizePath+"?"+authorizeQuery(testRedirect, ""), nil))
	if w.Code != http.StatusBadRequest {
		t.Errorf("missing state: status %d, want 400", w.Code)
	}
}

// A signed-out user is sent through the real login first, and comes back
// to the same authorize URL afterwards.
func TestBrokerSignsInFirst(t *testing.T) {
	t.Parallel()
	tb := newTestBroker(t)
	target := brokerAuthorizePath + "?" + authorizeQuery(testRedirect, "st")
	w := tb.do(httptest.NewRequest("GET", target, nil))
	if w.Code != http.StatusFound {
		t.Fatalf("status %d, want 302", w.Code)
	}
	loc, _ := url.Parse(w.Header().Get("Location"))
	if loc.Path != "/api/auth/fake/login" {
		t.Errorf("redirected to %q, want the fake provider's login", loc)
	}
	if next := loc.Query().Get("next"); next != target {
		t.Errorf("next = %q, want %q", next, target)
	}

	// And that login round-trip does land back on the consent page.
	w = tb.do(httptest.NewRequest("GET", loc.String(), nil))
	resp := w.Result()
	state := cookieNamed(t, resp, stateCookie)
	next := cookieNamed(t, resp, nextCookie)
	if state == nil || next == nil || next.Value != target {
		t.Fatalf("login didn't pin state and next: %v", resp.Cookies())
	}
	req := callbackRequest(state.Value, "state="+state.Value+"&code=good-code")
	req.AddCookie(&http.Cookie{Name: nextCookie, Value: next.Value})
	w = tb.do(req)
	if w.Code != http.StatusFound || w.Header().Get("Location") != target {
		t.Errorf("after login: %d -> %q, want 302 -> %q", w.Code, w.Header().Get("Location"), target)
	}
}

func TestBrokerConsentPage(t *testing.T) {
	t.Parallel()
	tb := newTestBroker(t)
	req := httptest.NewRequest("GET", brokerAuthorizePath+"?"+authorizeQuery(testRedirect, "st"), nil)
	req.AddCookie(tb.session)
	w := tb.do(req)
	if w.Code != http.StatusOK {
		t.Fatalf("status %d: %s", w.Code, w.Body)
	}
	body := w.Body.String()
	for _, want := range []string{testApp, "Ada Lovelace", "ada@example.com", `value="` + testRedirect + `"`, `value="st"`} {
		if !strings.Contains(body, want) {
			t.Errorf("consent page lacks %q", want)
		}
	}
	if csp := w.Header().Get("Content-Security-Policy"); !strings.Contains(csp, "form-action 'self'") {
		t.Errorf("CSP = %q", csp)
	}
}

func TestBrokerConsentRequiresSameOriginAndSession(t *testing.T) {
	t.Parallel()
	tb := newTestBroker(t)

	form := url.Values{"redirect_uri": {testRedirect}, "state": {"st"}, "decision": {"allow"}}
	for _, origin := range []string{"", "https://evil.example", "http://crossme.test"} {
		req := httptest.NewRequest("POST", brokerAuthorizePath, strings.NewReader(form.Encode()))
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		if origin != "" {
			req.Header.Set("Origin", origin)
		}
		req.AddCookie(tb.session)
		if w := tb.do(req); w.Code != http.StatusForbidden {
			t.Errorf("Origin %q: status %d, want 403", origin, w.Code)
		}
	}
	if w := tb.consent(testRedirect, "st", "allow", false); w.Code != http.StatusUnauthorized {
		t.Errorf("signed out: status %d, want 401", w.Code)
	}
	if w := tb.consent("https://evil.example/api/auth/crossme/callback", "st", "allow", true); w.Code != http.StatusBadRequest {
		t.Errorf("bad redirect: status %d, want 400", w.Code)
	}
}

func TestBrokerDeny(t *testing.T) {
	t.Parallel()
	tb := newTestBroker(t)
	w := tb.consent(testRedirect, "st", "deny", true)
	if w.Code != http.StatusFound || w.Header().Get("Location") != "/" {
		t.Errorf("deny: %d -> %q, want 302 -> /", w.Code, w.Header().Get("Location"))
	}
	tb.broker.mu.Lock()
	defer tb.broker.mu.Unlock()
	if len(tb.broker.codes) != 0 {
		t.Errorf("deny issued a code")
	}
}

func TestBrokerExchange(t *testing.T) {
	t.Parallel()
	tb := newTestBroker(t)
	code := tb.codeFor(t, testRedirect)

	w := tb.redeem(code, testRedirect, "app:"+testApp)
	if w.Code != http.StatusOK {
		t.Fatalf("redeem: status %d: %s", w.Code, w.Body)
	}
	var resp brokerTokenResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatal(err)
	}
	if resp.User.Id != tb.user.Id || resp.User.Email != "ada@example.com" || resp.User.DisplayName != "Ada Lovelace" {
		t.Errorf("user = %+v", resp.User)
	}
	if len(resp.Identities) != 1 || resp.Identities[0] != (brokerIdentity{Provider: "fake", Subject: "sub-1"}) {
		t.Errorf("identities = %+v", resp.Identities)
	}

	// Single use.
	if w := tb.redeem(code, testRedirect, "app:"+testApp); w.Code != http.StatusBadRequest {
		t.Errorf("second redeem: status %d, want 400", w.Code)
	}
}

func TestBrokerExchangeRejectsWrongClient(t *testing.T) {
	t.Parallel()
	tb := newTestBroker(t)
	code := tb.codeFor(t, testRedirect)

	// A squatter on another app name, even one matching the pattern, and
	// a garbage assertion, are both refused; neither consumes the code.
	if w := tb.redeem(code, testRedirect, "app:crossme-pr-43"); w.Code != http.StatusUnauthorized {
		t.Errorf("other app: status %d, want 401", w.Code)
	}
	if w := tb.redeem(code, testRedirect, "not-a-token"); w.Code != http.StatusUnauthorized {
		t.Errorf("garbage assertion: status %d, want 401", w.Code)
	}
	if w := tb.redeem(code, testRedirect, ""); w.Code != http.StatusUnauthorized {
		t.Errorf("no assertion: status %d, want 401", w.Code)
	}
	if w := tb.redeem(code, testRedirect, "app:"+testApp); w.Code != http.StatusOK {
		t.Errorf("real client afterwards: status %d, want 200", w.Code)
	}
}

func TestBrokerCodeBoundToRedirect(t *testing.T) {
	t.Parallel()
	tb := newTestBroker(t)
	code := tb.codeFor(t, testRedirect)
	other := "https://crossme-pr-43.fly.dev/api/auth/crossme/callback"
	if w := tb.redeem(code, other, "app:crossme-pr-43"); w.Code != http.StatusBadRequest {
		t.Errorf("redeem at other preview: status %d, want 400", w.Code)
	}
	// A failed redeem burns the code.
	if w := tb.redeem(code, testRedirect, "app:"+testApp); w.Code != http.StatusBadRequest {
		t.Errorf("redeem after misuse: status %d, want 400", w.Code)
	}
}

func TestBrokerCodeExpires(t *testing.T) {
	t.Parallel()
	tb := newTestBroker(t)
	now := time.Now()
	tb.broker.now = func() time.Time { return now }
	code := tb.codeFor(t, testRedirect)
	now = now.Add(defaultCodeLifetime + time.Second)
	if w := tb.redeem(code, testRedirect, "app:"+testApp); w.Code != http.StatusBadRequest {
		t.Errorf("expired code: status %d, want 400", w.Code)
	}
	if w := tb.redeem("nonsense", testRedirect, "app:"+testApp); w.Code != http.StatusBadRequest {
		t.Errorf("unknown code: status %d, want 400", w.Code)
	}
}

func TestNewBrokerValidatesConfig(t *testing.T) {
	t.Parallel()
	ta := newTestAuth(t)
	good := BrokerConfig{BaseURL: testProdBaseURL, AppPattern: "crossme-pr-*", Clients: fakeVerifier{}}
	if _, err := ta.handler.NewBroker(good); err != nil {
		t.Errorf("good config: %v", err)
	}
	for name, mutate := range map[string]func(*BrokerConfig){
		"no verifier": func(c *BrokerConfig) { c.Clients = nil },
		"bad pattern": func(c *BrokerConfig) { c.AppPattern = "[" },
		"no pattern":  func(c *BrokerConfig) { c.AppPattern = "" },
		"bad base":    func(c *BrokerConfig) { c.BaseURL = "crossme.test" },
	} {
		cfg := good
		mutate(&cfg)
		if _, err := ta.handler.NewBroker(cfg); err == nil {
			t.Errorf("%s: accepted", name)
		}
	}

	// A handler with only the crossme provider has nothing to sign users
	// in with.
	r, err := repo.Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer r.Close()
	h := NewHandler(r, NewCrossMe(testProdBaseURL, testRedirect, fakeTokens(testApp)))
	if _, err := h.NewBroker(good); err == nil {
		t.Errorf("broker with no sign-in provider: accepted")
	}
}

// The whole thing, end to end: a preview instance (its own handler and
// database, holding the same identities as production's) signs a user in
// through production.
func TestPreviewLoginRoundTrip(t *testing.T) {
	t.Parallel()
	prod := newTestBroker(t)
	prodServer := httptest.NewServer(prod.mux)
	t.Cleanup(prodServer.Close)
	// The broker needs to know its own origin for the Origin check; the
	// test server's URL is it.
	prod.broker.cfg.BaseURL = prodServer.URL

	// The preview's database is a snapshot of production's: same
	// identities. (Here it is rebuilt rather than copied.)
	previewRepo, err := repo.Open(":memory:")
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { previewRepo.Close() })
	snapshotUser, err := previewRepo.LoginUser("fake", "sub-1", &pb.User{Email: "old@example.com"})
	if err != nil {
		t.Fatal(err)
	}
	tokens := func(ctx context.Context, audience string) (string, error) {
		if audience != prodServer.URL {
			return "", fmt.Errorf("audience %q, want %q", audience, prodServer.URL)
		}
		return "app:" + testApp, nil
	}
	preview := NewHandler(previewRepo, NewCrossMe(prodServer.URL, testRedirect, tokens))
	previewMux := http.NewServeMux()
	preview.Register(previewMux)
	do := func(req *http.Request) *httptest.ResponseRecorder {
		w := httptest.NewRecorder()
		previewMux.ServeHTTP(w, req)
		return w
	}

	// 1. The browser clicks "sign in" on the preview...
	w := do(httptest.NewRequest("GET", "/api/auth/crossme/login", nil))
	if w.Code != http.StatusFound {
		t.Fatalf("preview login: status %d", w.Code)
	}
	authorize, _ := url.Parse(w.Header().Get("Location"))
	state := cookieNamed(t, w.Result(), stateCookie)
	if !strings.HasPrefix(authorize.String(), prodServer.URL+brokerAuthorizePath) ||
		authorize.Query().Get("redirect_uri") != testRedirect ||
		authorize.Query().Get("state") != state.Value {
		t.Fatalf("preview sent the browser to %q", authorize)
	}

	// 2. ...and lands on production's consent page, already signed in
	// there...
	req, _ := http.NewRequest("GET", authorize.String(), nil)
	req.AddCookie(prod.session)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("consent page: status %d", resp.StatusCode)
	}

	// 3. ...clicks Continue, and is sent back to the preview with a code.
	form := url.Values{"redirect_uri": {testRedirect}, "state": {state.Value}, "decision": {"allow"}}
	req, _ = http.NewRequest("POST", prodServer.URL+brokerAuthorizePath, strings.NewReader(form.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	req.Header.Set("Origin", prodServer.URL)
	req.AddCookie(prod.session)
	noRedirect := &http.Client{CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse }}
	resp, err = noRedirect.Do(req)
	if err != nil {
		t.Fatal(err)
	}
	resp.Body.Close()
	if resp.StatusCode != http.StatusFound {
		t.Fatalf("consent: status %d", resp.StatusCode)
	}
	back, _ := url.Parse(resp.Header.Get("Location"))
	if back.Host != testApp+".fly.dev" || back.Path != previewCallbackPath {
		t.Fatalf("consent sent the browser to %q", back)
	}

	// 4. The preview redeems the code with production and signs the
	// browser in as the snapshot's user.
	cb := httptest.NewRequest("GET", back.Path+"?"+back.RawQuery, nil)
	cb.AddCookie(&http.Cookie{Name: stateCookie, Value: state.Value})
	w = do(cb)
	if w.Code != http.StatusFound || w.Header().Get("Location") != "/" {
		t.Fatalf("preview callback: %d -> %q: %s", w.Code, w.Header().Get("Location"), w.Body)
	}
	session := cookieNamed(t, w.Result(), sessionCookie)
	if session == nil {
		t.Fatal("preview set no session cookie")
	}
	user, _, err := previewRepo.SessionUser(session.Value)
	if err != nil {
		t.Fatal(err)
	}
	if user.Id != snapshotUser.Id {
		t.Errorf("preview signed in as %s, want the snapshot's %s", user.Id, snapshotUser.Id)
	}
	if user.Email != "ada@example.com" {
		t.Errorf("profile not refreshed from production: %v", user)
	}
}

func TestCrossMeExchangeRejectsBadResponses(t *testing.T) {
	t.Parallel()
	for name, body := range map[string]string{
		"no identities":    `{"user":{"id":"u"},"identities":[]}`,
		"self-referential": `{"user":{"id":"u"},"identities":[{"provider":"crossme","subject":"u"}]}`,
		"empty subject":    `{"user":{"id":"u"},"identities":[{"provider":"google","subject":""}]}`,
		"not json":         `<html>`,
	} {
		srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			fmt.Fprint(w, body)
		}))
		p := NewCrossMe(srv.URL, testRedirect, fakeTokens(testApp))
		if _, err := p.Exchange(context.Background(), "code"); err == nil {
			t.Errorf("%s: accepted", name)
		}
		srv.Close()
	}

	// And a token source failure is an error rather than an anonymous
	// request.
	p := NewCrossMe("https://prod.example", testRedirect, func(context.Context, string) (string, error) {
		return "", errors.New("no Fly agent")
	})
	if _, err := p.Exchange(context.Background(), "code"); err == nil || !strings.Contains(err.Error(), "no Fly agent") {
		t.Errorf("token source failure: %v", err)
	}
}
