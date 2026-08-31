import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ReportStatus } from "@prisma/client";
import {
  assertOpenReport,
  listReports,
} from "@/services/report.service";

describe("assertOpenReport", () => {
  it("prevents a closed report from being resolved or dismissed again", () => {
    assert.doesNotThrow(() => assertOpenReport(ReportStatus.OPEN));
    assert.throws(
      () => assertOpenReport(ReportStatus.RESOLVED),
      /already closed/
    );
    assert.throws(
      () => assertOpenReport(ReportStatus.DISMISSED),
      /already closed/
    );
  });
});

describe("listReports", () => {
  it("resolves a full moderation queue without exhausting database connections", async () => {
    const reports = await listReports({ status: ReportStatus.OPEN });

    assert.ok(reports.length > 50);
    assert.ok(
      reports.every((report) => report.targetPreview !== null),
      "every report should resolve to a live or deleted-target preview"
    );
  });
});
