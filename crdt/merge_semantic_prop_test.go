package crdt

// Property tests for the *per-cell semantics* of Merge: what the merged
// value of a single cell is, given the two cells (or the one cell) the
// inputs offer at that index.
//
// This file is deliberately scoped to "what does cell N come out as, and
// where did it come from". The sibling file merge_algebra_prop_test.go
// covers the algebraic laws of the join itself -- commutativity,
// associativity, idempotence, absorption, N-way convergence, non-mutation,
// error symmetry and canonical output -- and nothing here should duplicate
// those.
//
// The rules under test, from merge.go and the "Game CRDT" section of
// ARCHITECTURE.md:
//
//   - a `complete` side is terminal and wins wholesale;
//   - the sticky history flags DID_CHECK / DID_REVEAL are OR-merged;
//   - a cell that exactly one side has marked CHECKED_RIGHT wins outright,
//     whatever the clocks say;
//   - otherwise the higher (clock, owner node name) wins;
//   - and the winner supplies Fill, Clock, owner and the content flags
//     CHECKED_RIGHT / CHECKED_WRONG / PENCIL -- content flags are taken,
//     never OR'ed.
//
// These are exactly the rules the live client merge was found to be
// missing in notes/2026-08-10-crdt-bugs.md finding 2 (no "checked-right
// wins" rule, and a `checked` marker that is set but never cleared), which
// left the server and every client permanently disagreeing about a cell.
// Pinning them down here is what keeps a future edit to merge.go from
// re-introducing that divergence on the Go side.

import (
	"fmt"
	"slices"
	"testing"

	"crossme.app/src/pb"

	"hegel.dev/go/hegel"
)

// semSide is one side of a per-cell conflict: a cell together with the
// fill it came from, which is what owner indices are relative to.
type semSide struct {
	fill *pb.Fill
	cell *pb.Fill_Cell
}

// semOwner returns the node name owning s's cell.
func (s semSide) semOwner() string { return ownerName(s.fill, s.cell) }

// semCellString renders one side's cell for a failure message.
func semCellString(s semSide) string {
	if s.cell == nil {
		return "<absent>"
	}
	return fmt.Sprintf("%d@%s:%d=%q/%s", s.cell.Index, s.semOwner(), s.cell.Clock,
		s.cell.Fill, flagString(s.cell.Flags))
}

// semIndices returns every cell index mentioned by either fill, ascending.
func semIndices(l, r *pb.Fill) []uint32 {
	var out []uint32
	for _, f := range []*pb.Fill{l, r} {
		for _, c := range f.Cells {
			if !slices.Contains(out, c.Index) {
				out = append(out, c.Index)
			}
		}
	}
	slices.Sort(out)
	return out
}

// semWinner recomputes, independently of Merge, which side should win the
// conflict at index idx, and reports false if the two sides do not both
// have a cell there.
//
// The rule: a side that alone carries CHECKED_RIGHT wins outright;
// otherwise the higher cell clock wins, and equal clocks are broken by the
// higher owner node name. The generators guarantee that no two distinct
// versions of a cell share an (owner, clock) pair, so if both clock and
// owner name are equal the two sides are carrying the *same* write and
// agree on content -- either answer is correct, and we return the right
// side (which is what Merge happens to pick).
func semWinner(l, r *pb.Fill, idx uint32) (semSide, bool) {
	lhs := semSide{fill: l, cell: cellAt(l, idx)}
	rhs := semSide{fill: r, cell: cellAt(r, idx)}
	if lhs.cell == nil || rhs.cell == nil {
		return semSide{}, false
	}
	lright := hasFlag(lhs.cell, pb.Fill_CHECKED_RIGHT)
	rright := hasFlag(rhs.cell, pb.Fill_CHECKED_RIGHT)
	switch {
	case lright != rright:
		if lright {
			return lhs, true
		}
		return rhs, true
	case lhs.cell.Clock > rhs.cell.Clock:
		return lhs, true
	case rhs.cell.Clock > lhs.cell.Clock:
		return rhs, true
	case lhs.semOwner() > rhs.semOwner():
		return lhs, true
	default:
		return rhs, true
	}
}

// semSameWrite reports whether a merged cell carries the same write as
// one side's cell: the same content (Fill), the same identity (Clock and
// owner node name), and the same content flags. Sticky flags are excluded
// on purpose -- Merge OR-merges those, so they are not part of the write.
func semSameWrite(out *pb.Fill, oc *pb.Fill_Cell, s semSide) bool {
	if oc == nil || s.cell == nil {
		return false
	}
	return oc.Fill == s.cell.Fill &&
		oc.Clock == s.cell.Clock &&
		ownerName(out, oc) == s.semOwner() &&
		oc.Flags&contentFlags == s.cell.Flags&contentFlags
}

