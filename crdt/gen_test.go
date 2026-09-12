package crdt

// Property-testing generators for *pb.Fill, built on hegel.
//
// # The universe-of-writes model
//
// Merge resolves per-cell conflicts by the total order
// (has CHECKED_RIGHT, clock, owner node name). That order is only a
// well-defined tie-break if the pair (node name, lamport clock) uniquely
// identifies a write: if two fills carried, at the same cell index, cells
// with the same owner name and the same clock but different contents,
// Merge would have nothing left to break the tie with, and would simply
// return whichever side it happened to look at last -- so
// Merge(l, r) != Merge(r, l) trivially, and the counterexample would say
// nothing about the CRDT. The real system never produces that: a node
// bumps its lamport clock on every write, so (node, clock) names exactly
// one write, forever.
//
// The generators here model that directly. A scenario draws a shared
// "universe" up front:
//
//   - a small set of node names (1-4 drawn from "n0".."n5"),
//   - a small set of cell indices (0..7),
//   - for each index, a pool of 0-3 candidate *versions* of that cell,
//     each with a distinct (owner name, clock) pair within the index.
//
// A version carries the content of a write -- fill text, clock, and the
// content flags CHECKED_RIGHT / CHECKED_WRONG / PENCIL. Every fill in the
// scenario is then assembled by picking, per index, either no cell or one
// version from that index's pool, so any two fills that mention the same
// (index, owner, clock) necessarily agree on content. The sticky history
// flags (DID_CHECK, DID_REVEAL) are deliberately allowed to vary per fill
// on top of a version, because Merge OR-merges them: they are observed
// history, not part of the write's identity.
//
// Clocks are drawn small (0..6) on purpose, so that ties across different
// owners -- the case that exercises the node-name tie-break -- are common.
//
// Each fill gets its own Nodes table: a randomly ordered permutation of
// some superset of the nodes its cells actually reference. Clients build
// node tables in arrival order, so unsorted tables and unreferenced
// entries are both realistic, and Merge is expected to canonicalize them.
//
// # Complete fills
//
// `complete` is terminal and server-only: the server stamps it on a merge
// output it has verified, under the game lock, so a complete fill is
// always canonical (sorted nodes) and there is at most one *distinct*
// complete fill per game. A scenario therefore, with some probability,
// designates a single canonical complete fill, and each fill in the
// scenario is either an exact clone of it or an ordinary non-complete
// fill. Two different complete fills are never generated together.

import (
	"fmt"
	"slices"
	"strings"
	"testing"

	"crossme.app/src/pb"

	"google.golang.org/protobuf/proto"
	"hegel.dev/go/hegel"
)

// allFlags is the set of flag bits Merge knows about. Generated fills
// never set anything outside this mask.
const allFlags = uint32(pb.Fill_CHECKED_RIGHT | pb.Fill_CHECKED_WRONG | pb.Fill_PENCIL |
	pb.Fill_DID_CHECK | pb.Fill_DID_REVEAL)

// contentFlags are the flags that belong to the winning write, and so are
// part of a write's content: two cells sharing an (index, owner, clock)
// must agree on them.
const contentFlags = uint32(pb.Fill_CHECKED_RIGHT | pb.Fill_CHECKED_WRONG | pb.Fill_PENCIL)

// stickyFlags are OR-merged by Merge rather than taken from the winner,
// so they may legitimately differ between fills that share a write.
const stickyFlags = uint32(pb.Fill_DID_CHECK | pb.Fill_DID_REVEAL)

// nodeUniverse is the fixed pool of node names scenarios draw from.
var nodeUniverse = []string{"n0", "n1", "n2", "n3", "n4", "n5"}

// fillAlphabet is the pool of cell contents; "" models an erased cell.
var fillAlphabet = []string{"", "A", "B", "C"}

