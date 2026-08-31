export const MOONIE_EMPTY_REASONS = [
  "unknown_status",
  "no_matches",
  "unseen_exhausted",
  "excluded_exhausted",
  "quota",
  "error",
  "retrieval_incomplete",
] as const;

export type MoonieEmptyReason = (typeof MOONIE_EMPTY_REASONS)[number];

export function isMoonieEmptyReason(
  value: unknown
): value is MoonieEmptyReason {
  return (
    typeof value === "string" &&
    (MOONIE_EMPTY_REASONS as readonly string[]).includes(value)
  );
}

export function emptyReasonFromHardConstraintCopy(copy: {
  reply: string;
  summary: string;
}): MoonieEmptyReason {
  const text = `${copy.summary} ${copy.reply}`;
  if (/could not verify any MoonVerse novels as/i.test(text)) {
    return "unknown_status";
  }
  if (/no additional unseen/i.test(text)) {
    return "unseen_exhausted";
  }
  if (
    /after respecting the titles you hid or rejected|after your exclusions/i.test(
      text
    )
  ) {
    return "excluded_exhausted";
  }
  if (/Verified retrieval incomplete/i.test(copy.summary)) {
    return "retrieval_incomplete";
  }
  if (/Could not verify this batch yet/i.test(copy.summary)) {
    return "retrieval_incomplete";
  }
  return "no_matches";
}

export function moonieNoMatchCopy(reason: MoonieEmptyReason | undefined): {
  title: string;
  description: string;
} {
  switch (reason) {
    case "unknown_status":
      return {
        title: "Completion status is not listed.",
        description:
          "Some catalogue rows match your other criteria but do not state whether they are completed. Moonie will not guess completion status.",
      };
    case "unseen_exhausted":
      return {
        title: "No additional unseen matches.",
        description:
          "Previously shown verified matches still fit. Relax a criterion to widen the pool.",
      };
    case "excluded_exhausted":
      return {
        title: "No matches remain after your exclusions.",
        description:
          "Moonie kept your hidden and rejected titles out. Relax a criterion or open browse.",
      };
    case "quota":
      return {
        title: "Daily Moonie turns are used up.",
        description: "Come back tomorrow, or open browse to keep looking.",
      };
    case "error":
      return {
        title: "Moonie could not finish that search.",
        description: "This was an operational failure, not an empty catalogue. Please retry.",
      };
    case "retrieval_incomplete":
      return {
        title: "Couldn't verify this batch yet.",
        description:
          "Some eligible titles exist, but Moonie couldn't confirm a full recommendation batch. Please try again shortly.",
      };
    case "no_matches":
    default:
      return {
        title: "Nothing in the catalogue matches those criteria.",
        description:
          "Moonie will not invent a title to fill the desk. Relax one criterion, or open browse.",
      };
  }
}
