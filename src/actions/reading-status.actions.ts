"use server";

import { ReadingStatusValue } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import {
  clearReadingStatus,
  setReadingStatus,
} from "@/services/reading-status.service";

export type ReadingStatusActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in.");
  }
  return session.user.id;
}

export async function setReadingStatusAction(
  novelId: string,
  status: ReadingStatusValue
): Promise<ReadingStatusActionResult> {
  try {
    const userId = await requireUserId();
    await setReadingStatus(userId, novelId, status);
    revalidatePath(`/novels/${novelId}`);
    revalidatePath("/settings/library");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to update reading status." };
  }
}

export async function clearReadingStatusAction(
  novelId: string
): Promise<ReadingStatusActionResult> {
  try {
    const userId = await requireUserId();
    await clearReadingStatus(userId, novelId);
    revalidatePath(`/novels/${novelId}`);
    revalidatePath("/settings/library");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to clear reading status." };
  }
}