// semNotePair notes both inputs and the merge result, so that hegel's
// replay of a minimal counterexample prints the whole picture.
func semNotePair(ht *hegel.T, l, r, out *pb.Fill) {
	ht.Note("L: " + fillString(l))
	ht.Note("R: " + fillString(r))
	ht.Note("merged: " + fillString(out))
}

// semPair draws two well-formed, non-complete fills from one shared
// universe of writes.
func semPair(ht *hegel.T) (*pb.Fill, *pb.Fill) {
	fills := hegel.Draw(ht, genFills(2, false))
	return fills[0], fills[1]
}

const semCases = 500

// TestMergePropStickyFlagsAreSticky checks that DID_CHECK and DID_REVEAL
// are OR-merged: the merged cell has each one exactly when either input's
// cell at that index had it -- never lost, never invented.
//
// These flags record that a player once checked or revealed a cell, and
// the UI uses them to refuse credit for a solve. They are observed history
// rather than part of a write, so they must survive losing a conflict;
// equally, a merge must not invent history nobody observed.
func TestMergePropStickyFlagsAreSticky(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		l, r := semPair(ht)
		out := mustMerge(ht, l, r)

		for _, idx := range semIndices(l, r) {
			lc, rc, oc := cellAt(l, idx), cellAt(r, idx), cellAt(out, idx)
			if oc == nil {
				semNotePair(ht, l, r, out)
				ht.Fatalf("cell %d present in an input but missing from the merge", idx)
			}
			for _, flag := range []pb.Fill_Flags{pb.Fill_DID_CHECK, pb.Fill_DID_REVEAL} {
				want := hasFlag(lc, flag) || hasFlag(rc, flag)
				if got := hasFlag(oc, flag); got != want {
					semNotePair(ht, l, r, out)
					ht.Fatalf("cell %d: %s is %v in the merge, want %v (L=%v R=%v)",
						idx, flagString(uint32(flag)), got, want,
						hasFlag(lc, flag), hasFlag(rc, flag))
				}
			}
		}
	}, hegel.WithTestCases(semCases))
}

// TestMergePropCheckedRightAlwaysWins checks that a cell one side has
// confirmed correct beats the other side outright, whatever the clocks
// say, and that CHECKED_RIGHT itself is never dropped.
//
// This is the rule the live client merge was missing
// (notes/2026-08-10-crdt-bugs.md finding 2): a revealed cell at clock 5
// must not be overwritten by a concurrent wrong letter at clock 7, or the
// server and every client end up permanently disagreeing about that cell.
func TestMergePropCheckedRightAlwaysWins(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		l, r := semPair(ht)
		out := mustMerge(ht, l, r)

		for _, idx := range semIndices(l, r) {
			lc, rc, oc := cellAt(l, idx), cellAt(r, idx), cellAt(out, idx)
			lhs := semSide{fill: l, cell: lc}
			rhs := semSide{fill: r, cell: rc}
			lright, rright := hasFlag(lc, pb.Fill_CHECKED_RIGHT), hasFlag(rc, pb.Fill_CHECKED_RIGHT)

			// Where both sides have a cell and exactly one is
			// checked-correct, that side supplies the whole write,
			// clocks notwithstanding.
			if lc != nil && rc != nil && lright != rright {
				win := rhs
				if lright {
					win = lhs
				}
				if !semSameWrite(out, oc, win) {
					semNotePair(ht, l, r, out)
					ht.Fatalf("cell %d: CHECKED_RIGHT side %s did not win; merged as %s (loser was %s)",
						idx, semCellString(win), semCellString(semSide{fill: out, cell: oc}),
						semCellString(map[bool]semSide{true: rhs, false: lhs}[lright]))
				}
			}

			// And CHECKED_RIGHT is never lost, whichever side had it
			// and whether or not the other side has a cell at all.
			if lright || rright {
				if !hasFlag(oc, pb.Fill_CHECKED_RIGHT) {
					semNotePair(ht, l, r, out)
					ht.Fatalf("cell %d: CHECKED_RIGHT set on an input (L=%v R=%v) but not on the merge",
						idx, lright, rright)
				}
			}
		}
	}, hegel.WithTestCases(semCases))
}

