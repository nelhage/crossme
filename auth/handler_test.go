package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"crossme.app/src/pb"
	"crossme.app/src/repo"
)

// fakeProvider stands in for Google: it "authenticates" anyone who
// presents wantCode.
type fakeProvider struct {
	ident    ExternalIdentity
	wantCode string
}

func (f *fakeProvider) Name() string { return "fake" }

func (f *fakeProvider) AuthCodeURL(state string) string {
	return "https://idp.example/auth?state=" + url.QueryEscape(state)
}

func (f *fakeProvider) Exchange(ctx context.Context, code string) (*ExternalIdentity, error) {
	if code != f.wantCode {
		return nil, fmt.Errorf("bad code %q", code)
	}
	ident := f.ident
	return &ident, nil
}

type testAuth struct {
	repo     *repo.Repository
	provider *fakeProvider
	handler  *Handler
	mux      *http.ServeMux
}

func newTestAuth(t *testing.T) *testAuth {
	t.Helper()
	r, err := repo.Open(":memory:")
	if err != nil {
		t.Fatalf("open repo: %v", err)
	}
	t.Cleanup(func() { r.Close() })

	ta := &testAuth{
		repo: r,
		provider: &fakeProvider{
			ident: ExternalIdentity{
				Provider:  "fake",
				Subject:   "sub-1",
				Email:     "ada@example.com",
				Name:      "Ada Lovelace",
				AvatarURL: "https://example.com/ada.png",
			},
			wantCode: "good-code",
		},
	}
	ta.handler = NewHandler(r, ta.provider)
	ta.mux = http.NewServeMux()
	ta.handler.Register(ta.mux)
	return ta
}

func (ta *testAuth) do(req *http.Request) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	ta.mux.ServeHTTP(w, req)
	return w
}

func cookieNamed(t *testing.T, resp *http.Response, name string) *http.Cookie {
	t.Helper()
	for _, c := range resp.Cookies() {
		if c.Name == name {
			return c
		}
	}
	return nil
}

// login must redirect to the provider carrying the same state it pinned
// in the browser cookie.
func TestLogin(t *testing.T) {
	t.Parallel()
	ta := newTestAuth(t)

	w := ta.do(httptest.NewRequest("GET", "/api/auth/fake/login", nil))
	resp := w.Result()
	if resp.StatusCode != http.StatusFound {
		t.Fatalf("status %d, want 302", resp.StatusCode)
	}
	loc, err := url.Parse(resp.Header.Get("Location"))
	if err != nil || loc.Host != "idp.example" {
		t.Fatalf("redirected to %q", resp.Header.Get("Location"))
	}
	cookie := cookieNamed(t, resp, stateCookie)
	if cookie == nil {
		t.Fatalf("no state cookie set")
	}
	if got := loc.Query().Get("state"); got != cookie.Value {
		t.Errorf("state in URL %q != state in cookie %q", got, cookie.Value)
	}
	if !cookie.HttpOnly {
		t.Errorf("state cookie is not HttpOnly")
	}
}

func TestLoginUnknownProvider(t *testing.T) {
	t.Parallel()
	ta := newTestAuth(t)
	w := ta.do(httptest.NewRequest("GET", "/api/auth/google/login", nil))
	if w.Code != http.StatusNotFound {
		t.Errorf("status %d, want 404", w.Code)
	}
}

func callbackRequest(state, query string) *http.Request {
	req := httptest.NewRequest("GET", "/api/auth/fake/callback?"+query, nil)
	if state != "" {
		req.AddCookie(&http.Cookie{Name: stateCookie, Value: state})
	}
	return req
}

func TestCallback(t *testing.T) {
	t.Parallel()
	ta := newTestAuth(t)

	w := ta.do(callbackRequest("some-state", "state=some-state&code=good-code"))
	resp := w.Result()
	if resp.StatusCode != http.StatusFound {
		t.Fatalf("status %d, want 302: %s", resp.StatusCode, w.Body.String())
	}
	if loc := resp.Header.Get("Location"); loc != "/" {
		t.Errorf("redirected to %q, want /", loc)
	}

	session := cookieNamed(t, resp, sessionCookie)
	if session == nil {
		t.Fatalf("no session cookie set")
	}
	if !session.HttpOnly {
		t.Errorf("session cookie is not HttpOnly")
	}
	user, _, err := ta.repo.SessionUser(session.Value)
	if err != nil {
		t.Fatalf("session does not resolve: %v", err)
	}
	if user.Email != "ada@example.com" || user.DisplayName != "Ada Lovelace" {
		t.Errorf("wrong user: %v", user)
	}

	// The state cookie is consumed.
	if state := cookieNamed(t, resp, stateCookie); state == nil || state.MaxAge >= 0 {
		t.Errorf("state cookie not cleared: %v", state)
	}
}

