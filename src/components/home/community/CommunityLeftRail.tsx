import Link from "next/link";
import { Bookmark, Flame, BookOpen } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommunityDeskCta } from "@/components/home/community/CommunityDeskCta";
import { CommunityGenreChips } from "@/components/home/community/CommunityGenreChips";
import type { CommunityDeskSnapshot } from "@/services/community-desk.service";
import type { PreferredGenreOption } from "@/services/preference.service";
import { buildTasteMaturity } from "@/lib/taste-signature";
import type { ReadingTasteSnapshot } from "@/services/feed.service";
import { cn } from "@/lib/utils";

interface CommunityLeftRailProps {
  displayName: string;
  username: string;
  avatarInitials: string;
  avatarUrl?: string | null;
  reviewCount: number;
  followerCount: number;
  savedNovelCount: number;
  genres: PreferredGenreOption[];
  desk: CommunityDeskSnapshot;
  taste: ReadingTasteSnapshot;
  currentUserId?: string;
  className?: string;
}

function formatMemberSince(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function weeklyStatItems(
  weekly: CommunityDeskSnapshot["weekly"]
): { value: number; label: string }[] {
  const items: { value: number; label: string }[] = [];

  if (weekly.reviews > 0) {
    items.push({
      value: weekly.reviews,
      label: weekly.reviews === 1 ? "review" : "reviews",
    });
  }
  if (weekly.saves > 0) {
    items.push({
      value: weekly.saves,
      label: weekly.saves === 1 ? "save" : "saves",
    });
  }
  if (weekly.follows > 0) {
    items.push({
      value: weekly.follows,
      label: weekly.follows === 1 ? "follow" : "follows",
    });
  }

  return items;
}

/**
 * Left community rail: reader desk (profile, activity, genres, CTA).
 */
export function CommunityLeftRail({
  displayName,
  username,
  avatarInitials,
  avatarUrl,
  reviewCount,
  followerCount,
  savedNovelCount,
  genres,
  desk,
  taste,
  currentUserId,
  className,
}: CommunityLeftRailProps) {
  const photo = avatarUrl?.trim() || undefined;
  const maturity = buildTasteMaturity(taste);
  const weekItems = weeklyStatItems(desk.weekly);
  const memberSince = formatMemberSince(desk.memberSince);

  return (
    <aside className={cn("min-w-0", className)}>
      <section className="overflow-hidden rounded-3xl border border-[var(--mv-border)] bg-white shadow-[0_16px_40px_-28px_rgba(36,22,48,0.45)]">
        <div
          className="relative h-[4.5rem] overflow-hidden mv-plum-banner"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(255,255,255,0.28),transparent_62%)]" />
          <div className="absolute -right-6 top-2 size-24 rounded-full bg-white/10 blur-2xl" />
        </div>

        <div className="relative space-y-4 px-4 pb-5 pt-0">
          <Link
            href={`/users/${username}`}
            className="group block -mt-10 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]"
          >
            <Avatar className="size-16 rounded-2xl after:rounded-2xl ring-[3px] ring-white shadow-md">
              {photo ? (
                <AvatarImage
                  src={photo}
                  alt={`${displayName}'s profile photo`}
                  className="rounded-2xl object-cover"
                />
              ) : null}
              <AvatarFallback className="mv-avatar-plum rounded-2xl text-base font-bold text-white">
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
            <div className="mt-3 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-[family-name:var(--font-source-serif)] text-base font-semibold leading-snug text-[var(--mv-ink)] transition group-hover:text-[var(--mv-plum)]">
                  {displayName}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    maturity.maturity === "distinct"
                      ? "bg-[var(--mv-gold)]/20 text-[var(--mv-deep-plum)]"
                      : maturity.maturity === "defined"
                        ? "bg-[var(--mv-plum)]/12 text-[var(--mv-plum)]"
                        : "bg-[var(--mv-paper)] text-[var(--mv-text-muted)]"
                  )}
                >
                  {maturity.label}
                </span>
              </div>
              <p className="text-[13px] text-[var(--mv-text-muted)]">@{username}</p>
              {memberSince ? (
                <p className="text-[12px] leading-relaxed text-[var(--mv-text-muted)]">
                  Reader since {memberSince}
                </p>
              ) : null}
            </div>
          </Link>

          <dl className="mv-stats-panel grid grid-cols-3 gap-1 rounded-2xl px-1 py-3.5">
            {[
              { label: "Reviews", value: reviewCount, href: "/my-reviews" },
              { label: "Fans", value: followerCount, href: `/users/${username}` },
              { label: "Saved", value: savedNovelCount, href: "/folders" },
            ].map((stat) => (
              <div key={stat.label} className="min-w-0 px-1.5 text-center">
                <dd className="leading-none">
                  <Link
                    href={stat.href}
                    className="text-[15px] font-bold tabular-nums text-[var(--mv-ink)] transition hover:text-[var(--mv-plum)]"
                  >
                    {stat.value}
                  </Link>
                </dd>
                <dt className="mt-1.5 text-[11px] font-medium leading-none text-[var(--mv-text-muted)]">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>

          {(weekItems.length > 0 || desk.activeStreakDays > 0) && (
            <div className="rounded-xl border border-[var(--mv-border)]/80 bg-[linear-gradient(180deg,rgba(250,248,245,0.9)_0%,#ffffff_100%)] px-3.5 py-3.5">
              {desk.activeStreakDays > 0 ? (
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[var(--mv-gold)]/14">
                    <Flame
                      className="size-4 text-[var(--mv-gold)]"
                      aria-hidden
                    />
                  </span>
                  <p className="text-[13px] font-semibold leading-tight text-[var(--mv-ink)]">
                    {desk.activeStreakDays}-day reading streak
                  </p>
                </div>
              ) : null}

              {weekItems.length > 0 ? (
                <div
                  className={cn(
                    desk.activeStreakDays > 0 &&
                      "mt-3 border-t border-[var(--mv-border)]/70 pt-3"
                  )}
                >
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--mv-text-muted)]">
                    This week
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {weekItems.map((item) => (
                      <span
                        key={item.label}
                        className="inline-flex min-w-0 items-baseline gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] ring-1 ring-[var(--mv-border)]/80"
                      >
                        <span className="font-bold tabular-nums text-[var(--mv-ink)]">
                          {item.value}
                        </span>
                        <span className="text-[var(--mv-text-muted)]">
                          {item.label}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {desk.currentlyReading ? (
            <Link
              href={`/novels/${desk.currentlyReading.novelId}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--mv-border)] bg-white p-3 transition hover:border-[var(--mv-plum)]/30"
            >
              <div className="relative h-[4.5rem] w-12 shrink-0 overflow-hidden rounded-md ring-1 ring-[var(--mv-border)]">
                <CoverImage
                  src={desk.currentlyReading.coverUrl}
                  alt=""
                  title={desk.currentlyReading.novelTitle}
                  author={desk.currentlyReading.novelAuthor ?? ""}
                  themeSeed={desk.currentlyReading.novelId}
                  sizes="48px"
                  compactFallback
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--mv-plum)]">
                  <BookOpen className="size-3.5" aria-hidden />
                  Now reading
                </p>
                <p className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-[var(--mv-ink)]">
                  {desk.currentlyReading.novelTitle}
                </p>
              </div>
            </Link>
          ) : null}

          {genres.length > 0 ? (
            <div className="border-t border-[var(--mv-border)]/70 pt-4">
              <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--mv-text-muted)]">
                <Bookmark className="size-3.5 text-[var(--mv-plum)]" aria-hidden />
                Favourite genres
              </p>
              <CommunityGenreChips genres={genres} />
            </div>
          ) : null}

          <div className="border-t border-[var(--mv-border)]/70 pt-4">
            {currentUserId ? (
              <CommunityDeskCta userId={currentUserId} />
            ) : (
              <Link
                href="/reviews/new"
                className="inline-flex h-11 w-full items-center justify-center rounded-full bg-[var(--mv-deep-plum)] text-sm font-semibold text-white"
              >
                Write a review
              </Link>
            )}
          </div>
        </div>
      </section>
    </aside>
  );
}
