import {
  ContentModerationStatus,
  NotificationType,
  Prisma,
  ReportStatus,
  ReportTargetType,
  UserRole,
} from "@prisma/client";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/services/audit.service";
import { createNotification } from "@/services/notification.service";

export type ReportRemediation =
  | "resolve_only"
  | "hide_review"
  | "hide_comment"
  | "suspend_user";

export interface RemediateAndResolveReportInput {
  reportId: string;
  adminId: string;
  remediation: ReportRemediation;
  resolution?: string;
}

interface ReportResolutionNotification {
  reporterId: string;
  status: ReportStatus;
}

export interface ReportSummary {
  id: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  resolution: string | null;
  reporterUsername: string;
  resolvedByUsername: string | null;
  createdAt: string;
  updatedAt: string;
  /** Best-effort preview of the reported content, when resolvable. */
  targetPreview: string | null;
  targetLink: string | null;
}

export interface CreateReportInput {
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  reason: string;
  details?: string;
}

const MAX_REASON_LENGTH = 200;
const MAX_DETAILS_LENGTH = 1000;

export async function createReport(input: CreateReportInput): Promise<void> {
  const reason = input.reason.trim().slice(0, MAX_REASON_LENGTH);
  if (!reason) {
    throw new Error("Please select or describe a reason for this report.");
  }
  const details = input.details?.trim().slice(0, MAX_DETAILS_LENGTH) || null;

  if (input.targetType === ReportTargetType.REVIEW) {
    const review = await db.review.findUnique({
      where: { id: input.targetId },
      select: { id: true },
    });
    if (!review) throw new Error("Review not found.");
  } else if (input.targetType === ReportTargetType.COMMENT) {
    const comment = await db.comment.findUnique({
      where: { id: input.targetId },
      select: { id: true },
    });
    if (!comment) throw new Error("Comment not found.");
  } else if (input.targetType === ReportTargetType.USER) {
    const user = await db.user.findUnique({
      where: { id: input.targetId },
      select: { id: true },
    });
    if (!user) throw new Error("User not found.");
  } else if (input.targetType === ReportTargetType.NOVEL) {
    const novel = await db.novel.findUnique({
      where: { id: input.targetId },
      select: { id: true },
    });
    if (!novel) throw new Error("Novel not found.");
  }

  const existingOpen = await db.report.findFirst({
    where: {
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      status: ReportStatus.OPEN,
    },
    select: { id: true },
  });
  if (existingOpen) {
    throw new Error("You already reported this. Our team will review it soon.");
  }

  await db.report.create({
    data: {
      reporterId: input.reporterId,
      targetType: input.targetType,
      targetId: input.targetId,
      reason,
      details,
    },
  });
}

export interface ListReportsOptions {
  status?: ReportStatus | "ALL";
  targetType?: ReportTargetType | "ALL";
  skip?: number;
  take?: number;
}

