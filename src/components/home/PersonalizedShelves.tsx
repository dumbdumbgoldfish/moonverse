import { DiscoveryShelf } from "@/components/discovery/DiscoveryShelf";
import type { DiscoveryShelfData } from "@/types/shelves";

interface PersonalizedShelvesProps {
  shelves: DiscoveryShelfData[];
}

export function PersonalizedShelves({ shelves }: PersonalizedShelvesProps) {
  if (shelves.length === 0) return null;

  return (
    <div className="space-y-7">
      {shelves.map((shelf) => (
        <DiscoveryShelf
          key={shelf.id}
          shelf={shelf}
          size={
            shelf.id === "made-for-you" || shelf.id === "top-picks" || shelf.id === "recommended" ? "xl" : "lg"
          }
        />
      ))}
    </div>
  );
}