func TestCallbackStateMismatch(t *testing.T) {
	t.Parallel()
	ta := newTestAuth(t)

	for _, tc := range []struct {
		name  string
		state string
		query string
	}{
		{"wrong state", "state-a", "state=state-b&code=good-code"},
		{"no cookie", "", "state=state-a&code=good-code"},
		{"no param", "state-a", "code=good-code"},
	} {
		w := ta.do(callbackRequest(tc.state, tc.query))
		resp := w.Result()
		if resp.StatusCode != http.StatusBadRequest {
			t.Errorf("%s: status %d, want 400", tc.name, resp.StatusCode)
		}
		if c := cookieNamed(t, resp, sessionCookie); c != nil {
			t.Errorf("%s: session cookie set on failed login", tc.name)
		}
	}
}

func TestCallbackBadCode(t *testing.T) {
	t.Parallel()
	ta := newTestAuth(t)

	w := ta.do(callbackRequest("s", "state=s&code=bad-code"))
	resp := w.Result()
	if resp.StatusCode != http.StatusBadGateway {
		t.Errorf("status %d, want 502", resp.StatusCode)
	}
	if c := cookieNamed(t, resp, sessionCookie); c != nil {
		t.Errorf("session cookie set on failed exchange")
	}
}

// A user backing out at the provider's consent screen is sent home, not
// shown an error.
func TestCallbackUserDenied(t *testing.T) {
	t.Parallel()
	ta := newTestAuth(t)

	w := ta.do(callbackRequest("s", "error=access_denied&state=s"))
	resp := w.Result()
	if resp.StatusCode != http.StatusFound || resp.Header.Get("Location") != "/" {
		t.Errorf("got %d -> %q, want 302 -> /", resp.StatusCode, resp.Header.Get("Location"))
	}
	if c := cookieNamed(t, resp, sessionCookie); c != nil {
		t.Errorf("session cookie set on denied login")
	}
}

func TestLogout(t *testing.T) {
	t.Parallel()
	ta := newTestAuth(t)

	user, err := ta.repo.LoginUser("fake", "sub-1", &pb.User{})
	if err != nil {
		t.Fatalf("LoginUser: %v", err)
	}
	token, err := ta.repo.NewSession(user.Id)
	if err != nil {
		t.Fatalf("NewSession: %v", err)
	}

	req := httptest.NewRequest("POST", "/api/auth/logout", nil)
	req.AddCookie(&http.Cookie{Name: sessionCookie, Value: token})
	w := ta.do(req)
	resp := w.Result()
	if resp.StatusCode != http.StatusNoContent {
		t.Fatalf("status %d, want 204", resp.StatusCode)
	}
	if c := cookieNamed(t, resp, sessionCookie); c == nil || c.MaxAge >= 0 {
		t.Errorf("session cookie not cleared: %v", c)
	}
	if _, _, err := ta.repo.SessionUser(token); !errors.Is(err, repo.ErrNoSuchSession) {
		t.Errorf("session survived logout: %v", err)
	}

	// Logging out while not logged in is fine.
	w = ta.do(httptest.NewRequest("POST", "/api/auth/logout", nil))
	if w.Code != http.StatusNoContent {
		t.Errorf("anonymous logout: status %d, want 204", w.Code)
	}
}

func TestMiddleware(t *testing.T) {
	t.Parallel()
	ta := newTestAuth(t)

	user, err := ta.repo.LoginUser("fake", "sub-1", &pb.User{Email: "ada@example.com"})
	if err != nil {
		t.Fatalf("LoginUser: %v", err)
	}
	token, err := ta.repo.NewSession(user.Id)
	if err != nil {
		t.Fatalf("NewSession: %v", err)
	}

	var seen *pb.User
	wrapped := ta.handler.Middleware(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		seen = UserFromContext(req.Context())
	}))

	// No cookie: anonymous.
	seen = &pb.User{}
	wrapped.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest("GET", "/", nil))
	if seen != nil {
		t.Errorf("anonymous request got user %v", seen)
	}

	// Valid session: the user rides the context.
	req := httptest.NewRequest("GET", "/", nil)
	req.AddCookie(&http.Cookie{Name: sessionCookie, Value: token})
	wrapped.ServeHTTP(httptest.NewRecorder(), req)
	if seen == nil || seen.Id != user.Id {
		t.Errorf("session request got user %v, want %v", seen, user)
	}

	// Garbage cookie: anonymous, and the dead cookie is cleared.
	seen = &pb.User{}
	req = httptest.NewRequest("GET", "/", nil)
	req.AddCookie(&http.Cookie{Name: sessionCookie, Value: "garbage"})
	w := httptest.NewRecorder()
	wrapped.ServeHTTP(w, req)
	if seen != nil {
		t.Errorf("garbage-cookie request got user %v", seen)
	}
	if c := cookieNamed(t, w.Result(), sessionCookie); c == nil || c.MaxAge >= 0 {
		t.Errorf("dead session cookie not cleared: %v", c)
	}
}

