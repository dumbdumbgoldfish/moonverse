import { ReadingStatusValue } from "@prisma/client";
import {
  getReadingListByStatus,
  type ReadingStatusNovel,
} from "@/services/reading-status.service";

export interface WritingStudioDesk {
  currentlyReading: ReadingStatusNovel | null;
  recentlyFinished: ReadingStatusNovel[];
}

export async function getWritingStudioDesk(
  userId: string
): Promise<WritingStudioDesk> {
  const [reading, finished] = await Promise.all([
    getReadingListByStatus(userId, ReadingStatusValue.READING),
    getReadingListByStatus(userId, ReadingStatusValue.FINISHED),
  ]);

  const currentlyReading = reading[0] ?? null;
  const readingId = currentlyReading?.novelId;

  return {
    currentlyReading,
    recentlyFinished: finished
      .filter((novel) => novel.novelId !== readingId)
      .slice(0, 4),
  };
}
