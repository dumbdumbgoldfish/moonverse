import Link from "next/link";
import { Flame, Sparkles, Users } from "lucide-react";
import { LiteraryDiscoveryRail } from "@/components/home/community/LiteraryDiscoveryRail";
import type { HomeDashboardShared } from "@/lib/home-dashboard";
import type { ReaderSection } from "@/lib/home-view";
import { HOME_SURFACE } from "@/lib/home-atelier";

interface HomeContextRailProps {
  shared: HomeDashboardShared;
  section: ReaderSection;
  variant?: "desktop" | "mobile";
}

export function HomeContextRail({
  shared,
  section,
  variant = "desktop",
}: HomeContextRailProps) {
  if (section === "for-you") {
    return (
      <LiteraryDiscoveryRail
        taste={shared.taste}
        tasteInsight={shared.tasteInsight}
        suggestedReviewers={shared.suggestedReviewers}
        variant={variant}
      />
    );
  }

  if (variant === "mobile") {
    return (
      <section className={`${HOME_SURFACE} px-4 py-4`}>
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1224]/45">
          <Flame className="size-3.5 text-[#6E46C7]" aria-hidden />
          Community pulse
        </p>
        <p className="mt-2 text-sm text-[#1A1224]/70">
          Follow readers to shape your feed, or browse what&apos;s trending.
        </p>
        <Link
          href="/community?feed=following"
          className="mt-3 inline-flex text-sm font-semibold text-[#6E46C7] hover:underline"
        >
          View following
        </Link>
      </section>
    );
  }

  return (
    <aside className="min-w-0 space-y-4">
      <section className={`${HOME_SURFACE} px-4 py-4`}>
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1224]/45">
          <Flame className="size-3.5 text-[#6E46C7]" aria-hidden />
          Trending now
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#1A1224]/70">
          The feed shows reviews from your circle and the wider community.
        </p>
        <Link
          href="/browse"
          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#6E46C7] hover:underline"
        >
          <Sparkles className="size-3.5" aria-hidden />
          Browse catalogue
        </Link>
      </section>

      {shared.suggestedReviewers.length > 0 ? (
        <section className={`${HOME_SURFACE} px-4 py-4`}>
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1A1224]/45">
            <Users className="size-3.5 text-[#6E46C7]" aria-hidden />
            Readers to follow
          </p>
          <ul className="mt-3 space-y-2.5">
            {shared.suggestedReviewers.slice(0, 3).map((reviewer) => (
              <li key={reviewer.id}>
                <Link
                  href={`/users/${reviewer.username}`}
                  className="block truncate text-sm font-semibold text-[#1A1224] hover:text-[#6E46C7]"
                >
                  {reviewer.displayName}
                </Link>
                <p className="truncate text-[11px] text-[#1A1224]/50">
                  {reviewer.highlightGenre ?? `${reviewer.reviewCount} reviews`}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
