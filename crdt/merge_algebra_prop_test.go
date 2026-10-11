package crdt

// Property-based tests of the algebraic laws Merge is supposed to satisfy
// as a CRDT join: commutativity, associativity, idempotence, absorption,
// and order-independent convergence when folding over many replicas, plus
// the supporting purity and error-handling properties that make those laws
// meaningful (Merge must not mutate its inputs, and must reject exactly
// the same malformed inputs regardless of argument order).
//
// This file is deliberately blind to *what* a merged cell looks like --
// which side wins a given cell, how flags combine, how `complete`
// interacts with ordinary cells -- those semantic rules belong in
// merge_semantic_prop_test.go. Here we only ever compare whole merge
// results to each other (via fillsEqual/fillsIdentical) or check that a
// result is well-formed; we never inspect individual cell contents.
//
// Every property here is built from the generators in gen_test.go, which
// documents the "shared universe of writes" model that makes
// Merge(l, r) == Merge(r, l) a meaningful assertion rather than a
// tautology about untestable inputs. See that file's package doc comment
// before touching this one.

import (
	"fmt"
	"slices"
	"strconv"
	"strings"
	"testing"

	"crossme.app/src/pb"

	"google.golang.org/protobuf/proto"
	"hegel.dev/go/hegel"
)

// algPermutation draws a uniformly random permutation of 0..n-1,
// imperatively: repeatedly pick an index among those not yet placed. Used
// to fold-merge a scenario's fills in independently-drawn orders.
func algPermutation(tc hegel.TestCase, n int) []int {
	remaining := make([]int, n)
	for i := range remaining {
		remaining[i] = i
	}
	perm := make([]int, 0, n)
	for len(remaining) > 0 {
		i := hegel.Draw(tc, hegel.Integers(0, len(remaining)-1))
		perm = append(perm, remaining[i])
		remaining = slices.Delete(remaining, i, i+1)
	}
	return perm
}

// algFoldLeft merges fills[order[0]], fills[order[1]], ... left to right,
// aborting the test case (via mustMerge) if any step errors.
func algFoldLeft(ht *hegel.T, fills []*pb.Fill, order []int) *pb.Fill {
	acc := fills[order[0]]
	for _, idx := range order[1:] {
		acc = mustMerge(ht, acc, fills[idx])
	}
	return acc
}

// algFoldTree merges fills in a random tree shape: repeatedly pick two
// still-unmerged items at random and replace them with their merge, until
// one remains. This exercises bracketings that a strict left-fold never
// produces, on top of the order permutations algFoldLeft covers.
func algFoldTree(ht *hegel.T, tc hegel.TestCase, fills []*pb.Fill) *pb.Fill {
	items := slices.Clone(fills)
	for len(items) > 1 {
		i := hegel.Draw(tc, hegel.Integers(0, len(items)-1))
		a := items[i]
		items = slices.Delete(items, i, i+1)
		j := hegel.Draw(tc, hegel.Integers(0, len(items)-1))
		b := items[j]
		items = slices.Delete(items, j, j+1)
		items = append(items, mustMerge(ht, a, b))
	}
	return items[0]
}

// noteFills attaches each fill in fills to ht via Note, labeled by index,
// so a shrunk counterexample is readable without re-deriving it.
func noteFills(ht *hegel.T, fills []*pb.Fill) {
	for i, f := range fills {
		ht.Note(fillIndexString(i, f))
	}
}

func fillIndexString(i int, f *pb.Fill) string {
	return fmt.Sprintf("fills[%d] = %s", i, fillString(f))
}

// TestMergePropCommutative checks Merge(a, b) == Merge(b, a): the join
// must not depend on which side a caller happens to call "left". This is
// the most basic requirement for two replicas to converge regardless of
// which one initiates a sync.
func TestMergePropCommutative(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		fills := hegel.Draw(ht, genScenario(2))
		noteFills(ht, fills)
		a, b := fills[0], fills[1]

		ab := mustMerge(ht, a, b)
		ba := mustMerge(ht, b, a)
		ht.Note("Merge(a,b) = " + fillString(ab))
		ht.Note("Merge(b,a) = " + fillString(ba))

		if !fillsEqual(ab, ba) {
			ht.Fatalf("Merge is not commutative")
		}
	}, hegel.WithTestCases(500))
}

