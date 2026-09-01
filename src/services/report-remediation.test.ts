import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ContentModerationStatus,
  Prisma,
  ReportStatus,
  ReportTargetType,
  UserRole,
} from "@prisma/client";
import { remediateAndResolveReportInTransaction } from "@/services/report.service";

type MockReport = {
  id: string;
  reporterId: string;
  targetType: ReportTargetType;
  targetId: string;
  status: ReportStatus;
};

function createMockTransactionClient(options: {
  report: MockReport;
  reviewExists?: boolean;
  commentExists?: boolean;
  userRole?: UserRole;
  failOn?: "review" | "comment" | "user" | "report";
}) {
  const state = {
    reviewModeration: ContentModerationStatus.OK as ContentModerationStatus,
    commentModeration: ContentModerationStatus.OK as ContentModerationStatus,
    userSuspended: false,
    reportStatus: ReportStatus.OPEN as ReportStatus,
    reportResolvedById: null as string | null,
    auditLogCount: 0,
  };

  const tx = {
    report: {
      findUnique: async () => options.report,
      updateMany: async (args: {
        where: { id: string; status: ReportStatus };
        data: {
          status: ReportStatus;
          resolvedById: string;
          resolution: string | null;
        };
      }) => {
        if (options.failOn === "report") {
          throw new Error("SIMULATED_REPORT_FAILURE");
        }
        if (
          args.where.id !== options.report.id ||
          args.where.status !== ReportStatus.OPEN
        ) {
          return { count: 0 };
        }
        state.reportStatus = args.data.status;
        state.reportResolvedById = args.data.resolvedById;
        return { count: 1 };
      },
    },
    review: {
      findUnique: async () =>
        options.reviewExists ? { id: options.report.targetId } : null,
      update: async (args: {
        where: { id: string };
        data: { moderationStatus: ContentModerationStatus };
      }) => {
        if (options.failOn === "review") {
          throw new Error("SIMULATED_REVIEW_FAILURE");
        }
        state.reviewModeration = args.data.moderationStatus;
      },
    },
    comment: {
      findUnique: async () =>
        options.commentExists ? { id: options.report.targetId } : null,
      update: async (args: {
        where: { id: string };
        data: { moderationStatus: ContentModerationStatus };
      }) => {
        if (options.failOn === "comment") {
          throw new Error("SIMULATED_COMMENT_FAILURE");
        }
        state.commentModeration = args.data.moderationStatus;
      },
    },
    user: {
      findUnique: async () => ({
        role: options.userRole ?? UserRole.USER,
      }),
      count: async () => 2,
      update: async (args: {
        where: { id: string };
        data: { isSuspended: boolean };
      }) => {
        if (options.failOn === "user") {
          throw new Error("SIMULATED_USER_FAILURE");
        }
        state.userSuspended = args.data.isSuspended;
      },
    },
    moderationAuditLog: {
      create: async () => {
        state.auditLogCount += 1;
      },
    },
  };

  return {
    tx: tx as unknown as Prisma.TransactionClient,
    state,
  };
}

async function runMockRemediation(
  tx: Prisma.TransactionClient,
  rollbackToSnapshot: () => void,
  input: Parameters<typeof remediateAndResolveReportInTransaction>[1]
): Promise<ReturnType<typeof remediateAndResolveReportInTransaction>> {
  try {
    return await remediateAndResolveReportInTransaction(tx, input);
  } catch (error) {
    rollbackToSnapshot();
    throw error;
  }
}

