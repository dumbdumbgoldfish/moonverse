"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CommunityLeftRail } from "@/components/home/community/CommunityLeftRail";
import { LiteraryDiscoveryRail } from "@/components/home/community/LiteraryDiscoveryRail";
import {
  LITERARY_PAGE_BG,
  LITERARY_SALON_STYLE,
} from "@/lib/literary-salon";
import type { HomeDashboardShared } from "@/lib/home-dashboard";
import { parseHomeFeedTab } from "@/lib/feed";
import { parseHomeView, parseReaderSection } from "@/lib/home-view";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import { ReaderHubProvider, useReaderHub } from "./reader-hub-context";
import { ReaderHubTabs } from "./ReaderHubTabs";
import { ReaderHubMainSkeleton } from "./ReaderHubMainSkeleton";

export const READER_HUB_SIDEBAR_STICKY =
  "sticky top-[calc(var(--mv-nav-h)+5.25rem)] space-y-6";

export const READER_HUB_GRID =
  "grid items-start gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_280px]";

interface ReaderHubDashboardLayoutProps {
  shared: HomeDashboardShared;
  children: ReactNode;
}

function ReaderHubMainColumn({ children }: { children: ReactNode }) {
  const { isPending } = useReaderHub();

  return (
    <div className="relative min-w-0 min-h-[480px]">
      <div
        className={cn(
          "transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          isPending && "pointer-events-none opacity-70 translate-y-0.5"
        )}
      >
        {children}
      </div>
      {isPending ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 opacity-40"
          aria-hidden
        >
          <ReaderHubMainSkeleton />
        </div>
      ) : null}
    </div>
  );
}

function ReaderHubDashboardChrome({
  shared,
  children,
}: ReaderHubDashboardLayoutProps) {
  const { displaySection } = useReaderHub();

  const leftRail = (
    <CommunityLeftRail
      displayName={shared.displayName}
      username={shared.username}
      avatarInitials={shared.avatarInitials}
      avatarUrl={shared.avatarUrl}
      reviewCount={shared.taste.reviewCount}
      followerCount={shared.followerCount}
      savedNovelCount={shared.taste.savedNovelCount}
      genres={shared.preferredGenres}
      desk={shared.desk}
      taste={shared.taste}
      currentUserId={shared.userId}
    />
  );

  const rightRail = (
    <LiteraryDiscoveryRail
      taste={shared.taste}
      tasteInsight={shared.tasteInsight}
      suggestedReviewers={shared.suggestedReviewers}
    />
  );

  return (
    <div
      className={cn(
        "safe-bottom-pad relative min-h-[70vh] text-[#1A1224]",
        LITERARY_PAGE_BG
      )}
      style={LITERARY_SALON_STYLE}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(ellipse_at_top,_rgba(110,70,199,0.08),_transparent_60%),radial-gradient(ellipse_at_80%_20%,_rgba(200,155,74,0.08),_transparent_45%)]"
        aria-hidden
      />
      <div className={cn(SITE_SHELL_CLASS, "relative pb-8 pt-4 sm:pt-5")}>
        <div className="sticky top-[var(--mv-nav-h)] z-30 -mx-4 bg-[linear-gradient(180deg,rgba(251,247,241,0.94),rgba(251,247,241,0.88))] px-4 py-2 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <ReaderHubTabs />
        </div>

        <div
          id="reader-hub-panel"
          role="tabpanel"
          aria-labelledby={`reader-hub-tab-${displaySection}`}
          className="reader-hub-panel relative mt-6 min-h-[70vh]"
        >
          <div className={READER_HUB_GRID}>
            <aside
              className="hidden self-start lg:block"
              aria-label="Your shortcuts"
            >
              <div className={READER_HUB_SIDEBAR_STICKY}>{leftRail}</div>
            </aside>

            <ReaderHubMainColumn>{children}</ReaderHubMainColumn>

            <aside
              className="hidden self-start xl:block"
              aria-label="Discovery sidebar"
            >
              <div className={READER_HUB_SIDEBAR_STICKY}>{rightRail}</div>
            </aside>
          </div>

          <div className="mt-8 space-y-4 border-t border-[var(--mv-border)] pt-6 lg:hidden">
            {leftRail}
            <LiteraryDiscoveryRail
              taste={shared.taste}
              tasteInsight={shared.tasteInsight}
              suggestedReviewers={shared.suggestedReviewers}
              variant="mobile"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ReaderHubDashboardInner({
  shared,
  children,
}: ReaderHubDashboardLayoutProps) {
  const searchParams = useSearchParams();
  const view = parseHomeView(searchParams.get("view"));
  const section = parseReaderSection("/home", view);
  const feed = parseHomeFeedTab(searchParams.get("feed"));

  return (
    <ReaderHubProvider section={section} feed={feed}>
      <ReaderHubDashboardChrome shared={shared}>
        {children}
      </ReaderHubDashboardChrome>
    </ReaderHubProvider>
  );
}

export function ReaderHubDashboardLayout({
  shared,
  children,
}: ReaderHubDashboardLayoutProps) {
  return (
    <Suspense fallback={null}>
      <ReaderHubDashboardInner shared={shared}>{children}</ReaderHubDashboardInner>
    </Suspense>
  );
}
