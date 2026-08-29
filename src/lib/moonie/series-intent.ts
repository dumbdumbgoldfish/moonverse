import {
  extractDirectTitleQuery,
  normalizeConversationalInput,
  resolveOrdinalIndex,
} from "@/lib/moonie/intent";

export type MoonieSeriesQueryKind =
  | "membership"
  | "full_series"
  | "reading_order"
  | "next"
  | "before"
  | "first"
  | "book_number"
  | "sequel_check"
  | "standalone";

const SERIES_SIGNAL_RE =
  /\b(?:part of (?:a )?series|in (?:a )?series|whole series|full series|reading order|read(?:ing)? order|what comes (?:after|next)|comes next|what(?:'s| is) next|read before|should i read first|read first|start from the beginning|from the beginning|book\s+\d+|is this a sequel|sequel to|prequel|spin[- ]?off|side story|standalone|stand alone|stand-alone)\b/i;

const VERIFIED_SERIES_DISCOVERY_RE =
  /\bfind\s+(?:a\s+)?novel\s+with\s+verified\s+series\s+data\b/i;

const SERIES_FOLLOW_UP_RE =
  /\b(?:what comes (?:after|next)|comes next|what(?:'s| is) next|show (?:me )?(?:the )?(?:whole|full) series|full series|whole series|reading order|read(?:ing)? order|what should i read first|read first|start from the beginning|from the beginning|part of (?:a )?series|is this a sequel|can i read this standalone|stand alone|stand-alone|book\s+\d+)\b/i;

function normalizeText(message: string): string {
  return normalizeConversationalInput(message).toLowerCase();
}

export function isSeriesQueryMessage(message: string): boolean {
  const text = normalizeText(message);
  if (!text) return false;
  if (isVerifiedSeriesDiscoveryRequest(message)) return false;
  return SERIES_SIGNAL_RE.test(text);
}

export function isVerifiedSeriesDiscoveryRequest(message: string): boolean {
  return VERIFIED_SERIES_DISCOVERY_RE.test(
    normalizeConversationalInput(message)
  );
}

export function isSeriesFollowUpMessage(message: string): boolean {
  const text = normalizeText(message);
  if (!text) return false;
  return SERIES_FOLLOW_UP_RE.test(text);
}

export function resolveSeriesQueryKind(message: string): MoonieSeriesQueryKind {
  const text = normalizeText(message);

  if (/\bcan i read (?:this|it) standalone\b/.test(text) || /\bstand[- ]?alone\b/.test(text)) {
    return "standalone";
  }
  if (/\bis this a sequel\b/.test(text) || /\bsequel to\b/.test(text)) {
    return "sequel_check";
  }
  if (/\bwhat comes (?:after|next)\b/.test(text) || /\bcomes next\b/.test(text) || /\bwhat(?:'s| is) next\b/.test(text)) {
    return "next";
  }
  if (/\bwhat should i read (?:before|first)\b/.test(text) || /\bread before\b/.test(text)) {
    return "before";
  }
  if (/\bread first\b/.test(text) || /\bstart from the beginning\b/.test(text) || /\bfrom the beginning\b/.test(text)) {
    return "first";
  }
  if (/\b(?:whole|full) series\b/.test(text) || /\bshow (?:me )?(?:the )?series\b/.test(text)) {
    return "full_series";
  }
  if (/\breading order\b/.test(text) || /\bread(?:ing)? order\b/.test(text)) {
    return "reading_order";
  }
  if (/\bpart of (?:a )?series\b/.test(text) || /\bin (?:a )?series\b/.test(text)) {
    return "membership";
  }

  const bookMatch = text.match(/\bbook\s+(\d{1,2})\b/);
  if (bookMatch?.[1]) {
    return "book_number";
  }

  return "reading_order";
}

export function resolveSeriesBookNumber(message: string): number | null {
  const text = normalizeText(message);
  const bookMatch = text.match(/\bbook\s+(\d{1,2})\b/);
  if (bookMatch?.[1]) {
    return Number.parseInt(bookMatch[1], 10);
  }
  const ordinal = resolveOrdinalIndex(message);
  if (ordinal != null && /\bbook\b/.test(text)) {
    return ordinal + 1;
  }
  return null;
}

export function extractSeriesTitleQuery(message: string): string | null {
  const direct = extractDirectTitleQuery(message);
  if (direct) return direct;

  const text = normalizeConversationalInput(message);
  const stripped = text
    .replace(
      /\b(?:is|are)\s+.+\s+(?:part of (?:a )?series|in (?:a )?series)\??$/i,
      ""
    )
    .replace(
      /\b(?:what|which)\s+(?:order|comes)\b[\s\S]*$/i,
      ""
    )
    .replace(/\b(?:show me|tell me about|find)\s+/i, "")
    .replace(/\b(?:the )?(?:whole|full) series\b/gi, "")
    .replace(/\breading order\b/gi, "")
    .trim();

  if (stripped.length >= 3 && stripped.length <= 120) {
    return stripped;
  }

  return null;
}
