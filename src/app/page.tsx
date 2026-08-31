import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  isAdminRole,
  shouldRenderPublicLanding,
} from "@/lib/admin-redirect";
import { MarketingLandingPage } from "@/components/landing/MarketingLandingPage";
import { hasCompletedOnboarding } from "@/services/preference.service";
import {
  getLandingDiscoverShelf,
  getLandingGenreDoors,
  getLandingReadingShelves,
} from "@/services/discovery.service";
import {
  getAllReviews,
  getTrendingReviews,
} from "@/services/review.service";

export const dynamic = "force-dynamic";

export default async function RootPage({
  searchParams,
}: {
  searchParams: Promise<{ public?: string | string[] }>;
}) {
  const showPublicLanding = shouldRenderPublicLanding(await searchParams);
  const session = await getSession();

  if (session?.user?.id && !showPublicLanding) {
    if (isAdminRole(session.user.role)) {
      redirect("/admin");
    }
    const onboarded = await hasCompletedOnboarding(session.user.id);
    redirect(onboarded ? "/home" : "/onboarding/genres");
  }

  const [
    trending,
    mustRead,
    readingLists,
    discoverTrending,
    discoverHighest,
    genreDoors,
  ] = await Promise.all([
    getTrendingReviews(20),
    getAllReviews({ sort: "highest-rated", limit: 20 }),
    getLandingReadingShelves(6),
    getLandingDiscoverShelf("trending", 12),
    getLandingDiscoverShelf("highest", 12),
    getLandingGenreDoors(),
  ]);

  return (
    <MarketingLandingPage
      trending={trending}
      mustRead={mustRead}
      discoverTrending={discoverTrending}
      discoverHighest={discoverHighest}
      readingLists={readingLists}
      genreDoors={genreDoors}
    />
  );
}
