import { ReadingStatusValue } from "@prisma/client";
import { NovelEditionDesk } from "@/components/novels/NovelEditionDesk";
import type {
  NovelDetail,
  NovelRecommendation,
  ReviewListItem,
} from "@/types/review";

interface NovelDetailViewProps {
  novel: NovelDetail;
  reviews: ReviewListItem[];
  recommendations: NovelRecommendation[];
  isLoggedIn?: boolean;
  initialReadingStatus?: ReadingStatusValue | null;
}

export function NovelDetailView({
  novel,
  reviews,
  recommendations,
  isLoggedIn = false,
  initialReadingStatus = null,
}: NovelDetailViewProps) {
  return (
    <article
      className={
        isLoggedIn
          ? "flex flex-1 flex-col bg-[#FBF7F1] pb-24 text-[#1A1224] md:pb-0"
          : "flex flex-1 flex-col bg-[#FBF7F1] pb-14 text-[#1A1224] md:pb-0"
      }
    >
      <NovelEditionDesk
        novel={novel}
        reviews={reviews}
        recommendations={recommendations}
        isLoggedIn={isLoggedIn}
        initialReadingStatus={initialReadingStatus}
      />
    </article>
  );
}
