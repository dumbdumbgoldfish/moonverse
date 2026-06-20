import { ReviewForm } from "@/components/reviews/ReviewForm";
import {
  getAllGenres,
  getAllTags,
  getNovelsForSelect,
} from "@/services/novel.service";

export const metadata = {
  title: "Write a Review — MoonVerse",
  description: "Share your thoughts on a web novel with the MoonVerse community.",
};

export const dynamic = "force-dynamic";

export default async function NewReviewPage() {
  const [genres, tags, novels] = await Promise.all([
    getAllGenres(),
    getAllTags(),
    getNovelsForSelect(),
  ]);

  return <ReviewForm genres={genres} tags={tags} novels={novels} />;
}
