import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { UserProfileView } from "@/components/users/UserProfileView";
import { isFollowing, getFollowersForUser, getFollowingForUser } from "@/services/follow.service";
import { getReadingListsForUser, getProfileRecommendationsForUser } from "@/services/discovery.service";
import { getReviewsByUserId } from "@/services/review.service";
import { getUserByUsername } from "@/services/user.service";

export const dynamic = "force-dynamic";

interface UserProfilePageProps {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: UserProfilePageProps) {
  const { username } = await params;
  const profile = await getUserByUsername(username);

  if (!profile) {
    return { title: "User not found · MoonVerse" };
  }

  return {
    title: `${profile.displayName} (@${profile.username}) · MoonVerse`,
    description: profile.bio ?? `View ${profile.displayName}'s reviews on MoonVerse.`,
  };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { username } = await params;
  const session = await auth();

  const profile = await getUserByUsername(username);

  if (!profile) {
    notFound();
  }

  const [reviews, initialFollowing, readingLists, suggestedReviews, following, followers] =
    await Promise.all([
    getReviewsByUserId(profile.id),
    session?.user?.id && session.user.id !== profile.id
      ? isFollowing(session.user.id, profile.id)
      : Promise.resolve(false),
    getReadingListsForUser(profile.id, session?.user?.id),
    getProfileRecommendationsForUser(profile.id, 12),
    getFollowingForUser(profile.id, session?.user?.id),
    getFollowersForUser(profile.id, session?.user?.id),
  ]);

  const isOwnProfile = session?.user?.id === profile.id;

  return (
    <UserProfileView
      profile={profile}
      reviews={reviews}
      readingLists={readingLists}
      isOwnProfile={isOwnProfile}
      isLoggedIn={!!session?.user?.id}
      initialFollowing={initialFollowing}
      suggestedReviews={suggestedReviews}
      following={following}
      followers={followers}
    />
  );
}
