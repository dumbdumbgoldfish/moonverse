"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import {
  approveReadingLinkAction,
  checkReadingLinkHealthAction,
  rejectReadingLinkAction,
} from "@/actions/admin.actions";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import {
  AdminTableCell,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
  AdminTableTh,
} from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { runAdminTableAction } from "@/lib/admin/admin-table-action-runner";
import {
  serialAdminFollowUp,
  serialAdminServerAction,
} from "@/lib/admin/serial-admin-server-action";
import {
  applyReadingLinkHealthCheckOutcome,
  applyReadingLinkRowOutcome,
  beginReadingLinkHealthCheck,
  beginReadingLinkRowAction,
  canBeginReadingLinkRowAction,
  clearReadingLinkRowPendingIfMatch,
  isReadingLinkRowBusy,
  mergeReadingLinkRowPatches,
  readingLinkHealthBadgeVariant,
  readingLinkHealthBadgeClassName,
  type ReadingLinkHealthCheckUiState,
  type ReadingLinkRowPatch,
  type ReadingLinkRowPendingOperation,
} from "@/lib/admin/reading-link-presentation";
import { formatDate } from "@/lib/date-utils";
import { getPlatformLabel } from "@/lib/reading-platforms";

export interface AdminReadingLinkRow {
  id: string;
  url: string;
  platform: string;
  category: string;
  moderationStatus: string;
  healthStatus: string;
  lastCheckedAt: string | null;
  createdAt: string;
  novel: { id: string; title: string; author: string | null };
  submittedByUser: {
    id: string;
    username: string;
    displayName: string;
  } | null;
  submittedViaReview: { id: string; title: string } | null;
}

interface AdminReadingLinksTableProps {
  links: AdminReadingLinkRow[];
}

const statusVariant: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  PENDING: "outline",
  NEEDS_REVIEW: "secondary",
  APPROVED: "default",
  REJECTED: "destructive",
};

interface ReadingLinkRowActionsProps {
  link: AdminReadingLinkRow;
  isRowBusy: boolean;
  pendingOperation: ReadingLinkRowPendingOperation | null;
  healthCheckError: string | null;
  onCheckHealth: (linkId: string) => void;
  onApprove: (linkId: string) => void;
  onReject: (linkId: string) => Promise<{ success: boolean; error?: string }>;
}

function ReadingLinkRowActions({
  link,
  isRowBusy,
  pendingOperation,
  healthCheckError,
  onCheckHealth,
  onApprove,
  onReject,
}: ReadingLinkRowActionsProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="ghost"
          disabled={isRowBusy}
          className="rounded-lg"
          onClick={() => onCheckHealth(link.id)}
        >
          {isRowBusy && pendingOperation === "health_check" ? "…" : "Check health"}
        </Button>
        {link.moderationStatus !== "APPROVED" ? (
          <Button
            size="sm"
            variant="outline"
            disabled={isRowBusy}
            className="rounded-lg"
            onClick={() => onApprove(link.id)}
          >
            {isRowBusy && pendingOperation === "approve" ? "…" : "Approve"}
          </Button>
        ) : null}
        {link.moderationStatus !== "REJECTED" ? (
          <AdminConfirmDialog
            title="Reject reading link"
            description="Hide this source from the public novel list?"
            confirmLabel="Reject"
            disabled={isRowBusy}
            onConfirm={() => onReject(link.id)}
          />
        ) : null}
      </div>
      {healthCheckError ? (
        <p className="text-xs text-destructive" role="alert">
          {healthCheckError}
        </p>
      ) : null}
    </div>
  );
}

const INITIAL_ROW_STATE: ReadingLinkHealthCheckUiState = {
  pendingLinkId: null,
  pendingOperation: null,
  errorsByLinkId: {},
  patchedById: {},
};

