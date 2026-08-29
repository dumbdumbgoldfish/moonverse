import { redirect } from "next/navigation";
import { MyReviewsView } from "@/components/reviews/MyReviewsView";
import { auth } from "@/lib/auth";
import { getReviewsByUserId } from "@/services/review.service";

export const metadata = {
  title: "My Reviews · MoonVerse",
  description: "See your published reviews and browser drafts on MoonVerse.",
};

export const dynamic = "force-dynamic";

export default async function MyReviewsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/my-reviews");
  }

  const reviews = await getReviewsByUserId(session.user.id);

  return <MyReviewsView userId={session.user.id} reviews={reviews} />;
}
