type ReviewsAnalyticsEvent =
  | "shelf_impression"
  | "card_click"
  | "filter_apply"
  | "compare_pin"
  | "compare_open"
  | "sign_in_prompt"
  | "load_more";

/** Lightweight client analytics hook for the reviews salon. */
export function trackReviewsEvent(
  event: ReviewsAnalyticsEvent,
  detail?: Record<string, string | number | boolean>
): void {
  if (typeof window === "undefined") return;

  try {
    window.dispatchEvent(
      new CustomEvent("moonverse:reviews-analytics", {
        detail: { event, ...detail, ts: Date.now() },
      })
    );
  } catch {
    // Ignore analytics failures in private mode or restricted environments.
  }
}
