import Link from "next/link";
import { Pencil } from "lucide-react";
import { FollowButton } from "@/components/users/FollowButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";
import { getInitials } from "@/lib/review-utils";
import type { UserProfile } from "@/types/user";

interface UserProfileHeaderProps {
  profile: UserProfile;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  initialFollowing: boolean;
}

export function UserProfileHeader({
  profile,
  isOwnProfile,
  isLoggedIn,
  initialFollowing,
}: UserProfileHeaderProps) {
  const initials = getInitials(profile.displayName);

  return (
    <header className="overflow-hidden rounded-2xl border border-border/60 bg-white shadow-sm">
      <div className="gradient-moonverse h-32 sm:h-40" aria-hidden="true" />

      <div className="relative px-4 pb-6 sm:px-6">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <Avatar className="size-24 border-4 border-white text-2xl shadow-md sm:size-28">
            {profile.avatarUrl && (
              <AvatarImage
                src={profile.avatarUrl}
                alt={`${profile.displayName}'s avatar`}
              />
            )}
            <AvatarFallback className="bg-primary/15 text-2xl text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="shrink-0 sm:mb-1">
            {isOwnProfile ? (
              <Button
                size="sm"
                variant="outline"
                className="bg-white"
                render={<Link href="/settings" />}
              >
                <Pencil data-icon="inline-start" aria-hidden="true" />
                Edit Profile
              </Button>
            ) : (
              isLoggedIn && (
                <FollowButton
                  userId={profile.id}
                  username={profile.username}
                  initialFollowing={initialFollowing}
                />
              )
            )}
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {profile.displayName}
          </h1>
          <p className="text-muted-foreground">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/90">
              {profile.bio}
            </p>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            Member since {formatDate(profile.createdAt)}
          </p>
        </div>

        <dl className="mt-5 flex flex-wrap gap-6 rounded-xl bg-bg-warm px-4 py-3 text-sm">
          <div>
            <dt className="sr-only">Reviews</dt>
            <dd>
              <span className="font-bold text-foreground">{profile.reviewCount}</span>{" "}
              <span className="text-muted-foreground">
                review{profile.reviewCount !== 1 ? "s" : ""}
              </span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Followers</dt>
            <dd>
              <span className="font-bold text-foreground">{profile.followerCount}</span>{" "}
              <span className="text-muted-foreground">
                follower{profile.followerCount !== 1 ? "s" : ""}
              </span>
            </dd>
          </div>
          <div>
            <dt className="sr-only">Following</dt>
            <dd>
              <span className="font-bold text-foreground">{profile.followingCount}</span>{" "}
              <span className="text-muted-foreground">following</span>
            </dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
