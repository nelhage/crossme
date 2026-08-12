package crdt

import (
	"fmt"
	"slices"

	"crossme.app/src/pb"
	"google.golang.org/protobuf/proto"
)

// remapOwner returns a copy of `cell` with its `owner` field rewritten
// from an index into `nodes` into an index into the merged node table
// described by `nodemap`.
func remapOwner(cell *pb.Fill_Cell, nodes []string, nodemap map[string]uint32) (*pb.Fill_Cell, error) {
	if cell.Owner >= uint32(len(nodes)) {
		return nil, fmt.Errorf("node id out of range")
	}
	out := proto.CloneOf(cell)
	out.Owner = nodemap[nodes[cell.Owner]]
	return out, nil
}

func Merge(l *pb.Fill, r *pb.Fill) (*pb.Fill, error) {
	// A complete fill is terminal: the grid has been verified fully
	// correct and the game is over, so the complete side wins wholesale
	// and nothing ever merges into it. Convergence relies on the server
	// being the sole writer of `complete` (stamped under the game lock),
	// so at most one distinct complete fill exists per game. If both
	// sides are complete they must agree on content, and we fall through
	// to the ordinary per-cell rules.
	if l.Complete != r.Complete {
		if l.Complete {
			return proto.CloneOf(l), nil
		}
		return proto.CloneOf(r), nil
	}

	out := proto.CloneOf(l)

	if r.Clock > out.Clock {
		out.Clock = r.Clock
	}

	// A repeated entry in a node table is redundant -- two indices for
	// the same node -- and nothing we ever generate, so reject it
	// rather than quietly collapse it. Reject it from either side:
	// accepting it on one side only would make `Merge` non-commutative.
	nodemap := make(map[string]uint32)
	out.Nodes = make([]string, 0, len(l.Nodes))
	for _, n := range l.Nodes {
		if _, ok := nodemap[n]; ok {
			return nil, fmt.Errorf("duplicate node in left: %s", n)
		}
		nodemap[n] = uint32(len(out.Nodes))
		out.Nodes = append(out.Nodes, n)
	}
	seen := make(map[string]struct{}, len(r.Nodes))
	for _, n := range r.Nodes {
		if _, ok := seen[n]; ok {
			return nil, fmt.Errorf("duplicate node in right: %s", n)
		}
		seen[n] = struct{}{}
		if _, ok := nodemap[n]; ok {
			continue
		}
		nodemap[n] = uint32(len(out.Nodes))
		out.Nodes = append(out.Nodes, n)
	}
	slices.Sort(out.Nodes)
	for i, n := range out.Nodes {
		nodemap[n] = uint32(i)
	}

	var li, ri int
	out.Cells = make([]*pb.Fill_Cell, 0, len(l.Cells))

	for li < len(l.Cells) || ri < len(r.Cells) {
		if ri == len(r.Cells) || (li < len(l.Cells) && l.Cells[li].Index < r.Cells[ri].Index) {
			// Consume the left
			cell, err := remapOwner(l.Cells[li], l.Nodes, nodemap)
			if err != nil {
				return nil, err
			}
			out.Cells = append(out.Cells, cell)
			li += 1
			continue
		}
		if li == len(l.Cells) || l.Cells[li].Index > r.Cells[ri].Index {
			// Consume the right
			cell, err := remapOwner(r.Cells[ri], r.Nodes, nodemap)
			if err != nil {
				return nil, err
			}
			out.Cells = append(out.Cells, cell)
			ri += 1
			continue
		}
		lc := l.Cells[li]
		rc := r.Cells[ri]
		if lc.Owner >= uint32(len(l.Nodes)) || rc.Owner >= uint32(len(r.Nodes)) {
			return nil, fmt.Errorf("node id out of range")
		}
		li += 1
		ri += 1
		if lc.Index != rc.Index {
			return nil, fmt.Errorf("Out-of-order cells list! l=%d r=%d", lc.Index, rc.Index)
		}

		oc := proto.CloneOf(lc)
		out.Cells = append(out.Cells, oc)

		// "history" flags merge between the two sides
		oc.Flags = (lc.Flags | rc.Flags) & uint32(pb.Fill_DID_CHECK|pb.Fill_DID_REVEAL)

		// Decide which side wins; all other fields will come
		// from the winner
		var win *pb.Fill_Cell
		if (lc.Flags & uint32(pb.Fill_CHECKED_RIGHT)) != (rc.Flags & uint32(pb.Fill_CHECKED_RIGHT)) {
			// If one side has been checked as "correct",
			// keep that fill
			if (lc.Flags & uint32(pb.Fill_CHECKED_RIGHT)) != 0 {
				win = lc
			} else {
				win = rc
			}
		} else {
			// Settle results by (clock, owner) order
			if lc.Clock > rc.Clock {
				win = lc
			} else if rc.Clock > lc.Clock {
				win = rc
			} else if l.Nodes[lc.Owner] > r.Nodes[rc.Owner] {
				win = lc
			} else {
				win = rc
			}
		}
		oc.Clock = win.Clock
		if win == lc {
			oc.Owner = nodemap[l.Nodes[win.Owner]]
		} else {
			oc.Owner = nodemap[r.Nodes[win.Owner]]
		}
		oc.Fill = win.Fill
		oc.Flags |= win.Flags & uint32(pb.Fill_CHECKED_RIGHT|pb.Fill_CHECKED_WRONG|pb.Fill_PENCIL)
	}

	return out, nil
}
