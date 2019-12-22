import { Fill } from "../pb/fill_pb";

export function merge(l: Fill, r: Fill): Fill {
  if (l.getPuzzleId() != r.getPuzzleId()) {
    throw new Error(
      `Puzzle IDs mismatch: ${l.getPuzzleId()} != ${r.getPuzzleId()}`
    );
  }

  const out = new Fill();
  out.setPuzzleId(l.getPuzzleId());
  if (l.getClock() > r.getClock()) {
    out.setClock(l.getClock());
  } else {
    out.setClock(r.getClock());
  }

  out.setComplete(l.getComplete() || r.getComplete());

  let nodemap: { [id: string]: number } = {};
  l.getNodesList().forEach(node => {
    out.addNodes(node);
    nodemap[node] = 0;
  });
  r.getNodesList().forEach(node => {
    if (!(node in nodemap)) {
      out.addNodes(node);
      nodemap[node] = 0;
    }
  });
  out.getNodesList().sort();
  out.getNodesList().forEach((node, i) => {
    nodemap[node] = i;
  });

  let li: number = 0,
    ri: number = 0;

  const lcells = l.getCellsList();
  const rcells = r.getCellsList();
  while (li < lcells.length || ri < rcells.length) {
    if (
      ri === rcells.length ||
      (li < lcells.length && lcells[li].getIndex() < rcells[ri].getIndex())
    ) {
      out.addCells(lcells[li]);
      li++;
      continue;
    }
    if (li === lcells.length || lcells[li].getIndex() > rcells[ri].getIndex()) {
      out.addCells(rcells[ri]);
      ri++;
      continue;
    }

    const lc = lcells[li];
    const rc = rcells[ri];
    li++;
    ri++;

    if (
      lc.getOwner() >= l.getNodesList().length ||
      rc.getOwner() >= r.getNodesList().length
    ) {
      throw new Error("node index out of range");
    }
    if (lc.getIndex() !== rc.getIndex()) {
      throw new Error("cell list out of order!");
    }

    const oc = new Fill.Cell();

    oc.setFlags(
      (lc.getFlags() | rc.getFlags()) &
        (Fill.Flags.DID_CHECK | Fill.Flags.DID_REVEAL)
    );

    let win: Fill.Cell | null;
    if (l.getComplete() !== r.getComplete()) {
      if (l.getComplete()) {
        win = lc;
      } else {
        win = rc;
      }
    } else if (
      (lc.getFlags() & Fill.Flags.CHECKED_RIGHT) !==
      (rc.getFlags() & Fill.Flags.CHECKED_RIGHT)
    ) {
      if ((lc.getFlags() & Fill.Flags.CHECKED_RIGHT) != 0) {
        win = lc;
      } else {
        win = rc;
      }
    } else if (lc.getClock() > rc.getClock()) {
      win = lc;
    } else if (rc.getClock() > lc.getClock()) {
      win = rc;
    } else if (
      l.getNodesList()[lc.getOwner()] > r.getNodesList()[rc.getOwner()]
    ) {
      win = lc;
    } else {
      win = rc;
    }

    oc.setIndex(win.getIndex());
    oc.setClock(win.getClock());
    if (win === lc) {
      oc.setOwner(nodemap[l.getNodesList()[win.getOwner()]]);
    } else {
      oc.setOwner(nodemap[r.getNodesList()[win.getOwner()]]);
    }
    oc.setFill(win.getFill());
    oc.setFlags(
      oc.getFlags() |
        (win.getFlags() &
          (Fill.Flags.CHECKED_RIGHT |
            Fill.Flags.CHECKED_WRONG |
            Fill.Flags.PENCIL))
    );
    out.addCells(oc);
  }

  return out;
}
