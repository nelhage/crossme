package main

import (
	"io"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

const testIndex = "<!doctype html><title>crossme</title>"

// buildDist writes a stand-in for a built client bundle.
func buildDist(t *testing.T) string {
	t.Helper()
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "index.html"), []byte(testIndex), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(dir, "assets"), 0o755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "assets", "app-abc123.js"), []byte("console.log(1)\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	return dir
}

func newTestSPA(t *testing.T) *spaHandler {
	t.Helper()
	h, err := newSPAHandler(buildDist(t))
	if err != nil {
		t.Fatal(err)
	}
	return h
}

func get(t *testing.T, h http.Handler, target string) *http.Response {
	t.Helper()
	w := httptest.NewRecorder()
	h.ServeHTTP(w, httptest.NewRequest("GET", target, nil))
	return w.Result()
}

func body(t *testing.T, resp *http.Response) string {
	t.Helper()
	b, err := io.ReadAll(resp.Body)
	if err != nil {
		t.Fatal(err)
	}
	return string(b)
}

func TestSPAMissingIndex(t *testing.T) {
	if _, err := newSPAHandler(t.TempDir()); err == nil {
		t.Fatal("expected an error for a directory with no index.html")
	}
}

func TestSPAServesIndex(t *testing.T) {
	resp := get(t, newTestSPA(t), "/")
	if resp.StatusCode != 200 {
		t.Fatalf("GET /: status %d", resp.StatusCode)
	}
	if got := body(t, resp); got != testIndex {
		t.Errorf("GET /: body %q", got)
	}
	if ct := resp.Header.Get("Content-Type"); !strings.HasPrefix(ct, "text/html") {
		t.Errorf("GET /: Content-Type %q", ct)
	}
	if cc := resp.Header.Get("Cache-Control"); cc != defaultCacheControl {
		t.Errorf("GET /: Cache-Control %q", cc)
	}
}

func TestSPASecurityHeaders(t *testing.T) {
	for _, path := range []string{"/", "/assets/app-abc123.js", "/games/abc"} {
		resp := get(t, newTestSPA(t), path)
		for header, want := range map[string]string{
			"Content-Security-Policy": staticCSP,
			"X-Content-Type-Options":  "nosniff",
			"Referrer-Policy":         "same-origin",
		} {
			if got := resp.Header.Get(header); got != want {
				t.Errorf("GET %s: %s = %q, want %q", path, header, got, want)
			}
		}
	}
}

func TestSPAServesAssetImmutably(t *testing.T) {
	resp := get(t, newTestSPA(t), "/assets/app-abc123.js")
	if resp.StatusCode != 200 {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if got := body(t, resp); got != "console.log(1)\n" {
		t.Errorf("body %q", got)
	}
	if cc := resp.Header.Get("Cache-Control"); cc != immutableCacheControl {
		t.Errorf("Cache-Control %q, want %q", cc, immutableCacheControl)
	}
}

// An unknown path is a client-side route: it gets the app shell, and the shell
// must stay revalidated so a deploy doesn't strand clients on a stale one.
func TestSPAFallsBackToIndex(t *testing.T) {
	resp := get(t, newTestSPA(t), "/games/abc")
	if resp.StatusCode != 200 {
		t.Fatalf("status %d", resp.StatusCode)
	}
	if got := body(t, resp); got != testIndex {
		t.Errorf("body %q, want the app shell", got)
	}
	if cc := resp.Header.Get("Cache-Control"); cc != defaultCacheControl {
		t.Errorf("Cache-Control %q, want %q", cc, defaultCacheControl)
	}
}

// A hashed asset that doesn't exist isn't immutable, whatever its path says.
func TestSPAMissingAssetIsNotImmutable(t *testing.T) {
	resp := get(t, newTestSPA(t), "/assets/gone-000000.js")
	if got := body(t, resp); got != testIndex {
		t.Errorf("body %q, want the app shell", got)
	}
	if cc := resp.Header.Get("Cache-Control"); cc != defaultCacheControl {
		t.Errorf("Cache-Control %q, want %q", cc, defaultCacheControl)
	}
}

// Directories get the app shell, never a listing.
func TestSPANoDirectoryListing(t *testing.T) {
	for _, path := range []string{"/assets", "/assets/"} {
		resp := get(t, newTestSPA(t), path)
		got := body(t, resp)
		if got != testIndex {
			t.Errorf("GET %s: body %q, want the app shell", path, got)
		}
		if strings.Contains(got, "app-abc123.js") {
			t.Errorf("GET %s: response lists directory contents", path)
		}
	}
}

func TestSPARejectsWrites(t *testing.T) {
	w := httptest.NewRecorder()
	newTestSPA(t).ServeHTTP(w, httptest.NewRequest("POST", "/games/abc", nil))
	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("POST: status %d, want 405", w.Code)
	}
}

// The SPA catch-all must not swallow the API or the health check when it's
// mounted alongside them, which is exactly how main wires it up.
func TestSPADoesNotShadowAPI(t *testing.T) {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, req *http.Request) {
		io.WriteString(w, "ok\n")
	})
	mux.HandleFunc("GET /api/auth/{provider}/login", func(w http.ResponseWriter, req *http.Request) {
		io.WriteString(w, "login:"+req.PathValue("provider"))
	})
	mux.HandleFunc("GET /api/auth/{provider}/callback", func(w http.ResponseWriter, req *http.Request) {
		io.WriteString(w, "callback")
	})
	mux.HandleFunc("/api/crossme.CrossMe/", func(w http.ResponseWriter, req *http.Request) {
		io.WriteString(w, "rpc:"+strings.TrimPrefix(req.URL.Path, "/api/crossme.CrossMe/"))
	})
	mux.Handle("/api/", http.NotFoundHandler())
	mux.Handle("/", newTestSPA(t))

	for target, want := range map[string]string{
		"/healthz":                     "ok\n",
		"/api/auth/google/login":       "login:google",
		"/api/auth/google/callback":    "callback",
		"/api/crossme.CrossMe/GetSelf": "rpc:GetSelf",
	} {
		if got := body(t, get(t, mux, target)); got != want {
			t.Errorf("GET %s: body %q, want %q", target, got, want)
		}
	}

	// Anything else under /api/ is a 404 from the API, not the app shell.
	resp := get(t, mux, "/api/nope")
	if resp.StatusCode != http.StatusNotFound {
		t.Errorf("GET /api/nope: status %d, want 404", resp.StatusCode)
	}
	if got := body(t, resp); strings.Contains(got, "<!doctype html>") {
		t.Errorf("GET /api/nope: served the app shell: %q", got)
	}
}
