package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"sort"
	"strings"

	"crossme.app/src/pb"
	"crossme.app/src/repo"
)

const (
	// The session cookie holds the bearer token for a row in the
	// sessions table. HttpOnly: the SPA never sees it, it just rides
	// along on /api requests and is interrogated via GetSelf.
	sessionCookie = "crossme_session"

	// The state cookie pins the OAuth `state` parameter across the
	// provider round-trip, tying the callback to the browser that
	// started the login. Scoped to /api/auth/ and short-lived.
	stateCookie   = "crossme_oauth_state"
	stateLifetime = 10 * 60 // seconds

	// The next cookie remembers where to send the browser after a login
	// that was started from somewhere other than the home page (today:
	// the preview-login consent page). Same scope and lifetime as the
	// state cookie; only ever a same-origin path.
	nextCookie = "crossme_oauth_next"
)

type Handler struct {
	repo      *repo.Repository
	providers map[string]Provider
}

func NewHandler(r *repo.Repository, providers ...Provider) *Handler {
	m := make(map[string]Provider, len(providers))
	for _, p := range providers {
		m[p.Name()] = p
	}
	return &Handler{repo: r, providers: m}
}

// Register installs the auth endpoints. They are plain HTTP, not Connect
// RPCs, because OAuth is a redirect dance; they live under /api/ so the
// existing nginx/vite proxying reaches them.
func (h *Handler) Register(mux *http.ServeMux) {
	mux.HandleFunc("GET /api/auth/{provider}/login", h.login)
	mux.HandleFunc("GET /api/auth/{provider}/callback", h.callback)
	mux.HandleFunc("POST /api/auth/logout", h.logout)
}

func (h *Handler) provider(w http.ResponseWriter, req *http.Request) Provider {
	p, ok := h.providers[req.PathValue("provider")]
	if !ok {
		http.Error(w, "unknown login provider", http.StatusNotFound)
		return nil
	}
	return p
}

// ProviderNames lists the enabled providers' slugs, sorted, for the
// client to build its sign-in links from.
func (h *Handler) ProviderNames() []string {
	names := make([]string, 0, len(h.providers))
	for name := range h.providers {
		names = append(names, name)
	}
	sort.Strings(names)
	return names
}

// loginURL is the path that starts a login with provider p, returning the
// browser to next (a same-origin path; empty means the home page)
// afterwards.
func loginURL(p Provider, next string) string {
	u := "/api/auth/" + p.Name() + "/login"
	if next != "" {
		u += "?next=" + url.QueryEscape(next)
	}
	return u
}

func (h *Handler) login(w http.ResponseWriter, req *http.Request) {
	p := h.provider(w, req)
	if p == nil {
		return
	}
	state := newState()
	setFlowCookie(w, req, stateCookie, state)
	if next := safeNext(req.URL.Query().Get("next")); next != "" {
		setFlowCookie(w, req, nextCookie, next)
	}
	http.Redirect(w, req, p.AuthCodeURL(state), http.StatusFound)
}

// safeNext returns next if it is a path on this origin that the browser
// can be sent to after login, and "" otherwise. Only absolute paths
// qualify; anything with a scheme or host (including the protocol-relative
// "//evil.example") is refused, so a crafted login link can't turn the
// callback into an open redirect.
func safeNext(next string) string {
	if !strings.HasPrefix(next, "/") || strings.HasPrefix(next, "//") || strings.HasPrefix(next, "/\\") {
		return ""
	}
	u, err := url.Parse(next)
	if err != nil || u.Scheme != "" || u.Host != "" || u.User != nil {
		return ""
	}
	return next
}

// setFlowCookie sets one of the short-lived cookies that carry a login
// across the provider round-trip.
func setFlowCookie(w http.ResponseWriter, req *http.Request, name, value string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     "/api/auth/",
		MaxAge:   stateLifetime,
		HttpOnly: true,
		Secure:   isSecure(req),
		SameSite: http.SameSiteLaxMode,
	})
}

func clearFlowCookie(w http.ResponseWriter, req *http.Request, name string) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Path:     "/api/auth/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   isSecure(req),
		SameSite: http.SameSiteLaxMode,
	})
}

