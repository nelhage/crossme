package repo

import (
	"io/ioutil"
	"log"
	"os"
	"path"
	"testing"

	"crossme.app/src/puz"
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

const TestdataPath = "../puz/testdata"

func TestInsertQuery(t *testing.T) {
	repo, err := Open(":memory:")
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer repo.Close()

	for _, name := range []string{
		"nyt_sun_rebus.puz",
		"nyt_with_shape.puz",
	} {
		data, err := ioutil.ReadFile(path.Join(TestdataPath, name))
		if err != nil {
			t.Fatalf("Reading puzzle: %v", err)
		}

		puzzle, err := puz.FromBytes(data)
		if err != nil {
			t.Fatalf("Loading puzzle: %v", err)
		}

		err = repo.InsertPuzzle(Puz2Proto(puzzle), data)
		if err != nil {
			t.Fatalf("insert %q: %v", name, err)
		}
	}

	index, err := repo.PuzzleIndex()
	if err != nil {
		t.Fatalf("PuzzleIndex: %v", err)
	}
	if len(index) != 2 {
		t.Fatalf("expected two puzzles")
	}
	log.Printf("%#v", index)
	for _, idx := range index {
		rt, err := repo.PuzzleBySha256(idx.Sha256)
		if err != nil {
			t.Errorf("Get(%q): %v", idx.Sha256, err)
		}
		if rt.Metadata.Sha256 != idx.Sha256 ||
			rt.Title != idx.Title {
			t.Errorf("%q[sha=%s]: Failed to round trip", idx.Title, idx.Sha256)
		}
	}
}
