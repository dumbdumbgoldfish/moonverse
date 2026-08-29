import {
  isConversationalOnly,
  type MoonieIntent,
} from "@/lib/moonie/intent";
import type { MoonieResponseKind } from "@/types/moonie";

/** Stable intent labels for admin analytics (no raw user text). */
export type MoonieAnalyticsIntent =
  | "greeting"
  | "chat"
  | "help"
  | "thanks"
  | "recommend"
  | "refine"
  | "more_like_this"
  | "find_novel"
  | "reading_source"
  | "novel_reviews"
  | "novel_overview"
  | "compare"
  | "image_lookup"
  | "file_lookup"
  | "find_reviewers"
  | "reviewer_overview"
  | "novel_series";

export function resolveAnalyticsIntent(options: {
  intents: MoonieIntent[];
  primary: MoonieIntent | null;
  responseKind?: MoonieResponseKind;
}): MoonieAnalyticsIntent {
  if (isConversationalOnly(options.intents)) {
    if (options.intents.includes("GREETING")) return "greeting";
    if (options.intents.includes("IDENTITY")) return "chat";
    if (options.intents.includes("HELP")) return "help";
    if (options.intents.includes("THANKS")) return "thanks";
    return "chat";
  }

  switch (options.primary) {
    case "IMAGE_LOOKUP":
      return "image_lookup";
    case "FILE_LOOKUP":
      return "file_lookup";
    case "COMPARE":
      return "compare";
    case "FIND_READING_SOURCE":
      return "reading_source";
    case "FIND_NOVEL":
      return "find_novel";
    case "NOVEL_REVIEWS":
      return "novel_reviews";
    case "NOVEL_OVERVIEW":
      return "novel_overview";
    case "REFINE":
      return "refine";
    case "MORE_LIKE_THIS":
      return "more_like_this";
    case "FIND_REVIEWERS":
      return "find_reviewers";
    case "REVIEWER_OVERVIEW":
      return "reviewer_overview";
    case "NOVEL_SERIES":
      return "novel_series";
    case "RECOMMEND":
      return "recommend";
    default:
      if (options.responseKind === "compare") return "compare";
      if (options.responseKind === "novel_bundle") return "find_novel";
      if (options.responseKind === "recommendations") return "recommend";
      return "chat";
  }
}