func (h *Handler) callback(w http.ResponseWriter, req *http.Request) {
	p := h.provider(w, req)
	if p == nil {
		return
	}

	// Clear the flow cookies no matter how this turns out; they have
	// done their job the moment the callback arrives.
	clearFlowCookie(w, req, stateCookie)
	clearFlowCookie(w, req, nextCookie)

	// Where to go afterwards: wherever the login was started from, if
	// that was recorded, else home. Re-checked here so a tampered cookie
	// can't redirect off-site either.
	next := "/"
	if c, err := req.Cookie(nextCookie); err == nil {
		if safe := safeNext(c.Value); safe != "" {
			next = safe
		}
	}

	q := req.URL.Query()
	if errcode := q.Get("error"); errcode != "" {
		// The user backed out at the provider (access_denied and
		// friends). Not our error; just go home logged out.
		http.Redirect(w, req, "/", http.StatusFound)
		return
	}

	cookie, err := req.Cookie(stateCookie)
	if err != nil || cookie.Value == "" || cookie.Value != q.Get("state") {
		http.Error(w, "login state mismatch; please try signing in again",
			http.StatusBadRequest)
		return
	}

	ident, err := p.Exchange(req.Context(), q.Get("code"))
	if err != nil {
		log.Printf("auth: %s code exchange: %v", p.Name(), err)
		http.Error(w, "login failed", http.StatusBadGateway)
		return
	}

	user, err := h.repo.LoginUser(ident.Provider, ident.Subject, &pb.User{
		Email:       ident.Email,
		DisplayName: ident.Name,
		AvatarUrl:   ident.AvatarURL,
	})
	if err != nil {
		log.Printf("auth: recording %s login: %v", p.Name(), err)
		http.Error(w, "login failed", http.StatusInternalServerError)
		return
	}

	token, err := h.repo.NewSession(user.Id)
	if err != nil {
		log.Printf("auth: creating session: %v", err)
		http.Error(w, "login failed", http.StatusInternalServerError)
		return
	}

	setSessionCookie(w, req, token)
	http.Redirect(w, req, next, http.StatusFound)
}

func (h *Handler) logout(w http.ResponseWriter, req *http.Request) {
	if cookie, err := req.Cookie(sessionCookie); err == nil && cookie.Value != "" {
		if err := h.repo.DeleteSession(cookie.Value); err != nil {
			log.Printf("auth: deleting session: %v", err)
			http.Error(w, "logout failed", http.StatusInternalServerError)
			return
		}
	}
	clearSessionCookie(w, req)
	w.WriteHeader(http.StatusNoContent)
}

// currentUser resolves the request's session cookie to a user, or nil for
// an anonymous request. Unlike Middleware it has no side effects on the
// response; it is for the auth endpoints themselves.
func (h *Handler) currentUser(req *http.Request) *pb.User {
	cookie, err := req.Cookie(sessionCookie)
	if err != nil || cookie.Value == "" {
		return nil
	}
	user, _, err := h.repo.SessionUser(cookie.Value)
	if err != nil {
		if !errors.Is(err, repo.ErrNoSuchSession) {
			log.Printf("auth: resolving session: %v", err)
		}
		return nil
	}
	return user
}

// Middleware resolves the session cookie to a user and attaches it to the
// request context; handlers read it back with UserFromContext. Requests
// without a (valid) session pass through anonymous — nothing is denied
// here.
func (h *Handler) Middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		cookie, err := req.Cookie(sessionCookie)
		if err != nil || cookie.Value == "" {
			next.ServeHTTP(w, req)
			return
		}
		user, renewed, err := h.repo.SessionUser(cookie.Value)
		if err != nil {
			if !errors.Is(err, repo.ErrNoSuchSession) {
				log.Printf("auth: resolving session: %v", err)
			} else {
				// The cookie points at nothing (expired, or the
				// session was deleted); drop it so the browser
				// stops sending it.
				clearSessionCookie(w, req)
			}
			next.ServeHTTP(w, req)
			return
		}
		if renewed {
			// The server slid the session's expiry forward; refresh
			// the cookie so its own lifetime slides too.
			setSessionCookie(w, req, cookie.Value)
		}
		next.ServeHTTP(w, req.WithContext(withUser(req.Context(), user)))
	})
}

func setSessionCookie(w http.ResponseWriter, req *http.Request, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Value:    token,
		Path:     "/",
		MaxAge:   int(repo.SessionLifetime.Seconds()),
		HttpOnly: true,
		Secure:   isSecure(req),
		SameSite: http.SameSiteLaxMode,
	})
}

func clearSessionCookie(w http.ResponseWriter, req *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     sessionCookie,
		Path:     "/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   isSecure(req),
		SameSite: http.SameSiteLaxMode,
	})
}

// isSecure reports whether the browser reached us over https, directly or
// via the nginx proxy (which sets X-Forwarded-Proto).
func isSecure(req *http.Request) bool {
	return req.TLS != nil || req.Header.Get("X-Forwarded-Proto") == "https"
}

func newState() string {
	var raw [16]byte
	if _, err := rand.Read(raw[:]); err != nil {
		panic(fmt.Errorf("generating state: %v", err))
	}
	return hex.EncodeToString(raw[:])
}
