"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
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
import { readingLinkHealthBadgeVariant } from "@/lib/admin/reading-link-presentation";
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
  pendingLinkId: string | null;
  onCheckHealth: (linkId: string) => void;
  onApprove: (linkId: string) => void;
  onReject: (linkId: string) => Promise<{ success: boolean; error?: string }>;
}

function ReadingLinkRowActions({
  link,
  pendingLinkId,
  onCheckHealth,
  onApprove,
  onReject,
}: ReadingLinkRowActionsProps) {
  const isPending = pendingLinkId === link.id;

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        className="rounded-lg"
        onClick={() => onCheckHealth(link.id)}
      >
        {isPending ? "…" : "Check health"}
      </Button>
      {link.moderationStatus !== "APPROVED" ? (
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          className="rounded-lg"
          onClick={() => onApprove(link.id)}
        >
          {isPending ? "…" : "Approve"}
        </Button>
      ) : null}
      {link.moderationStatus !== "REJECTED" ? (
        <AdminConfirmDialog
          title="Reject reading link"
          description="Hide this source from the public novel list?"
          confirmLabel="Reject"
          onConfirm={() => onReject(link.id)}
        />
      ) : null}
    </div>
  );
}

export function AdminReadingLinksTable({ links }: AdminReadingLinksTableProps) {
  const router = useRouter();
  const [patchedById, setPatchedById] = useState<
    Record<string, Partial<AdminReadingLinkRow>>
  >({});
  const [pendingLinkId, setPendingLinkId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const rows = links.map((link) => ({
    ...link,
    ...patchedById[link.id],
  }));

  function applyRowPatch(linkId: string, patch: Partial<AdminReadingLinkRow>) {
    setPatchedById((current) => ({
      ...current,
      [linkId]: { ...current[linkId], ...patch },
    }));
  }

  function runForLink(
    linkId: string,
    action: () => Promise<{ success: boolean; error?: string }>,
    patch?: Partial<AdminReadingLinkRow>
  ) {
    setPendingLinkId(linkId);
    startTransition(async () => {
      const result = await action();
      setPendingLinkId(null);
      if (!result.success) return;
      if (patch) {
        applyRowPatch(linkId, patch);
      }
      router.refresh();
    });
  }

  function handleCheckHealth(linkId: string) {
    setPendingLinkId(linkId);
    startTransition(async () => {
      const result = await checkReadingLinkHealthAction(linkId);
      setPendingLinkId(null);
      if (!result.success) return;
      applyRowPatch(result.linkId, {
        healthStatus: result.healthStatus,
        lastCheckedAt: result.lastCheckedAt,
      });
      router.refresh();
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
              <Badge variant={readingLinkHealthBadgeVariant(link.healthStatus)}>
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
                pendingLinkId={pendingLinkId}
                onCheckHealth={handleCheckHealth}
                onApprove={(linkId) =>
                  runForLink(
                    linkId,
                    () => approveReadingLinkAction(linkId),
                    { moderationStatus: "APPROVED" }
                  )
                }
                onReject={async (linkId) => {
                  const result = await rejectReadingLinkAction(
                    linkId,
                    "Rejected by moderator"
                  );
                  if (result.success) {
                    applyRowPatch(linkId, { moderationStatus: "REJECTED" });
                    router.refresh();
                  }
                  return result;
                }}
              />
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </tbody>
    </AdminTableShell>
  );
}
