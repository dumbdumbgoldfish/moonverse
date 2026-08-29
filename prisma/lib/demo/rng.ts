/** Seeded PRNG for reproducible demo datasets. */
export function createRng(seed = 42) {
  let state = seed >>> 0;
  return {
    next(): number {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      return state / 0x100000000;
    },
    int(min: number, max: number): number {
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick<T>(items: readonly T[]): T {
      return items[this.int(0, items.length - 1)];
    },
    shuffle<T>(items: T[]): T[] {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = this.int(0, i);
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    },
    chance(p: number): boolean {
      return this.next() < p;
    },
  };
}

export type Rng = ReturnType<typeof createRng>;
