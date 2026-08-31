"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  demoteUserAction,
  promoteUserAction,
  suspendUserAction,
} from "@/actions/admin.actions";
import { Button } from "@/components/ui/button";

interface AdminUserActionsProps {
  userId: string;
  role: string;
  isSuspended: boolean;
  isCurrentAdmin: boolean;
}

export function AdminUserActions({
  userId,
  role,
  isSuspended,
  isCurrentAdmin,
}: AdminUserActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        router.refresh();
        return;
      }
      setError(result.error ?? "Action failed.");
    });
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {role !== "ADMIN" ? (
          <Button
            size="sm"
            disabled={isPending}
            onClick={() => run(() => promoteUserAction(userId))}
          >
            Promote to admin
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            disabled={isPending || isCurrentAdmin}
            onClick={() => run(() => demoteUserAction(userId))}
          >
            Demote to user
          </Button>
        )}
        <Button
          size="sm"
          variant={isSuspended ? "outline" : "destructive"}
          disabled={isPending || isCurrentAdmin}
          onClick={() => run(() => suspendUserAction(userId, !isSuspended))}
        >
          {isSuspended ? "Unsuspend" : "Suspend"}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="mt-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
    </div>
  );
}
