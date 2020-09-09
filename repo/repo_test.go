package repo

import (
	"io/ioutil"
	"log"
	"path"
	"sort"
	"testing"

	mysqltest "github.com/lestrrat-go/test-mysqld"

	"crossme.app/src/puz"
)

func TestOpenEmpty(t *testing.T) {
	t.Parallel()
	mysqld, err := mysqltest.NewMysqld(nil)
	if err != nil {
		t.Fatalf("Failed to start mysqld: %s", err)
	}
	defer mysqld.Stop()
	repo, err := Open(mysqld.DSN())
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
	t.Parallel()
	mysqld, err := mysqltest.NewMysqld(nil)
	if err != nil {
		log.Fatalf("Failed to start mysqld: %s", err)
	}
	defer mysqld.Stop()

	repo, err := Open(mysqld.DSN())
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer repo.Close()

	var version int32 = 32

	repo.Config.SchemaVersion = version
	if err := repo.FlushConfig(); err != nil {
		t.Fatal("FlushConfig", err)
	}

	r2, err := Open(mysqld.DSN())
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
	t.Parallel()
	mysqld, err := mysqltest.NewMysqld(nil)
	if err != nil {
		log.Fatalf("Failed to start mysqld: %s", err)
	}
	defer mysqld.Stop()
	repo, err := Open(mysqld.DSN())
	if err != nil {
		t.Fatalf("open: %v", err)
	}
	defer repo.Close()

	var ids []string
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

		id, err := repo.InsertPuzzle(Puz2Proto(puzzle), data)
		if err != nil {
			t.Fatalf("insert %q: %v", name, err)
		}
		ids = append(ids, id)
	}

	sort.Slice(ids, func(i, j int) bool { return ids[i] < ids[j] })
	if ids[0] == ids[1] {
		t.Fatalf("duplicate ids: %#v", ids)
	}

	index, err := repo.PuzzleIndex()
	if err != nil {
		t.Fatalf("PuzzleIndex: %v", err)
	}
	sort.Slice(index, func(i, j int) bool { return index[i].Id < index[j].Id })
	if len(index) != 2 {
		t.Fatalf("expected two puzzles, got %d", len(index))
	}

	for i, idx := range index {
		if idx.Id != ids[i] {
			t.Errorf("got back the wrong id, got %s want %s", idx.Id, ids[i])
		}
		rt, err := repo.PuzzleById(idx.Id)
		if err != nil {
			t.Errorf("Get(%q): %v", idx.Id, err)
			continue
		}

		if rt.Metadata.Id != idx.Id ||
			rt.Title != idx.Title {
			t.Errorf("%q[sha=%s]: Failed to round trip", idx.Title, idx.Id)
		}
	}
}
