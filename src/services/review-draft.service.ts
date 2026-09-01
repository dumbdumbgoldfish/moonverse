import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  isMeaningfulReviewDraft,
  type ReviewDraftV1,
} from "@/lib/review-draft";

function parseDraftPayload(
  rowId: string,
  payload: unknown
): ReviewDraftV1 | null {
  if (
    !payload ||
    typeof payload !== "object" ||
    (payload as { version?: unknown }).version !== 1
  ) {
    return null;
  }

  const draft = payload as ReviewDraftV1;
  return {
    ...draft,
    id: draft.id?.trim() || rowId,
    version: 1,
  };
}

export async function upsertReviewDraft(
  userId: string,
  draft: ReviewDraftV1
): Promise<void> {
  if (!draft.id?.trim()) {
    throw new Error("Draft id is required.");
  }

  const novelId =
    draft.novelMode === "existing" && draft.selectedNovelId
      ? draft.selectedNovelId
      : null;

  const existing = await db.reviewDraft.findFirst({
    where: { id: draft.id, userId },
    select: { id: true },
  });

  const payload = draft as unknown as Prisma.InputJsonValue;

  if (existing) {
    await db.reviewDraft.update({
      where: { id: existing.id },
      data: { payload, novelId },
    });
    return;
  }

  await db.reviewDraft.create({
    data: { id: draft.id, userId, payload, novelId },
  });
}

export async function listReviewDrafts(
  userId: string
): Promise<ReviewDraftV1[]> {
  const rows = await db.reviewDraft.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return rows
    .map((row) => parseDraftPayload(row.id, row.payload))
    .filter((draft): draft is ReviewDraftV1 => Boolean(draft))
    .filter((draft) => isMeaningfulReviewDraft(draft));
}

export async function getReviewDraft(
  userId: string,
  draftId?: string
): Promise<ReviewDraftV1 | null> {
  const draft = await db.reviewDraft.findFirst({
    where: draftId ? { userId, id: draftId } : { userId },
    orderBy: { updatedAt: "desc" },
  });
  if (!draft) return null;
  return parseDraftPayload(draft.id, draft.payload);
}

export async function getReviewDraftOwnerId(
  draftId: string
): Promise<string | null> {
  const row = await db.reviewDraft.findUnique({
    where: { id: draftId },
    select: { userId: true },
  });
  return row?.userId ?? null;
}

export async function deleteReviewDraftById(
  userId: string,
  draftId: string
): Promise<void> {
  await db.reviewDraft.deleteMany({
    where: { userId, id: draftId },
  });
}

export async function deleteReviewDraft(userId: string): Promise<void> {
  await db.reviewDraft.deleteMany({ where: { userId } });
}
