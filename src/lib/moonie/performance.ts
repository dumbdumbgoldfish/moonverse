/** Max items per horizontal carousel shelf */
export const MOONIE_CAROUSEL_LIMIT = 24;

export function limitCarouselItems<T>(items: T[], limit = MOONIE_CAROUSEL_LIMIT): T[] {
  return items.slice(0, limit);
}

/** Moonies at or below this height skip motion, particles, and glow halos */
export const MOONIE_LIGHTWEIGHT_SIZE_PX = 96;

export function isMoonieLightweightSize(size: number): boolean {
  return size <= MOONIE_LIGHTWEIGHT_SIZE_PX;
}