// TestMergePropLastWriterWins checks the ordinary conflict rule: when both
// sides have a cell and neither is uniquely checked-correct, the write
// with the higher (clock, owner node name) supplies the merged cell's
// Fill, Clock, owner and content flags.
//
// This is the Lamport-clock backbone of the CRDT: it is what makes the
// join deterministic, and therefore what makes two clients that saw the
// same writes in different orders agree.
func TestMergePropLastWriterWins(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		l, r := semPair(ht)
		out := mustMerge(ht, l, r)

		for _, idx := range semIndices(l, r) {
			lc, rc := cellAt(l, idx), cellAt(r, idx)
			if lc == nil || rc == nil {
				continue
			}
			if hasFlag(lc, pb.Fill_CHECKED_RIGHT) != hasFlag(rc, pb.Fill_CHECKED_RIGHT) {
				continue // covered by TestMergePropCheckedRightAlwaysWins
			}
			win, ok := semWinner(l, r, idx)
			if !ok {
				continue
			}
			oc := cellAt(out, idx)
			if !semSameWrite(out, oc, win) {
				semNotePair(ht, l, r, out)
				ht.Fatalf("cell %d: expected winner %s, merged as %s (L=%s R=%s)",
					idx, semCellString(win), semCellString(semSide{fill: out, cell: oc}),
					semCellString(semSide{fill: l, cell: lc}), semCellString(semSide{fill: r, cell: rc}))
			}
		}
	}, hegel.WithTestCases(semCases))
}

// TestMergePropNoInvention checks that Merge never fabricates cell
// content: every merged cell carries a write that one of the inputs
// actually offered at that index, and a cell only one side has is carried
// over untouched apart from owner renumbering.
//
// A merge that blended two writes -- say, one side's letter with the
// other's clock -- would produce a state no node ever wrote, which no
// amount of further merging could reconcile.
func TestMergePropNoInvention(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		l, r := semPair(ht)
		out := mustMerge(ht, l, r)

		for _, idx := range semIndices(l, r) {
			lc, rc, oc := cellAt(l, idx), cellAt(r, idx), cellAt(out, idx)
			lhs := semSide{fill: l, cell: lc}
			rhs := semSide{fill: r, cell: rc}

			if oc == nil {
				semNotePair(ht, l, r, out)
				ht.Fatalf("cell %d present in an input but missing from the merge", idx)
			}

			// The merged write came from one of the two sides. When
			// both sides carry the same write it matches both, which
			// is fine -- what matters is that it matches at least one.
			if !semSameWrite(out, oc, lhs) && !semSameWrite(out, oc, rhs) {
				semNotePair(ht, l, r, out)
				ht.Fatalf("cell %d: merged write %s matches neither input (L=%s R=%s)",
					idx, semCellString(semSide{fill: out, cell: oc}),
					semCellString(lhs), semCellString(rhs))
			}

			// A cell only one side has is passed through verbatim --
			// including its sticky flags, and including any flag bits
			// Merge does not know about -- with only its owner index
			// renumbered into the merged node table.
			if lc == nil || rc == nil {
				only := lhs
				if lc == nil {
					only = rhs
				}
				if oc.Fill != only.cell.Fill || oc.Clock != only.cell.Clock ||
					oc.Flags != only.cell.Flags || ownerName(out, oc) != only.semOwner() {
					semNotePair(ht, l, r, out)
					ht.Fatalf("cell %d exists on one side only but was altered: %s -> %s",
						idx, semCellString(only), semCellString(semSide{fill: out, cell: oc}))
				}
			}
		}
	}, hegel.WithTestCases(semCases))
}

// TestMergePropUnions checks the structural union rules: the merged cell
// indices are exactly the union of the inputs', the merged node table is
// the sorted, duplicate-free union of the inputs', and every merged cell
// is owned by a node one of the inputs named as the owner of that cell.
//
// Losing a cell would silently discard a player's work; inventing one, or
// leaving the node table unsorted or duplicated, would break the
// canonical-output guarantee the rest of the CRDT rests on.
func TestMergePropUnions(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		l, r := semPair(ht)
		out := mustMerge(ht, l, r)

		wantIdx := semIndices(l, r)
		gotIdx := make([]uint32, 0, len(out.Cells))
		for _, c := range out.Cells {
			gotIdx = append(gotIdx, c.Index)
		}
		if !slices.Equal(gotIdx, wantIdx) {
			semNotePair(ht, l, r, out)
			ht.Fatalf("merged cell indices %v, want the union %v", gotIdx, wantIdx)
		}

		var wantNodes []string
		for _, f := range []*pb.Fill{l, r} {
			for _, n := range f.Nodes {
				if !slices.Contains(wantNodes, n) {
					wantNodes = append(wantNodes, n)
				}
			}
		}
		slices.Sort(wantNodes)
		if !slices.Equal(out.Nodes, wantNodes) {
			semNotePair(ht, l, r, out)
			ht.Fatalf("merged nodes %v, want the sorted union %v", out.Nodes, wantNodes)
		}

		for _, idx := range wantIdx {
			oc := cellAt(out, idx)
			owner := ownerName(out, oc)
			lname := ownerName(l, cellAt(l, idx))
			rname := ownerName(r, cellAt(r, idx))
			if owner != lname && owner != rname {
				semNotePair(ht, l, r, out)
				ht.Fatalf("cell %d: merged owner %q is neither input owner (L=%q R=%q)",
					idx, owner, lname, rname)
			}
		}
	}, hegel.WithTestCases(semCases))
}

