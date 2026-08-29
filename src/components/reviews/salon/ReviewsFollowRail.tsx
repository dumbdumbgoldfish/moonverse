"use client";

import Link from "next/link";
import { UserPlus } from "lucide-react";
import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
import { DiscoverProfileFollowButton } from "@/components/discovery/DiscoverProfileFollowButton";
import { CoverCarousel } from "@/components/discovery/CoverCarousel";
import { cn } from "@/lib/utils";
import type { TopReviewerPreview } from "@/types/discovery";

interface ReviewsFollowRailProps {
  reviewers: TopReviewerPreview[];
  isLoggedIn: boolean;
  className?: string;
}

export function ReviewsFollowRail({
  reviewers,
  isLoggedIn,
  className,
}: ReviewsFollowRailProps) {
  const { promptSignIn } = useSignInPrompt();

  if (reviewers.length === 0) return null;

  return (
    <CoverCarousel
      title="Readers worth following"
      subtitle="Voices shaping the salon"
      icon={UserPlus}
      accentClass="text-[#6E46C7]"
      className={className}
    >
      {reviewers.map((user) => (
        <article
          key={user.id}
          className="w-[220px] shrink-0 snap-start touch-manipulation rounded-2xl bg-white/80 p-4 ring-1 ring-[#1A1224]/8 transition-all fine-hover:-translate-y-0.5 fine-hover:bg-white fine-hover:shadow-[0_16px_40px_-28px_rgba(26,18,36,0.35)] motion-reduce:transition-none motion-reduce:fine-hover:translate-y-0"
        >
          <div className="flex items-start gap-3">
            <Link
              href={`/users/${user.username}`}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6E46C7]/15 to-[#C89B4A]/15 text-sm font-bold text-[#6E46C7] ring-2 ring-white"
            >
              {user.avatarInitials}
            </Link>
            <div className="min-w-0">
              <Link
                href={`/users/${user.username}`}
                className="block truncate font-semibold text-[#1A1224] fine-hover:text-[#6E46C7]"
              >
                {user.displayName}
              </Link>
              <p className="mt-0.5 text-[11px] text-[#1A1224]/50">
                {user.reviewCount} reviews
                {user.highlightGenre ? ` · ${user.highlightGenre}` : ""}
              </p>
            </div>
          </div>
          <div className="mt-3">
            {isLoggedIn ? (
              <DiscoverProfileFollowButton
                userId={user.id}
                username={user.username}
                initialFollowing={user.viewerIsFollowing ?? false}
                isLoggedIn
              />
            ) : (
              <button
                type="button"
                onClick={() => promptSignIn()}
                className={cn(
                  "inline-flex w-full min-h-8 items-center justify-center rounded-full",
                  "bg-[#1A1224]/5 text-[12px] font-semibold text-[#1A1224]/70",
                  "ring-1 ring-[#1A1224]/10 fine-hover:bg-white"
                )}
              >
                Sign in to follow
              </button>
            )}
          </div>
        </article>
      ))}
    </CoverCarousel>
  );
}
