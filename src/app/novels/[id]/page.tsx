import { notFound } from "next/navigation";
import { NovelDetailView } from "@/components/novels/NovelDetailView";
import { getSession } from "@/lib/session";
import { getReadingStatus } from "@/services/reading-status.service";
import {
  getNovelById,
  getReviewsByNovelId,
  getSimilarNovels,
} from "@/services/novel.service";

export const dynamic = "force-dynamic";

interface NovelDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: NovelDetailPageProps) {
  const { id } = await params;
  const novel = await getNovelById(id);
  if (!novel) return { title: "Novel not found · MoonVerse" };

  const description = (
    novel.synopsis?.trim() ||
    `Read ${novel.reviewCount} community reviews for ${novel.title}${novel.author ? ` by ${novel.author}` : ""}.`
  ).slice(0, 200);
  const title = `${novel.title} · MoonVerse`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "book" as const,
      images: novel.coverUrl ? [{ url: novel.coverUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
      images: novel.coverUrl ? [novel.coverUrl] : undefined,
    },
  };
}

export default async function NovelDetailPage({ params }: NovelDetailPageProps) {
  const { id } = await params;
  const [novel, session] = await Promise.all([getNovelById(id), getSession()]);

  if (!novel) {
    notFound();
  }

  const [reviews, recommendations, readingStatus] = await Promise.all([
    getReviewsByNovelId(id),
    getSimilarNovels(id, 25),
    session?.user?.id ? getReadingStatus(session.user.id, id) : Promise.resolve(null),
  ]);

  return (
    <NovelDetailView
      novel={novel}
      reviews={reviews}
      recommendations={recommendations}
      isLoggedIn={!!session?.user?.id}
      initialReadingStatus={readingStatus}
    />
  );
}
