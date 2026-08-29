"use client";

import { Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
interface WritingStudioMobileActionsProps {
  show: boolean;
  drawerOpen: boolean;
  canPublish: boolean;
  isPending: boolean;
  onShip: () => void;
  onCloseDrawer: () => void;
  onPublish: () => void;
  publishLabel?: string;
  className?: string;
}

export function WritingStudioMobileActions({
  show,
  drawerOpen,
  canPublish,
  isPending,
  onShip,
  onCloseDrawer,
  onPublish,
  publishLabel = "Publish",
  className,
}: WritingStudioMobileActionsProps) {
  if (!show) return null;

  return (
    <div
      className={cn(
        "mv-write-mobile-actions safe-bottom-pad fixed inset-x-0 bottom-0 z-40 border-t border-[var(--mv-border)] bg-white/95 p-3 backdrop-blur-md lg:hidden",
        className
      )}
    >
      <div className="mx-auto flex max-w-lg gap-2">
        {drawerOpen ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCloseDrawer}
            disabled={isPending}
            className="h-11 flex-1 rounded-xl border-[var(--mv-border)]"
          >
            Keep editing
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={onShip}
            disabled={isPending}
            className="h-11 flex-1 rounded-xl border-[var(--mv-border)]"
          >
            <Eye className="mr-1.5 size-4" aria-hidden />
            Preview
          </Button>
        )}
        <Button
          type="button"
          onClick={onPublish}
          disabled={isPending || !canPublish}
          className="h-11 flex-[1.2] rounded-xl bg-[var(--mv-deep-plum)] font-semibold text-white hover:bg-[var(--mv-plum)]"
        >
          {isPending ? (
            <Loader2 className="mr-1.5 size-4 animate-spin" aria-hidden />
          ) : null}
          {isPending ? "Publishing…" : publishLabel}
        </Button>
      </div>
    </div>
  );
}
