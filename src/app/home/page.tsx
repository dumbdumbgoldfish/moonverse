import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DiscoverHome } from "@/components/home/DiscoverHome";
import { ForYouFeed } from "@/components/home/ForYouFeed";
import { ReviewsSalonShelvesSkeleton } from "@/components/reviews/salon/ReviewsSalonShelvesView";
import { parseHomeFeedTab } from "@/lib/feed";
import { LITERARY_SALON_STYLE } from "@/lib/literary-salon";
import { homeHref, parseHomeView } from "@/lib/home-view";
import { isAdminRole } from "@/lib/admin-redirect";
import { requireOnboardedUser } from "@/lib/onboarding-guard";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { getPersonalizedHomeShelves } from "@/services/home-shelves.service";
import { getOrCreateDailyPick } from "@/services/moonie-daily.service";
import { getPreferredGenres } from "@/services/preference.service";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Home · MoonVerse",
  description:
    "Personalised novel review discovery: trending, latest, and reviews selected for you.",
};

interface HomePageProps {
  searchParams: Promise<{ view?: string; feed?: string }>;
}

async function ForYouShelvesAsync({ userId }: { userId: string }) {
  const shelves = await getPersonalizedHomeShelves(userId);
  return <ForYouFeed shelves={shelves} />;
}

export default async function AuthenticatedHomePage({
  searchParams,
}: HomePageProps) {
  const session = await requireOnboardedUser("/home");
  if (isAdminRole(session.user.role)) {
    redirect("/admin");
  }
  const params = await searchParams;
  const view = parseHomeView(params.view);

  if (view === "community") {
    redirect(homeHref("community", parseHomeFeedTab(params.feed)));
  }

  const userId = session.user.id;
  const displayName =
    session.user.name?.trim() || session.user.username || "Reader";
  const greetingName = displayName.split(/\s+/)[0] || "reader";

  void getOrCreateDailyPick(userId).catch(() => {});

  const preferred = await getPreferredGenres(userId);

  return (
    <div
      className="safe-bottom-pad min-h-[60vh] bg-[#F7F5FA]"
      style={LITERARY_SALON_STYLE}
    >
      <div className={SITE_SHELL_CLASS}>
        <div className="py-5">
          <DiscoverHome greetingName={greetingName} genres={preferred}>
            <Suspense fallback={<ReviewsSalonShelvesSkeleton />}>
              <ForYouShelvesAsync userId={userId} />
            </Suspense>
          </DiscoverHome>
        </div>
      </div>
    </div>
  );
}