const (
	maxCellIndex = 7 // indices 0..maxCellIndex may appear
	maxCellClock = 6 // per-cell lamport clocks are drawn from 0..maxCellClock
	maxPoolSize  = 3 // at most this many versions of any one cell
	maxNodes     = 4 // at most this many nodes in a scenario's universe
)

// version is one write in the scenario's universe: the content that any
// fill mentioning (index, owner, clock) must carry.
type version struct {
	index uint32
	owner string // node *name*, not an index into any Nodes table
	clock int64
	fill  string
	flags uint32 // content flags only; sticky bits are added per-fill
}

// scenario is the shared universe a group of fills is drawn from. All
// fills in one scenario are built from these same writes, which is what
// makes them plausible states of a single game.
type scenario struct {
	// nodes are the node names in play, in sorted order.
	nodes []string
	// pools maps a cell index to the candidate versions of that cell.
	// Within one index, every version has a distinct (owner, clock).
	pools map[uint32][]version
	// indices are the cell indices with a non-empty pool, ascending.
	indices []uint32
}

// drawScenario draws the shared universe: node names, cell indices, and
// the pool of candidate writes for each index.
func drawScenario(tc hegel.TestCase) *scenario {
	nnodes := hegel.Draw(tc, hegel.Integers(1, maxNodes))
	remaining := slices.Clone(nodeUniverse)
	nodes := make([]string, 0, nnodes)
	for range nnodes {
		i := hegel.Draw(tc, hegel.Integers(0, len(remaining)-1))
		nodes = append(nodes, remaining[i])
		remaining = slices.Delete(remaining, i, i+1)
	}
	slices.Sort(nodes)

	s := &scenario{nodes: nodes, pools: make(map[uint32][]version)}
	for idx := uint32(0); idx <= maxCellIndex; idx++ {
		n := hegel.Draw(tc, hegel.Integers(0, maxPoolSize))
		var pool []version
		for range n {
			v := version{
				index: idx,
				owner: hegel.Draw(tc, hegel.SampledFrom(nodes)),
				clock: hegel.Draw(tc, hegel.Integers[int64](0, maxCellClock)),
				fill:  hegel.Draw(tc, hegel.SampledFrom(fillAlphabet)),
				flags: hegel.Draw(tc, hegel.Integers[uint32](0, allFlags)) & contentFlags,
			}
			// (owner, clock) uniquely identifies a write, so a
			// collision is not a new version -- drop it.
			if slices.ContainsFunc(pool, func(o version) bool {
				return o.owner == v.owner && o.clock == v.clock
			}) {
				continue
			}
			pool = append(pool, v)
		}
		if len(pool) > 0 {
			s.pools[idx] = pool
			s.indices = append(s.indices, idx)
		}
	}
	return s
}

// drawFill assembles one well-formed, non-complete fill out of the
// scenario's universe.
func (s *scenario) drawFill(tc hegel.TestCase) *pb.Fill {
	// Pick at most one version per index, in ascending index order, so
	// Cells comes out sorted by construction.
	var picked []version
	var stickies []uint32
	for _, idx := range s.indices {
		pool := s.pools[idx]
		// -1 means "this fill has no cell at this index".
		choice := hegel.Draw(tc, hegel.Integers(-1, len(pool)-1))
		if choice < 0 {
			continue
		}
		picked = append(picked, pool[choice])
		// Sticky history flags are observed per-node, so they may
		// differ between two fills that share the same write.
		extra := uint32(0)
		if hegel.Draw(tc, hegel.Booleans()) {
			extra |= uint32(pb.Fill_DID_CHECK)
		}
		if hegel.Draw(tc, hegel.Booleans()) {
			extra |= uint32(pb.Fill_DID_REVEAL)
		}
		stickies = append(stickies, extra)
	}

	// Build this fill's node table: every referenced node, plus a random
	// subset of the rest, in random order.
	referenced := make(map[string]bool, len(picked))
	for _, v := range picked {
		referenced[v.owner] = true
	}
	var table []string
	for _, n := range s.nodes {
		if referenced[n] || hegel.Draw(tc, hegel.Booleans()) {
			table = append(table, n)
		}
	}
	// Permute: clients build node tables in arrival order, not sorted.
	for i := len(table) - 1; i > 0; i-- {
		j := hegel.Draw(tc, hegel.Integers(0, i))
		table[i], table[j] = table[j], table[i]
	}
	owners := make(map[string]uint32, len(table))
	for i, n := range table {
		owners[n] = uint32(i)
	}

	out := &pb.Fill{Nodes: table}
	var maxClock int64
	for i, v := range picked {
		out.Cells = append(out.Cells, &pb.Fill_Cell{
			Index: v.index,
			Clock: v.clock,
			Owner: owners[v.owner],
			Fill:  v.fill,
			Flags: v.flags | stickies[i],
		})
		maxClock = max(maxClock, v.clock)
	}
	// The fill-level clock is a lamport clock that dominates every write
	// the fill carries.
	out.Clock = maxClock + hegel.Draw(tc, hegel.Integers[int64](0, 3))
	return out
}

