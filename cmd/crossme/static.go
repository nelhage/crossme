package main

import (
	"fmt"
	"io/fs"
	"net/http"
	"os"
	"path"
	"strings"
)

// These mirror the headers client/nginx.conf sets in production, where nginx
// serves the built client and proxies /api/ to us. The preview image collapses
// both jobs into this process, so the responses have to look the same.
const (
	// We serve our own JS and talk only to our own API; lock the page down to
	// that. 'unsafe-inline' is needed for react-select/bootstrap's injected
	// styles. googleusercontent.com hosts the avatars of users signed in with
	// Google.
	staticCSP = "default-src 'self'; style-src 'self' 'unsafe-inline'; " +
		"img-src 'self' data: https://*.googleusercontent.com; connect-src 'self'; " +
		"frame-ancestors 'none'; base-uri 'self'"

	// Vite emits content-hashed filenames under /assets/, so those are
	// immutable. Everything else (chiefly index.html) must be revalidated so a
	// deploy doesn't strand clients on a stale app shell.
	immutableCacheControl = "max-age=31536000,immutable"
	defaultCacheControl   = "no-cache"
)

// spaHandler serves a built client bundle out of a directory, with the
// single-page-app fallback nginx spells `try_files $uri $uri/ /index.html`:
// anything that isn't a file on disk gets the app shell, and the client router
// takes it from there. It never lists directories.
type spaHandler struct {
	fsys fs.FS
}

// newSPAHandler fails if dir doesn't look like a built client, so a
// misconfigured -static-dir is a startup error rather than a site that 404s
// every page.
func newSPAHandler(dir string) (*spaHandler, error) {
	fsys := os.DirFS(dir)
	if _, err := fs.Stat(fsys, "index.html"); err != nil {
		return nil, fmt.Errorf("%s: %w", path.Join(dir, "index.html"), err)
	}
	return &spaHandler{fsys: fsys}, nil
}

func (h *spaHandler) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	hdr := w.Header()
	hdr.Set("Content-Security-Policy", staticCSP)
	hdr.Set("X-Content-Type-Options", "nosniff")
	hdr.Set("Referrer-Policy", "same-origin")

	if req.Method != http.MethodGet && req.Method != http.MethodHead {
		hdr.Set("Cache-Control", defaultCacheControl)
		hdr.Set("Allow", "GET, HEAD")
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// path.Clean resolves any ".." the mux didn't already redirect away, and
	// fs.ValidPath rejects anything still malformed, so we only ever open names
	// rooted inside the directory.
	name := strings.TrimPrefix(path.Clean("/"+req.URL.Path), "/")
	if name != "" && fs.ValidPath(name) {
		// Only regular files are served: a directory falls through to the app
		// shell rather than producing a listing.
		if st, err := fs.Stat(h.fsys, name); err == nil && st.Mode().IsRegular() {
			hdr.Set("Cache-Control", cacheControlFor(req.URL.Path))
			http.ServeFileFS(w, req, h.fsys, name)
			return
		}
	}

	// The fallback is always the app shell, which must be revalidated even
	// under /assets/ — a hashed name that doesn't exist isn't immutable.
	hdr.Set("Cache-Control", defaultCacheControl)
	http.ServeFileFS(w, req, h.fsys, "index.html")
}

func cacheControlFor(urlPath string) string {
	if strings.HasPrefix(urlPath, "/assets/") {
		return immutableCacheControl
	}
	return defaultCacheControl
}
