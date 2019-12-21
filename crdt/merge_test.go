package crdt

import (
	"encoding/json"
	"io/ioutil"
	"path"
	"testing"

	"crossme.app/src/pb"

	"github.com/kylelemons/godebug/diff"
)

func mustReadFile(t *testing.T, path string) *pb.Fill {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile(%q): %v", path, err)
	}
	var out *pb.Fill
	if err := json.Unmarshal(data, &out); err != nil {
		t.Fatalf("Unmarshal(%q): %v", path, err)
	}
	return out
}

func assertMerge(t *testing.T, name string, left *pb.Fill, right *pb.Fill, out *pb.Fill) *pb.Fill {
	merged, err := Merge(left, right)
	if err != nil {
		t.Fatalf("Merge: %v", err)
	}
	gotbytes, err := json.MarshalIndent(merged, "", "  ")
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}
	wantbytes, err := json.MarshalIndent(out, "", "  ")
	if err != nil {
		t.Fatalf("Marshal: %v", err)
	}
	gotstr := string(gotbytes)
	wantstr := string(wantbytes)
	if gotstr != wantstr {
		d := diff.Diff(wantstr, gotstr)
		t.Fatalf("merge error (%s): diff (-want, +got):\n%s", name, d)
	}
	return merged
}

func runOne(t *testing.T, dir string) {
	l := mustReadFile(t, path.Join(dir, "left.json"))
	r := mustReadFile(t, path.Join(dir, "right.json"))
	m := mustReadFile(t, path.Join(dir, "merged.json"))

	m1 := assertMerge(t, "left, right", l, r, m)
	m2 := assertMerge(t, "right, left", r, l, m)

	inc := *m

	assertMerge(t, "(left, right), m", m1, m, &inc)
	assertMerge(t, "(right, left), m", m2, m, &inc)
	assertMerge(t, "m, (left, right)", m, m1, &inc)
	assertMerge(t, "m, (right, left), m", m, m2, &inc)
	assertMerge(t, "m, m", m, m, &inc)
}

func TestMerge(t *testing.T) {
	dents, err := ioutil.ReadDir("testdata/merge")
	if err != nil {
		t.Fatalf("readdir: %v", err)
	}

	for _, d := range dents {
		d := d
		t.Run(d.Name(), func(t *testing.T) {
			t.Parallel()
			runOne(t, path.Join("testdata/merge", d.Name()))
		})
	}
}
