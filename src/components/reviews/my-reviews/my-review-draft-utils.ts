import { LIMITS } from "@/lib/validation";
import type { ReviewDraftV1 } from "@/lib/review-draft";

export function draftNovelLabel(draft: ReviewDraftV1): string {
  if (draft.novelTitle.trim()) return draft.novelTitle.trim();
  if (draft.reviewTitle.trim()) return draft.reviewTitle.trim();
  return "Untitled draft";
}

export function draftResumeHref(draft: ReviewDraftV1): string {
  const params = new URLSearchParams({ resume: "1" });
  if (draft.novelMode === "existing" && draft.selectedNovelId) {
    params.set("novelId", draft.selectedNovelId);
  }
  return `/reviews/new?${params.toString()}`;
}

export function draftPublishHref(draft: ReviewDraftV1): string {
  const params = new URLSearchParams({ resume: "1", publish: "1" });
  if (draft.novelMode === "existing" && draft.selectedNovelId) {
    params.set("novelId", draft.selectedNovelId);
  }
  return `/reviews/new?${params.toString()}`;
}

export function isDraftReadyToPublish(draft: ReviewDraftV1): boolean {
  const hasNovel =
    draft.novelMode === "existing"
      ? Boolean(draft.selectedNovelId)
      : Boolean(
          draft.novelTitle.trim() &&
            draft.novelAuthor.trim() &&
            draft.selectedGenreIds.length > 0
        );
  const hasReview =
    draft.rating > 0 &&
    draft.reviewTitle.trim().length >= LIMITS.reviewTitle.min &&
    draft.reviewBody.trim().length >= LIMITS.reviewBody.min;

  return hasNovel && hasReview;
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

export function formatDraftSavedDay(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}
