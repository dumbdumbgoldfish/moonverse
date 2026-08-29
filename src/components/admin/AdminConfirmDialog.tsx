"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ADMIN_BTN_DELETE } from "@/components/admin/admin-styles";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
}

export function AdminConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  variant = "destructive",
  onConfirm,
}: AdminConfirmDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const showDeleteIcon = /^delete/i.test(confirmLabel);

  const confirmContent = isPending ? (
    "Working…"
  ) : (
    <>
      {showDeleteIcon ? <Trash2 className="admin-icon-destructive size-3.5" aria-hidden /> : null}
      {confirmLabel}
    </>
  );

  const handleConfirm = () => {
    setError(null);
    startTransition(async () => {
      const result = await onConfirm();
      if (!result.success) {
        setError(result.error ?? "Action failed.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        size="xs"
        variant="outline"
        className={cn(variant === "destructive" && ADMIN_BTN_DELETE)}
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        {showDeleteIcon ? <Trash2 className="admin-icon-destructive size-3.5" aria-hidden /> : null}
        {confirmLabel}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button
              variant={variant === "destructive" ? "outline" : "default"}
              className={cn(variant === "destructive" && ADMIN_BTN_DELETE)}
              onClick={handleConfirm}
              disabled={isPending}
            >
              {confirmContent}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
