package seed

import (
	"bytes"
	"context"
	"encoding/json"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/klauspost/compress/zstd"
)

const (
	testProvider = "//iam.googleapis.com/projects/123/locations/global/workloadIdentityPools/fly-io/providers/fly-io"
	testJWT      = "eyJhbGciOiJub25lIn0.eyJzdWIiOiJwZXJzb25hbDpjcm9zc21lLXByLTE6bWFjaGluZSJ9.sig"
	testAccess   = "ya29.federated"
)

// fakeCloud stands in for the Fly agent socket, Google STS, and GCS. It
// records what it was asked so tests can check the exchange was done right.
type fakeCloud struct {
	t       *testing.T
	object  []byte // what GCS serves for the one object it knows about
	flyAud  string
	stsBody map[string]string
	gotAuth string
	gotPath string
	calls   int

	socket     string
	stsURL     string
	storageURL string
}

func newFakeCloud(t *testing.T, object []byte) *fakeCloud {
	t.Helper()
	f := &fakeCloud{t: t, object: object}

	// Fly agent: unix socket, returns the bare JWT.
	f.socket = filepath.Join(t.TempDir(), "api")
	ln, err := net.Listen("unix", f.socket)
	if err != nil {
		t.Fatal(err)
	}
	fly := &http.Server{Handler: http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		f.calls++
		if r.Method != http.MethodPost || r.URL.Path != "/v1/tokens/oidc" {
			http.Error(w, "bad request", http.StatusBadRequest)
			return
		}
		var body struct{ Aud string }
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		f.flyAud = body.Aud
		io.WriteString(w, testJWT)
	})}
	go fly.Serve(ln)
	t.Cleanup(func() { fly.Close() })

	sts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		f.calls++
		if err := json.NewDecoder(r.Body).Decode(&f.stsBody); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if f.stsBody["subjectToken"] != testJWT {
			http.Error(w, `{"error":"invalid_grant"}`, http.StatusBadRequest)
			return
		}
		json.NewEncoder(w).Encode(map[string]any{
			"access_token": testAccess, "token_type": "Bearer", "expires_in": 3600,
		})
	}))
	t.Cleanup(sts.Close)
	f.stsURL = sts.URL

	storage := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		f.calls++
		f.gotAuth = r.Header.Get("Authorization")
		f.gotPath = r.URL.RequestURI()
		if f.gotAuth != "Bearer "+testAccess {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		w.Write(f.object)
	}))
	t.Cleanup(storage.Close)
	f.storageURL = storage.URL
	return f
}

func (f *fakeCloud) options(source string) Options {
	return Options{
		Source:           source,
		IdentityProvider: testProvider,
		FlySocket:        f.socket,
		STSURL:           f.stsURL,
		StorageURL:       f.storageURL,
	}
}

// fakeDB is a byte string that passes the header check.
var fakeDB = []byte(sqliteHeader + "the rest of the database")

func compress(t *testing.T, data []byte) []byte {
	t.Helper()
	var buf bytes.Buffer
	enc, err := zstd.NewWriter(&buf)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := enc.Write(data); err != nil {
		t.Fatal(err)
	}
	if err := enc.Close(); err != nil {
		t.Fatal(err)
	}
	return buf.Bytes()
}

func TestEnsureDownloadsCompressedSnapshot(t *testing.T) {
	cloud := newFakeCloud(t, compress(t, fakeDB))
	dbPath := filepath.Join(t.TempDir(), "crossme.db")

	err := Ensure(context.Background(), dbPath, cloud.options("gs://nelhage-data/crossme/crossme.db.zst"))
	if err != nil {
		t.Fatal(err)
	}

	got, err := os.ReadFile(dbPath)
	if err != nil {
		t.Fatal(err)
	}
	if !bytes.Equal(got, fakeDB) {
		t.Errorf("db contents = %q, want %q", got, fakeDB)
	}

	if cloud.flyAud != DefaultAudience {
		t.Errorf("Fly token audience = %q, want %q", cloud.flyAud, DefaultAudience)
	}
	if cloud.stsBody["audience"] != testProvider {
		t.Errorf("STS audience = %q, want %q", cloud.stsBody["audience"], testProvider)
	}
	if cloud.stsBody["subjectTokenType"] != "urn:ietf:params:oauth:token-type:jwt" {
		t.Errorf("STS subjectTokenType = %q", cloud.stsBody["subjectTokenType"])
	}
	want := "/storage/v1/b/nelhage-data/o/crossme%2Fcrossme.db.zst?alt=media"
	if cloud.gotPath != want {
		t.Errorf("storage request = %q, want %q", cloud.gotPath, want)
	}

	// No leftover temp files.
	entries, _ := os.ReadDir(filepath.Dir(dbPath))
	if len(entries) != 1 {
		t.Errorf("directory has %d entries, want just the db: %v", len(entries), entries)
	}
}

