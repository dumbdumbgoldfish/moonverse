import type { ReviewDraftV1 } from "@/lib/review-draft";
import { isDraftReadyToPublish } from "@/lib/review-draft";
import { LIMITS } from "@/lib/validation";

export { isDraftReadyToPublish };

export interface ReviewDraftListItem {
  id: string;
  draft: ReviewDraftV1;
  updatedAt: string;
}

export function draftNovelLabel(draft: ReviewDraftV1): string {
  if (draft.novelTitle.trim()) return draft.novelTitle.trim();
  if (draft.reviewTitle.trim()) return draft.reviewTitle.trim();
  return "Untitled novel";
}

export function draftResumeHref(draft: ReviewDraftV1): string {
  const params = new URLSearchParams({ resume: "1", draft: draft.id });
  return `/reviews/new?${params.toString()}`;
}

export function draftPublishHref(draft: ReviewDraftV1): string {
  const params = new URLSearchParams({
    resume: "1",
    publish: "1",
    draft: draft.id,
  });
  return `/reviews/new?${params.toString()}`;
}

export function draftStatusLabel(draft: ReviewDraftV1): string {
  if (isDraftReadyToPublish(draft)) return "Ready to publish";
  const hasNovel =
    draft.novelMode === "existing"
      ? Boolean(draft.selectedNovelId)
      : Boolean(draft.novelTitle.trim() && draft.novelAuthor.trim());
  if (hasNovel) return "In progress";
  return "Attach novel";
}

export function draftProgressPercent(draft: ReviewDraftV1): number {
  let score = 0;

  const hasNovel =
    draft.novelMode === "existing"
      ? Boolean(draft.selectedNovelId)
      : Boolean(draft.novelTitle.trim() && draft.novelAuthor.trim());
  if (hasNovel) score += 25;

  if (draft.rating > 0) score += 15;

  if (draft.reviewTitle.trim().length >= LIMITS.reviewTitle.min) {
    score += 20;
  } else if (draft.reviewTitle.trim()) {
    score += 8;
  }

  const bodyLen = draft.reviewBody.trim().length;
  score += Math.min(40, (bodyLen / LIMITS.reviewBody.min) * 40);

  return Math.round(Math.min(100, score));
}

export function formatDraftSavedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export function toDraftListItem(draft: ReviewDraftV1): ReviewDraftListItem {
  return {
    id: draft.id,
    draft,
    updatedAt: draft.savedAt,
  };
}
