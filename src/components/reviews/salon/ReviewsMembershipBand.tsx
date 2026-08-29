"use client";

import Link from "next/link";
import { Bookmark, Heart, Sparkles, Users } from "lucide-react";
import type { CommunityStats } from "@/services/community.service";
import { formatCompactCount } from "@/lib/format-utils";
import { MV_PRIMARY_BTN_ROUNDED } from "@/lib/mv-buttons";
import { cn } from "@/lib/utils";

interface ReviewsMembershipBandProps {
  stats?: CommunityStats;
}

const BENEFITS = [
  {
    icon: Bookmark,
    title: "Save reviews",
    copy: "Build folders and revisit your best finds.",
  },
  {
    icon: Users,
    title: "Follow readers",
    copy: "Track voices whose taste matches yours.",
  },
  {
    icon: Heart,
    title: "Personalise",
    copy: "Unlock For You shelves and hidden gems.",
  },
] as const;

export function ReviewsMembershipBand({ stats }: ReviewsMembershipBandProps) {
  return (
    <section
      aria-label="Join the salon"
      className="relative overflow-hidden rounded-[28px] bg-[#0B0818] p-6 text-[#F4F0FF] sm:p-8"
    >
      <div
        className="pointer-events-none absolute -left-20 top-[-60px] size-[260px] rounded-full bg-[#6E46C7]/22 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-16 bottom-[-70px] size-[220px] rounded-full bg-[#C89B4A]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative space-y-6">
        <div className="max-w-2xl">
          <p className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#E8C36A]/55 bg-[#E8C36A]/8 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#E8C36A]">
            <Sparkles className="size-3.5" aria-hidden />
            Join the salon
          </p>
          <h2 className="mt-4 font-serif text-[1.75rem] font-medium leading-[1.12] tracking-tight text-white sm:text-[2.15rem]">
            Join{" "}
            {stats?.totalUsers
              ? `${formatCompactCount(stats.totalUsers)} readers`
              : "readers"}{" "}
            shaping what gets read next
          </h2>
          <p className="mt-3 max-w-xl text-[14px] leading-relaxed text-[#B7B0CC] sm:text-[15px]">
            Free account. Save reviews, follow curators, and unlock personalised
            sorts that learn your taste over time.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Link
              href="/register?callbackUrl=/discover"
              className={cn(
                MV_PRIMARY_BTN_ROUNDED,
                "min-h-10 px-5 text-[13px] font-bold",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A]"
              )}
            >
              Join free
            </Link>
            <Link
              href="/login?callbackUrl=/discover"
              className={cn(
                "inline-flex min-h-10 items-center rounded-full px-4 text-[13px] font-semibold text-white",
                "border border-white/20 transition fine-hover:border-white/40 fine-hover:bg-white/8",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A]"
              )}
            >
              Log in
            </Link>
          </div>
        </div>

        <ul className="grid gap-2.5 sm:grid-cols-3">
          {BENEFITS.map(({ icon: Icon, title, copy }) => (
            <li
              key={title}
              className="rounded-2xl border border-white/8 bg-white/[0.04] px-3.5 py-3"
            >
              <p className="flex items-center gap-1.5 text-[13px] font-semibold text-white">
                <Icon className="size-3.5 text-[#E8C36A]" aria-hidden />
                {title}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-[#9C95B3]">{copy}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
