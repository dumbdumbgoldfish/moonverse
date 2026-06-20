import Link from "next/link";
import { UserProfileHeader } from "@/components/users/UserProfileHeader";
import { SocialReviewCard } from "@/components/reviews/SocialReviewCard";
import { Button } from "@/components/ui/button";
import type { ReviewListItem } from "@/types/review";
import type { UserProfile } from "@/types/user";

interface UserProfileViewProps {
  profile: UserProfile;
  reviews: ReviewListItem[];
  isOwnProfile: boolean;
  isLoggedIn: boolean;
  initialFollowing: boolean;
}

export function UserProfileView({
  profile,
  reviews,
  isOwnProfile,
  isLoggedIn,
  initialFollowing,
}: UserProfileViewProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <UserProfileHeader
        profile={profile}
        isOwnProfile={isOwnProfile}
        isLoggedIn={isLoggedIn}
        initialFollowing={initialFollowing}
      />

      <section className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Reviews by {profile.displayName}
        </h2>

        {reviews.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border/60 bg-white px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {isOwnProfile
                ? "You haven't written any reviews yet."
                : `${profile.displayName} hasn't written any reviews yet.`}
            </p>
            {isOwnProfile && (
              <Button className="mt-4" size="sm" render={<Link href="/reviews/new" />}>
                Write a review
              </Button>
            )}
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <SocialReviewCard key={review.id} review={review} variant="profile" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
