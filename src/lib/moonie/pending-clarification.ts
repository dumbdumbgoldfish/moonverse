import { pickStoredMoonieMetaField } from "@/lib/moonie/persist-assistant-turn";
import type { MoonieHardInclusionConstraints } from "@/lib/moonie/hard-constraints";
import type { MooniePendingClarification } from "@/types/moonie";

function asRecord(meta: unknown): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object") return null;
  return meta as Record<string, unknown>;
}

export function pendingClarificationFromMeta(
  meta: unknown
): MooniePendingClarification | null {
  const record = asRecord(meta);
  if (!record) return null;
  const pending = pickStoredMoonieMetaField<MooniePendingClarification>(
    record,
    "pendingClarification"
  );
  if (!pending || typeof pending !== "object") return null;
  if (pending.kind === "review_ranking") {
    const count = Number(pending.count);
    if (!Number.isFinite(count) || count < 1) return null;
    return {
      kind: "review_ranking",
      count: Math.min(20, Math.max(1, count)),
      amongThese: Boolean(pending.amongThese),
    };
  }
  if (pending.kind === "review_preference") {
    const count = Number(pending.count);
    if (!Number.isFinite(count) || count < 1) return null;
    return {
      kind: "review_preference",
      count: Math.min(20, Math.max(1, count)),
    };
  }
  if (pending.kind === "constraint_relaxation") {
    const hard = pending.hard as MoonieHardInclusionConstraints | undefined;
    if (!hard || typeof hard !== "object") return null;
    return {
      kind: "constraint_relaxation",
      hard,
      phase: pending.phase === "genre_or_status" ? "genre_or_status" : "pick_constraint",
      offeredGenre: pending.offeredGenre ?? undefined,
    };
  }
  if (pending.kind === "compare_titles") {
    const unresolvedTitles = Array.isArray(pending.unresolvedTitles)
      ? pending.unresolvedTitles.filter(
          (title): title is string =>
            typeof title === "string" && title.trim().length > 0
        )
      : undefined;
    const resolvedNovelIds = Array.isArray(pending.resolvedNovelIds)
      ? pending.resolvedNovelIds.filter(
          (id): id is string => typeof id === "string" && id.trim().length > 0
        )
      : undefined;
    return {
      kind: "compare_titles",
      ...(unresolvedTitles?.length ? { unresolvedTitles } : {}),
      ...(resolvedNovelIds?.length ? { resolvedNovelIds } : {}),
    };
  }
  return null;
}

export function latestPendingClarification(
  messages: Array<{ role: string; meta?: unknown }>
): MooniePendingClarification | null {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const entry = messages[index];
    if (entry?.role !== "assistant") continue;
    return pendingClarificationFromMeta(entry.meta);
  }
  return null;
}