// TestMergePropAssociative checks that Merge((a,b),c) == Merge(a,(b,c)),
// and that other bracketings of the same three fills agree too. Since
// gossip protocols merge updates as they arrive in whatever grouping is
// convenient, replicas must reach the same state regardless of how merges
// are associated.
func TestMergePropAssociative(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		fills := hegel.Draw(ht, genScenario(3))
		noteFills(ht, fills)
		a, b, c := fills[0], fills[1], fills[2]

		abThenC := mustMerge(ht, mustMerge(ht, a, b), c)
		aThenBC := mustMerge(ht, a, mustMerge(ht, b, c))
		ht.Note("Merge(Merge(a,b),c) = " + fillString(abThenC))
		ht.Note("Merge(a,Merge(b,c)) = " + fillString(aThenBC))
		if !fillsEqual(abThenC, aThenBC) {
			ht.Fatalf("Merge is not associative: Merge(Merge(a,b),c) != Merge(a,Merge(b,c))")
		}

		// A different bracketing over a different pairing of the same
		// three fills, to catch an implementation that only happens to
		// respect the (a,b,c) grouping above.
		acThenB := mustMerge(ht, mustMerge(ht, a, c), b)
		ht.Note("Merge(Merge(a,c),b) = " + fillString(acThenB))
		if !fillsEqual(abThenC, acThenB) {
			ht.Fatalf("Merge is not associative: Merge(Merge(a,b),c) != Merge(Merge(a,c),b)")
		}

		bThenAC := mustMerge(ht, b, mustMerge(ht, a, c))
		ht.Note("Merge(b,Merge(a,c)) = " + fillString(bThenAC))
		if !fillsEqual(abThenC, bThenAC) {
			ht.Fatalf("Merge is not associative: Merge(Merge(a,b),c) != Merge(b,Merge(a,c))")
		}
	}, hegel.WithTestCases(500))
}

// TestMergePropIdempotentIdentity checks that merging a fill with itself
// changes nothing: Merge(a,a) == a always, and is byte-for-byte identical
// to a when a is already canonical (the shape Merge itself produces).
// It also checks that any merge output is a fixpoint of Merge: merging it
// with itself again reproduces it exactly. Idempotence is what makes it
// safe for a replica to re-send or re-apply a state it already holds.
func TestMergePropIdempotentIdentity(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		a := hegel.Draw(ht, genScenario(1))[0]
		ht.Note("a = " + fillString(a))

		aa := mustMerge(ht, a, a)
		ht.Note("Merge(a,a) = " + fillString(aa))
		if !fillsEqual(aa, a) {
			ht.Fatalf("Merge(a,a) != a")
		}
		if isCanonical(a) && !fillsIdentical(aa, a) {
			ht.Fatalf("a is canonical but Merge(a,a) is not byte-identical to it")
		}
	}, hegel.WithTestCases(500))

	hegel.Test(t, func(ht *hegel.T) {
		// Merge output (of non-complete inputs) should already be
		// canonical, and merging it with itself should be a strict
		// no-op: an exact fixpoint, not merely fillsEqual.
		fills := hegel.Draw(ht, genFills(2, false))
		a, b := fills[0], fills[1]
		ht.Note("a = " + fillString(a))
		ht.Note("b = " + fillString(b))

		m := mustMerge(ht, a, b)
		ht.Note("m = Merge(a,b) = " + fillString(m))

		mm := mustMerge(ht, m, m)
		ht.Note("Merge(m,m) = " + fillString(mm))
		if !fillsIdentical(mm, m) {
			ht.Fatalf("Merge(m,m) is not identical to m: merge output is not a fixpoint")
		}
	}, hegel.WithTestCases(500))
}

