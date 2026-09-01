import type { NovelSelectOption } from "@/services/novel.service";

/** Label shown in admin novel pickers and select options. */
export function formatNovelSelectLabel(novel: NovelSelectOption): string {
  return novel.author ? `${novel.title}: ${novel.author}` : novel.title;
}

export function findNovelSelectOption(
  novels: NovelSelectOption[],
  novelId: string
): NovelSelectOption | undefined {
  return novels.find((novel) => novel.id === novelId);
}

/** `datetime-local` value pattern (minute or second precision). */
const DATETIME_LOCAL_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/;

export function isValidDatetimeLocalValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || !DATETIME_LOCAL_PATTERN.test(trimmed)) {
    return false;
  }
  return !Number.isNaN(new Date(trimmed).getTime());
}

/**
 * Convert a `datetime-local` string (local wall time) to ISO for persistence.
 * Returns null when the value is non-empty but invalid.
 */
export function datetimeLocalToIso(value: string): string | null | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (!isValidDatetimeLocalValue(trimmed)) return null;
  return new Date(trimmed).toISOString();
}
