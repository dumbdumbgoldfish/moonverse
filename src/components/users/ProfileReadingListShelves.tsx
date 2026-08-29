"use client";

import { ProfileReadingListShelf } from "@/components/users/ProfileReadingListShelf";
import {
  PROFILE_SECTION_HEADER_CLASS,
  PROFILE_SECTION_TITLE_CLASS,
  profileSectionByLabel,
} from "@/components/users/profile-carousel-layout";
import { formatCompactCount } from "@/lib/format-utils";
import type { ReadingListPreview } from "@/types/discovery";

interface ProfileReadingListShelvesProps {
  lists: ReadingListPreview[];
  displayName: string;
  isOwnProfile: boolean;
}

export function ProfileReadingListShelves({
  lists,
  displayName,
  isOwnProfile,
}: ProfileReadingListShelvesProps) {
  return (
    <div className="min-w-0 overflow-x-hidden px-4">
      <header className={PROFILE_SECTION_HEADER_CLASS}>
        <h2 className={PROFILE_SECTION_TITLE_CLASS}>
          {formatCompactCount(lists.length)} Reading List
          {lists.length === 1 ? "" : "s"} by{" "}
          {profileSectionByLabel(displayName, isOwnProfile)}
        </h2>
      </header>

      <div className="flex flex-col gap-10">
        {lists.map((list) => (
          <ProfileReadingListShelf key={list.id} list={list} />
        ))}
      </div>
    </div>
  );
}
