import type { MoonieCompareRow } from "@/types/moonie";

const COMEDY_TAG_RE =
  /\b(comedic|comedy|humou?r|humorous|funny|lighthearted|satire|witty)\b/i;

export interface CompareWidgetBullet {
  label: string;
  title: string;
}

function tagSignals(tags: string[], pattern: RegExp): string[] {
  return tags.filter((tag) => pattern.test(tag));
}

function isCompleted(status: string | null | undefined): boolean {
  return status?.toLowerCase() === "completed";
}

/** Compact comparison bullets for the floating widget — catalogue tags only. */
export function buildCompareWidgetSummary(
  rows: MoonieCompareRow[]
): { titleLine: string; bullets: CompareWidgetBullet[] } | null {
  if (rows.length < 2) return null;

  const titleLine = rows.map((row) => row.title).join(" vs ");
  const bullets: CompareWidgetBullet[] = [];

  const darkerRows = rows.filter((row) => row.toneSignals.length > 0);
  if (darkerRows.length === 1) {
    bullets.push({ label: "Darker", title: darkerRows[0]!.title });
  }

  const comedyRows = rows
    .map((row) => ({
      row,
      count: tagSignals(row.tags, COMEDY_TAG_RE).length,
    }))
    .sort((a, b) => b.count - a.count);
  if (
    comedyRows[0]!.count > 0 &&
    comedyRows[0]!.count > (comedyRows[comedyRows.length - 1]?.count ?? 0)
  ) {
    bullets.push({
      label: "More comedic",
      title: comedyRows[0]!.row.title,
    });
  } else if (darkerRows.length === 1 && rows.length === 2) {
    const lighter = rows.find((row) => row.novelId !== darkerRows[0]!.novelId);
    if (lighter) {
      bullets.push({ label: "Lighter tone", title: lighter.title });
    }
  }

  const completed = rows.filter((row) => isCompleted(row.publicationStatus));
  if (completed.length === 1 && rows.length === 2) {
    const other = rows.find((row) => row.novelId !== completed[0]!.novelId);
    if (other && !isCompleted(other.publicationStatus)) {
      bullets.push({ label: "Completed", title: completed[0]!.title });
    }
  }

  const byRating = [...rows].sort(
    (a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0)
  );
  if (
    byRating[0]!.averageRating != null &&
    byRating[1]!.averageRating != null &&
    byRating[0]!.averageRating !== byRating[1]!.averageRating &&
    bullets.length < 4
  ) {
    bullets.push({
      label: "Higher rated",
      title: byRating[0]!.title,
    });
  }

  const byRomance = [...rows].sort(
    (a, b) => b.romanceSignals.length - a.romanceSignals.length
  );
  if (
    byRomance[0]!.romanceSignals.length >
      (byRomance[byRomance.length - 1]?.romanceSignals.length ?? 0) &&
    bullets.length < 4
  ) {
    bullets.push({
      label: "More romance",
      title: byRomance[0]!.title,
    });
  }

  return {
    titleLine,
    bullets: bullets.slice(0, 4),
  };
}
