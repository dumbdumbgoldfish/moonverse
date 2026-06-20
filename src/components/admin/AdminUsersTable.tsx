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
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-border/60 bg-muted/30">
          <tr>
            <th className="px-4 py-3 font-medium" scope="col">User</th>
            <th className="px-4 py-3 font-medium" scope="col">Role</th>
            <th className="px-4 py-3 font-medium" scope="col">Stats</th>
            <th className="px-4 py-3 font-medium" scope="col">Joined</th>
            <th className="px-4 py-3 font-medium" scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-border/40 last:border-0">
              <td className="px-4 py-3">
                <Link
                  href={`/users/${user.username}`}
                  className="font-medium hover:text-primary"
                >
                  {user.displayName}
                </Link>
                <p className="text-xs text-muted-foreground">@{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
                {user.isSuspended && (
                  <Badge variant="destructive" className="mt-1">
                    Suspended
                  </Badge>
                )}
              </td>
              <td className="px-4 py-3">
                <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                  {user.role}
                </Badge>
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {user.reviewCount} reviews · {user.followerCount} followers
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDate(user.createdAt)}
              </td>
              <td className="px-4 py-3">
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
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
