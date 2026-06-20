const DAILY_LIMIT = 10;

interface RateLimitEntry {
  count: number;
  dayKey: string;
}

const store = new Map<string, RateLimitEntry>();

function getDayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function checkMoonieRateLimit(userId: string): {
  allowed: boolean;
  remaining: number;
} {
  const dayKey = getDayKey();
  const entry = store.get(userId);

  if (!entry || entry.dayKey !== dayKey) {
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }

  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  return { allowed: true, remaining: DAILY_LIMIT - entry.count - 1 };
}

export function recordMoonieRequest(userId: string): void {
  const dayKey = getDayKey();
  const entry = store.get(userId);

  if (!entry || entry.dayKey !== dayKey) {
    store.set(userId, { count: 1, dayKey });
    return;
  }

  entry.count += 1;
  store.set(userId, entry);
}

export const MOONIE_DAILY_LIMIT = DAILY_LIMIT;
