"use client";

import Link from "next/link";
import { BookOpen, Library, Users } from "lucide-react";
import { formatCompactCount } from "@/lib/format-utils";
import type { CommunityStats } from "@/services/community.service";
import type { TopReviewerPreview } from "@/types/discovery";

interface BrowseProofRailProps {
  stats: CommunityStats;
  topReviewers: TopReviewerPreview[];
  isLoggedIn: boolean;
}

export function BrowseProofRail({
  stats,
  topReviewers,
  isLoggedIn,
}: BrowseProofRailProps) {
  const statItems = [
    {
      icon: BookOpen,
      value: stats.totalReviews,
      label: stats.totalReviews === 1 ? "review" : "reviews",
    },
    {
      icon: Library,
      value: stats.totalNovels,
      label: stats.totalNovels === 1 ? "work" : "works",
    },
    {
      icon: Users,
      value: stats.totalUsers,
      label: stats.totalUsers === 1 ? "reader" : "readers",
    },
  ];

  return (
    <section
      aria-label="Community proof"
      className="grid gap-4 rounded-2xl bg-white/60 p-4 ring-1 ring-[#1A1224]/8 sm:grid-cols-[minmax(0,1fr)_auto]"
    >
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {statItems.map(({ icon: Icon, value, label }) => (
          <p
            key={label}
            className="inline-flex items-center gap-2 text-sm text-[#1A1224]/70"
          >
            <Icon className="size-4 text-[#6E46C7]" aria-hidden />
            <span className="tabular-nums font-semibold text-[#1A1224]">
              {formatCompactCount(value)}
            </span>
            <span>{label}</span>
          </p>
        ))}
      </div>

      {topReviewers.length > 0 ? (
        <div className="flex min-w-0 items-center gap-3">
          <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-[#1A1224]/45">
            Top reviewers
          </p>
          <ul className="flex min-w-0 items-center -space-x-2">
            {topReviewers.slice(0, 5).map((user) => (
              <li key={user.id}>
                <Link
                  href={`/users/${user.username}`}
                  title={`${user.displayName} · ${user.reviewCount} reviews`}
                  className="flex size-8 items-center justify-center rounded-full bg-[#6E46C7]/12 text-[10px] font-bold text-[#6E46C7] ring-2 ring-[#FBF7F1] transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-[#6E46C7]"
                >
                  {user.avatarInitials}
                </Link>
              </li>
            ))}
          </ul>
          {!isLoggedIn ? (
            <Link
              href="/register?callbackUrl=/discover"
              className="hidden shrink-0 text-[11px] font-semibold text-[#6E46C7] hover:underline sm:inline"
            >
              Follow after signup
            </Link>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
