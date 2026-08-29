"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { resolveReportAction } from "@/actions/report.actions";
import { resolveReportWithRemediationAction } from "@/actions/inbox.actions";
import {
  AdminTableCell,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
  AdminTableTh,
} from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate, formatRelativeTime } from "@/lib/date-utils";
import type { ReportSummary } from "@/services/report.service";
import { getReportRemediationOptions } from "@/services/admin/inbox.service";

interface AdminReportsTableProps {
  reports: ReportSummary[];
}

function statusVariant(status: ReportSummary["status"]) {
  if (status === "OPEN") return "default" as const;
  if (status === "RESOLVED") return "secondary" as const;
  return "outline" as const;
}

function ReportRow({ report }: { report: ReportSummary }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState<string | null>(null);

  const isOpen = report.status === "OPEN";
  const remediationOptions = getReportRemediationOptions(report.targetType);

  function handleResolve(status: "RESOLVED" | "DISMISSED") {
    setError(null);
    startTransition(async () => {
      const result = await resolveReportAction(report.id, status, resolution);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <AdminTableRow>
      <AdminTableCell>
        <Badge variant="outline">{report.targetType}</Badge>
        <p className="mt-1.5 max-w-xs text-sm">
          {report.targetLink ? (
            <Link
              href={report.targetLink}
              className="font-medium text-[#fcd34d] hover:underline"
            >
              {report.targetPreview}
            </Link>
          ) : (
            <span className="text-white">
              {report.targetPreview ?? "(unavailable)"}
            </span>
          )}
        </p>
      </AdminTableCell>
      <AdminTableCell className="max-w-xs">
        <p className="font-semibold text-white">{report.reason}</p>
        {report.details ? (
          <p className="mt-1 text-xs leading-relaxed text-white">
            {report.details}
          </p>
        ) : null}
      </AdminTableCell>
      <AdminTableCell>
        <Link
          href={`/users/${report.reporterUsername}`}
          className="font-medium text-[#fcd34d] hover:underline"
        >
          @{report.reporterUsername}
        </Link>
        <p className="mt-1 text-xs text-white">
          {formatRelativeTime(report.createdAt)} · {formatDate(report.createdAt)}
        </p>
      </AdminTableCell>
      <AdminTableCell>
        <Badge variant={statusVariant(report.status)}>{report.status}</Badge>
        {report.resolvedByUsername ? (
          <p className="mt-1 text-xs text-white">
            by @{report.resolvedByUsername}
          </p>
        ) : null}
        {report.resolution ? (
          <p className="mt-1 text-xs text-white">{report.resolution}</p>
        ) : null}
      </AdminTableCell>
      <AdminTableCell>
        {isOpen ? (
          <div className="flex flex-col gap-2">
            {error ? (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Input
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Resolution note (optional)"
              disabled={isPending}
              className="h-8 rounded-lg border-[#14111f]/10 text-xs"
            />
            <div className="flex flex-wrap gap-2">
              {remediationOptions.map((option) => (
                <Button
                  key={option.id}
                  size="xs"
                  className="rounded-lg"
                  disabled={isPending}
                  onClick={() => {
                    setError(null);
                    startTransition(async () => {
                      const result =
                        option.id === "resolve_only"
                          ? await resolveReportAction(
                              report.id,
                              "RESOLVED",
                              resolution
                            )
                          : await resolveReportWithRemediationAction({
                              reportId: report.id,
                              remediation: option.id as
                                | "hide_review"
                                | "hide_comment"
                                | "suspend_user",
                              resolution,
                            });
                      if (!result.success) {
                        setError(result.error);
                        return;
                      }
                      router.refresh();
                    });
                  }}
                >
                  {option.label}
                </Button>
              ))}
              <Button
                size="xs"
                variant="outline"
                className="rounded-lg"
                onClick={() => handleResolve("DISMISSED")}
                disabled={isPending}
              >
                Dismiss
              </Button>
            </div>
          </div>
        ) : (
          <span className="text-xs text-white">No action needed</span>
        )}
      </AdminTableCell>
    </AdminTableRow>
  );
}

export function AdminReportsTable({ reports }: AdminReportsTableProps) {
  return (
    <AdminTableShell minWidth="960px">
      <AdminTableHead>
        <tr>
          <AdminTableTh>Target</AdminTableTh>
          <AdminTableTh>Reason</AdminTableTh>
          <AdminTableTh>Reporter</AdminTableTh>
          <AdminTableTh>Status</AdminTableTh>
          <AdminTableTh>Actions</AdminTableTh>
        </tr>
      </AdminTableHead>
      <tbody>
        {reports.map((report) => (
          <ReportRow key={report.id} report={report} />
        ))}
      </tbody>
    </AdminTableShell>
  );
}
