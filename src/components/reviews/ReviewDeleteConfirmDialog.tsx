"use client";

import {
  DeskDangerButton,
  DeskOutlineButton,
} from "@/components/reviews/write/WritingDeskButtons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  NESTED_DIALOG_Z_CLASS,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const REVIEW_DELETE_DIALOG_TITLE = "Delete review?";
export const REVIEW_DELETE_DIALOG_DESCRIPTION =
  "This action cannot be undone. This review will be permanently removed.";

interface ReviewDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  isDeleting?: boolean;
  error?: string | null;
  title?: string;
  description?: string;
}

export function ReviewDeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
  error,
  title = REVIEW_DELETE_DIALOG_TITLE,
  description = REVIEW_DELETE_DIALOG_DESCRIPTION,
}: ReviewDeleteConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!isDeleting) onOpenChange(next);
      }}
    >
      <DialogContent
        className={cn(
          "gap-5 border border-violet-100 bg-[#FBF7F1] text-[#1A1224] shadow-xl sm:max-w-md",
          NESTED_DIALOG_Z_CLASS
        )}
        overlayClassName={cn("bg-black/40 backdrop-blur-sm", NESTED_DIALOG_Z_CLASS)}
        showCloseButton={!isDeleting}
      >
        <DialogHeader className="gap-2 text-left">
          <DialogTitle className="font-serif text-xl font-bold tracking-tight text-night-blue">
            {title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-slate-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <DeskOutlineButton
            type="button"
            deskSize="sm"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </DeskOutlineButton>
          <DeskDangerButton
            type="button"
            deskSize="sm"
            disabled={isDeleting}
            showDeleteIcon={!isDeleting}
            onClick={() => void onConfirm()}
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </DeskDangerButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
