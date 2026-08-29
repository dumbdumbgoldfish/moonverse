"use server";

import { ReportStatus, ReportTargetType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { requireAdminUserId } from "@/lib/admin-auth";
import { createReport, resolveReport } from "@/services/report.service";

export type ReportActionResult =
  | { success: true }
  | { success: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be logged in to report content.");
  }
  return session.user.id;
}

export async function createReportAction(input: {
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}): Promise<ReportActionResult> {
  try {
    const userId = await requireUserId();
    await createReport({
      reporterId: userId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason: input.reason,
      details: input.details,
    });
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to submit report." };
  }
}

export async function resolveReportAction(
  reportId: string,
  status: "RESOLVED" | "DISMISSED",
  resolution?: string
): Promise<ReportActionResult> {
  try {
    const adminId = await requireAdminUserId();
    await resolveReport(
      reportId,
      adminId,
      status === "RESOLVED" ? ReportStatus.RESOLVED : ReportStatus.DISMISSED,
      resolution
    );
    revalidatePath("/admin/reports");
    revalidatePath("/admin/inbox");
    return { success: true };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to resolve report." };
  }
}
