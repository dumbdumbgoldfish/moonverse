"use client";

import Link from "next/link";
import { MoonieEmptyState } from "@/components/moonie/MoonieEmptyState";
import { ProfileFollowingCard } from "@/components/users/ProfileFollowingCard";
import { ProfileSectionCarousel } from "@/components/users/ProfileSectionCarousel";
import {
  profileSectionByLabel,
} from "@/components/users/profile-carousel-layout";
import { Button } from "@/components/ui/button";
import { formatCompactCount } from "@/lib/format-utils";
import type { ProfileFollowingUser } from "@/types/user";

interface ProfileFollowingCarouselProps {
  following: ProfileFollowingUser[];
  displayName: string;
  isOwnProfile: boolean;
  isLoggedIn: boolean;
}

export function ProfileFollowingCarousel({
  following,
  displayName,
  isOwnProfile,
  isLoggedIn,
}: ProfileFollowingCarouselProps) {
  if (following.length === 0) {
    return (
      <MoonieEmptyState
        variant="thinking"
        title={
          isOwnProfile
            ? "You're not following anyone yet"
            : `${displayName} isn't following anyone yet`
        }
        description={
          isOwnProfile
            ? "Discover readers and reviewers on MoonVerse to build your following feed."
            : "Check back later to see who this reader follows."
        }
        action={
          isOwnProfile ? (
            <Button size="sm" render={<Link href="/discover" />}>
              Discover readers
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <ProfileSectionCarousel
      title={`${formatCompactCount(following.length)} Following by ${profileSectionByLabel(displayName, isOwnProfile)}`}
      ariaLabel={isOwnProfile ? "Following" : `Readers followed by ${displayName}`}
      items={following}
      getItemKey={(user) => user.id}
      renderItem={(user) => (
        <ProfileFollowingCard user={user} isLoggedIn={isLoggedIn} />
      )}
      previousLabel="Show previous followed readers"
      nextLabel="Show next followed readers"
      cardsPerView={{ desktop: 6, tablet: 3, mobile: 1 }}
    />
  );
}
