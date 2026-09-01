import { ReviewsSalonShelvesSkeleton } from "@/components/reviews/salon/ReviewsSalonShelvesView";
import { LiteraryStreamingFallback } from "@/components/layout/LiteraryStreamingFallback";

export default function CommunityLoading() {
  return (
    <LiteraryStreamingFallback label="Loading the community feed">
      <ReviewsSalonShelvesSkeleton />
    </LiteraryStreamingFallback>
  );
}
