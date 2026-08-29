"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { Session } from "next-auth";
import {
  BookMarked,
  Menu,
  MessagesSquare,
  Newspaper,
  PenLine,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { NavAuthActions, NavGuestActions } from "@/components/landing/NavActions";
import { NavSearchSlot } from "@/components/layout/NavSearchSlot";
import { NavDropdown } from "@/components/landing/NavDropdown";
import { NavMyReviewsCard } from "@/components/landing/NavMyReviewsCard";
import { NavWriteReviewCard } from "@/components/landing/NavWriteReviewCard";
import { NavShell } from "@/components/landing/NavShell";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { NavbarUserMenu } from "@/components/layout/NavbarUserMenu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { WEB_NOVEL_GENRES, genreBrowseHref } from "@/lib/genres";
import { DISCOVERY_MOOD_CHIPS } from "@/lib/moonie/constants";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import { WEB_NOVEL_TAGS } from "@/lib/tags";
import { cn } from "@/lib/utils";
import type { EnrichedNotificationItem } from "@/types/notification";

const CATALOGUE_TROPES = WEB_NOVEL_TAGS.filter((tag) =>
  [
    "slow-burn",
    "enemies-to-lovers",
    "found-family",
    "strong-fl",
    "villainess",
    "reincarnation",
  ].includes(tag.slug)
);

interface NavbarProps {
  session: Session | null;
  unreadCount?: number;
  latestNotifications?: EnrichedNotificationItem[];
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className="mv-nav-trigger inline-flex h-11 min-h-[44px] items-center px-3 text-[13px] font-semibold tracking-wide"
    >
      {children}
    </Link>
  );
}

/**
 * Site-wide navbar.
 * Left: Community · Discover · Browse (logo → Home when signed in)
 * Center: search
 * Right: Write · Moonie · profile
 */
