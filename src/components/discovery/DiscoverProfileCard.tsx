import Link from "next/link";
import { DiscoverProfileFollowButton } from "@/components/discovery/DiscoverProfileFollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { UserSearchResult } from "@/services/user.service";

interface DiscoverProfileCardProps {
  profile: UserSearchResult;
  isLoggedIn: boolean;
  currentUserId?: string;
}

function ProfileStat({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="inline-flex items-baseline gap-1">
      <span className="font-bold text-[#1a1033]">{value.toLocaleString()}</span>
      <span className="text-[#6b6b6b]">{label}</span>
    </div>
  );
}

export function DiscoverProfileCard({
  profile,
  isLoggedIn,
  currentUserId,
}: DiscoverProfileCardProps) {
  const profileHref = `/users/${profile.username}`;
  const isOwnProfile = currentUserId === profile.id;
  const showFollow = !isOwnProfile;

  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_2px_12px_rgba(26,16,51,0.06)] ring-1 ring-[#1a1033]/6 sm:flex-row sm:items-center">
      <Link
        href={profileHref}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition-colors hover:bg-[#fcfaf7]/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6246ea]"
      >
        <Avatar className="size-14 shrink-0 border border-[#1a1033]/8 bg-[#f4f0ff]">
          {profile.avatarUrl && (
            <AvatarImage src={profile.avatarUrl} alt="" />
          )}
          <AvatarFallback className="bg-[#f4f0ff] text-base font-bold text-[#6246ea]">
            {profile.avatarInitials}
          </AvatarFallback>
        </Avatar>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-base font-bold text-[#1a1033]">
            {profile.displayName}
          </span>
          <span className="block truncate text-sm text-[#6b6b6b]">
            @{profile.username}
          </span>
          <div
            className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs"
            aria-label={`${profile.displayName} profile stats`}
          >
            <ProfileStat
              value={profile.reviewCount}
              label={profile.reviewCount === 1 ? "Review" : "Reviews"}
            />
            <span className="text-[#c8c8c8]" aria-hidden>
              ·
            </span>
            <ProfileStat
              value={profile.readingListCount}
              label={
                profile.readingListCount === 1
                  ? "Reading list"
                  : "Reading lists"
              }
            />
            <span className="text-[#c8c8c8]" aria-hidden>
              ·
            </span>
            <ProfileStat
              value={profile.followerCount}
              label={
                profile.followerCount === 1 ? "Follower" : "Followers"
              }
            />
          </div>
        </span>
      </Link>

      {showFollow && (
        <div className="flex shrink-0 justify-end sm:self-center">
          <DiscoverProfileFollowButton
            userId={profile.id}
            username={profile.username}
            initialFollowing={profile.isFollowing}
            isLoggedIn={isLoggedIn}
          />
        </div>
      )}
    </article>
  );
}
