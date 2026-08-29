import { redirect } from "next/navigation";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { auth } from "@/lib/auth";
import { getWritingStudioDesk } from "@/services/writing-studio.service";
import {
  getAllGenres,
  getAllTags,
  getNovelsForSelect,
} from "@/services/novel.service";

export const metadata = {
  title: "Write a Review · MoonVerse",
  description: "Share your thoughts on a web novel with the MoonVerse community.",
};

export const dynamic = "force-dynamic";

interface NewReviewPageProps {
  searchParams: Promise<{
    novelId?: string;
    resume?: string;
    publish?: string;
    draft?: string;
  }>;
}

export default async function NewReviewPage({
  searchParams,
}: NewReviewPageProps) {
  const { novelId, resume, publish, draft } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) redirect("/write");

  const [genres, tags, novels, studioDesk] = await Promise.all([
    getAllGenres(),
    getAllTags(),
    getNovelsForSelect(),
    getWritingStudioDesk(session.user.id),
  ]);

  const initialNovelId = novels.some((novel) => novel.id === novelId)
    ? novelId
    : undefined;

  return (
    <ReviewForm
      key={`resume:${resume ?? "0"}:publish:${publish ?? "0"}:draft:${draft ?? ""}:${initialNovelId ?? ""}`}
      genres={genres}
      tags={tags}
      novels={novels}
      initialNovelId={initialNovelId}
      initialDraftId={draft}
      autoResumeDraft={resume === "1"}
      autoOpenPublish={resume === "1" && publish === "1"}
      userId={session.user.id}
      userName={
        session.user.name?.trim() ||
        session.user.username ||
        "MoonVerse reader"
      }
      userUsername={session.user.username}
      userImage={session.user.image}
      currentlyReading={studioDesk.currentlyReading}
      recentlyFinished={studioDesk.recentlyFinished}
    />
  );
}