// TestMergePropFillClockIsMax checks that the fill-level Lamport clock is
// the max of the two inputs', and still dominates every cell clock in the
// merged fill.
//
// The fill clock is what a node stamps its next write with, so a merge
// that let it slip below a clock already present in the grid would let
// that node write a cell that instantly loses to state it can see.
func TestMergePropFillClockIsMax(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		l, r := semPair(ht)
		out := mustMerge(ht, l, r)

		if want := max(l.Clock, r.Clock); out.Clock != want {
			semNotePair(ht, l, r, out)
			ht.Fatalf("merged clock %d, want max(%d, %d) = %d", out.Clock, l.Clock, r.Clock, want)
		}
		for _, c := range out.Cells {
			if c.Clock > out.Clock {
				semNotePair(ht, l, r, out)
				ht.Fatalf("cell %d has clock %d above the fill clock %d", c.Index, c.Clock, out.Clock)
			}
		}
	}, hegel.WithTestCases(semCases))
}

// semCompletePair is a pair of fills of which exactly one is complete,
// built from a single shared universe of writes. Which side is the
// complete one is drawn, so both argument orders get exercised.
type semCompletePair struct {
	// L and R are the two fills; Idx says which of them is complete.
	L, R *pb.Fill
	Idx  int
}

// Complete returns the complete side of the pair.
func (p semCompletePair) Complete() *pb.Fill {
	if p.Idx == 0 {
		return p.L
	}
	return p.R
}

// Other returns the non-complete side of the pair.
func (p semCompletePair) Other() *pb.Fill {
	if p.Idx == 0 {
		return p.R
	}
	return p.L
}

// semGenCompletePair forces the case genScenario(2) only reaches
// occasionally: exactly one of the two fills is complete. The complete
// side is normalized first, because the server only ever stamps `complete`
// on a merge output, which is canonical by construction.
func semGenCompletePair() hegel.Generator[semCompletePair] {
	return hegel.Composite(func(tc hegel.TestCase) semCompletePair {
		fills := hegel.Draw(tc, genFills(2, false))
		idx := hegel.Draw(tc, hegel.Integers(0, 1))
		done := normalize(fills[idx])
		done.Complete = true
		fills[idx] = done
		return semCompletePair{L: fills[0], R: fills[1], Idx: idx}
	})
}

// TestMergePropCompleteIsTerminal checks that a complete fill wins
// wholesale in either argument order -- the merge is the complete side,
// byte for byte -- no matter what the other side carries, including higher
// clocks or checked-correct cells. It also checks that merging a complete
// fill with a clone of itself is a no-op.
//
// `complete` means the server verified the whole grid against the puzzle's
// solution, so the game is over and frozen. If anything could still change
// a completed fill, a straggling delta could un-solve a finished puzzle.
func TestMergePropCompleteIsTerminal(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		p := hegel.Draw(ht, semGenCompletePair())
		done, other := p.Complete(), p.Other()

		lr := mustMerge(ht, p.L, p.R)
		rl := mustMerge(ht, p.R, p.L)

		for _, tc := range []struct {
			name string
			out  *pb.Fill
		}{{"Merge(L, R)", lr}, {"Merge(R, L)", rl}} {
			if !fillsIdentical(tc.out, done) {
				ht.Note("L: " + fillString(p.L))
				ht.Note("R: " + fillString(p.R))
				ht.Note("merged: " + fillString(tc.out))
				ht.Fatalf("%s is not the complete side:\n complete: %s\n      got: %s\n    other: %s",
					tc.name, fillString(done), fillString(tc.out), fillString(other))
			}
		}

		// Two complete fills in one game are always clones of each
		// other (the server is the sole writer of `complete`), and
		// merging a completed game with itself must change nothing.
		clone := mustMerge(ht, done, mustMerge(ht, done, done))
		if !fillsIdentical(clone, done) {
			ht.Note("complete: " + fillString(done))
			ht.Note("merged: " + fillString(clone))
			ht.Fatalf("merging a complete fill with a clone of itself changed it:\n want: %s\n  got: %s",
				fillString(done), fillString(clone))
		}
	}, hegel.WithTestCases(semCases))
}