export async function listReports(
  options: ListReportsOptions = {}
): Promise<ReportSummary[]> {
  const reports = await db.report.findMany({
    where: {
      ...(options.status && options.status !== "ALL"
        ? { status: options.status }
        : {}),
      ...(options.targetType && options.targetType !== "ALL"
        ? { targetType: options.targetType }
        : {}),
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    ...(options.skip !== undefined ? { skip: options.skip } : {}),
    ...(options.take !== undefined ? { take: options.take } : {}),
    include: {
      reporter: { select: { username: true } },
      resolvedBy: { select: { username: true } },
    },
  });

  const idsByType = {
    review: reports
      .filter((report) => report.targetType === ReportTargetType.REVIEW)
      .map((report) => report.targetId),
    comment: reports
      .filter((report) => report.targetType === ReportTargetType.COMMENT)
      .map((report) => report.targetId),
    user: reports
      .filter((report) => report.targetType === ReportTargetType.USER)
      .map((report) => report.targetId),
    novel: reports
      .filter((report) => report.targetType === ReportTargetType.NOVEL)
      .map((report) => report.targetId),
  };
  const [reviews, comments, users, novels] = await Promise.all([
    db.review.findMany({
      where: { id: { in: idsByType.review } },
      select: { id: true, title: true },
    }),
    db.comment.findMany({
      where: { id: { in: idsByType.comment } },
      select: { id: true, body: true, reviewId: true },
    }),
    db.user.findMany({
      where: { id: { in: idsByType.user } },
      select: { id: true, username: true },
    }),
    db.novel.findMany({
      where: { id: { in: idsByType.novel } },
      select: { id: true, title: true, author: true },
    }),
  ]);
  const reviewMap = new Map(reviews.map((review) => [review.id, review]));
  const commentMap = new Map(comments.map((comment) => [comment.id, comment]));
  const userMap = new Map(users.map((user) => [user.id, user]));
  const novelMap = new Map(novels.map((novel) => [novel.id, novel]));

  return reports.map((report) => {
    let targetPreview: string;
    let targetLink: string | null = null;
    if (report.targetType === ReportTargetType.REVIEW) {
      const review = reviewMap.get(report.targetId);
      targetPreview = review?.title ?? "(deleted review)";
      targetLink = review ? `/reviews/${report.targetId}` : null;
    } else if (report.targetType === ReportTargetType.COMMENT) {
      const comment = commentMap.get(report.targetId);
      targetPreview = comment?.body.slice(0, 120) ?? "(deleted comment)";
      targetLink = comment ? `/reviews/${comment.reviewId}#comments` : null;
    } else if (report.targetType === ReportTargetType.USER) {
      const user = userMap.get(report.targetId);
      targetPreview = user ? `@${user.username}` : "(deleted user)";
      targetLink = user ? `/users/${user.username}` : null;
    } else {
      const novel = novelMap.get(report.targetId);
      targetPreview = novel
        ? novel.author
          ? `${novel.title} by ${novel.author}`
          : novel.title
        : "(deleted novel)";
      targetLink = novel ? `/novels/${report.targetId}` : null;
    }

    return {
        id: report.id,
        targetType: report.targetType,
        targetId: report.targetId,
        reason: report.reason,
        details: report.details,
        status: report.status,
        resolution: report.resolution,
        reporterUsername: report.reporter.username,
        resolvedByUsername: report.resolvedBy?.username ?? null,
        createdAt: report.createdAt.toISOString(),
        updatedAt: report.updatedAt.toISOString(),
        targetPreview,
        targetLink,
      };
  });
}

export async function countOpenReports(): Promise<number> {
  return db.report.count({ where: { status: ReportStatus.OPEN } });
}

export function assertOpenReport(status: ReportStatus): void {
  if (status !== ReportStatus.OPEN) {
    throw new Error("Report is already closed.");
  }
}

async function hideReviewInTransaction(
  tx: Prisma.TransactionClient,
  reviewId: string
): Promise<void> {
  const review = await tx.review.findUnique({
    where: { id: reviewId },
    select: { id: true },
  });
  if (!review) throw new Error("Review not found.");

  await tx.review.update({
    where: { id: reviewId },
    data: { moderationStatus: ContentModerationStatus.HIDDEN },
  });
}

async function hideCommentInTransaction(
  tx: Prisma.TransactionClient,
  commentId: string
): Promise<void> {
  const comment = await tx.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });
  if (!comment) throw new Error("Comment not found.");

  await tx.comment.update({
    where: { id: commentId },
    data: { moderationStatus: ContentModerationStatus.HIDDEN },
  });
}

async function suspendUserInTransaction(
  tx: Prisma.TransactionClient,
  userId: string,
  adminId: string,
  suspended: boolean
): Promise<void> {
  if (userId === adminId && suspended) {
    throw new Error("You cannot suspend your own account.");
  }

  const user = await tx.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw new Error("User not found.");

  if (suspended && user.role === UserRole.ADMIN) {
    const adminCount = await tx.user.count({
      where: { role: UserRole.ADMIN, isSuspended: false },
    });
    if (adminCount <= 1) {
      throw new Error("Cannot suspend the last active admin.");
    }
  }

  await tx.user.update({
    where: { id: userId },
    data: { isSuspended: suspended },
  });
}

