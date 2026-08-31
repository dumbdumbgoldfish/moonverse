import { ReviewsSalonShelvesSkeleton } from "@/components/reviews/salon/ReviewsSalonShelvesView";
import { LITERARY_PAGE_BG, LITERARY_SALON_STYLE } from "@/lib/literary-salon";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";

export default function CommunityLoading() {
  return (
    <div
      className={`safe-bottom-pad min-h-[40vh] ${LITERARY_PAGE_BG}`}
      style={LITERARY_SALON_STYLE}
    >
      <div className={`${SITE_SHELL_CLASS} py-5`}>
        <div className="mb-4 h-2.5 w-28 animate-pulse rounded-full bg-[#1A1224]/8" />
        <ReviewsSalonShelvesSkeleton />
        <p className="sr-only" role="status">
          Loading the community feed
        </p>
      </div>
    </div>
  );
}
