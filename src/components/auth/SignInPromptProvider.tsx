"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { SignInPromptDialog } from "@/components/auth/SignInPromptDialog";

interface SignInPromptContextValue {
  promptSignIn: (callbackUrl?: string) => void;
}

const SignInPromptContext = createContext<SignInPromptContextValue | null>(
  null
);

function resolveCallbackUrl(callbackUrl?: string): string {
  if (callbackUrl) return callbackUrl;
  if (typeof window === "undefined") return "/discover";
  return `${window.location.pathname}${window.location.search}`;
}

export function SignInPromptProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/reviews");

  const promptSignIn = useCallback((nextCallbackUrl?: string) => {
    setCallbackUrl(resolveCallbackUrl(nextCallbackUrl));
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ promptSignIn }), [promptSignIn]);

  return (
    <SignInPromptContext.Provider value={value}>
      {children}
      <SignInPromptDialog
        open={open}
        onOpenChange={setOpen}
        callbackUrl={callbackUrl}
      />
    </SignInPromptContext.Provider>
  );
}

export function useSignInPrompt(): SignInPromptContextValue {
  const context = useContext(SignInPromptContext);
  if (!context) {
    throw new Error("useSignInPrompt must be used within SignInPromptProvider");
  }
  return context;
}

/** Safe variant for components that may render outside the provider in tests. */
export function useSignInPromptOptional(): SignInPromptContextValue | null {
  return useContext(SignInPromptContext);
}
