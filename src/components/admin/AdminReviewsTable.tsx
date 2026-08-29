"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  deleteReviewAction,
  setReviewModerationStatusAction,
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
import { formatDate } from "@/lib/date-utils";
import type { AdminReviewSummary } from "@/types/admin";

interface AdminReviewsTableProps {
  reviews: AdminReviewSummary[];
}

function ModerationButton({
  reviewId,
  label,
  status,
}: {
  reviewId: string;
  label: string;
  status: "OK" | "HIDDEN";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="xs"
      variant="outline"
      disabled={pending}
      className="rounded-lg"
      onClick={() =>
        startTransition(async () => {
          await setReviewModerationStatusAction(reviewId, status);
          router.refresh();
        })
      }
    >
      {pending ? "…" : label}
    </Button>
  );
}

export function AdminReviewsTable({ reviews }: AdminReviewsTableProps) {
  return (
    <AdminTableShell minWidth="880px">
      <AdminTableHead>
        <tr>
          <AdminTableTh>Review</AdminTableTh>
          <AdminTableTh>Novel</AdminTableTh>
          <AdminTableTh>Author</AdminTableTh>
          <AdminTableTh>Rating</AdminTableTh>
          <AdminTableTh>Engagement</AdminTableTh>
          <AdminTableTh>Actions</AdminTableTh>
        </tr>
      </AdminTableHead>
      <tbody>
        {reviews.map((review) => (
          <AdminTableRow key={review.id}>
            <AdminTableCell>
              <Link
                href={`/reviews/${review.id}`}
                className="font-semibold text-[#fcd34d] hover:underline"
              >
                {review.title}
              </Link>
              <p className="mt-0.5 text-xs text-white">
                {formatDate(review.createdAt)}
              </p>
            </AdminTableCell>
            <AdminTableCell className="text-white">
              {review.novelTitle}
            </AdminTableCell>
            <AdminTableCell>
              <Link
                href={`/users/${review.reviewerUsername}`}
                className="font-medium text-[#fcd34d] hover:underline"
              >
                @{review.reviewerUsername}
              </Link>
            </AdminTableCell>
            <AdminTableCell>
              <Badge variant="secondary">{review.rating}/5</Badge>
              {review.moderationStatus !== "OK" && (
                <Badge variant="destructive" className="ml-1.5">
                  {review.moderationStatus.replace(/_/g, " ")}
                </Badge>
              )}
            </AdminTableCell>
            <AdminTableCell className="text-xs text-white">
              {review.likeCount} likes · {review.commentCount} comments ·{" "}
              {review.saveCount} saves · {review.shareCount} shares
            </AdminTableCell>
            <AdminTableCell>
              <div className="flex flex-wrap gap-2">
                {review.moderationStatus === "HIDDEN" ? (
                  <ModerationButton
                    reviewId={review.id}
                    label="Restore"
                    status="OK"
                  />
                ) : (
                  <ModerationButton
                    reviewId={review.id}
                    label="Hide"
                    status="HIDDEN"
                  />
                )}
                <AdminConfirmDialog
                  title="Delete review"
                  description={`Permanently delete "${review.title}"?`}
                  confirmLabel="Delete"
                  onConfirm={() => deleteReviewAction(review.id)}
                />
              </div>
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </tbody>
    </AdminTableShell>
  );
}
