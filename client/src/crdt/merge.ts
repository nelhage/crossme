import { create } from "@bufbuild/protobuf";

import {
  Fill,
  FillSchema,
  Fill_Cell,
  Fill_CellSchema,
  Fill_Flags,
} from "../pb/fill_pb";

// remapOwner returns a copy of `cell` with its `owner` field rewritten
// from an index into `nodes` into an index into the merged node table
// described by `nodemap`.
function remapOwner(
  cell: Fill_Cell,
  nodes: string[],
  nodemap: { [id: string]: number }
): Fill_Cell {
  if (cell.owner >= nodes.length) {
    throw new Error("node index out of range");
  }
  return create(Fill_CellSchema, {
    index: cell.index,
    clock: cell.clock,
    owner: nodemap[nodes[cell.owner]],
    fill: cell.fill,
    flags: cell.flags,
  });
}

export function merge(l: Fill, r: Fill): Fill {
  const out = create(FillSchema, {
    clock: l.clock > r.clock ? l.clock : r.clock,
    complete: l.complete || r.complete,
  });

  const nodemap: { [id: string]: number } = {};
  l.nodes.forEach((node) => {
    out.nodes.push(node);
    nodemap[node] = 0;
  });
  r.nodes.forEach((node) => {
    if (!(node in nodemap)) {
      out.nodes.push(node);
      nodemap[node] = 0;
    }
  });
  out.nodes.sort();
  out.nodes.forEach((node, i) => {
    nodemap[node] = i;
  });

  let li: number = 0,
    ri: number = 0;

  const lcells = l.cells;
  const rcells = r.cells;
  while (li < lcells.length || ri < rcells.length) {
    if (
      ri === rcells.length ||
      (li < lcells.length && lcells[li].index < rcells[ri].index)
    ) {
      out.cells.push(remapOwner(lcells[li], l.nodes, nodemap));
      li++;
      continue;
    }
    if (li === lcells.length || lcells[li].index > rcells[ri].index) {
      out.cells.push(remapOwner(rcells[ri], r.nodes, nodemap));
      ri++;
      continue;
    }

    const lc = lcells[li];
    const rc = rcells[ri];
    li++;
    ri++;

    if (lc.owner >= l.nodes.length || rc.owner >= r.nodes.length) {
      throw new Error("node index out of range");
    }
    if (lc.index !== rc.index) {
      throw new Error("cell list out of order!");
    }

    const oc = create(Fill_CellSchema, {
      flags:
        (lc.flags | rc.flags) & (Fill_Flags.DID_CHECK | Fill_Flags.DID_REVEAL),
    });

    let win: Fill_Cell;
    if (l.complete !== r.complete) {
      if (l.complete) {
        win = lc;
      } else {
        win = rc;
      }
    } else if (
      (lc.flags & Fill_Flags.CHECKED_RIGHT) !==
      (rc.flags & Fill_Flags.CHECKED_RIGHT)
    ) {
      if ((lc.flags & Fill_Flags.CHECKED_RIGHT) != 0) {
        win = lc;
      } else {
        win = rc;
      }
    } else if (lc.clock > rc.clock) {
      win = lc;
    } else if (rc.clock > lc.clock) {
      win = rc;
    } else if (l.nodes[lc.owner] > r.nodes[rc.owner]) {
      win = lc;
    } else {
      win = rc;
    }

    oc.index = win.index;
    oc.clock = win.clock;
    if (win === lc) {
      oc.owner = nodemap[l.nodes[win.owner]];
    } else {
      oc.owner = nodemap[r.nodes[win.owner]];
    }
    oc.fill = win.fill;
    oc.flags |=
      win.flags &
      (Fill_Flags.CHECKED_RIGHT | Fill_Flags.CHECKED_WRONG | Fill_Flags.PENCIL);
    out.cells.push(oc);
  }

  return out;
}
