import Link from "next/link";
import { Pencil } from "lucide-react";
import { ReportTargetType } from "@prisma/client";
import { FollowButton } from "@/components/users/FollowButton";
import { ReportButton } from "@/components/moderation/ReportButton";
import type { ProfileStatTab } from "@/components/users/profile-tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/date-utils";
import { getInitials } from "@/lib/review-utils";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/user";

interface ProfileHeaderProps {
  profile: UserProfile;
  readingListCount: number;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  initialFollowing: boolean;
  onStatClick?: (tab: ProfileStatTab) => void;
}

export function ProfileHeader({
  profile,
  readingListCount,
  isOwnProfile,
  isLoggedIn,
  initialFollowing,
  onStatClick,
}: ProfileHeaderProps) {
  const initials = getInitials(profile.displayName);

  const statButtonClass = cn(
    "rounded-md text-left transition-colors",
    onStatClick &&
      "cursor-pointer hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
  );

  function renderStat(
    tab: ProfileStatTab,
    count: number,
    label: string,
    singularLabel?: string
  ) {
    const displayLabel =
      singularLabel && count === 1 ? singularLabel : label;

    const content = (
      <>
        <span className="font-bold">{count}</span>{" "}
        <span className="text-muted-foreground">{displayLabel}</span>
      </>
    );

    if (!onStatClick) {
      return <dd>{content}</dd>;
    }

    return (
      <dd>
        <button
          type="button"
          onClick={() => onStatClick(tab)}
          className={statButtonClass}
          aria-label={`View ${count} ${displayLabel.toLowerCase()}`}
        >
          {content}
        </button>
      </dd>
    );
  }

  return (
    <header className="overflow-hidden bg-white">
      <div
        className={cn(
          "h-52 bg-cover bg-center sm:h-64",
          !profile.profileBackgroundUrl && "gradient-profile-cover",
        )}
        style={
          profile.profileBackgroundUrl
            ? { backgroundImage: `url(${profile.profileBackgroundUrl})` }
            : undefined
        }
        role={profile.profileBackgroundUrl ? "img" : undefined}
        aria-label={
          profile.profileBackgroundUrl
            ? `${profile.displayName} profile background`
            : undefined
        }
      />

      <div className="relative px-4 pb-4">
        <div className="-mt-12 flex items-end justify-between sm:-mt-14">
          <Avatar className="size-24 border-4 border-white shadow-md sm:size-28">
            {profile.avatarUrl && (
              <AvatarImage src={profile.avatarUrl} alt="" />
            )}
            <AvatarFallback className="bg-moon-purple-soft text-xl text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center gap-2 pb-1">
            {isOwnProfile ? (
              <Button size="sm" variant="outline" render={<Link href="/settings" />}>
                <Pencil data-icon="inline-start" aria-hidden="true" />
                Edit
              </Button>
            ) : (
              isLoggedIn && (
                <>
                  <FollowButton
                    userId={profile.id}
                    username={profile.username}
                    initialFollowing={initialFollowing}
                  />
                  <ReportButton
                    targetType={ReportTargetType.USER}
                    targetId={profile.id}
                    isLoggedIn={isLoggedIn}
                    variant="icon"
                  />
                </>
              )
            )}
          </div>
        </div>

        <h1 className="mt-3 text-xl font-bold">{profile.displayName}</h1>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        {profile.bio && (
          <p className="mt-2 text-sm leading-relaxed">{profile.bio}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          Joined {formatDate(profile.createdAt)}
        </p>

        <dl className="mt-4 flex flex-wrap gap-5 text-sm">
          <div>
            <dt className="sr-only">Reviews</dt>
            {renderStat("reviews", profile.reviewCount, "Reviews", "Review")}
          </div>
          <div>
            <dt className="sr-only">Reading lists</dt>
            {renderStat("lists", readingListCount, "Lists", "List")}
          </div>
          <div>
            <dt className="sr-only">Followers</dt>
            {renderStat("followers", profile.followerCount, "Followers", "Follower")}
          </div>
          <div>
            <dt className="sr-only">Following</dt>
            {renderStat("following", profile.followingCount, "Following")}
          </div>
        </dl>
      </div>
    </header>
  );
}
