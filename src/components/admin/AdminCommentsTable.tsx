"use client";

import Link from "next/link";
import { deleteCommentAction } from "@/actions/admin.actions";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/date-utils";
import type { AdminCommentSummary } from "@/types/admin";

interface AdminCommentsTableProps {
  comments: AdminCommentSummary[];
}

export function AdminCommentsTable({ comments }: AdminCommentsTableProps) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead className="border-b border-border/60 bg-muted/30">
          <tr>
            <th className="px-4 py-3 font-medium" scope="col">Comment</th>
            <th className="px-4 py-3 font-medium" scope="col">Review</th>
            <th className="px-4 py-3 font-medium" scope="col">Author</th>
            <th className="px-4 py-3 font-medium" scope="col">Type</th>
            <th className="px-4 py-3 font-medium" scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {comments.map((comment) => (
            <tr key={comment.id} className="border-b border-border/40 last:border-0">
              <td className="max-w-xs px-4 py-3">
                <p className="line-clamp-3">{comment.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </p>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/reviews/${comment.reviewId}`}
                  className="text-primary hover:underline"
                >
                  {comment.reviewTitle}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Link
                  href={`/users/${comment.authorUsername}`}
                  className="hover:text-primary"
                >
                  {comment.authorDisplayName}
                </Link>
              </td>
              <td className="px-4 py-3">
                <Badge variant="outline">
                  {comment.parentCommentId ? "Reply" : "Comment"}
                </Badge>
              </td>
              <td className="px-4 py-3">
                <AdminConfirmDialog
                  title="Delete comment"
                  description="Permanently delete this comment?"
                  confirmLabel="Delete"
                  onConfirm={() => deleteCommentAction(comment.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
