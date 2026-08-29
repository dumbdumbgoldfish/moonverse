"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  deleteCommentAction,
  setCommentModerationStatusAction,
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
import type { AdminCommentSummary } from "@/types/admin";

interface AdminCommentsTableProps {
  comments: AdminCommentSummary[];
}

function ModerationButton({
  commentId,
  label,
  status,
}: {
  commentId: string;
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
          await setCommentModerationStatusAction(commentId, status);
          router.refresh();
        })
      }
    >
      {pending ? "…" : label}
    </Button>
  );
}

export function AdminCommentsTable({ comments }: AdminCommentsTableProps) {
  return (
    <AdminTableShell minWidth="800px">
      <AdminTableHead>
        <tr>
          <AdminTableTh>Comment</AdminTableTh>
          <AdminTableTh>Review</AdminTableTh>
          <AdminTableTh>Author</AdminTableTh>
          <AdminTableTh>Type</AdminTableTh>
          <AdminTableTh>Actions</AdminTableTh>
        </tr>
      </AdminTableHead>
      <tbody>
        {comments.map((comment) => (
          <AdminTableRow key={comment.id}>
            <AdminTableCell className="max-w-xs">
              <p className="line-clamp-3 text-white/90">{comment.body}</p>
              <p className="mt-1 text-xs text-white/70">
                {formatDate(comment.createdAt)}
              </p>
            </AdminTableCell>
            <AdminTableCell>
              <Link
                href={`/reviews/${comment.reviewId}`}
                className="font-medium text-[#6e46c7] hover:underline"
              >
                {comment.reviewTitle}
              </Link>
            </AdminTableCell>
            <AdminTableCell>
              <Link
                href={`/users/${comment.authorUsername}`}
                className="font-medium text-white/90 hover:text-[#6e46c7]"
              >
                {comment.authorDisplayName}
              </Link>
            </AdminTableCell>
            <AdminTableCell>
              <Badge variant="outline">
                {comment.parentCommentId ? "Reply" : "Comment"}
              </Badge>
              {comment.moderationStatus !== "OK" && (
                <Badge variant="destructive" className="ml-1.5">
                  {comment.moderationStatus.replace(/_/g, " ")}
                </Badge>
              )}
            </AdminTableCell>
            <AdminTableCell>
              <div className="flex flex-wrap gap-2">
                {comment.moderationStatus === "HIDDEN" ? (
                  <ModerationButton
                    commentId={comment.id}
                    label="Restore"
                    status="OK"
                  />
                ) : (
                  <ModerationButton
                    commentId={comment.id}
                    label="Hide"
                    status="HIDDEN"
                  />
                )}
                <AdminConfirmDialog
                  title="Delete comment"
                  description="Permanently delete this comment?"
                  confirmLabel="Delete"
                  onConfirm={() => deleteCommentAction(comment.id)}
                />
              </div>
            </AdminTableCell>
          </AdminTableRow>
        ))}
      </tbody>
    </AdminTableShell>
  );
}
