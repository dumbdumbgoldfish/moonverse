"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
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
import { formatDate } from "@/lib/date-utils";
import type { AdminUserSummary } from "@/types/admin";

interface AdminUsersTableProps {
  users: AdminUserSummary[];
  currentAdminId: string;
}

export function AdminUsersTable({ users, currentAdminId }: AdminUsersTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const run = (action: () => Promise<{ success: boolean; error?: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) router.refresh();
    });
  };

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
        {users.map((user) => (
          <AdminTableRow key={user.id}>
            <AdminTableCell>
              <Link
                href={`/admin/users/${user.id}`}
                className="font-semibold text-[#fcd34d] hover:underline"
              >
                {user.displayName}
              </Link>
              <p className="text-xs text-white">
                @{user.username} ·{" "}
                <Link
                  href={`/users/${user.username}`}
                  className="hover:underline"
                >
                  public profile
                </Link>
              </p>
                <p className="text-xs text-white">{user.email}</p>
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
              <AdminTableCell className="text-white">
                {user.reviewCount} reviews · {user.followerCount} followers
              </AdminTableCell>
              <AdminTableCell className="text-white">
                {formatDate(user.createdAt)}
              </AdminTableCell>
              <AdminTableCell>
                <div className="flex flex-wrap gap-2">
                  {user.role === "USER" ? (
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={isPending}
                      onClick={() => run(() => promoteUserAction(user.id))}
                    >
                      Promote
                    </Button>
                  ) : (
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={isPending || user.id === currentAdminId}
                      onClick={() => run(() => demoteUserAction(user.id))}
                    >
                      Demote
                    </Button>
                  )}
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={isPending || user.id === currentAdminId}
                    onClick={() =>
                      run(() => suspendUserAction(user.id, !user.isSuspended))
                    }
                  >
                    {user.isSuspended ? "Unsuspend" : "Suspend"}
                  </Button>
                  {user.id !== currentAdminId && (
                    <AdminConfirmDialog
                      title="Delete user"
                      description={`Delete ${user.displayName}? Only allowed if they have no reviews.`}
                      confirmLabel="Delete"
                      onConfirm={() => deleteUserAction(user.id)}
                    />
                  )}
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </tbody>
    </AdminTableShell>
  );
}
