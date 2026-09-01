/**
 * Separates response-format instructions (brief explanations) from catalogue
 * constraints (novel length). "with a short why" must not become length=short.
 */

const OUTPUT_FORMAT_BREVITY_RE =
  /\b(?:with\s+)?(?:a\s+)?(?:short|brief|concise|one-sentence|one sentence)\s+(?:why|reason|explanation|rationale)\b/i;

const OUTPUT_FORMAT_BRIEFLY_RE = /\b(?:briefly|concisely)\s+explain\b/i;

export function containsOutputFormatBrevityCue(message: string): boolean {
  const text = message.toLowerCase();
  return (
    OUTPUT_FORMAT_BREVITY_RE.test(text) || OUTPUT_FORMAT_BRIEFLY_RE.test(text)
  );
}

/** User asked for novel-length filtering — not supported in catalogue recommendations. */
export const NOVEL_LENGTH_UNSUPPORTED_NOTICE =
  "MoonVerse does not have reliable novel-length metadata, so I cannot filter by short, long, or quick-read length.";

export function prependNovelLengthTransparency(
  reply: string,
  askedForLength: boolean
): string {
  if (!askedForLength) return reply;
  if (/novel-length metadata/i.test(reply)) return reply;
  return `${NOVEL_LENGTH_UNSUPPORTED_NOTICE} ${reply}`;
}

/** True when the user asked for short/brief novels, not short explanations. */
export function mentionsNovelLengthConstraint(message: string): boolean {
  const text = message.toLowerCase();
  if (/\bshort\s+(?:novels?|books?|stories?|reads?)\b/i.test(text)) {
    return true;
  }
  if (/\bunder\s+\d+\s+chapters?\b/i.test(text)) return true;
  if (/\bquick\s+read\b/i.test(text)) return true;
  if (/\bshort\s+length\b/i.test(text)) return true;
  if (/\blong\s+length\b/i.test(text)) return true;
  if (/\blong\s+(?:novels?|books?|stories?|epics?)\b/i.test(text)) {
    return true;
  }
  if (containsOutputFormatBrevityCue(message)) return false;
  return (
    text.includes("short") &&
    (text.includes("novel") || text.includes("story") || text.includes("read"))
  );
}