export function AdminReadingLinksTable({ links }: AdminReadingLinksTableProps) {
  const router = useRouter();
  const [rowState, setRowState] =
    useState<ReadingLinkHealthCheckUiState>(INITIAL_ROW_STATE);

  const rows = mergeReadingLinkRowPatches(links, rowState.patchedById);

  function beginRowAction(
    linkId: string,
    operation: ReadingLinkRowPendingOperation
  ): boolean {
    let started = false;
    flushSync(() => {
      setRowState((current) => {
        if (!canBeginReadingLinkRowAction(current, linkId)) {
          return current;
        }
        started = true;
        return operation === "health_check"
          ? beginReadingLinkHealthCheck(current, linkId)
          : beginReadingLinkRowAction(current, linkId, operation);
      });
    });
    return started;
  }

  function clearRowPending(
    linkId: string,
    operation: ReadingLinkRowPendingOperation
  ) {
    flushSync(() => {
      setRowState((current) =>
        clearReadingLinkRowPendingIfMatch(current, linkId, operation)
      );
    });
  }

  function scheduleDeferredRefresh() {
    void serialAdminFollowUp(() =>
      startTransition(() => router.refresh())
    );
  }

  function handleCheckHealth(linkId: string) {
    if (!beginRowAction(linkId, "health_check")) {
      return;
    }

    void runAdminTableAction({
      run: () =>
        serialAdminServerAction(() => checkReadingLinkHealthAction(linkId)),
      applyOutcome: (outcome) => {
        setRowState((current) =>
          applyReadingLinkHealthCheckOutcome(current, linkId, outcome)
        );
      },
      clearPending: () => clearRowPending(linkId, "health_check"),
    }).then((result) => {
      if (result.success) {
        scheduleDeferredRefresh();
      }
    });
  }

  function runModerationAction(
    linkId: string,
    operation: Exclude<ReadingLinkRowPendingOperation, "health_check">,
    action: () => Promise<{ success: boolean; error?: string }>,
    patch?: ReadingLinkRowPatch
  ): Promise<{ success: boolean; error?: string }> {
    if (!beginRowAction(linkId, operation)) {
      return Promise.resolve({
        success: false,
        error: "Another action is already running for this link.",
      });
    }

    return runAdminTableAction({
      run: () => serialAdminServerAction(action),
      applyOutcome: (result) => {
        setRowState((current) =>
          applyReadingLinkRowOutcome(current, linkId, result, patch)
        );
      },
      clearPending: () => clearRowPending(linkId, operation),
    }).then((result) => {
      if (result.success) {
        scheduleDeferredRefresh();
      }
      return result;
    });
  }

  return (
    <AdminTableShell minWidth="980px">
      <AdminTableHead>
        <tr>
          <AdminTableTh>Novel / source</AdminTableTh>
          <AdminTableTh>Submitted by</AdminTableTh>
          <AdminTableTh>Status</AdminTableTh>
          <AdminTableTh>Health</AdminTableTh>
          <AdminTableTh>Actions</AdminTableTh>
        </tr>
      </AdminTableHead>
      <tbody>
        {rows.map((link) => (
          <AdminTableRow key={link.id}>
            <AdminTableCell>
              <Link
                href={`/novels/${link.novel.id}`}
                className="font-semibold text-[#6e46c7] hover:underline"
              >
                {link.novel.title}
              </Link>
              <p className="mt-1 text-xs text-white/70">
                {getPlatformLabel(link.platform)} · {link.category}
              </p>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block break-all text-xs text-[#6e46c7]/80 hover:underline"
              >
                {link.url}
              </a>
              <p className="mt-1 text-[11px] text-white/70">
                {formatDate(link.createdAt)}
              </p>
            </AdminTableCell>
            <AdminTableCell>
              {link.submittedByUser ? (
                <Link
                  href={`/users/${link.submittedByUser.username}`}
                  className="font-medium text-[#6e46c7] hover:underline"
                >
                  @{link.submittedByUser.username}
                </Link>
              ) : (
                <span className="text-white/70">Catalog / unknown</span>
              )}
              {link.submittedViaReview ? (
                <p className="mt-1 text-xs text-white/70">
                  via{" "}
                  <Link
                    href={`/reviews/${link.submittedViaReview.id}`}
                    className="text-[#6e46c7] hover:underline"
                  >
                    {link.submittedViaReview.title}
                  </Link>
                </p>
              ) : null}
            </AdminTableCell>
            <AdminTableCell>
              <Badge variant={statusVariant[link.moderationStatus] ?? "outline"}>
                {link.moderationStatus.replace("_", " ")}
              </Badge>
            </AdminTableCell>
            <AdminTableCell>
              <Badge
                variant={readingLinkHealthBadgeVariant(link.healthStatus)}
                className={readingLinkHealthBadgeClassName(link.healthStatus)}
              >
                {link.healthStatus.replace(/_/g, " ")}
              </Badge>
              {link.lastCheckedAt ? (
                <p className="mt-1 text-[11px] text-white/70">
                  Checked {formatDate(link.lastCheckedAt)}
                </p>
              ) : null}
            </AdminTableCell>
            <AdminTableCell>
              <ReadingLinkRowActions
                key={link.id}
                link={link}
                isRowBusy={isReadingLinkRowBusy(rowState, link.id)}
                pendingOperation={
                  rowState.pendingLinkId === link.id
                    ? rowState.pendingOperation
                    : null
                }
                healthCheckError={rowState.errorsByLinkId[link.id] ?? null}
                onCheckHealth={handleCheckHealth}
                onApprove={(linkId) =>
                  runModerationAction(
                    linkId,
                    "approve",
                    () => approveReadingLinkAction(linkId),
                    { moderationStatus: "APPROVED" }
                  )
                }
                onReject={(linkId) =>
                  runModerationAction(
                    linkId,
                    "reject",
                    () =>
                      rejectReadingLinkAction(linkId, "Rejected by moderator"),
                    { moderationStatus: "REJECTED" }
                  )
                }
              />
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </tbody>
    </AdminTableShell>
  );
}
