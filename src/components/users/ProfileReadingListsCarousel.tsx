"use client";

import { ProfileReadingListCard } from "@/components/users/ProfileReadingListCard";
import { ProfileSectionCarousel } from "@/components/users/ProfileSectionCarousel";
import type { ReadingListPreview } from "@/types/discovery";

interface ProfileReadingListsCarouselProps {
  lists: ReadingListPreview[];
  displayName: string;
}

export function ProfileReadingListsCarousel({
  lists,
  displayName,
}: ProfileReadingListsCarouselProps) {
  return (
    <ProfileSectionCarousel
      title={`Reading lists by ${displayName}`}
      subtitle={`${lists.length} ${lists.length === 1 ? "list" : "lists"}`}
      ariaLabel={`Reading lists by ${displayName}`}
      items={lists}
      getItemKey={(list) => list.id}
      renderItem={(list) => <ProfileReadingListCard list={list} />}
      previousLabel="Show previous reading lists"
      nextLabel="Show next reading lists"
    />
  );
}
