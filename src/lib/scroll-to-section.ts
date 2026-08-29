export function scrollToSectionId(
  id: string,
  { updateHash = true }: { updateHash?: boolean } = {}
): boolean {
  const target = document.getElementById(id);
  if (!target) return false;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  target.scrollIntoView({
    behavior: reducedMotion ? "auto" : "smooth",
    block: "start",
  });

  if (updateHash) {
    const hash = `#${id}`;
    if (window.location.hash !== hash) {
      window.history.replaceState(window.history.state, "", hash);
    }
  }

  return true;
}

/** Retry scroll until lazy/suspended content has mounted the target. */
export function scrollToSectionIdWhenReady(
  id: string,
  { maxAttempts = 12, intervalMs = 100 }: { maxAttempts?: number; intervalMs?: number } = {}
) {
  let attempts = 0;

  const tryScroll = () => {
    if (scrollToSectionId(id)) return;
    attempts += 1;
    if (attempts < maxAttempts) {
      window.setTimeout(tryScroll, intervalMs);
    }
  };

  tryScroll();
}
