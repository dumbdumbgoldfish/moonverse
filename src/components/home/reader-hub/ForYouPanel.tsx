import type { ReactNode } from "react";
import { DiscoverHome } from "@/components/home/DiscoverHome";
import type { PreferredGenreOption } from "@/services/preference.service";
import type { ForYouShelfData } from "@/services/home-shelves.service";

interface ForYouPanelProps {
  greetingName: string;
  genres: PreferredGenreOption[];
  shelves: ForYouShelfData[];
  reviewStream?: ReactNode;
}

export function ForYouPanel({
  greetingName,
  genres,
  shelves,
  reviewStream,
}: ForYouPanelProps) {
  return (
    <div className="space-y-10">
      <DiscoverHome
        greetingName={greetingName}
        genres={genres}
        shelves={shelves}
      />
      {reviewStream}
    </div>
  );
}
