import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseSearchSort, parseSearchType, parseTagSlugs } from "@/lib/search";
import { runSearch } from "@/services/search.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? "";
    const type = parseSearchType(searchParams.get("type") ?? searchParams.get("tab"));
    const sort = parseSearchSort(searchParams.get("sort"));
    const genre = searchParams.get("genre")?.trim() || undefined;
    const tagSlugs = parseTagSlugs(
      searchParams.get("tags") ?? undefined,
      searchParams.get("tag") ?? undefined
    );
    const offset = Math.max(0, Number(searchParams.get("offset") ?? "0") || 0);
    const defaultLimit = type === "all" ? 8 : 12;
    const limit = Math.min(
      Math.max(1, Number(searchParams.get("limit") ?? String(defaultLimit)) || defaultLimit),
      24
    );

    const session = await auth();
    const result = await runSearch({
      query: q,
      type,
      sort,
      genreSlug: genre,
      tagSlugs,
      limit,
      offset,
      viewerId: session?.user?.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search failed", error);
    return NextResponse.json(
      { error: "Search failed. Please try again." },
      { status: 500 }
    );
  }
}
