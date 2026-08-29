import { getContinueReadingReviews } from "@/services/discovery.service";
import { getReadingListsForUser } from "@/services/discovery.service";
import { getFoldersByUser } from "@/services/folder.service";
import { FoldersList } from "@/components/folders/FoldersList";
import { requireOnboardedUser } from "@/lib/onboarding-guard";

export const metadata = {
  title: "Library · MoonVerse",
  description: "Your reading lists on MoonVerse.",
};

export const dynamic = "force-dynamic";

export default async function FoldersPage() {
  const session = await requireOnboardedUser("/folders");
  const userId = session.user.id;
  const [folders, readingLists, continueReading] = userId
    ? await Promise.all([
        getFoldersByUser(userId),
        getReadingListsForUser(userId, userId),
        getContinueReadingReviews(userId),
      ])
    : [[], [], []];

  return (
    <FoldersList
      folders={folders}
      readingLists={readingLists}
      continueReading={continueReading}
    />
  );
}
