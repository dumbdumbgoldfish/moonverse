"use client";

import Link from "next/link";
import { MoonieEmptyState } from "@/components/moonie/MoonieEmptyState";
import { ProfileFollowingCard } from "@/components/users/ProfileFollowingCard";
import { ProfileSectionCarousel } from "@/components/users/ProfileSectionCarousel";
import {
  profileSectionByLabel,
} from "@/components/users/profile-carousel-layout";
import { formatCompactCount } from "@/lib/format-utils";
import type { ProfileFollowingUser } from "@/types/user";

interface ProfileFollowersCarouselProps {
  followers: ProfileFollowingUser[];
  displayName: string;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
}

export function ProfileFollowersCarousel({
  followers,
  displayName,
  isOwnProfile,
  isLoggedIn,
}: ProfileFollowersCarouselProps) {
  if (followers.length === 0) {
    return (
      <MoonieEmptyState
        variant="waving"
        title={
          isOwnProfile
            ? "You don't have any followers yet"
            : `${displayName} doesn't have any followers yet`
        }
        description={
          isOwnProfile
            ? "Share reviews and lists to grow your reader circle on MoonVerse."
            : "Check back later to see who follows this reader."
        }
        descriptionClassName={
          isOwnProfile ? "max-w-none whitespace-nowrap" : undefined
        }
      />
    );
  }

  const subject = profileSectionByLabel(displayName, isOwnProfile);

  return (
    <ProfileSectionCarousel
      title={`${formatCompactCount(followers.length)} Follower${
        followers.length === 1 ? "" : "s"
      } of ${subject}`}
      ariaLabel={isOwnProfile ? "Followers" : `Followers of ${displayName}`}
      items={followers}
      getItemKey={(user) => user.id}
      renderItem={(user) => (
        <ProfileFollowingCard user={user} isLoggedIn={isLoggedIn} />
      )}
      previousLabel="Show previous followers"
      nextLabel="Show next followers"
      cardsPerView={{ desktop: 6, tablet: 3, mobile: 1 }}
    />
  );
}
