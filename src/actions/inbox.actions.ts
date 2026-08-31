"use server";

import {
  ContentModerationStatus,
  ReportStatus,
  ReportTargetType,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdminUserId } from "@/lib/admin-auth";
import { resolveReport } from "@/services/report.service";
import {
  approveReadingLinkAction,
  rejectReadingLinkAction,
  setCommentModerationStatusAction,
  setReviewModerationStatusAction,
  suspendUserAction,
} from "@/actions/admin.actions";
import { resolveReportAction } from "@/actions/report.actions";

export type InboxActionResult =
  | { success: true }
  | { success: false; error: string };

function revalidateInbox() {
  revalidatePath("/admin/inbox");
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/admin/reviews");
  revalidatePath("/admin/comments");
  revalidatePath("/admin/reading-links");
  revalidatePath("/admin/tags");
  revalidatePath("/admin/audit");
}

export async function resolveReportWithRemediationAction(input: {
  reportId: string;
  remediation:
    | "resolve_only"
    | "hide_review"
    | "hide_comment"
    | "suspend_user";
  resolution?: string;
}): Promise<InboxActionResult> {
  try {
    const adminId = await requireAdminUserId();
    const { db } = await import("@/lib/db");
    const report = await db.report.findUnique({ where: { id: input.reportId } });
    if (!report) return { success: false, error: "Report not found." };
    if (report.status !== ReportStatus.OPEN) {
      return { success: false, error: "Report is already closed." };
    }

    if (input.remediation === "hide_review") {
      if (report.targetType !== ReportTargetType.REVIEW) {
        return { success: false, error: "Report target is not a review." };
      }
      const hideResult = await setReviewModerationStatusAction(
        report.targetId,
        ContentModerationStatus.HIDDEN
      );
      if (!hideResult.success) return hideResult;
    }

    if (input.remediation === "hide_comment") {
      if (report.targetType !== ReportTargetType.COMMENT) {
        return { success: false, error: "Report target is not a comment." };
      }
      const hideResult = await setCommentModerationStatusAction(
        report.targetId,
        ContentModerationStatus.HIDDEN
      );
      if (!hideResult.success) return hideResult;
    }

    if (input.remediation === "suspend_user") {
      if (report.targetType !== ReportTargetType.USER) {
        return { success: false, error: "Report target is not a user." };
      }
      const suspendResult = await suspendUserAction(report.targetId, true);
      if (!suspendResult.success) return suspendResult;
    }

    await resolveReport(
      input.reportId,
      adminId,
      ReportStatus.RESOLVED,
      input.resolution
    );

    revalidateInbox();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Action failed.",
    };
  }
}

export async function inboxHideReviewAction(
  reviewId: string
): Promise<InboxActionResult> {
  const result = await setReviewModerationStatusAction(
    reviewId,
    ContentModerationStatus.HIDDEN
  );
  if (result.success) revalidateInbox();
  return result;
}

export async function inboxRestoreReviewAction(
  reviewId: string
): Promise<InboxActionResult> {
  const result = await setReviewModerationStatusAction(
    reviewId,
    ContentModerationStatus.OK
  );
  if (result.success) revalidateInbox();
  return result;
}

export async function inboxHideCommentAction(
  commentId: string
): Promise<InboxActionResult> {
  const result = await setCommentModerationStatusAction(
    commentId,
    ContentModerationStatus.HIDDEN
  );
  if (result.success) revalidateInbox();
  return result;
}

export async function inboxRestoreCommentAction(
  commentId: string
): Promise<InboxActionResult> {
  const result = await setCommentModerationStatusAction(
    commentId,
    ContentModerationStatus.OK
  );
  if (result.success) revalidateInbox();
  return result;
}

export async function inboxApproveLinkAction(
  linkId: string
): Promise<InboxActionResult> {
  const result = await approveReadingLinkAction(linkId);
  if (result.success) revalidateInbox();
  return result;
}

export async function inboxRejectLinkAction(
  linkId: string
): Promise<InboxActionResult> {
  const result = await rejectReadingLinkAction(linkId);
  if (result.success) revalidateInbox();
  return result;
}

export async function inboxDismissReportAction(
  reportId: string,
  resolution?: string
): Promise<InboxActionResult> {
  const result = await resolveReportAction(reportId, "DISMISSED", resolution);
  if (result.success) revalidateInbox();
  return result;
}