// TestMergePropAbsorption checks that merging the join m = Merge(a,b)
// back in with either input, in either order, reproduces m: once a
// replica has absorbed a's and b's writes, re-merging either original
// state contributes nothing new. This is the property that lets a
// replica gossip its already-merged state without regressing anyone.
func TestMergePropAbsorption(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		fills := hegel.Draw(ht, genScenario(2))
		noteFills(ht, fills)
		a, b := fills[0], fills[1]

		m := mustMerge(ht, a, b)
		ht.Note("m = Merge(a,b) = " + fillString(m))

		cases := []struct {
			name string
			got  *pb.Fill
		}{
			{"Merge(m,a)", mustMerge(ht, m, a)},
			{"Merge(a,m)", mustMerge(ht, a, m)},
			{"Merge(m,b)", mustMerge(ht, m, b)},
			{"Merge(b,m)", mustMerge(ht, b, m)},
		}
		for _, c := range cases {
			ht.Note(c.name + " = " + fillString(c.got))
			if !fillsEqual(c.got, m) {
				ht.Fatalf("%s != m: absorption fails", c.name)
			}
		}
	}, hegel.WithTestCases(500))
}

// TestMergePropOrderIndependentConvergence checks that folding Merge
// over k (2..5) fills from a shared scenario reaches the same result no
// matter what order the fills are folded in, or what tree shape the
// folds are grouped into. This generalizes commutativity and
// associativity at once, and is the property that actually matters for
// gossip-style sync: replicas exchange updates in arbitrary orders and
// must still converge to the same state.
func TestMergePropOrderIndependentConvergence(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		k := hegel.Draw(ht, hegel.Integers(2, 5))
		fills := hegel.Draw(ht, genScenario(k))
		noteFills(ht, fills)

		permA := algPermutation(ht, k)
		permB := algPermutation(ht, k)
		ht.Note("order A = " + itoaSlice(permA))
		ht.Note("order B = " + itoaSlice(permB))

		resultA := algFoldLeft(ht, fills, permA)
		resultB := algFoldLeft(ht, fills, permB)
		ht.Note("fold(A) = " + fillString(resultA))
		ht.Note("fold(B) = " + fillString(resultB))
		if !fillsEqual(resultA, resultB) {
			ht.Fatalf("folding in two different orders diverged")
		}

		// A random tree shape (not necessarily a left fold at all) must
		// land on the same result too.
		resultTree := algFoldTree(ht, ht, fills)
		ht.Note("fold(tree) = " + fillString(resultTree))
		if !fillsEqual(resultA, resultTree) {
			ht.Fatalf("folding in a random tree shape diverged from a linear fold")
		}
	}, hegel.WithTestCases(500))
}

func itoaSlice(xs []int) string {
	parts := make([]string, len(xs))
	for i, x := range xs {
		parts[i] = strconv.Itoa(x)
	}
	return "[" + strings.Join(parts, " ") + "]"
}

// TestMergePropInputsNotMutated checks that Merge never mutates either
// argument in place, whether it succeeds or (given malformed input)
// returns an error. Merge is documented and used as a pure function --
// callers keep using their local Fill after calling Merge -- so any
// in-place mutation would be a correctness bug even though Go can't catch
// it at compile time.
func TestMergePropInputsNotMutated(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		fills := hegel.Draw(ht, genScenario(2))
		a, b := fills[0], fills[1]
		aBefore := proto.CloneOf(a)
		bBefore := proto.CloneOf(b)

		if _, err := Merge(a, b); err != nil {
			ht.Fatalf("Merge on well-formed inputs errored: %v", err)
		}
		if !fillsIdentical(a, aBefore) {
			ht.Fatalf("Merge mutated its left argument:\nbefore: %s\nafter:  %s",
				fillString(aBefore), fillString(a))
		}
		if !fillsIdentical(b, bBefore) {
			ht.Fatalf("Merge mutated its right argument:\nbefore: %s\nafter:  %s",
				fillString(bBefore), fillString(b))
		}
	}, hegel.WithTestCases(500))

	hegel.Test(t, func(ht *hegel.T) {
		p := hegel.Draw(ht, genMalformedPair())
		ht.Note("why: " + p.Why)
		lBefore := proto.CloneOf(p.L)
		rBefore := proto.CloneOf(p.R)

		_, _ = Merge(p.L, p.R) // expected to error; that's covered elsewhere

		if !fillsIdentical(p.L, lBefore) {
			ht.Fatalf("Merge mutated its left argument on a malformed pair:\nbefore: %s\nafter:  %s",
				fillString(lBefore), fillString(p.L))
		}
		if !fillsIdentical(p.R, rBefore) {
			ht.Fatalf("Merge mutated its right argument on a malformed pair:\nbefore: %s\nafter:  %s",
				fillString(rBefore), fillString(p.R))
		}
	}, hegel.WithTestCases(500))
}

