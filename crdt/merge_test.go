package crdt

import (
	"encoding/json"
	"fmt"
	"os"
	"path"
	"testing"

	"crossme.app/src/pb"

	"github.com/kylelemons/godebug/diff"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

// mustReadFile reads a test vector. The vectors are protobuf JSON, and
// are read directly by the TypeScript merge tests as well (via the
// `testdata` symlink), so both implementations parse the same bytes and
// neither test run can leave the other validating stale input.
func mustReadFile(t *testing.T, path string) *pb.Fill {
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("ReadFile(%q): %v", path, err)
	}
	out := &pb.Fill{}
	if err := protojson.Unmarshal(data, out); err != nil {
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

	inc := proto.CloneOf(m)

	assertMerge(t, "(left, right), m", m1, m, inc)
	assertMerge(t, "(right, left), m", m2, m, inc)
	assertMerge(t, "m, (left, right)", m, m1, inc)
	assertMerge(t, "m, (right, left), m", m, m2, inc)
	assertMerge(t, "m, m", m, m, inc)
}

func TestMerge(t *testing.T) {
	dents, err := os.ReadDir("testdata/merge")
	if err != nil {
		t.Fatalf("readdir: %v", err)
	}

	for _, d := range dents {
		t.Run(d.Name(), func(t *testing.T) {
			t.Parallel()
			runOne(t, path.Join("testdata/merge", d.Name()))
		})
	}
}

// runAssociative checks that three-way merges converge to the same
// state regardless of the order or association of the merges. Two-way
// tests can't catch rules that consult fill-level state when resolving
// cell conflicts; the old "complete side wins per-cell" rule was
// non-associative in exactly that way.
func runAssociative(t *testing.T, dir string) {
	a := mustReadFile(t, path.Join(dir, "a.json"))
	b := mustReadFile(t, path.Join(dir, "b.json"))
	c := mustReadFile(t, path.Join(dir, "c.json"))
	m := mustReadFile(t, path.Join(dir, "merged.json"))

	fills := []*pb.Fill{a, b, c}
	names := []string{"a", "b", "c"}
	perms := [][3]int{{0, 1, 2}, {0, 2, 1}, {1, 0, 2}, {1, 2, 0}, {2, 0, 1}, {2, 1, 0}}
	for _, p := range perms {
		x, y, z := fills[p[0]], fills[p[1]], fills[p[2]]
		xn, yn, zn := names[p[0]], names[p[1]], names[p[2]]

		xy, err := Merge(x, y)
		if err != nil {
			t.Fatalf("Merge(%s, %s): %v", xn, yn, err)
		}
		assertMerge(t, fmt.Sprintf("merge(merge(%s, %s), %s)", xn, yn, zn), xy, z, m)

		yz, err := Merge(y, z)
		if err != nil {
			t.Fatalf("Merge(%s, %s): %v", yn, zn, err)
		}
		assertMerge(t, fmt.Sprintf("merge(%s, merge(%s, %s))", xn, yn, zn), x, yz, m)
	}
}

func TestMergeAssociative(t *testing.T) {
	dents, err := os.ReadDir("testdata/associative")
	if err != nil {
		t.Fatalf("readdir: %v", err)
	}

	for _, d := range dents {
		t.Run(d.Name(), func(t *testing.T) {
			t.Parallel()
			runAssociative(t, path.Join("testdata/associative", d.Name()))
		})
	}
}

// A duplicate entry in a node table makes the `owner` indices into it
// ambiguous; both implementations reject such a fill, from either side.
func TestMergeDuplicateNodes(t *testing.T) {
	dup := &pb.Fill{
		Clock: 1,
		Nodes: []string{"nodeA", "nodeA"},
		Cells: []*pb.Fill_Cell{{Index: 1, Clock: 1, Owner: 0, Fill: "X"}},
	}
	ok := &pb.Fill{
		Clock: 1,
		Nodes: []string{"nodeB"},
		Cells: []*pb.Fill_Cell{{Index: 1, Clock: 1, Owner: 0, Fill: "Y"}},
	}

	if _, err := Merge(dup, ok); err == nil {
		t.Errorf("Merge(dup, ok): expected an error")
	}
	if _, err := Merge(ok, dup); err == nil {
		t.Errorf("Merge(ok, dup): expected an error")
	}
}
