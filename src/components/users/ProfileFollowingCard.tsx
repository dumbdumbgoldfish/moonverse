import Link from "next/link";
import { FollowButton } from "@/components/users/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatCompactCount } from "@/lib/format-utils";
import { getInitials } from "@/lib/review-utils";
import { cn } from "@/lib/utils";
import type { ProfileFollowingUser } from "@/types/user";

interface ProfileFollowingCardProps {
  user: ProfileFollowingUser;
  isLoggedIn: boolean;
  className?: string;
}

function StatColumn({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0 px-0.5">
      <p className="text-xs font-bold tabular-nums text-[#1A1224]">{value}</p>
      <p className="text-[9px] leading-tight text-[#1A1224]/55">{label}</p>
    </div>
  );
}

export function ProfileFollowingCard({
  user,
  isLoggedIn,
  className,
}: ProfileFollowingCardProps) {
  const initials = getInitials(user.displayName);

  return (
    <article
      className={cn(
        "flex h-full flex-col overflow-hidden rounded-2xl border border-[#1A1224]/10 bg-white",
        "shadow-[0_12px_32px_-28px_rgba(26,18,36,0.35)]",
        className
      )}
    >
      <div className="gradient-profile-cover h-20 shrink-0" aria-hidden="true" />

      <div className="flex flex-col px-3 pb-3 pt-0">
        <div className="-mt-9 flex flex-col items-center text-center">
          <Link
            href={`/users/${user.username}`}
            className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Avatar className="size-16 border-4 border-white shadow-md sm:size-[4.5rem]">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback className="bg-moon-purple-soft text-lg font-semibold text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>

          <Link
            href={`/users/${user.username}`}
            className="mt-2 line-clamp-1 font-serif text-base font-bold text-[#1A1224] transition-colors hover:text-[#6E46C7]"
          >
            {user.displayName}
          </Link>
          <p className="mt-0.5 line-clamp-1 text-xs text-[#1A1224]/55">
            @{user.username}
          </p>
        </div>

        <div className="mt-2.5 flex justify-center">
          {isLoggedIn ? (
            <FollowButton
              userId={user.id}
              username={user.username}
              initialFollowing={user.isFollowing}
              appearance="pill"
              isLoggedIn
            />
          ) : (
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/users/${user.username}`)}`}
              className="inline-flex h-9 items-center justify-center rounded-full bg-[#6E46C7] px-4 text-[13px] font-semibold text-white transition hover:bg-[#5E3BB5]"
            >
              Follow
            </Link>
          )}
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg bg-[#F7F3FF] px-1.5 py-2 text-center">
          <StatColumn
            value={formatCompactCount(user.readingListCount)}
            label={user.readingListCount === 1 ? "List" : "Lists"}
          />
          <StatColumn
            value={formatCompactCount(user.reviewCount)}
            label={user.reviewCount === 1 ? "Review" : "Reviews"}
          />
          <StatColumn
            value={formatCompactCount(user.followerCount)}
            label={user.followerCount === 1 ? "Follower" : "Followers"}
          />
        </div>
      </div>
    </article>
  );
}