// TestMergePropErrorsSymmetric checks that Merge's validation doesn't
// depend on argument order: a malformed pair is rejected in both
// (L,R) and (R,L) order, and a well-formed pair is accepted in both
// orders. An asymmetric validator would make Merge's error behavior --
// and therefore whether a sync round trip succeeds at all -- depend on
// which replica initiated it.
func TestMergePropErrorsSymmetric(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		p := hegel.Draw(ht, genMalformedPair())
		ht.Note("why: " + p.Why)
		ht.Note("L = " + fillString(p.L))
		ht.Note("R = " + fillString(p.R))

		if _, err := Merge(p.L, p.R); err == nil {
			ht.Fatalf("Merge(L,R) accepted a malformed pair (%s)", p.Why)
		}
		if _, err := Merge(p.R, p.L); err == nil {
			ht.Fatalf("Merge(R,L) accepted a malformed pair (%s)", p.Why)
		}
	}, hegel.WithTestCases(500))

	hegel.Test(t, func(ht *hegel.T) {
		fills := hegel.Draw(ht, genScenario(2))
		noteFills(ht, fills)
		a, b := fills[0], fills[1]

		if _, err := Merge(a, b); err != nil {
			ht.Fatalf("Merge(a,b) on a well-formed scenario pair errored: %v", err)
		}
		if _, err := Merge(b, a); err != nil {
			ht.Fatalf("Merge(b,a) on a well-formed scenario pair errored: %v", err)
		}
	}, hegel.WithTestCases(500))
}

// TestMergePropOutputWellFormedCanonical checks that a successful Merge
// always produces well-formed output, and -- for non-complete inputs --
// output that is already canonical (sorted node table). Callers
// (including Merge itself, on the next round) rely on being able to feed
// a merge result back in as an ordinary input without re-validating or
// re-sorting it first.
func TestMergePropOutputWellFormedCanonical(t *testing.T) {
	hegel.Test(t, func(ht *hegel.T) {
		fills := hegel.Draw(ht, genFills(2, false))
		a, b := fills[0], fills[1]
		ht.Note("a = " + fillString(a))
		ht.Note("b = " + fillString(b))

		m := mustMerge(ht, a, b)
		ht.Note("m = " + fillString(m))

		if err := checkWellFormed(m); err != nil {
			ht.Fatalf("Merge output is not well-formed: %v", err)
		}
		if !isCanonical(m) {
			ht.Fatalf("Merge output of non-complete inputs is not canonical: %s", fillString(m))
		}
	}, hegel.WithTestCases(500))

	hegel.Test(t, func(ht *hegel.T) {
		fills := hegel.Draw(ht, genScenario(2))
		noteFills(ht, fills)
		a, b := fills[0], fills[1]

		m := mustMerge(ht, a, b)
		ht.Note("m = " + fillString(m))

		if err := checkWellFormed(m); err != nil {
			ht.Fatalf("Merge output is not well-formed: %v", err)
		}
	}, hegel.WithTestCases(500))
}
