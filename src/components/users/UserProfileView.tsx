"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MoonieProfileRecommendations } from "@/components/moonie/MoonieProfileRecommendations";
import { MoonieEmptyState } from "@/components/moonie/MoonieEmptyState";
import { ProfileFollowersCarousel } from "@/components/users/ProfileFollowersCarousel";
import { ProfileHeader } from "@/components/users/ProfileHeader";
import { ProfileFollowingCarousel } from "@/components/users/ProfileFollowingCarousel";
import { ProfileReadingListShelves } from "@/components/users/ProfileReadingListShelves";
import { ProfileReviewsCarousel } from "@/components/users/ProfileReviewsCarousel";
import type { ProfileStatTab, ProfileTab } from "@/components/users/profile-tabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReadingListPreview } from "@/types/discovery";
import type { ReviewListItem } from "@/types/review";
import type { UserProfile, ProfileFollowingUser } from "@/types/user";
import { SITE_PAGE_SHELL_CLASS } from "@/lib/site-shell";

interface UserProfileViewProps {
  profile: UserProfile;
  reviews: ReviewListItem[];
  readingLists: ReadingListPreview[];
  suggestedReviews: ReviewListItem[];
  following: ProfileFollowingUser[];
  followers: ProfileFollowingUser[];
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  initialFollowing: boolean;
}

export function UserProfileView({
  profile,
  reviews,
  readingLists,
  suggestedReviews,
  following,
  followers,
  isOwnProfile,
  isLoggedIn,
  initialFollowing,
}: UserProfileViewProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<ProfileTab>("reviews");

  function openTab(nextTab: ProfileTab) {
    setTab(nextTab);
    tabsRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }

  function handleStatClick(statTab: ProfileStatTab) {
    openTab(statTab);
  }

  const profileTabs: { id: ProfileTab; label: string }[] = [
    { id: "reviews", label: "Reviews" },
    { id: "lists", label: "Reading Lists" },
    { id: "followers", label: "Followers" },
    { id: "following", label: "Following" },
    { id: "recommendations", label: "Recommendations" },
  ];

  return (
    <div className={cn(SITE_PAGE_SHELL_CLASS, "bg-white")}>
      <ProfileHeader
        profile={profile}
        readingListCount={readingLists.length}
        isOwnProfile={isOwnProfile}
        isLoggedIn={isLoggedIn}
        initialFollowing={initialFollowing}
        onStatClick={handleStatClick}
      />

      <div
        ref={tabsRef}
        className="flex gap-3 overflow-x-auto border-b border-border/60 px-4 scrollbar-hide"
      >
        {profileTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => openTab(t.id)}
            className={cn(
              "shrink-0 border-b-2 py-3 text-sm font-semibold transition-colors",
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="py-4">
        {tab === "reviews" && (
          <>
            {reviews.length === 0 ? (
              <MoonieEmptyState
                variant="thinking"
                title={
                  isOwnProfile
                    ? "You haven't posted any reviews yet"
                    : "No reviews yet"
                }
                description={
                  isOwnProfile
                    ? "Share your first take on a novel and help other readers discover what to read next."
                    : "This reader hasn't shared any reviews on MoonVerse yet."
                }
                action={
                  isOwnProfile ? (
                    <Button size="sm" render={<Link href="/reviews/new" />}>
                      Write a review
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              <ProfileReviewsCarousel
                reviews={reviews}
                displayName={profile.displayName}
                isOwnProfile={isOwnProfile}
              />
            )}
          </>
        )}

        {tab === "lists" && (
          <>
            {readingLists.length === 0 ? (
              <MoonieEmptyState
                variant="happy"
                title={
                  isOwnProfile
                    ? "You don't have any reading lists yet"
                    : "No public reading lists yet"
                }
                description={
                  isOwnProfile
                    ? "Organize novels into shelves so other readers can follow what you're into."
                    : "This reader hasn't shared any public reading lists yet."
                }
              />
            ) : (
              <ProfileReadingListShelves
                lists={readingLists}
                displayName={profile.displayName}
                isOwnProfile={isOwnProfile}
              />
            )}
          </>
        )}

        {tab === "recommendations" && (
          <MoonieProfileRecommendations
            reviews={suggestedReviews}
            displayName={profile.displayName}
            isOwnProfile={isOwnProfile}
          />
        )}

        {tab === "followers" && (
          <ProfileFollowersCarousel
            followers={followers}
            displayName={profile.displayName}
            isOwnProfile={isOwnProfile}
            isLoggedIn={isLoggedIn}
          />
        )}

        {tab === "following" && (
          <ProfileFollowingCarousel
            following={following}
            displayName={profile.displayName}
            isOwnProfile={isOwnProfile}
            isLoggedIn={isLoggedIn}
          />
        )}
      </div>
    </div>
  );
}
