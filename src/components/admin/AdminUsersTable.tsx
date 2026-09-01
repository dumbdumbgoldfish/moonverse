"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteUserAction,
  demoteUserAction,
  promoteUserAction,
  suspendUserAction,
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
import {
  beginUserRowAction,
  canBeginUserRowAction,
  completeUserRowAction,
  INITIAL_USER_ROW_PENDING_STATE,
  isUserRowActionPending,
  isUserRowBusy,
  userSuspendActionId,
  type UserRowPendingActionId,
  type UserRowPendingState,
} from "@/lib/admin/user-row-pending";
import { formatDate } from "@/lib/date-utils";
import type { AdminUserSummary } from "@/types/admin";

interface AdminUsersTableProps {
  users: AdminUserSummary[];
  currentAdminId: string;
}

export function AdminUsersTable({ users, currentAdminId }: AdminUsersTableProps) {
  const router = useRouter();
  const [pendingState, setPendingState] = useState<UserRowPendingState>(
    INITIAL_USER_ROW_PENDING_STATE
  );
  const [actionError, setActionError] = useState<{
    userId: string;
    message: string;
  } | null>(null);
  const [, startTransition] = useTransition();

  function runUserAction(
    userId: string,
    action: UserRowPendingActionId,
    actionFn: () => Promise<{ success: boolean; error?: string }>
  ): Promise<{ success: boolean; error?: string }> {
    let started = false;
    setPendingState((current) => {
      if (!canBeginUserRowAction(current, userId)) {
        return current;
      }
      started = true;
      return beginUserRowAction(current, userId, action);
    });

    if (!started) {
      return Promise.resolve({
        success: false,
        error: "Another action is already running for this user.",
      });
    }

    const startedUserId = userId;
    setActionError((current) =>
      current?.userId === startedUserId ? null : current
    );

    return new Promise((resolve) => {
      startTransition(async () => {
        const result = await actionFn();
        setPendingState((current) => completeUserRowAction(current));

        if (!result.success) {
          setActionError({
            userId: startedUserId,
            message: result.error ?? "Action failed.",
          });
          resolve(result);
          return;
        }

        setActionError((current) =>
          current?.userId === startedUserId ? null : current
        );
        router.refresh();
        resolve(result);
      });
    });
  }

  function actionLabel(
    userId: string,
    action: UserRowPendingActionId,
    label: string
  ): string {
    return isUserRowActionPending(pendingState, userId, action) ? "…" : label;
  }

  return (
    <AdminTableShell minWidth="720px">
      <AdminTableHead>
        <tr>
          <AdminTableTh>User</AdminTableTh>
          <AdminTableTh>Role</AdminTableTh>
          <AdminTableTh>Stats</AdminTableTh>
          <AdminTableTh>Joined</AdminTableTh>
          <AdminTableTh>Actions</AdminTableTh>
        </tr>
      </AdminTableHead>
      <tbody>
        {users.map((user) => {
          const rowBusy = isUserRowBusy(pendingState, user.id);
          const rowError =
            actionError?.userId === user.id ? actionError.message : null;
          const suspendAction = userSuspendActionId(user.isSuspended);

          return (
            <AdminTableRow key={user.id}>
              <AdminTableCell>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="font-semibold text-[#6e46c7] hover:underline"
                >
                  {user.displayName}
                </Link>
                <p className="text-xs text-white/70">
                  @{user.username} ·{" "}
                  <Link
                    href={`/users/${user.username}`}
                    className="hover:underline"
                  >
                    public profile
                  </Link>
                </p>
                <p className="text-xs text-white/70">{user.email}</p>
                {user.isSuspended && (
                  <Badge variant="destructive" className="mt-1">
                    Suspended
                  </Badge>
                )}
              </AdminTableCell>
              <AdminTableCell>
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </AdminTableCell>
              <AdminTableCell className="text-white/70">
                {user.reviewCount} reviews · {user.followerCount} followers
              </AdminTableCell>
              <AdminTableCell className="text-white/70">
                {formatDate(user.createdAt)}
              </AdminTableCell>
              <AdminTableCell>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2">
                    {user.role === "USER" ? (
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={rowBusy}
                        onClick={() =>
                          runUserAction(user.id, "promote", () =>
                            promoteUserAction(user.id)
                          )
                        }
                      >
                        {actionLabel(user.id, "promote", "Promote")}
                      </Button>
                    ) : (
                      <Button
                        size="xs"
                        variant="outline"
                        disabled={rowBusy || user.id === currentAdminId}
                        onClick={() =>
                          runUserAction(user.id, "demote", () =>
                            demoteUserAction(user.id)
                          )
                        }
                      >
                        {actionLabel(user.id, "demote", "Demote")}
                      </Button>
                    )}
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={rowBusy || user.id === currentAdminId}
                      onClick={() =>
                        runUserAction(user.id, suspendAction, () =>
                          suspendUserAction(user.id, !user.isSuspended)
                        )
                      }
                    >
                      {actionLabel(
                        user.id,
                        suspendAction,
                        user.isSuspended ? "Unsuspend" : "Suspend"
                      )}
                    </Button>
                    {user.id !== currentAdminId && (
                      <AdminConfirmDialog
                        title="Delete user"
                        description={`Delete ${user.displayName}? Only allowed if they have no reviews.`}
                        confirmLabel="Delete"
                        disabled={rowBusy}
                        onConfirm={() =>
                          runUserAction(user.id, "delete", () =>
                            deleteUserAction(user.id)
                          )
                        }
                      />
                    )}
                  </div>
                  {rowError ? (
                    <p
                      role="alert"
                      className="text-xs text-rose-200"
                    >
                      {rowError}
                    </p>
                  ) : null}
                </div>
              </AdminTableCell>
            </AdminTableRow>
          );
        })}
      </tbody>
    </AdminTableShell>
  );
}
