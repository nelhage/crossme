package repo

import (
	"io/ioutil"
	"os"
	"testing"
)

func TestOpenEmpty(t *testing.T) {
	repo, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer repo.Close()
	if repo.db == nil {
		t.Fatalf("open: nil db")
	}
	if v := repo.Config.SchemaVersion; v != 0 {
		t.Fatalf("schema version %d", v)
	}
}

func TestRoundTripConfig(t *testing.T) {
	f, err := ioutil.TempFile("", "crossme*.sql")
	if err != nil {
		t.Fatalf("tempfile: %v", err)
	}
	defer os.Remove(f.Name())

	repo, err := Open(f.Name())
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer repo.Close()

	var version int32 = 32

	repo.Config.SchemaVersion = version
	if err := repo.FlushConfig(); err != nil {
		t.Fatal("FlushConfig", err)
	}

	r2, err := Open(f.Name())
	if err != nil {
		t.Fatal("reopen", err)
	}
	defer r2.Close()
	if v := r2.Config.SchemaVersion; v != version {
		t.Fatalf("wrong config version on reopen: %d", v)
	}
}
