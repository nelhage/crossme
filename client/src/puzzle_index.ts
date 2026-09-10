import type { PuzzleIndex } from "./pb/puzzle_pb";

// Puzzle dates are "YYYY-MM-DD" strings (or "" when the import couldn't
// find one). They're parsed by hand, and formatted in UTC, so a puzzle
// never slips into a neighboring day or month in some timezone.
function parseDate(date: string): null | Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) {
    return null;
  }
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return isNaN(d.getTime()) ? null : d;
}

export function monthLabel(date: string): string {
  const d = parseDate(date);
  if (!d) {
    return "Undated";
  }
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

export function dayLabel(date: string): string {
  const d = parseDate(date);
  if (!d) {
    return "";
  }
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export interface PuzzleGroup {
  // The "YYYY-MM" prefix, or "" for undated puzzles.
  month: string;
  label: string;
  puzzles: PuzzleIndex[];
}

// Buckets the (already date-sorted) index into one group per month,
// preserving order. Undated puzzles sort last, after every dated one.
export function groupByMonth(index: PuzzleIndex[]): PuzzleGroup[] {
  const groups: PuzzleGroup[] = [];
  const byMonth = new Map<string, PuzzleGroup>();
  for (const puz of index) {
    const month = parseDate(puz.date) ? puz.date.slice(0, 7) : "";
    let group = byMonth.get(month);
    if (!group) {
      group = { month, label: monthLabel(puz.date), puzzles: [] };
      byMonth.set(month, group);
      groups.push(group);
    }
    group.puzzles.push(puz);
  }
  return groups.sort((a, b) => {
    if (a.month === b.month) {
      return 0;
    }
    if (a.month === "") {
      return 1;
    }
    if (b.month === "") {
      return -1;
    }
    return a.month < b.month ? 1 : -1;
  });
}

// A puzzle matches a query if every whitespace-separated word of the
// query appears somewhere in its title, author, or date (either the raw
// "YYYY-MM-DD" or the month as displayed, so "sep 2026" works).
export function matchesQuery(puz: PuzzleIndex, query: string): boolean {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) {
    return true;
  }
  const haystack = [puz.title, puz.author, puz.date, monthLabel(puz.date)]
    .join("\n")
    .toLowerCase();
  return terms.every((term) => haystack.includes(term));
}
