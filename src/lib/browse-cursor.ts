/**
 * Opaque browse cursor for Works mode.
 * Encodes offset so clients never invent rank keys, while the API stays thesis-clear.
 */
export interface BrowseCursorPayload {
  o: number;
}

export function encodeBrowseCursor(offset: number): string {
  const payload: BrowseCursorPayload = { o: Math.max(0, Math.floor(offset)) };
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

export function decodeBrowseCursor(cursor?: string | null): number | null {
  if (!cursor?.trim()) return null;
  try {
    const raw = Buffer.from(cursor.trim(), "base64url").toString("utf8");
    const parsed = JSON.parse(raw) as BrowseCursorPayload;
    if (typeof parsed?.o !== "number" || !Number.isFinite(parsed.o) || parsed.o < 0) {
      return null;
    }
    return Math.floor(parsed.o);
  } catch {
    return null;
  }
}
