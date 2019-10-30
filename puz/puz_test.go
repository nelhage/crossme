package puz

import (
	"io/ioutil"
	"path"
	"testing"
)

func TestPuzReader(t *testing.T) {
	puzzles := make(map[string]*PuzFile)
	dents, err := ioutil.ReadDir("testdata")
	if err != nil {
		t.Fatal(err)
	}
	for _, ent := range dents {
		puzzles[ent.Name()], err = FromFile(path.Join("testdata", ent.Name()))
		if err != nil {
			t.Errorf("FromFile(%q): %v", ent.Name(), err)
		}
	}
	for _, ent := range puzzles {
		if ent == nil {
			return
		}
	}
}