// semEmptyPeer is a fill with no cells at all, whose node table is a
// (possibly empty, randomly ordered) subset of the nodes of f.
//
// Keeping the node table a subset matters: Merge unions node tables, so a
// peer naming a node f has never heard of would legitimately change the
// merged table, and the "identity" property below would not hold.
func semEmptyPeer(tc hegel.TestCase, f *pb.Fill) *pb.Fill {
	var nodes []string
	for _, n := range f.Nodes {
		if hegel.Draw(tc, hegel.Booleans()) {
			nodes = append(nodes, n)
		}
	}
	for i := len(nodes) - 1; i > 0; i-- {
		j := hegel.Draw(tc, hegel.Integers(0, i))
		nodes[i], nodes[j] = nodes[j], nodes[i]
	}
	return &pb.Fill{
		Nodes: nodes,
		Clock: hegel.Draw(tc, hegel.Integers[int64](0, f.Clock+3)),
	}
}

// TestMergePropEmptyIsIdentity checks that merging with a peer that has no
// cells is the identity on the grid: every cell survives unchanged, in
// either argument order, and the only thing that moves is the fill clock,
// which rises to the max.
//
// This is the case of a node that has connected but not written anything
// yet. Such a peer must not be able to blank, revert or re-flag a single
// cell simply by joining the game.
func TestMergePropEmptyIsIdentity(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		f := hegel.Draw(ht, genFill())
		empty := hegel.Draw(ht, hegel.Composite(func(tc hegel.TestCase) *pb.Fill {
			return semEmptyPeer(tc, f)
		}))

		want := normalize(f)
		want.Clock = max(f.Clock, empty.Clock)

		for _, tc := range []struct {
			name string
			out  *pb.Fill
		}{
			{"Merge(f, empty)", mustMerge(ht, f, empty)},
			{"Merge(empty, f)", mustMerge(ht, empty, f)},
		} {
			if !fillsEqual(tc.out, want) {
				ht.Note("f: " + fillString(f))
				ht.Note("empty: " + fillString(empty))
				ht.Note("merged: " + fillString(tc.out))
				ht.Fatalf("%s changed the fill:\n want: %s\n  got: %s",
					tc.name, fillString(want), fillString(tc.out))
			}
		}
	}, hegel.WithTestCases(semCases))
}

// TestMergePropContentFlagsComeFromTheWinner checks the flag rule from the
// other direction: CHECKED_WRONG and PENCIL are *taken from the winner*,
// not OR-merged, so a loser's CHECKED_WRONG or PENCIL mark does not
// survive a write that beat it. The merged content flags equal the
// winner's exactly.
//
// This is the second half of notes/2026-08-10-crdt-bugs.md finding 2: the
// live client merge only ever set its `checked` marker and never cleared
// it, so correcting a cell that had been checked wrong left the new,
// correct letter still displaying a wrong-mark.
func TestMergePropContentFlagsComeFromTheWinner(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		l, r := semPair(ht)
		out := mustMerge(ht, l, r)

		for _, idx := range semIndices(l, r) {
			lc, rc := cellAt(l, idx), cellAt(r, idx)
			if lc == nil || rc == nil {
				continue
			}
			win, ok := semWinner(l, r, idx)
			if !ok {
				continue
			}
			lose := semSide{fill: l, cell: lc}
			if win.cell == lc {
				lose = semSide{fill: r, cell: rc}
			}
			oc := cellAt(out, idx)

			if got, want := oc.Flags&contentFlags, win.cell.Flags&contentFlags; got != want {
				semNotePair(ht, l, r, out)
				ht.Fatalf("cell %d: merged content flags %s, want the winner's %s (winner %s, loser %s)",
					idx, flagString(got), flagString(want), semCellString(win), semCellString(lose))
			}

			// Spelled out for the two flags that are easy to OR by
			// accident, since the loser's mark surviving is exactly
			// the bug this guards.
			for _, flag := range []pb.Fill_Flags{pb.Fill_CHECKED_WRONG, pb.Fill_PENCIL} {
				if hasFlag(lose.cell, flag) && !hasFlag(win.cell, flag) && hasFlag(oc, flag) {
					semNotePair(ht, l, r, out)
					ht.Fatalf("cell %d: loser's %s survived into the merge (winner %s, loser %s)",
						idx, flagString(uint32(flag)), semCellString(win), semCellString(lose))
				}
			}
		}
	}, hegel.WithTestCases(semCases))
}
