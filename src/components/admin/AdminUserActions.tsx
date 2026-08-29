"use client";

import { useTransition } from "react";
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
}

export function AdminUserActions({
  userId,
  role,
  isSuspended,
}: AdminUserActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await action();
      if (result.success) router.refresh();
    });
  }

  return (
    <div className="mt-3 flex flex-wrap gap-2">
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
          disabled={isPending}
          onClick={() => run(() => demoteUserAction(userId))}
        >
          Demote to user
        </Button>
      )}
      <Button
        size="sm"
        variant={isSuspended ? "outline" : "destructive"}
        disabled={isPending}
        onClick={() => run(() => suspendUserAction(userId, !isSuspended))}
      >
        {isSuspended ? "Unsuspend" : "Suspend"}
      </Button>
    </div>
  );
}
