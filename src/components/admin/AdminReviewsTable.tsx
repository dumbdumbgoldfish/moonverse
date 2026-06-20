"use client";

import Link from "next/link";
import { deleteReviewAction } from "@/actions/admin.actions";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import type { AdminReviewSummary } from "@/types/admin";

interface AdminReviewsTableProps {
  reviews: AdminReviewSummary[];
}

export function AdminReviewsTable({ reviews }: AdminReviewsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-border/60 bg-muted/30">
          <tr>
            <th className="px-4 py-3 font-medium" scope="col">Review</th>
            <th className="px-4 py-3 font-medium" scope="col">Novel</th>
            <th className="px-4 py-3 font-medium" scope="col">Author</th>
            <th className="px-4 py-3 font-medium" scope="col">Rating</th>
            <th className="px-4 py-3 font-medium" scope="col">Engagement</th>
            <th className="px-4 py-3 font-medium" scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id} className="border-b border-border/40 last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/reviews/${review.id}`}
                  className="font-medium hover:text-primary"
                >
                  {review.title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {formatDate(review.createdAt)}
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{review.novelTitle}</td>
              <td className="px-4 py-3">
                <Link
                  href={`/users/${review.reviewerUsername}`}
                  className="text-primary hover:underline"
                >
                  @{review.reviewerUsername}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Badge variant="secondary">{review.rating}/5</Badge>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {review.likeCount} likes · {review.commentCount} comments ·{" "}
                {review.saveCount} saves · {review.shareCount} shares
              </td>
              <td className="px-4 py-3">
                <AdminConfirmDialog
                  title="Delete review"
                  description={`Permanently delete "${review.title}"?`}
                  confirmLabel="Delete"
                  onConfirm={() => deleteReviewAction(review.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
