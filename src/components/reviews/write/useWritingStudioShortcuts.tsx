"use client";

import { useEffect } from "react";

interface WritingStudioShortcutsOptions {
  enabled: boolean;
  onSaveDraft: () => void;
  onPreview: () => void;
  onPublish: () => void;
  canPreview: boolean;
  canPublish: boolean;
  isPending: boolean;
}

function isMeta(event: KeyboardEvent) {
  return event.metaKey || event.ctrlKey;
}

export function useWritingStudioShortcuts({
  enabled,
  onSaveDraft,
  onPreview,
  onPublish,
  canPreview,
  canPublish,
  isPending,
}: WritingStudioShortcutsOptions) {
  useEffect(() => {
    if (!enabled) return;

    function onKeyDown(event: KeyboardEvent) {
      if (!isMeta(event) || isPending) return;

      const key = event.key.toLowerCase();

      if (key === "s") {
        event.preventDefault();
        onSaveDraft();
        return;
      }

      if (key === "p" && event.shiftKey) {
        event.preventDefault();
        onPreview();
        return;
      }

      if (key === "enter" && canPublish) {
        const target = event.target as HTMLElement | null;
        const inTextarea = target?.tagName === "TEXTAREA";
        if (inTextarea && !event.shiftKey) return;
        event.preventDefault();
        onPublish();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    enabled,
    onSaveDraft,
    onPreview,
    onPublish,
    canPreview,
    canPublish,
    isPending,
  ]);
}