// genScenario returns a generator for exactly n fills drawn from one
// shared universe of writes (see the file comment). n is expected to be
// small; 1..5 is the intended range.
//
// With some probability the scenario designates a single canonical
// complete fill; each of the n fills is then either an exact clone of it
// or an ordinary non-complete fill. A scenario never contains two
// different complete fills.
func genScenario(n int) hegel.Generator[[]*pb.Fill] {
	return genFills(n, true)
}

// genFills is genScenario with control over whether complete fills may
// appear at all.
func genFills(n int, allowComplete bool) hegel.Generator[[]*pb.Fill] {
	return hegel.Composite(func(tc hegel.TestCase) []*pb.Fill {
		s := drawScenario(tc)

		// The server is the only writer of `complete`, and it stamps it
		// on a merge output, so the complete fill is canonical.
		// Designate a complete fill only occasionally: a complete side
		// wins wholesale, so too many of them would starve the
		// interesting per-cell merge paths.
		var complete *pb.Fill
		if allowComplete && hegel.Draw(tc, hegel.Integers(0, 3)) == 0 {
			complete = normalize(s.drawFill(tc))
			complete.Complete = true
		}

		out := make([]*pb.Fill, 0, n)
		for range n {
			if complete != nil && hegel.Draw(tc, hegel.Integers(0, 2)) == 0 {
				out = append(out, proto.CloneOf(complete))
				continue
			}
			out = append(out, s.drawFill(tc))
		}
		return out
	})
}

// genFill returns a generator for a single well-formed, non-complete
// fill.
func genFill() hegel.Generator[*pb.Fill] {
	return hegel.Map(genFills(1, false), func(fs []*pb.Fill) *pb.Fill { return fs[0] })
}

// malformedPair is a pair of fills of which at least one violates a
// well-formedness invariant Merge is documented to reject. Why describes
// the corruption(s) applied, for use with hegel's Note.
//
// NOTE: this is a struct rather than the [2]*pb.Fill the task sketched,
// so the description can ride along; use p.L / p.R for the two sides.
type malformedPair struct {
	L, R *pb.Fill
	Why  string
}

// genMalformedPair returns a generator for a pair of fills that Merge
// must reject, in either argument order. Both sides are non-complete:
// Merge short-circuits on a complete/non-complete pair before it
// validates anything, so a complete side would hide the corruption.
func genMalformedPair() hegel.Generator[malformedPair] {
	return hegel.Composite(func(tc hegel.TestCase) malformedPair {
		fills := hegel.Draw(tc, genFills(2, false))
		p := malformedPair{L: fills[0], R: fills[1]}

		// Corrupt the left, the right, or both.
		which := hegel.Draw(tc, hegel.Integers(0, 2))
		var why []string
		if which != 1 {
			why = append(why, "L: "+corrupt(tc, p.L))
		}
		if which != 0 {
			why = append(why, "R: "+corrupt(tc, p.R))
		}
		p.Why = strings.Join(why, "; ")
		return p
	})
}

