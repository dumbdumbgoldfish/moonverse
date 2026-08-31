/** Shared Moonie CTA prompts — keep routing tests aligned with these strings. */

export const DISCOVER_SALON_MOONIE_PROMPT =
  "Recommend spoiler-aware novel reviews from the MoonVerse salon that match what I might binge next.";

export const FOR_YOU_SHELF_REVIEWS_PROMPT =
  "Recommend novel reviews that match my For You shelves.";

export const BROWSE_CLARIFY_FIRST_PROMPT =
  "I want a web novel recommendation from the MoonVerse catalogue. Ask me one clarifying question, then suggest grounded titles.";

export const SALON_QUICK_PROMPTS = {
  binge: DISCOVER_SALON_MOONIE_PROMPT,
  mood: "Recommend spoiler-aware novel reviews from the MoonVerse salon that match cozy fantasy.",
} as const;
