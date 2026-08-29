import { ReviewsSalonShelf } from "@/components/reviews/salon/ReviewsSalonShelf";
import type { ForYouShelfData } from "@/services/home-shelves.service";

interface ForYouFeedProps {
  shelves: ForYouShelfData[];
}

export function ForYouFeed({ shelves }: ForYouFeedProps) {
  if (shelves.length === 0) {
    return (
      <p className="rounded-2xl bg-white/70 px-5 py-8 text-center text-sm text-[#1A1224]/55 ring-1 ring-[#1A1224]/8">
        No novel reviews to show yet. Write or save a review and this feed will
        fill in.
      </p>
    );
  }

  return (
    <div className="space-y-10">
      {shelves.map((shelf, index) => (
        <ReviewsSalonShelf
          key={shelf.id}
          id={shelf.id}
          title={shelf.title}
          subtitle={shelf.subtitle}
          iconName={shelf.iconName}
          accentClass={shelf.accentClass}
          reviews={shelf.reviews}
          eagerImageCount={index === 0 ? 2 : 0}
        />
      ))}
    </div>
  );
}