// corrupt breaks one well-formedness invariant of f in place and returns
// a description of what it did.
func corrupt(tc hegel.TestCase, f *pb.Fill) string {
	// A cell owner out of range needs a cell to point with; a duplicate
	// node always works, since we can invent a node table if need be.
	badOwner := len(f.Cells) > 0 && hegel.Draw(tc, hegel.Booleans())
	if badOwner {
		i := hegel.Draw(tc, hegel.Integers(0, len(f.Cells)-1))
		over := hegel.Draw(tc, hegel.Integers[uint32](0, 2))
		f.Cells[i].Owner = uint32(len(f.Nodes)) + over
		return fmt.Sprintf("cell %d owner=%d out of range (%d nodes)",
			f.Cells[i].Index, f.Cells[i].Owner, len(f.Nodes))
	}
	if len(f.Nodes) == 0 {
		f.Nodes = []string{nodeUniverse[0], nodeUniverse[0]}
		return "duplicate node " + nodeUniverse[0] + " (empty node table)"
	}
	// Append a duplicate rather than inserting one, so existing owner
	// indices keep meaning the node they meant.
	i := hegel.Draw(tc, hegel.Integers(0, len(f.Nodes)-1))
	f.Nodes = append(f.Nodes, f.Nodes[i])
	return "duplicate node " + f.Nodes[i]
}

// normalize returns a clone of f with Nodes sorted and cell owners
// remapped accordingly. It deliberately does nothing else: unknown flag
// bits, unreferenced nodes, clocks and cells are left exactly as they
// were. Merge canonicalizes its output this way, so Merge's output for
// non-complete inputs should already satisfy normalize(out) == out.
//
// An owner index that is out of range is left alone rather than remapped.
func normalize(f *pb.Fill) *pb.Fill {
	if f == nil {
		return nil
	}
	out := proto.CloneOf(f)
	sorted := slices.Clone(out.Nodes)
	slices.Sort(sorted)
	pos := make(map[string]uint32, len(sorted))
	for i, n := range sorted {
		if _, ok := pos[n]; !ok {
			pos[n] = uint32(i)
		}
	}
	for _, c := range out.Cells {
		if c.Owner < uint32(len(out.Nodes)) {
			c.Owner = pos[out.Nodes[c.Owner]]
		}
	}
	out.Nodes = sorted
	return out
}

// fillsEqual reports whether a and b describe the same state, ignoring
// the order of their node tables.
func fillsEqual(a, b *pb.Fill) bool {
	return proto.Equal(normalize(a), normalize(b))
}

// fillsIdentical reports whether a and b are byte-for-byte the same
// message, node ordering included.
func fillsIdentical(a, b *pb.Fill) bool {
	return proto.Equal(a, b)
}

// checkWellFormed reports the first way in which f violates the
// invariants Merge assumes of its inputs: a unique node table, cells
// sorted strictly ascending by index, every owner in range, only known
// flag bits, and a fill-level clock that dominates every cell clock.
func checkWellFormed(f *pb.Fill) error {
	if f == nil {
		return fmt.Errorf("nil fill")
	}
	seen := make(map[string]struct{}, len(f.Nodes))
	for _, n := range f.Nodes {
		if _, ok := seen[n]; ok {
			return fmt.Errorf("duplicate node %q", n)
		}
		seen[n] = struct{}{}
	}
	for i, c := range f.Cells {
		if c == nil {
			return fmt.Errorf("cells[%d] is nil", i)
		}
		if i > 0 && c.Index <= f.Cells[i-1].Index {
			return fmt.Errorf("cells[%d].index=%d not > cells[%d].index=%d",
				i, c.Index, i-1, f.Cells[i-1].Index)
		}
		if c.Owner >= uint32(len(f.Nodes)) {
			return fmt.Errorf("cells[%d].owner=%d out of range (%d nodes)",
				i, c.Owner, len(f.Nodes))
		}
		if c.Flags&^allFlags != 0 {
			return fmt.Errorf("cells[%d].flags=%#x has unknown bits %#x",
				i, c.Flags, c.Flags&^allFlags)
		}
		if c.Clock > f.Clock {
			return fmt.Errorf("cells[%d].clock=%d exceeds fill clock %d",
				i, c.Clock, f.Clock)
		}
	}
	return nil
}

