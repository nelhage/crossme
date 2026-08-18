package auth

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"net/http"

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

func (h *Handler) login(w http.ResponseWriter, req *http.Request) {
	p := h.provider(w, req)
	if p == nil {
		return
	}
	state := newState()
	http.SetCookie(w, &http.Cookie{
		Name:     stateCookie,
		Value:    state,
		Path:     "/api/auth/",
		MaxAge:   stateLifetime,
		HttpOnly: true,
		Secure:   isSecure(req),
		SameSite: http.SameSiteLaxMode,
	})
	http.Redirect(w, req, p.AuthCodeURL(state), http.StatusFound)
}

func (h *Handler) callback(w http.ResponseWriter, req *http.Request) {
	p := h.provider(w, req)
	if p == nil {
		return
	}

	// Clear the state cookie no matter how this turns out; it has done
	// its job the moment the callback arrives.
	http.SetCookie(w, &http.Cookie{
		Name:     stateCookie,
		Path:     "/api/auth/",
		MaxAge:   -1,
		HttpOnly: true,
		Secure:   isSecure(req),
		SameSite: http.SameSiteLaxMode,
	})

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
	http.Redirect(w, req, "/", http.StatusFound)
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