async function closeOpenReportInTransaction(
  tx: Prisma.TransactionClient,
  report: {
    id: string;
    reporterId: string;
    targetType: ReportTargetType;
    targetId: string;
  },
  adminId: string,
  status: ReportStatus,
  resolution?: string
): Promise<void> {
  const updated = await tx.report.updateMany({
    where: { id: report.id, status: ReportStatus.OPEN },
    data: {
      status,
      resolvedById: adminId,
      resolution: resolution?.trim().slice(0, MAX_DETAILS_LENGTH) || null,
    },
  });
  if (updated.count !== 1) {
    throw new Error("Report is already closed.");
  }

  await writeAuditLog(
    {
      actorId: adminId,
      action:
        status === ReportStatus.RESOLVED ? "REPORT_RESOLVE" : "REPORT_DISMISS",
      entityType: "Report",
      entityId: report.id,
      meta: { targetType: report.targetType, targetId: report.targetId },
    },
    tx
  );
}

async function notifyReporterOfReportResolution(
  reporterId: string,
  adminId: string,
  status: ReportStatus
): Promise<void> {
  if (reporterId === adminId) return;

  await createNotification({
    userId: reporterId,
    type: NotificationType.REPORT_UPDATE,
    message:
      status === ReportStatus.RESOLVED
        ? "A report you filed has been resolved. Thanks for helping keep MoonVerse safe."
        : "A report you filed was reviewed and dismissed.",
  });
}

/**
 * Applies remediation and closes the report in one transaction.
 * Audit logs for remediation and resolution are written inside the same tx.
 */
export async function remediateAndResolveReportInTransaction(
  tx: Prisma.TransactionClient,
  input: RemediateAndResolveReportInput
): Promise<ReportResolutionNotification> {
  const report = await tx.report.findUnique({ where: { id: input.reportId } });
  if (!report) throw new Error("Report not found.");
  assertOpenReport(report.status);

  if (input.remediation === "hide_review") {
    if (report.targetType !== ReportTargetType.REVIEW) {
      throw new Error("Report target is not a review.");
    }
    await hideReviewInTransaction(tx, report.targetId);
    await writeAuditLog(
      {
        actorId: input.adminId,
        action: "REVIEW_MODERATION_UPDATE",
        entityType: "Review",
        entityId: report.targetId,
        meta: { moderationStatus: ContentModerationStatus.HIDDEN },
      },
      tx
    );
  } else if (input.remediation === "hide_comment") {
    if (report.targetType !== ReportTargetType.COMMENT) {
      throw new Error("Report target is not a comment.");
    }
    await hideCommentInTransaction(tx, report.targetId);
    await writeAuditLog(
      {
        actorId: input.adminId,
        action: "COMMENT_MODERATION_UPDATE",
        entityType: "Comment",
        entityId: report.targetId,
        meta: { moderationStatus: ContentModerationStatus.HIDDEN },
      },
      tx
    );
  } else if (input.remediation === "suspend_user") {
    if (report.targetType !== ReportTargetType.USER) {
      throw new Error("Report target is not a user.");
    }
    await suspendUserInTransaction(tx, report.targetId, input.adminId, true);
    await writeAuditLog(
      {
        actorId: input.adminId,
        action: "USER_SUSPEND",
        entityType: "User",
        entityId: report.targetId,
      },
      tx
    );
  }

  await closeOpenReportInTransaction(
    tx,
    report,
    input.adminId,
    ReportStatus.RESOLVED,
    input.resolution
  );

  return { reporterId: report.reporterId, status: ReportStatus.RESOLVED };
}

export async function remediateAndResolveReport(
  input: RemediateAndResolveReportInput
): Promise<void> {
  const resolution = await db.$transaction(async (tx) =>
    remediateAndResolveReportInTransaction(tx, input)
  );
  await notifyReporterOfReportResolution(
    resolution.reporterId,
    input.adminId,
    resolution.status
  );
}

export async function resolveReport(
  reportId: string,
  adminId: string,
  status: ReportStatus,
  resolution?: string
): Promise<void> {
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Report not found.");
  assertOpenReport(report.status);

  const resolutionMeta = await db.$transaction(async (tx) => {
    await closeOpenReportInTransaction(
      tx,
      report,
      adminId,
      status,
      resolution
    );
    return { reporterId: report.reporterId, status };
  });

  await notifyReporterOfReportResolution(
    resolutionMeta.reporterId,
    adminId,
    resolutionMeta.status
  );
}