// isCanonical reports whether f is well-formed and its node table is
// sorted, which is the shape Merge produces.
func isCanonical(f *pb.Fill) bool {
	return checkWellFormed(f) == nil && slices.IsSorted(f.Nodes)
}

// cellAt returns the cell of f at the given index, or nil if f has none.
func cellAt(f *pb.Fill, index uint32) *pb.Fill_Cell {
	if f == nil {
		return nil
	}
	for _, c := range f.Cells {
		if c.Index == index {
			return c
		}
	}
	return nil
}

// ownerName returns the node name c's owner index refers to in f's node
// table, or "" if c is nil or the index is out of range.
func ownerName(f *pb.Fill, c *pb.Fill_Cell) string {
	if f == nil || c == nil || c.Owner >= uint32(len(f.Nodes)) {
		return ""
	}
	return f.Nodes[c.Owner]
}

// hasFlag reports whether c has the given flag set.
func hasFlag(c *pb.Fill_Cell, flag pb.Fill_Flags) bool {
	return c != nil && c.Flags&uint32(flag) != 0
}

var flagNames = []struct {
	flag pb.Fill_Flags
	name string
}{
	{pb.Fill_CHECKED_RIGHT, "RIGHT"},
	{pb.Fill_CHECKED_WRONG, "WRONG"},
	{pb.Fill_PENCIL, "PENCIL"},
	{pb.Fill_DID_CHECK, "DIDCHECK"},
	{pb.Fill_DID_REVEAL, "DIDREVEAL"},
}

func flagString(flags uint32) string {
	var parts []string
	for _, f := range flagNames {
		if flags&uint32(f.flag) != 0 {
			parts = append(parts, f.name)
		}
	}
	if rest := flags &^ allFlags; rest != 0 {
		parts = append(parts, fmt.Sprintf("%#x", rest))
	}
	if len(parts) == 0 {
		return "-"
	}
	return strings.Join(parts, "|")
}

// fillString renders f on a single line, for hegel Notes and failure
// messages. Cells read as index@owner:clock="fill"/flags.
func fillString(f *pb.Fill) string {
	if f == nil {
		return "<nil>"
	}
	var b strings.Builder
	fmt.Fprintf(&b, "{complete=%v clock=%d nodes=[%s] cells=[",
		f.Complete, f.Clock, strings.Join(f.Nodes, " "))
	for i, c := range f.Cells {
		if i > 0 {
			b.WriteString(" ")
		}
		owner := ownerName(f, c)
		if owner == "" {
			owner = fmt.Sprintf("?%d", c.Owner)
		}
		fmt.Fprintf(&b, "%d@%s:%d=%q/%s", c.Index, owner, c.Clock, c.Fill, flagString(c.Flags))
	}
	b.WriteString("]}")
	return b.String()
}

// mustMerge calls Merge and aborts the test case if it fails.
func mustMerge(ht *hegel.T, l, r *pb.Fill) *pb.Fill {
	out, err := Merge(l, r)
	if err != nil {
		ht.Fatalf("Merge(%s, %s): %v", fillString(l), fillString(r), err)
	}
	return out
}

// --- self-tests for the generators themselves ---------------------------