describe("remediateAndResolveReportInTransaction", () => {
  const adminId = "admin-1";
  const reporterId = "reporter-1";

  it("updates both review target and report on hide_review success", async () => {
    const report: MockReport = {
      id: "report-1",
      reporterId,
      targetType: ReportTargetType.REVIEW,
      targetId: "review-1",
      status: ReportStatus.OPEN,
    };
    const { tx, state } = createMockTransactionClient({
      report,
      reviewExists: true,
    });

    const result = await remediateAndResolveReportInTransaction(tx, {
      reportId: report.id,
      adminId,
      remediation: "hide_review",
      resolution: "Hidden after report",
    });

    assert.equal(result.reporterId, reporterId);
    assert.equal(result.status, ReportStatus.RESOLVED);
    assert.equal(state.reviewModeration, ContentModerationStatus.HIDDEN);
    assert.equal(state.reportStatus, ReportStatus.RESOLVED);
    assert.equal(state.reportResolvedById, adminId);
    assert.equal(state.auditLogCount, 2);
  });

  it("rolls back review mutation when report resolution fails", async () => {
    const report: MockReport = {
      id: "report-2",
      reporterId,
      targetType: ReportTargetType.REVIEW,
      targetId: "review-2",
      status: ReportStatus.OPEN,
    };
    const { tx, state } = createMockTransactionClient({
      report,
      reviewExists: true,
      failOn: "report",
    });

    await assert.rejects(
      () =>
        runMockRemediation(tx, () => {
          state.reviewModeration = ContentModerationStatus.OK;
          state.reportStatus = ReportStatus.OPEN;
          state.reportResolvedById = null;
          state.auditLogCount = 0;
        }, {
          reportId: report.id,
          adminId,
          remediation: "hide_review",
        }),
      /SIMULATED_REPORT_FAILURE/
    );

    assert.equal(state.reviewModeration, ContentModerationStatus.OK);
    assert.equal(state.reportStatus, ReportStatus.OPEN);
    assert.equal(state.auditLogCount, 0);
  });

  it("leaves report OPEN when target mutation fails", async () => {
    const report: MockReport = {
      id: "report-3",
      reporterId,
      targetType: ReportTargetType.COMMENT,
      targetId: "comment-1",
      status: ReportStatus.OPEN,
    };
    const { tx, state } = createMockTransactionClient({
      report,
      commentExists: true,
      failOn: "comment",
    });

    await assert.rejects(
      () =>
        remediateAndResolveReportInTransaction(tx, {
          reportId: report.id,
          adminId,
          remediation: "hide_comment",
        }),
      /SIMULATED_COMMENT_FAILURE/
    );

    assert.equal(state.commentModeration, ContentModerationStatus.OK);
    assert.equal(state.reportStatus, ReportStatus.OPEN);
    assert.equal(state.auditLogCount, 0);
  });

  it("suspends user and resolves report atomically", async () => {
    const report: MockReport = {
      id: "report-4",
      reporterId,
      targetType: ReportTargetType.USER,
      targetId: "user-1",
      status: ReportStatus.OPEN,
    };
    const { tx, state } = createMockTransactionClient({
      report,
      userRole: UserRole.USER,
    });

    await remediateAndResolveReportInTransaction(tx, {
      reportId: report.id,
      adminId,
      remediation: "suspend_user",
    });

    assert.equal(state.userSuspended, true);
    assert.equal(state.reportStatus, ReportStatus.RESOLVED);
    assert.equal(state.auditLogCount, 2);
  });
});

describe("remediation authorization guards", () => {
  const adminId = "admin-self";

  it("rejects self-suspension during suspend_user remediation", async () => {
    const report: MockReport = {
      id: "report-self",
      reporterId: "reporter-2",
      targetType: ReportTargetType.USER,
      targetId: adminId,
      status: ReportStatus.OPEN,
    };
    const { tx, state } = createMockTransactionClient({
      report,
      userRole: UserRole.ADMIN,
    });

    await assert.rejects(
      () =>
        remediateAndResolveReportInTransaction(tx, {
          reportId: report.id,
          adminId,
          remediation: "suspend_user",
        }),
      /cannot suspend your own account/i
    );

    assert.equal(state.userSuspended, false);
    assert.equal(state.reportStatus, ReportStatus.OPEN);
    assert.equal(state.auditLogCount, 0);
  });
});
