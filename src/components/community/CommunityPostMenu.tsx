"use client";

import { useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bookmark, MoreHorizontal, PencilLine, Trash2 } from "lucide-react";
import { deleteReviewAction } from "@/actions/review.actions";
import { ReviewDeleteConfirmDialog } from "@/components/reviews/ReviewDeleteConfirmDialog";
import { cn } from "@/lib/utils";

interface CommunityPostMenuProps {
  reviewId: string;
  onSave: () => void;
}

export function CommunityPostMenu({ reviewId, onSave }: CommunityPostMenuProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDelete] = useTransition();

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const width = 240;
    const left = Math.min(
      Math.max(8, rect.right - width),
      window.innerWidth - width - 8
    );
    const top = Math.min(rect.bottom + 6, window.innerHeight - 320);
    setCoords({ top: Math.max(8, top), left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const itemClass =
    "flex w-full items-start gap-2.5 px-3 py-2 text-left hover:bg-[var(--mv-surface-soft)]";

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label="More actions"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
        className="inline-flex size-9 items-center justify-center rounded-full text-[var(--mv-text-muted)] transition hover:bg-[var(--mv-surface-soft)] hover:text-[var(--mv-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-violet)]"
      >
        <MoreHorizontal className="size-5" aria-hidden />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              className={cn(
                "fixed z-[90] w-60 overflow-hidden rounded-xl border border-[var(--mv-border)] bg-white py-1 shadow-[0_18px_40px_-18px_rgba(20,17,31,0.45)]"
              )}
              style={{ top: coords.top, left: coords.left }}
            >
              <Link
                href={`/reviews/${reviewId}/edit`}
                role="menuitem"
                className={itemClass}
                onClick={() => setOpen(false)}
              >
                <PencilLine className="mt-0.5 size-4 text-[var(--mv-violet)]" aria-hidden />
                <span>
                  <span className="block text-[13px] font-semibold text-[var(--mv-ink)]">
                    Edit review
                  </span>
                  <span className="block text-[12px] font-normal text-[var(--mv-text-muted)]">
                    Change your review
                  </span>
                </span>
              </Link>

              <button
                type="button"
                role="menuitem"
                className={itemClass}
                onClick={() => {
                  setOpen(false);
                  onSave();
                }}
              >
                <Bookmark className="mt-0.5 size-4 text-[var(--mv-violet)]" aria-hidden />
                <span>
                  <span className="block text-[13px] font-semibold text-[var(--mv-ink)]">
                    Save review
                  </span>
                  <span className="block text-[12px] font-normal text-[var(--mv-text-muted)]">
                    Add this to your folders
                  </span>
                </span>
              </button>

              <button
                type="button"
                role="menuitem"
                disabled={isDeleting}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] font-semibold text-destructive hover:bg-red-50"
                onClick={() => {
                  setDeleteError(null);
                  setOpen(false);
                  setDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete review
              </button>
            </div>,
            document.body
          )
        : null}

      <ReviewDeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          setDeleteError(null);
          startDelete(async () => {
            const result = await deleteReviewAction(reviewId);
            if (!result.success) {
              setDeleteError(result.error);
              return;
            }
            setDeleteDialogOpen(false);
          });
        }}
        isDeleting={isDeleting}
        error={deleteError}
      />
    </div>
  );
}