func TestEnsureUncompressed(t *testing.T) {
	cloud := newFakeCloud(t, fakeDB)
	dbPath := filepath.Join(t.TempDir(), "crossme.db")
	if err := Ensure(context.Background(), dbPath, cloud.options("gs://b/crossme.db")); err != nil {
		t.Fatal(err)
	}
	got, _ := os.ReadFile(dbPath)
	if !bytes.Equal(got, fakeDB) {
		t.Errorf("db contents = %q", got)
	}
}

func TestEnsureCustomAudience(t *testing.T) {
	cloud := newFakeCloud(t, fakeDB)
	opts := cloud.options("gs://b/crossme.db")
	opts.Audience = "other"
	if err := Ensure(context.Background(), filepath.Join(t.TempDir(), "db"), opts); err != nil {
		t.Fatal(err)
	}
	if cloud.flyAud != "other" {
		t.Errorf("Fly token audience = %q, want other", cloud.flyAud)
	}
}

func TestEnsureLeavesExistingDatabaseAlone(t *testing.T) {
	cloud := newFakeCloud(t, fakeDB)
	dbPath := filepath.Join(t.TempDir(), "crossme.db")
	existing := []byte("existing")
	os.WriteFile(dbPath, existing, 0o644)

	if err := Ensure(context.Background(), dbPath, cloud.options("gs://b/crossme.db")); err != nil {
		t.Fatal(err)
	}
	if cloud.calls != 0 {
		t.Errorf("made %d network calls for an existing db", cloud.calls)
	}
	got, _ := os.ReadFile(dbPath)
	if !bytes.Equal(got, existing) {
		t.Errorf("existing db was overwritten: %q", got)
	}
}

func TestEnsureRejectsNonDatabase(t *testing.T) {
	cloud := newFakeCloud(t, []byte("<html>oops</html>"))
	dir := t.TempDir()
	dbPath := filepath.Join(dir, "crossme.db")

	err := Ensure(context.Background(), dbPath, cloud.options("gs://b/crossme.db"))
	if err == nil || !strings.Contains(err.Error(), "not a SQLite database") {
		t.Fatalf("err = %v, want not-a-database", err)
	}
	if _, err := os.Stat(dbPath); err == nil {
		t.Error("db file was created from a bad snapshot")
	}
	entries, _ := os.ReadDir(dir)
	if len(entries) != 0 {
		t.Errorf("leftover files after failure: %v", entries)
	}
}

func TestEnsureConfigErrors(t *testing.T) {
	cloud := newFakeCloud(t, fakeDB)
	dbPath := filepath.Join(t.TempDir(), "crossme.db")

	for _, tc := range []struct {
		name string
		edit func(*Options)
		want string
	}{
		{"bad source", func(o *Options) { o.Source = "https://x/y" }, "gs://bucket/object"},
		{"no object", func(o *Options) { o.Source = "gs://bucket" }, "gs://bucket/object"},
		{"no provider", func(o *Options) { o.IdentityProvider = "" }, "identity provider"},
	} {
		opts := cloud.options("gs://b/crossme.db")
		tc.edit(&opts)
		err := Ensure(context.Background(), dbPath, opts)
		if err == nil || !strings.Contains(err.Error(), tc.want) {
			t.Errorf("%s: err = %v, want containing %q", tc.name, err, tc.want)
		}
	}
	if cloud.calls != 0 {
		t.Errorf("made %d network calls despite bad config", cloud.calls)
	}
}
