"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "next-auth";
import { cn } from "@/lib/utils";
import { SearchCommandProvider } from "@/components/search/SearchCommand";
import { SignInPromptProvider } from "@/components/auth/SignInPromptProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { setMoonieEntrySignedIn } from "@/lib/moonie/open-moonie";
import type { EnrichedNotificationItem } from "@/types/notification";

const MoonieWidgetHost = dynamic(
  () =>
    import("@/components/moonie/MoonieWidgetHost").then(
      (mod) => mod.MoonieWidgetHost
    ),
  { ssr: false }
);

interface AppChromeProps {
  session: Session | null;
  unreadCount: number;
  latestNotifications: EnrichedNotificationItem[];
  children: React.ReactNode;
}

export function AppChrome({
  session,
  unreadCount,
  latestNotifications,
  children,
}: AppChromeProps) {
  const pathname = usePathname();
  useEffect(() => {
    setMoonieEntrySignedIn(Boolean(session));
    return () => setMoonieEntrySignedIn(false);
  }, [session]);
  const isAdminConsole = pathname.startsWith("/admin");
  const isMoonieDesk = pathname === "/moonie";
  const isGuestAskMoonie = pathname === "/ask-moonie";
  const isOnboarding = pathname.startsWith("/onboarding");
  const lockViewportHeight = isMoonieDesk;
  const lockGuestAskMoonieDesktop = isGuestAskMoonie;
  const isSearchPage = pathname === "/search" || pathname.startsWith("/search/");
  const showFooter =
    !lockViewportHeight &&
    !isGuestAskMoonie &&
    !isSearchPage &&
    !isOnboarding &&
    !isAdminConsole;

  if (isAdminConsole) {
    return <div className="min-h-[100dvh]">{children}</div>;
  }

  return (
    <SearchCommandProvider>
      <SignInPromptProvider>
      <a href="#main-content" className="skip-to-content">
        Skip to content
      </a>
      <a
        href="#mv-site-nav-search"
        className="skip-to-content skip-to-search hidden lg:inline-flex"
      >
        Skip to search
      </a>
      <a
        href="#mv-nav-search-mobile"
        className="skip-to-content skip-to-search lg:hidden"
      >
        Skip to search
      </a>
      {/* One site-wide navbar on every page. never swap variants by route */}
      {!isOnboarding ? (
        <Suspense
          fallback={
            <div
              className="h-[var(--mv-nav-h)] shrink-0 bg-[#FFFBFF]"
              aria-hidden
            />
          }
        >
          <Navbar
            session={session}
            unreadCount={unreadCount}
            latestNotifications={latestNotifications}
          />
        </Suspense>
      ) : null}
      <div
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          (isMoonieDesk || isGuestAskMoonie) && "bg-[#1A1224]",
          lockViewportHeight &&
            "h-[calc(100dvh-var(--mv-nav-offset)-var(--mv-mobile-nav-h)-env(safe-area-inset-bottom,0px))] max-h-[calc(100dvh-var(--mv-nav-offset)-var(--mv-mobile-nav-h)-env(safe-area-inset-bottom,0px))] overflow-hidden lg:h-[calc(100dvh-var(--mv-nav-offset))] lg:max-h-[calc(100dvh-var(--mv-nav-offset))]",
          lockGuestAskMoonieDesktop &&
            "lg:h-[calc(100dvh-var(--mv-nav-offset))] lg:max-h-[calc(100dvh-var(--mv-nav-offset))] lg:overflow-hidden",
          isGuestAskMoonie &&
            "min-h-[calc(100dvh-var(--mv-nav-offset)-var(--mv-mobile-nav-h)-env(safe-area-inset-bottom,0px))] lg:min-h-0",
        )}
      >
        <div
          id="main-content"
          tabIndex={-1}
          className={cn(
            "flex flex-1 flex-col outline-none",
            lockViewportHeight && "min-h-0 basis-0 overflow-hidden",
            lockGuestAskMoonieDesktop && "lg:min-h-0 lg:basis-0 lg:overflow-hidden",
          )}
        >
          {children}
        </div>
        <div className="shrink-0">
          {showFooter ? <Footer /> : null}
        </div>
      </div>
      {session && !isOnboarding ? (
        <Suspense
          fallback={
            <div
              className="h-[calc(4rem+env(safe-area-inset-bottom,0px))] md:hidden"
              aria-hidden
            />
          }
        >
          <MobileBottomNav
            unreadCount={unreadCount}
            username={session.user?.username}
          />
        </Suspense>
      ) : null}
      <MoonieWidgetHost isLoggedIn={Boolean(session)} />
      </SignInPromptProvider>
    </SearchCommandProvider>
  );
}
