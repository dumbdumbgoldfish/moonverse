"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const SIGN_IN_PROMPT_TITLE = "Sign in to continue";

export const SIGN_IN_PROMPT_DESCRIPTION =
  "Create an account or log in to read full reviews, interact with the community, save your favourites, and receive personalised recommendations.";

interface SignInPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callbackUrl?: string;
}

export function SignInPromptDialog({
  open,
  onOpenChange,
  callbackUrl = "/discover",
}: SignInPromptDialogProps) {
  const encoded = encodeURIComponent(callbackUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-[#FBF7F1] text-[#1A1224]">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-medium tracking-tight">
            {SIGN_IN_PROMPT_TITLE}
          </DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#1A1224]/70">
            {SIGN_IN_PROMPT_DESCRIPTION}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 pt-1">
          <Button
            className="mv-nav-signup h-11 w-full rounded-full border-0 text-sm font-bold text-white"
            nativeButton={false}
            render={<a href={`/register?callbackUrl=${encoded}`} />}
          >
            Create account
          </Button>
          <Button
            variant="outline"
            className="mv-nav-login h-11 w-full rounded-full text-sm font-bold"
            nativeButton={false}
            render={<a href={`/login?callbackUrl=${encoded}`} />}
          >
            Log in
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
