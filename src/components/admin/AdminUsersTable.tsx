"use client";

import Link from "next/link";
import { startTransition, useState } from "react";
import { flushSync } from "react-dom";
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
import { runAdminTableAction } from "@/lib/admin/admin-table-action-runner";
import { serialAdminServerAction } from "@/lib/admin/serial-admin-server-action";
import {
  beginUserRowAction,
  canBeginUserRowAction,
  clearUserRowPendingIfMatch,
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

type UserRowPatch = Partial<Pick<AdminUserSummary, "role" | "isSuspended">>;

function mergeUserRowPatches(
  users: AdminUserSummary[],
  patchedById: Record<string, UserRowPatch>
): AdminUserSummary[] {
  return users.map((user) => ({
    ...user,
    ...patchedById[user.id],
  }));
}

export function AdminUsersTable({ users, currentAdminId }: AdminUsersTableProps) {
  const [pendingState, setPendingState] = useState<UserRowPendingState>(
    INITIAL_USER_ROW_PENDING_STATE
  );
  const [patchedById, setPatchedById] = useState<Record<string, UserRowPatch>>({});
  const [removedUserIds, setRemovedUserIds] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<{
    userId: string;
    message: string;
  } | null>(null);

  const rows = mergeUserRowPatches(
    users.filter((user) => !removedUserIds.has(user.id)),
    patchedById
  );

  function beginUserAction(userId: string, action: UserRowPendingActionId): boolean {
    let started = false;
    setPendingState((current) => {
      if (!canBeginUserRowAction(current, userId)) {
        return current;
      }
      started = true;
      return beginUserRowAction(current, userId, action);
    });
    return started;
  }

  function clearUserPending(userId: string, action: UserRowPendingActionId) {
    flushSync(() => {
      setPendingState((current) =>
        clearUserRowPendingIfMatch(current, userId, action)
      );
    });
  }

  function applyUserRowPatch(userId: string, patch: UserRowPatch) {
    setPatchedById((current) => ({
      ...current,
      [userId]: {
        ...current[userId],
        ...patch,
      },
    }));
  }

  function runUserAction(
    userId: string,
    action: UserRowPendingActionId,
    actionFn: () => Promise<{ success: boolean; error?: string }>,
    successPatch?: UserRowPatch
  ): Promise<{ success: boolean; error?: string }> {
    if (!beginUserAction(userId, action)) {
      return Promise.resolve({
        success: false,
        error: "Another action is already running for this user.",
      });
    }

    setActionError((current) =>
      current?.userId === userId ? null : current
    );

    return runAdminTableAction({
      run: () => serialAdminServerAction(actionFn),
      applyOutcome: (result) => {
        if (!result.success) {
          setActionError({
            userId,
            message: result.error ?? "Action failed.",
          });
          return;
        }

        setActionError((current) =>
          current?.userId === userId ? null : current
        );

        if (action === "delete") {
          setRemovedUserIds((current) => new Set(current).add(userId));
          return;
        }

        if (successPatch) {
          applyUserRowPatch(userId, successPatch);
        }
      },
      clearPending: () => clearUserPending(userId, action),
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
        {rows.map((user) => {
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
                          runUserAction(
                            user.id,
                            "promote",
                            () => promoteUserAction(user.id),
                            { role: "ADMIN" }
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
                          runUserAction(
                            user.id,
                            "demote",
                            () => demoteUserAction(user.id),
                            { role: "USER" }
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
                        runUserAction(
                          user.id,
                          suspendAction,
                          () => suspendUserAction(user.id, !user.isSuspended),
                          { isSuspended: !user.isSuspended }
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
                    <p role="alert" className="text-xs text-rose-200">
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
