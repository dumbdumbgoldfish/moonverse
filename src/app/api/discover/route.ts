import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { countReviews, getAllReviews } from "@/services/review.service";
import { countUsers, searchUsers } from "@/services/user.service";
import { parseReviewSort } from "@/types/review";
import { parseReviewVerdictFilter } from "@/lib/review-verdict-filter";

const MAX_TAGS = 3;

function parseTagSlugs(searchParams: URLSearchParams): string[] {
  const fromTags = (searchParams.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const legacy = searchParams.get("tag")?.trim();
  const merged = [...fromTags];
  if (legacy && !merged.includes(legacy)) merged.push(legacy);
  return merged.slice(0, MAX_TAGS);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || undefined;
  const genre = searchParams.get("genre")?.trim() || undefined;
  const tagSlugs = parseTagSlugs(searchParams);
  const tab = searchParams.get("tab") === "profiles" ? "profiles" : "reviews";
  const spoilerFree = searchParams.get("spoilers") === "hide";
  const hasOfficialLink = searchParams.get("link") === "official";
  const verdictFilter = parseReviewVerdictFilter(searchParams.get("verdict"));
  const offset = Math.max(0, Number(searchParams.get("offset") ?? "0"));
  const lightweight = searchParams.get("lightweight") === "1";
  const defaultLimit = tab === "profiles" ? 13 : 10;
  const maxLimit = tab === "profiles" ? 13 : 10;
  const limit = Math.min(
    Math.max(1, Number(searchParams.get("limit") ?? String(defaultLimit))),
    maxLimit
  );
  if (tab === "profiles") {
    const query = q ?? "";
    const session = await auth();
    const viewerId = session?.user?.id;
    const [profiles, total] = await Promise.all([
      searchUsers(query, limit, offset, viewerId),
      countUsers(query),
    ]);
    return NextResponse.json({
      reviews: [],
      profiles,
      total,
      offset,
      limit,
      tab,
    });
  }

  const session = await auth();
  const viewerId = session?.user?.id;
  const sort = parseReviewSort(searchParams.get("sort"), !!viewerId);

  const filters = {
    query: q,
    genreSlug: genre,
    tagSlugs: tagSlugs.length ? tagSlugs : undefined,
    sort,
    spoilerFree: spoilerFree || undefined,
    hasOfficialLink: hasOfficialLink || undefined,
    verdictFilter: verdictFilter ?? undefined,
  };

  const reviewOptions = {
    ...filters,
    sort,
    personalizedUserId: viewerId,
    limit,
    offset,
    lightweight: lightweight || undefined,
  };

  const [reviews, total] = await Promise.all([
    getAllReviews(reviewOptions),
    countReviews({ ...filters, sort, personalizedUserId: viewerId }),
  ]);

  const isPublicTrending =
    !viewerId &&
    !q &&
    !genre &&
    tagSlugs.length === 0 &&
    !spoilerFree &&
    !hasOfficialLink &&
    !verdictFilter &&
    sort === "trending";

  return NextResponse.json(
    {
      reviews,
      profiles: [],
      total,
      offset,
      limit,
      tab: "reviews",
    },
    isPublicTrending
      ? {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        }
      : undefined
  );
}
