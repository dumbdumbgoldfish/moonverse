import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ForbiddenMessage } from "@/components/layout/ForbiddenMessage";
import { ReviewEditForm } from "@/components/reviews/ReviewEditForm";
import { getReviewById } from "@/services/review.service";

export const dynamic = "force-dynamic";

interface EditReviewPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: EditReviewPageProps) {
  const { id } = await params;
  const review = await getReviewById(id);
  if (!review) return { title: "Review not found · MoonVerse" };
  return {
    title: `Edit ${review.title} · MoonVerse`,
  };
}

export default async function EditReviewPage({ params }: EditReviewPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/reviews/${(await params).id}/edit`);
  }

  const { id } = await params;
  const review = await getReviewById(id);

  if (!review) {
    notFound();
  }

  if (review.userId !== session.user.id) {
    return (
      <ForbiddenMessage
        message="You can only edit reviews that you wrote."
        returnHref={`/reviews/${id}`}
        returnLabel="Back to review"
      />
    );
  }

  return <ReviewEditForm review={review} />;
}
