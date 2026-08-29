import { NextResponse } from "next/server";
import {
  getCachedCommunityStats,
  getCachedDiscoverPopularTags,
  getCachedGenresWithReviewCounts,
  getCachedTopReviewers,
} from "@/lib/cached-queries";
import { getSession } from "@/lib/session";
import { getFoldersByUser } from "@/services/folder.service";

export async function GET() {
  const session = await getSession();
  const foldersPromise = session?.user?.id
    ? getFoldersByUser(session.user.id)
    : Promise.resolve([]);

  const [genres, popularTags, topReviewers, communityStats, folders] =
    await Promise.all([
      getCachedGenresWithReviewCounts(),
      getCachedDiscoverPopularTags(),
      getCachedTopReviewers(),
      getCachedCommunityStats(),
      foldersPromise,
    ]);

  return NextResponse.json(
    {
      genres,
      popularTags,
      topReviewers,
      communityStats,
      folders,
    },
    {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=120",
      },
    }
  );
}
