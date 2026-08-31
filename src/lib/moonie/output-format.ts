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

/** True when the user asked for short/brief novels, not short explanations. */
export function mentionsNovelLengthConstraint(message: string): boolean {
  const text = message.toLowerCase();
  if (/\bshort\s+(?:novels?|books?|stories?|reads?)\b/i.test(text)) {
    return true;
  }
  if (/\bunder\s+\d+\s+chapters?\b/i.test(text)) return true;
  if (/\bquick\s+read\b/i.test(text)) return true;
  if (/\bshort\s+length\b/i.test(text)) return true;
  if (containsOutputFormatBrevityCue(message)) return false;
  return (
    text.includes("short") &&
    (text.includes("novel") || text.includes("story") || text.includes("read"))
  );
}
