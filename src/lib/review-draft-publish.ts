import type { CreateReviewPayload } from "@/actions/review.actions";
import {
  cleanedDraftReadingUrls,
  type ReviewDraftV1,
} from "@/lib/review-draft";

export function mapReviewDraftToCreatePayload(
  draft: ReviewDraftV1
): CreateReviewPayload {
  const readingUrls = cleanedDraftReadingUrls(draft);

  return {
    novelMode: draft.novelMode,
    novelId:
      draft.novelMode === "existing" ? draft.selectedNovelId.trim() : undefined,
    novelTitle: draft.novelMode === "new" ? draft.novelTitle.trim() : undefined,
    novelAuthor:
      draft.novelMode === "new" ? draft.novelAuthor.trim() : undefined,
    coverUrl: draft.novelMode === "new" ? draft.coverUrl.trim() : undefined,
    synopsis: draft.novelMode === "new" ? draft.synopsis.trim() : undefined,
    originalLanguage:
      draft.novelMode === "new" ? draft.originalLanguage.trim() : undefined,
    publicationStatus:
      draft.novelMode === "new" ? draft.publicationStatus.trim() : undefined,
    readingUrls,
    genreIds: draft.novelMode === "new" ? draft.selectedGenreIds : [],
    tagIds: draft.novelMode === "new" ? draft.selectedTagIds : [],
    acknowledgeDuplicate: draft.acknowledgeDuplicate,
    reviewTitle: draft.reviewTitle.trim(),
    reviewBody: draft.reviewBody.trim(),
    rating: draft.rating,
    containsSpoilers: draft.containsSpoilers,
  };
}

/** Local-only drafts have no server row; synced drafts must belong to the caller. */
export function canUserPublishDraft(
  userId: string,
  draftOwnerId: string | null
): boolean {
  if (!draftOwnerId) return true;
  return draftOwnerId === userId;
}
