/**
 * Opens Moonie with an optional starter prompt.
 *
 * Always enter via `/ask-moonie`:
 * - Guests see the demo chat page
 * - Logged-in users are redirected to `/moonie` by that page
 */
export function moonieEntryHref(prompt?: string): string {
  const trimmed = prompt?.trim();
  return trimmed
    ? `/ask-moonie?prompt=${encodeURIComponent(trimmed)}`
    : "/ask-moonie";
}

let widgetMounted = false;

export function setMoonieWidgetMounted(mounted: boolean): void {
  widgetMounted = mounted;
}

export function openMoonie(prompt?: string): void {
  if (typeof window === "undefined") return;

  if (widgetMounted) {
    window.dispatchEvent(
      new CustomEvent("moonie:open", { detail: { prompt: prompt?.trim() } })
    );
    return;
  }

  window.location.assign(moonieEntryHref(prompt));
}
