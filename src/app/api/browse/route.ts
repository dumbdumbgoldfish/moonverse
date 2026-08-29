import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  genreBrowseSortToApi,
  parseGenreBrowseSort,
} from "@/lib/browse-sort";
import { decodeBrowseCursor } from "@/lib/browse-cursor";
import { getBrowseWorks } from "@/services/browse.service";
import { countReviews, getAllReviews } from "@/services/review.service";
import { parseBrowseMode } from "@/types/browse";
import type { ReviewSort } from "@/types/review";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const genre = searchParams.get("genre");

  if (!genre) {
    return NextResponse.json({ error: "Genre is required." }, { status: 400 });
  }

  const mode = parseBrowseMode(searchParams.get("mode"));
  const tagsParam = searchParams.get("tags") ?? "";
  const sortParam = searchParams.get("sort") ?? "trending";
  const officialOnly = searchParams.get("link") === "official";
  const cursorOffset = decodeBrowseCursor(searchParams.get("cursor"));
  const offset =
    cursorOffset ?? Math.max(0, Number(searchParams.get("offset") ?? "0"));
  const limit = Math.min(
    Math.max(1, Number(searchParams.get("limit") ?? "30")),
    48
  );

  const tagSlugs = tagsParam
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);

  let browseSort = parseGenreBrowseSort(sortParam);
  const session = browseSort === "affinity" ? await auth() : null;
  const userId = session?.user?.id ?? null;

  if (mode === "works") {
    const page = await getBrowseWorks({
      genreSlug: genre,
      tagSlugs: tagSlugs.length ? tagSlugs : undefined,
      sort: browseSort,
      limit,
      offset,
      officialOnly,
      userId,
    });
    return NextResponse.json({
      mode: "works",
      works: page.works,
      total: page.total,
      offset: page.offset,
      limit: page.limit,
      nextCursor: page.nextCursor,
      affinityAvailable: Boolean(userId),
    });
  }

  if (browseSort === "affinity") {
    browseSort = "hot";
  }

  const filters = {
    genreSlug: genre,
    tagSlugs: tagSlugs.length ? tagSlugs : undefined,
    sort: genreBrowseSortToApi(browseSort) as ReviewSort,
    hasOfficialLink: officialOnly || undefined,
  };

  const [reviews, total] = await Promise.all([
    getAllReviews({ ...filters, limit, offset }),
    countReviews(filters),
  ]);

  return NextResponse.json({
    mode: "reviews",
    reviews,
    total,
    offset,
    limit,
    nextCursor: null,
  });
}
