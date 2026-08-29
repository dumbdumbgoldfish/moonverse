import { ForYouFeed } from "@/components/home/ForYouFeed";
import { ForYouMasthead } from "@/components/home/ForYouMasthead";
import { ReviewsSalonShelvesSkeleton } from "@/components/reviews/salon/ReviewsSalonShelvesView";
import type { PreferredGenreOption } from "@/services/preference.service";
import type { ForYouShelfData } from "@/services/home-shelves.service";
import type { ReactNode } from "react";

interface DiscoverHomeProps {
  greetingName: string;
  genres: PreferredGenreOption[];
  shelves?: ForYouShelfData[];
  children?: ReactNode;
}

export function DiscoverHome({
  greetingName,
  genres,
  shelves,
  children,
}: DiscoverHomeProps) {
  return (
    <div className="space-y-8 pb-2">
      <ForYouMasthead greetingName={greetingName} genres={genres} />
      {children ??
        (shelves ? (
          <ForYouFeed shelves={shelves} />
        ) : (
          <ReviewsSalonShelvesSkeleton />
        ))}
    </div>
  );
}
