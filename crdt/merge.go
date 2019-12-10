package crdt

import (
	"fmt"

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
	out.Clock += 1

	if r.Complete {
		out.Complete = true
	}

	var li, ri int
	out.Cells = make([]*pb.Fill_Cell, 0, len(l.Cells))
	for li < len(l.Cells) && ri < len(r.Cells) {
		if ri == len(r.Cells) || l.Cells[li].Index < r.Cells[ri].Index {
			// Consume the left
			out.Cells = append(out.Cells, l.Cells[li])
			li += 1
			continue
		}
		if li == len(l.Cells) || l.Cells[li].Index > r.Cells[ri].Index {
			// Consume the right
			out.Cells = append(out.Cells, r.Cells[li])
			ri += 1
			continue
		}
		lc := l.Cells[li]
		rc := r.Cells[ri]
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
			} else if lc.Owner > rc.Owner {
				win = lc
			} else {
				win = rc
			}
		}
		oc.Clock = win.Clock
		oc.Owner = win.Owner
		oc.Fill = win.Fill
		oc.Flags |= win.Flags & uint32(pb.Fill_CHECKED_RIGHT|pb.Fill_CHECKED_WRONG|pb.Fill_PENCIL)
	}

	return &out, nil
}
