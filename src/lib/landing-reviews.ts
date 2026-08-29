import { normalizeNovelTitle } from "@/lib/landing-genres";
import { ENGLISH_WEB_NOVELS } from "../../prisma/lib/english-web-novels";
import { TRANSLATED_CN_NOVELS } from "../../prisma/lib/translated-cn-novels";
import type { ReviewListItem } from "@/types/review";

const CURATED_WEB_NOVEL_TITLES = new Set(
  [...TRANSLATED_CN_NOVELS, ...ENGLISH_WEB_NOVELS].map((novel) =>
    normalizeNovelTitle(novel.title),
  ),
);

export function isCuratedWebNovelTitle(title: string): boolean {
  return CURATED_WEB_NOVEL_TITLES.has(normalizeNovelTitle(title));
}

const TEMPLATE_NOTES =
  /^(an?)\s+(beginner|casual|analytical|emotional|humorous|veteran)\s+reader's notes/i;

export function isTemplateReviewTitle(title: string): boolean {
  return TEMPLATE_NOTES.test(title.trim());
}

/** Display-only cleanup. Does not rewrite the stored review. */
export function displayReviewTitle(title: string): string {
  return title
    .replace(/^A (emotional|analytical)\b/i, "An $1")
    .replace(/\s+\(\d+\)$/, "")
    .replace(/\u2014/g, ":")
    .replace(/: /g, ": ")
    .trim();
}

export function reviewQuote(
  review: Pick<ReviewListItem, "excerpt" | "body">,
): string {
  return (review.excerpt || review.body).trim();
}

export function scoreLandingCommunityReview(review: ReviewListItem): number {
  const quote = reviewQuote(review);
  let score = 0;
  if (quote.length >= 120) score += 24;
  else if (quote.length >= 80) score += 16;
  else if (quote.length >= 60) score += 8;
  if (!isTemplateReviewTitle(review.title)) score += 40;
  if (isCuratedWebNovelTitle(review.novelTitle)) {
    score += 30;
  }
  if (review.containsSpoilers) score -= 8;
  score += Math.min(review.likeCount, 20) * 2;
  score += Math.min(review.commentCount, 10) * 3;
  score += Math.min(review.saveCount, 10);
  score += review.rating;
  return score;
}

export function pickLandingCommunityReviews(
  reviews: ReviewListItem[],
  limit = 4,
  options?: { catalogueOnly?: boolean },
): ReviewListItem[] {
  const pool = options?.catalogueOnly
    ? reviews.filter(isLandingHeroCandidate)
    : reviews;
  const ranked = [...pool].sort(
    (a, b) =>
      scoreLandingCommunityReview(b) - scoreLandingCommunityReview(a) ||
      b.createdAt.localeCompare(a.createdAt),
  );

  const picked: ReviewListItem[] = [];
  const seen = new Set<string>();

  for (const review of ranked) {
    if (seen.has(review.novelId)) continue;
    if (reviewQuote(review).length < 40 && picked.length > 0) continue;
    seen.add(review.novelId);
    picked.push(review);
    if (picked.length >= limit) break;
  }

  return picked;
}

/** Hero faces must be curated web novels or titles with a verified reading link. */
export function isLandingHeroCandidate(review: ReviewListItem): boolean {
  return (
    isCuratedWebNovelTitle(review.novelTitle) || Boolean(review.hasOfficialLink)
  );
}

export function scoreLandingHeroReview(review: ReviewListItem): number {
  let score = 0;
  if (isCuratedWebNovelTitle(review.novelTitle)) score += 200;
  if (review.hasOfficialLink) score += 80;
  if (review.coverUrl && !review.coverUrl.includes("picsum.photos"))
    score += 10;
  if (!isTemplateReviewTitle(review.title)) score += 8;
  score += review.rating;
  score += Math.min(review.likeCount, 10);
  return score;
}

export function pickLandingHeroReviews(
  reviews: ReviewListItem[],
  limit = 3,
): ReviewListItem[] {
  const ranked = reviews
    .filter(isLandingHeroCandidate)
    .sort(
      (a, b) =>
        scoreLandingHeroReview(b) - scoreLandingHeroReview(a) ||
        b.createdAt.localeCompare(a.createdAt),
    );

  const picked: ReviewListItem[] = [];
  const seen = new Set<string>();
  for (const review of ranked) {
    if (seen.has(review.novelId)) continue;
    seen.add(review.novelId);
    picked.push(review);
    if (picked.length >= limit) break;
  }
  return picked;
}
