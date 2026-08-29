"use client";

import { useSyncExternalStore } from "react";
import { HardDrive, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface DraftStatusProps {
  savedAt: string | null;
  restored?: boolean;
  justSaved?: boolean;
  saving?: boolean;
  backedUp?: boolean;
  /** Compact one-line status for the publish rail. */
  compact?: boolean;
}

function formatSavedTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export function DraftStatus({
  savedAt,
  restored = false,
  justSaved = false,
  saving = false,
  backedUp = false,
  compact = false,
}: DraftStatusProps) {
  const isClient = useIsClient();
  const savedLabel = isClient && savedAt ? formatSavedTime(savedAt) : null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--mv-border)] bg-[var(--mv-paper)]/60 px-2.5 py-2 text-sm text-[var(--mv-text-muted)]">
        <HardDrive className="size-3.5 shrink-0 text-[var(--mv-plum)]" aria-hidden />
        {saving ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--mv-plum)]" role="status">
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
            Saving draft…
          </span>
        ) : justSaved ? (
          <span className="font-semibold text-emerald-700" role="status">
            {backedUp ? "Saved & backed up" : "Saved"}
          </span>
        ) : restored && !justSaved ? (
          <span className="font-semibold text-emerald-700" role="status">
            Restored
          </span>
        ) : savedLabel ? (
          <span className="truncate">
            {backedUp ? "Backed up" : "Saved"} {savedLabel}
          </span>
        ) : (
          <span>Auto-save on</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-2 rounded-xl bg-[#faf8ff] px-3 py-2.5 ring-1 ring-violet-100"
      )}
    >
      <p className="inline-flex items-start gap-1.5 text-xs leading-relaxed text-slate-600">
        <HardDrive className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
        <span>
          Drafts stay in{" "}
          <strong className="font-semibold text-night-blue">
            this browser only
          </strong>
          until you publish.
        </span>
      </p>

      {justSaved ? (
        <p className="text-xs font-semibold text-emerald-700" role="status">
          Draft saved in this browser.
        </p>
      ) : null}

      {restored && !justSaved ? (
        <p className="text-xs font-semibold text-emerald-700" role="status">
          Restored your previous draft from this browser.
        </p>
      ) : null}

      {savedLabel ? (
        <p className="inline-flex items-center gap-1.5 text-xs text-slate-600">
          <Save className="size-3.5 text-primary" aria-hidden />
          Last saved · {savedLabel}
        </p>
      ) : (
        <p className="text-xs text-slate-500">Not saved yet · typing auto-saves</p>
      )}
    </div>
  );
}
