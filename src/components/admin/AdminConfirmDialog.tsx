"use client";

import { useState } from "react";
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
import { runAdminConfirmFlow } from "@/lib/admin/admin-confirm-flow";

interface AdminConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  disabled?: boolean;
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
}

export function AdminConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  variant = "destructive",
  disabled = false,
  onConfirm,
}: AdminConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const showDeleteIcon = /^delete/i.test(confirmLabel);
  const triggerDisabled = disabled || isConfirming;

  const confirmContent = isConfirming ? (
    "Working…"
  ) : (
    <>
      {showDeleteIcon ? <Trash2 className="size-3.5" aria-hidden /> : null}
      {confirmLabel}
    </>
  );

  const handleConfirm = () => {
    if (isConfirming) return;
    void runAdminConfirmFlow(onConfirm, {
      setConfirming: setIsConfirming,
      setError,
      close: () => setOpen(false),
    });
  };

  return (
    <>
      <Button
        size="xs"
        variant="outline"
        disabled={triggerDisabled}
        className={cn(variant === "destructive" && ADMIN_BTN_DELETE)}
        onClick={() => {
          if (triggerDisabled) return;
          setError(null);
          setOpen(true);
        }}
      >
        {showDeleteIcon ? <Trash2 className="size-3.5" aria-hidden /> : null}
        {isConfirming ? "…" : confirmLabel}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (isConfirming) return;
          setOpen(nextOpen);
          if (!nextOpen) {
            setError(null);
          }
        }}
      >
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
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isConfirming}
            >
              Cancel
            </Button>
            <Button
              variant={variant === "destructive" ? "outline" : "default"}
              className={cn(variant === "destructive" && ADMIN_BTN_DELETE)}
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {confirmContent}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