func TestGenScenarioWellFormed(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		n := hegel.Draw(ht, hegel.Integers(1, 5))
		fills := hegel.Draw(ht, genScenario(n))
		for _, f := range fills {
			ht.Note(fillString(f))
		}

		if len(fills) != n {
			ht.Fatalf("genScenario(%d) returned %d fills", n, len(fills))
		}

		var complete *pb.Fill
		for i, f := range fills {
			if err := checkWellFormed(f); err != nil {
				ht.Fatalf("fills[%d] malformed: %v", i, err)
			}
			if !f.Complete {
				continue
			}
			if !isCanonical(f) {
				ht.Fatalf("fills[%d] is complete but not canonical", i)
			}
			if complete == nil {
				complete = f
				continue
			}
			if !fillsIdentical(complete, f) {
				ht.Fatalf("two distinct complete fills in one scenario:\n%s\n%s",
					fillString(complete), fillString(f))
			}
		}

		// Any two cells that name the same write -- same index, owner
		// name and clock -- must agree on the write's content.
		for i, a := range fills {
			for j := i + 1; j < len(fills); j++ {
				b := fills[j]
				for _, ac := range a.Cells {
					bc := cellAt(b, ac.Index)
					if bc == nil {
						continue
					}
					if ownerName(a, ac) != ownerName(b, bc) || ac.Clock != bc.Clock {
						continue
					}
					if ac.Fill != bc.Fill {
						ht.Fatalf("fills[%d] and fills[%d] disagree on the fill of write %d@%s:%d: %q vs %q",
							i, j, ac.Index, ownerName(a, ac), ac.Clock, ac.Fill, bc.Fill)
					}
					if ac.Flags&contentFlags != bc.Flags&contentFlags {
						ht.Fatalf("fills[%d] and fills[%d] disagree on the flags of write %d@%s:%d: %s vs %s",
							i, j, ac.Index, ownerName(a, ac), ac.Clock,
							flagString(ac.Flags&contentFlags), flagString(bc.Flags&contentFlags))
					}
				}
			}
		}
	}, hegel.WithTestCases(300))
}

func TestGenMalformedPairRejected(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		p := hegel.Draw(ht, genMalformedPair())
		ht.Note("why: " + p.Why)
		ht.Note("L: " + fillString(p.L))
		ht.Note("R: " + fillString(p.R))

		if _, err := Merge(p.L, p.R); err == nil {
			ht.Fatalf("Merge(L, R) accepted a malformed pair (%s)", p.Why)
		}
		if _, err := Merge(p.R, p.L); err == nil {
			ht.Fatalf("Merge(R, L) accepted a malformed pair (%s)", p.Why)
		}
	}, hegel.WithTestCases(300))
}

func TestNormalizeIsIdempotentAndPreservesContent(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		f := hegel.Draw(ht, genFill())
		ht.Note(fillString(f))

		norm := normalize(f)
		ht.Note("normalized: " + fillString(norm))

		if !slices.IsSorted(norm.Nodes) {
			ht.Fatalf("normalize left nodes unsorted: %s", fillString(norm))
		}
		if !fillsIdentical(normalize(norm), norm) {
			ht.Fatalf("normalize is not idempotent:\n%s\n%s",
				fillString(norm), fillString(normalize(norm)))
		}
		if len(norm.Cells) != len(f.Cells) {
			ht.Fatalf("normalize changed the cell count: %d -> %d", len(f.Cells), len(norm.Cells))
		}
		for i, c := range f.Cells {
			nc := norm.Cells[i]
			if nc.Index != c.Index {
				ht.Fatalf("normalize reordered cells: %d -> %d", c.Index, nc.Index)
			}
			if got, want := ownerName(norm, nc), ownerName(f, c); got != want {
				ht.Fatalf("normalize changed the owner of cell %d: %q -> %q", c.Index, want, got)
			}
		}
	}, hegel.WithTestCases(300))
}