export function Navbar({
  session,
  unreadCount = 0,
  latestNotifications = [],
}: NavbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const homeView = searchParams.get("view");
  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [menuKey, setMenuKey] = useState(() => `${pathname}?${searchParams.toString()}`);

  const currentMenuKey = `${pathname}?${searchParams.toString()}`;
  if (currentMenuKey !== menuKey) {
    setMenuKey(currentMenuKey);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  }

  useEffect(() => {
    const onScroll = () => {
      const isScrolled = window.scrollY > 8;
      setScrolled(isScrolled);
      document.documentElement.style.setProperty(
        "--mv-nav-offset",
        isScrolled ? "var(--mv-nav-h-scrolled)" : "var(--mv-nav-h)"
      );
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.style.setProperty(
        "--mv-nav-offset",
        "var(--mv-nav-h)"
      );
    };
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  const writeHref = session ? "/reviews/new" : "/write";
  const myReviewsHref = session ? "/my-reviews" : "/login?callbackUrl=/my-reviews";
  const moonieHref = session ? "/moonie" : "/ask-moonie";
  const logoHref = session ? "/home" : "/";
  const communityHref = "/community";
  const communityActive = Boolean(
    session &&
      (pathname.startsWith("/community") ||
        (pathname.startsWith("/home") && homeView === "community"))
  );
  const browseActive = pathname.startsWith("/browse");
  const discoverActive =
    pathname === "/discover" ||
    pathname === "/reviews" ||
    (/^\/reviews\/[^/]+$/.test(pathname) && pathname !== "/reviews/new");
  const writeActive =
    pathname === "/write" ||
    pathname.startsWith("/reviews/new") ||
    pathname.startsWith("/my-reviews") ||
    /^\/reviews\/[^/]+\/edit$/.test(pathname);

  const belowBar =
    mobileSearchOpen || mobileMenuOpen ? (
      <div className="border-t border-[#1A1224]/8 bg-[#FFFBFF] text-night-blue lg:hidden">
        {mobileSearchOpen ? (
          <div className="px-4 py-3">
            <NavSearchSlot className="w-full" compact inputId="mv-nav-search-mobile" />
          </div>
        ) : null}
        {mobileMenuOpen ? (
          <div className="max-h-[min(85vh,720px)] overflow-y-auto px-3 py-4 sm:px-4">
            <div className="space-y-1">
              <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E46C7]">
                Destinations
              </p>
              {!session ? (
                <Link
                  href="/discover"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#F4ECF8]"
                >
                  <Newspaper className="size-4 text-primary" aria-hidden />
                  Discover
                </Link>
              ) : null}
              {session ? (
                <Link
                  href={communityHref}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#F4ECF8]"
                >
                  <MessagesSquare className="size-4 text-primary" aria-hidden />
                  Community
                </Link>
              ) : null}
              {session ? (
                <Link
                  href="/discover"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#F4ECF8]"
                >
                  <Newspaper className="size-4 text-primary" aria-hidden />
                  Discover
                </Link>
              ) : null}
              <Link
                href="/browse"
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#F4ECF8]"
              >
                Browse
              </Link>
              <Link
                href={moonieHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#F4ECF8]"
              >
                <Sparkles className="size-4 text-primary" aria-hidden />
                Ask Moonie
              </Link>

              <div className="flex items-center justify-between px-2 pb-1 pt-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E46C7]">
                  Catalogue
                </p>
                <span className="size-1.5 rounded-full bg-[#C89B4A]" aria-hidden />
              </div>
              <div className="mb-2 grid max-h-52 grid-cols-2 gap-1 overflow-y-auto">
                {WEB_NOVEL_GENRES.slice(0, 12).map((genre) => {
                  const Icon = genre.icon;
                  return (
                    <Link
                      key={genre.slug}
                      href={genreBrowseHref(genre.slug)}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold hover:bg-[#F4ECF8]"
                    >
                      <Icon className="size-4 shrink-0 text-primary" aria-hidden />
                      {genre.name}
                    </Link>
                  );
                })}
              </div>
              <Link
                href="/browse"
                onClick={() => setMobileMenuOpen(false)}
                className="mb-2 flex min-h-11 items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-primary hover:bg-[#F4ECF8]"
              >
                Open full catalogue
              </Link>

              <p className="px-2 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.2em] text-[#1A1224]/45">
                Account
              </p>
              <Link
                href={writeHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#F4ECF8]"
              >
                <PenLine className="size-4 text-primary" aria-hidden />
                Write
              </Link>
              <Link
                href={myReviewsHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-[#F4ECF8]"
              >
                <BookMarked className="size-4 text-primary" aria-hidden />
                My Reviews
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <NavShell
      scrolled={scrolled}
      maxWidth="guest"
      belowBar={belowBar}
      bar={
        <div className="flex w-full min-w-0 items-center gap-2 sm:gap-3 lg:gap-4">
          <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
            <BrandLogo
              href={logoHref}
              size="nav"
              mark="none"
              showWordmark
              showTagline={!scrolled}
              variant="light"
              priority
              className={cn(
                "mr-1 shrink-0 transition-transform duration-300 motion-reduce:transition-none lg:mr-2",
                scrolled && "scale-[0.94]",
                !scrolled && "[&_.mv-wordmark-sub]:hidden [&_.mv-wordmark-sub]:xl:block"
              )}
            />

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
              {!session ? (
                <NavLink href="/discover" active={discoverActive}>
                  Discover
                </NavLink>
              ) : null}
              {session ? (
                <NavLink href={communityHref} active={communityActive}>
                  Community
                </NavLink>
              ) : null}
              {session ? (
                <NavLink href="/discover" active={discoverActive}>
                  Discover
                </NavLink>
              ) : null}

              <NavDropdown
                label="Browse"
                variant="menu"
                active={browseActive}
                panelClassName="w-[min(680px,calc(100vw-2rem))] overflow-hidden p-0"
              >
                <div className="flex items-center justify-between border-b border-[#6E46C7]/10 px-4 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E46C7]">
                    Catalogue
                  </p>
                  <CatalogLink href="/browse" size="compact">
                    Open full catalogue
                  </CatalogLink>
                </div>
                <div className="grid gap-0 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
                  <div className="p-3">
                    <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A1224]/45">
                      Genres
                    </p>
                    <div className="grid max-h-[min(70vh,380px)] grid-cols-2 gap-1 overflow-y-auto">
                      {WEB_NOVEL_GENRES.map((genre) => {
                        const Icon = genre.icon;
                        return (
                          <Link
                            key={genre.slug}
                            href={genreBrowseHref(genre.slug)}
                            className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#1A1224] transition-colors hover:bg-[#F4ECF8]"
                          >
                            <Icon className="size-4 shrink-0 text-[#6E46C7]" aria-hidden />
                            {genre.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border-t border-[#6E46C7]/10 bg-[#FBF8FF] p-4 sm:border-l sm:border-t-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A1224]/45">
                      Moods
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {DISCOVERY_MOOD_CHIPS.map((mood) => (
                        <Link
                          key={mood.label}
                          href={moonieEntryHref(mood.prompt)}
                          className="inline-flex min-h-8 items-center rounded-full border border-[#6E46C7]/15 bg-white px-2.5 text-[12px] font-semibold text-[#1A1224] hover:border-[#6E46C7]/35 hover:bg-white"
                        >
                          {mood.label}
                        </Link>
                      ))}
                    </div>
                    <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A1224]/45">
                      Tropes
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {CATALOGUE_TROPES.map((tag) => (
                        <Link
                          key={tag.slug}
                          href={`/search?tags=${encodeURIComponent(tag.slug)}&type=works`}
                          className="inline-flex min-h-8 items-center rounded-full border border-[#1A1224]/10 bg-white px-2.5 text-[12px] font-semibold text-[#1A1224] hover:border-[#6E46C7]/30"
                        >
                          {tag.name}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href={moonieHref}
                      className="mt-5 flex min-h-11 items-center justify-between rounded-2xl bg-white px-3 py-2 text-sm font-semibold text-[#4C35C4] ring-1 ring-[#6E46C7]/12 hover:ring-[#6E46C7]/30"
                    >
                      Ask Moonie instead
                      <Sparkles className="size-3.5" aria-hidden />
                    </Link>
                  </div>
                </div>
              </NavDropdown>
            </nav>
          </div>

          <div className="hidden min-w-[11rem] flex-1 justify-center px-1 sm:min-w-[14rem] lg:flex xl:min-w-[18rem] xl:px-3">
            <NavSearchSlot
              className="mx-auto w-full max-w-[520px] xl:max-w-[580px] 2xl:max-w-[620px]"
              inputId="mv-site-nav-search"
            />
          </div>

          <div className="ml-auto flex shrink-0 items-center lg:ml-0">
            <div className="hidden items-center gap-2.5 lg:flex xl:gap-3">
              <NavDropdown
                label="Write"
                icon={PenLine}
                variant="menu"
                align="right"
                active={writeActive}
                panelClassName="w-[min(22rem,calc(100vw-2rem))] overflow-hidden p-0"
              >
                <div className="p-3">
                  <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E46C7]">
                    Reviews
                  </p>
                  <NavWriteReviewCard href={writeHref} />
                  <NavMyReviewsCard href={myReviewsHref} />
                </div>
              </NavDropdown>
              {session ? (
                <>
                  <NavAuthActions moonieHref={moonieHref} />
                  <div
                    aria-hidden
                    className="hidden h-6 w-px shrink-0 bg-[#E4D8EE] lg:block"
                  />
                  <div className="flex items-center gap-1.5 xl:gap-2">
                    <NotificationDropdown
                      unreadCount={unreadCount}
                      notifications={latestNotifications}
                    />
                    <NavbarUserMenu
                      session={session}
                      unreadCount={unreadCount}
                      notifications={latestNotifications}
                    />
                  </div>
                </>
              ) : (
                <NavGuestActions moonieHref={moonieHref} />
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 lg:hidden">
              <button
                id="mv-nav-search-mobile"
                type="button"
                onClick={() => {
                  setMobileSearchOpen((current) => !current);
                  setMobileMenuOpen(false);
                }}
                className="inline-flex size-11 items-center justify-center rounded-xl text-foreground/80 transition-colors hover:bg-moon-purple-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Toggle search"
                aria-expanded={mobileSearchOpen}
              >
                <Search className="size-5" />
              </button>

              {session ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <NotificationDropdown
                    unreadCount={unreadCount}
                    notifications={latestNotifications}
                  />
                  <NavbarUserMenu
                    session={session}
                    unreadCount={unreadCount}
                    notifications={latestNotifications}
                  />
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    prefetch={false}
                    className="mv-nav-login inline-flex h-11 min-h-[44px] items-center justify-center rounded-full px-3 text-[13px] font-semibold tracking-wide sm:px-4"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    prefetch={false}
                    className="mv-nav-signup inline-flex h-11 min-h-[44px] items-center justify-center rounded-full px-3.5 text-[13px] font-semibold tracking-wide text-white sm:px-4"
                  >
                    Sign up
                  </Link>
                </>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen((current) => !current);
                  setMobileSearchOpen(false);
                }}
                className="inline-flex size-11 items-center justify-center rounded-xl text-foreground/80 transition-colors hover:bg-moon-purple-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>
            </div>
          </div>
        </div>
      }
    />
  );
}
