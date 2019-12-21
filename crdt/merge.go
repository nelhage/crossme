package crdt

import (
	"fmt"
	"sort"

	"crossme.app/src/pb"
)

func Merge(l *pb.Fill, r *pb.Fill) (*pb.Fill, error) {
	if l.PuzzleId != r.PuzzleId {
		return nil, fmt.Errorf("mismatched Ids: %q != %q", l.PuzzleId, r.PuzzleId)
	}

	out := *l

	if r.Clock > out.Clock {
		out.Clock = r.Clock
	}

	if r.Complete {
		out.Complete = true
	}

	var li, ri int
	out.Cells = make([]*pb.Fill_Cell, 0, len(l.Cells))

	nodemap := make(map[string]uint32)
	out.Nodes = make([]string, 0, len(l.Nodes))
	for _, n := range l.Nodes {
		if _, ok := nodemap[n]; ok {
			return nil, fmt.Errorf("duplicate node in left: %s", n)
		}
		nodemap[n] = uint32(len(out.Nodes))
		out.Nodes = append(out.Nodes, n)
	}
	for _, n := range r.Nodes {
		if _, ok := nodemap[n]; ok {
			continue
		}
		nodemap[n] = uint32(len(out.Nodes))
		out.Nodes = append(out.Nodes, n)
	}
	sort.Slice(out.Nodes, func(i, j int) bool { return out.Nodes[i] < out.Nodes[j] })
	for i, n := range out.Nodes {
		nodemap[n] = uint32(i)
	}

	for li < len(l.Cells) || ri < len(r.Cells) {
		if ri == len(r.Cells) || (li < len(l.Cells) && l.Cells[li].Index < r.Cells[ri].Index) {
			// Consume the left
			out.Cells = append(out.Cells, l.Cells[li])
			li += 1
			continue
		}
		if li == len(l.Cells) || l.Cells[li].Index > r.Cells[ri].Index {
			// Consume the right
			out.Cells = append(out.Cells, r.Cells[ri])
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

		oc := *lc
		out.Cells = append(out.Cells, &oc)

		// "history" flags merge between the two sides
		oc.Flags = (lc.Flags | rc.Flags) & uint32(pb.Fill_DID_CHECK|pb.Fill_DID_REVEAL)

		// Decide which side wins; all other fields will come
		// from the winner
		var win *pb.Fill_Cell
		if l.Complete != r.Complete {
			// If one puzzle is solved, that side wins
			if l.Complete {
				win = lc
			} else {
				win = rc
			}
		} else if (lc.Flags & uint32(pb.Fill_CHECKED_RIGHT)) != (rc.Flags & uint32(pb.Fill_CHECKED_RIGHT)) {
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

	return &out, nil
}
