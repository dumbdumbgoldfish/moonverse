import Link from "next/link";
import { UserPlus } from "lucide-react";
import { FollowButton } from "@/components/users/FollowButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { TopReviewerPreview } from "@/types/discovery";

interface SuggestedReviewersProps {
  reviewers: TopReviewerPreview[];
}

export function SuggestedReviewers({ reviewers }: SuggestedReviewersProps) {
  if (reviewers.length === 0) return null;

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-night-blue">
        <UserPlus className="size-4 text-primary" aria-hidden />
        Suggested reviewers
      </h2>
      <ul className="mt-3 space-y-3">
        {reviewers.map((user) => (
          <li key={user.id} className="flex items-start gap-2.5">
            <Link
              href={`/users/${user.username}`}
              className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/15 text-[10px] font-bold text-primary">
                  {user.avatarInitials}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/users/${user.username}`}
                className="block truncate text-sm font-bold text-night-blue hover:text-primary"
              >
                {user.displayName}
              </Link>
              <p className="truncate text-[11px] text-slate-500">
                {user.highlightGenre
                  ? `Often reviews ${user.highlightGenre}`
                  : `${user.reviewCount} reviews`}
                {user.followerCount > 0
                  ? ` · ${user.followerCount} followers`
                  : null}
              </p>
              <div className="mt-1.5 [&_button]:h-8 [&_button]:rounded-full [&_button]:px-3 [&_button]:text-xs">
                <FollowButton
                  userId={user.id}
                  username={user.username}
                  initialFollowing={false}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
