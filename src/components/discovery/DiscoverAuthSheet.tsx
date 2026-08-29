"use client";

import { SignInPromptDialog } from "@/components/auth/SignInPromptDialog";

export type DiscoverAuthIntent = "save" | "follow" | "sort" | "generic";

interface DiscoverAuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intent?: DiscoverAuthIntent;
  callbackUrl?: string;
}

/** @deprecated Prefer useSignInPrompt() — kept for browse pages with local dialog state. */
export function DiscoverAuthSheet({
  open,
  onOpenChange,
  callbackUrl = "/discover",
}: DiscoverAuthSheetProps) {
  return (
    <SignInPromptDialog
      open={open}
      onOpenChange={onOpenChange}
      callbackUrl={callbackUrl}
    />
  );
}
