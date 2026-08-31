"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
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

function ApproveButton({ linkId }: { linkId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="outline"
      disabled={pending}
      className="rounded-lg"
      onClick={() =>
        startTransition(async () => {
          await approveReadingLinkAction(linkId);
          router.refresh();
        })
      }
    >
      {pending ? "…" : "Approve"}
    </Button>
  );
}

function HealthCheckButton({ linkId }: { linkId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button
      size="sm"
      variant="ghost"
      disabled={pending}
      className="rounded-lg"
      onClick={() =>
        startTransition(async () => {
          await checkReadingLinkHealthAction(linkId);
          router.refresh();
        })
      }
    >
      {pending ? "…" : "Check health"}
    </Button>
  );
}

export function AdminReadingLinksTable({ links }: AdminReadingLinksTableProps) {
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
        {links.map((link) => (
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
              <div className="flex flex-wrap gap-2">
                <HealthCheckButton linkId={link.id} />
                {link.moderationStatus !== "APPROVED" ? (
                  <ApproveButton linkId={link.id} />
                ) : null}
                {link.moderationStatus !== "REJECTED" ? (
                  <AdminConfirmDialog
                    title="Reject reading link"
                    description="Hide this source from the public novel list?"
                    confirmLabel="Reject"
                    onConfirm={() =>
                      rejectReadingLinkAction(link.id, "Rejected by moderator")
                    }
                  />
                ) : null}
              </div>
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </tbody>
    </AdminTableShell>
  );
}
