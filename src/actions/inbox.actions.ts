"use server";

import { ContentModerationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdminUserId } from "@/lib/admin-auth";
import { remediateAndResolveReport } from "@/services/report.service";
import {
  approveReadingLinkAction,
  rejectReadingLinkAction,
  setCommentModerationStatusAction,
  setReviewModerationStatusAction,
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
    await remediateAndResolveReport({
      reportId: input.reportId,
      adminId,
      remediation: input.remediation,
      resolution: input.resolution,
    });

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
