import { NotificationType, ReportStatus, ReportTargetType } from "@prisma/client";
import { db } from "@/lib/db";
import { writeAuditLog } from "@/services/audit.service";
import { createNotification } from "@/services/notification.service";

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

async function resolveTargetPreview(
  targetType: ReportTargetType,
  targetId: string
): Promise<{ preview: string | null; link: string | null }> {
  try {
    if (targetType === ReportTargetType.REVIEW) {
      const review = await db.review.findUnique({
        where: { id: targetId },
        select: { title: true },
      });
      return {
        preview: review?.title ?? "(deleted review)",
        link: review ? `/reviews/${targetId}` : null,
      };
    }
    if (targetType === ReportTargetType.COMMENT) {
      const comment = await db.comment.findUnique({
        where: { id: targetId },
        select: { body: true, reviewId: true },
      });
      return {
        preview: comment?.body.slice(0, 120) ?? "(deleted comment)",
        link: comment ? `/reviews/${comment.reviewId}#comments` : null,
      };
    }
    if (targetType === ReportTargetType.USER) {
      const user = await db.user.findUnique({
        where: { id: targetId },
        select: { username: true },
      });
      return {
        preview: user ? `@${user.username}` : "(deleted user)",
        link: user ? `/users/${user.username}` : null,
      };
    }
    if (targetType === ReportTargetType.NOVEL) {
      const novel = await db.novel.findUnique({
        where: { id: targetId },
        select: { title: true, author: true },
      });
      return {
        preview: novel
          ? novel.author
            ? `${novel.title} by ${novel.author}`
            : novel.title
          : "(deleted novel)",
        link: novel ? `/novels/${targetId}` : null,
      };
    }
  } catch {
    // fallthrough
  }
  return { preview: null, link: null };
}

export interface ListReportsOptions {
  status?: ReportStatus | "ALL";
  targetType?: ReportTargetType | "ALL";
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
    include: {
      reporter: { select: { username: true } },
      resolvedBy: { select: { username: true } },
    },
  });

  return Promise.all(
    reports.map(async (report) => {
      const { preview, link } = await resolveTargetPreview(
        report.targetType,
        report.targetId
      );
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
        targetPreview: preview,
        targetLink: link,
      };
    })
  );
}

export async function countOpenReports(): Promise<number> {
  return db.report.count({ where: { status: ReportStatus.OPEN } });
}

export async function resolveReport(
  reportId: string,
  adminId: string,
  status: ReportStatus,
  resolution?: string
): Promise<void> {
  const report = await db.report.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Report not found.");

  await db.report.update({
    where: { id: reportId },
    data: {
      status,
      resolvedById: adminId,
      resolution: resolution?.trim().slice(0, MAX_DETAILS_LENGTH) || null,
    },
  });

  await writeAuditLog({
    actorId: adminId,
    action: status === ReportStatus.RESOLVED ? "REPORT_RESOLVE" : "REPORT_DISMISS",
    entityType: "Report",
    entityId: reportId,
    meta: { targetType: report.targetType, targetId: report.targetId },
  });

  if (report.reporterId !== adminId) {
    await createNotification({
      userId: report.reporterId,
      type: NotificationType.REPORT_UPDATE,
      message:
        status === ReportStatus.RESOLVED
          ? "A report you filed has been resolved. Thanks for helping keep MoonVerse safe."
          : "A report you filed was reviewed and dismissed.",
    });
  }
}
