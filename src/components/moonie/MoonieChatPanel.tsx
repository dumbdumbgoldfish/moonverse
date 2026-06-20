"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { MoonieMessageList } from "@/components/moonie/MoonieMessageList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MOONIE_QUICK_PROMPTS } from "@/lib/moonie/constants";
import type { MoonieChatMessage } from "@/types/moonie";

interface MoonieChatPanelProps {
  open: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  messages: MoonieChatMessage[];
  isLoading: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (message: string) => void;
  loginCallbackUrl?: string;
}

export function MoonieChatPanel({
  open,
  onClose,
  isLoggedIn,
  messages,
  isLoading,
  input,
  onInputChange,
  onSubmit,
  loginCallbackUrl = "/",
}: MoonieChatPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    panelRef.current?.focus();

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input.trim());
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Moonie recommendation assistant"
      aria-modal="false"
      aria-busy={isLoading}
      tabIndex={-1}
      className="fixed bottom-20 right-4 z-50 flex h-[min(560px,calc(100vh-6rem))] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-primary/20 bg-white shadow-2xl ring-1 ring-primary/10 focus:outline-none"
    >
      <header className="flex items-center gap-3 border-b border-border/60 bg-gradient-to-r from-moon-purple-soft to-sky-50 px-4 py-3">
        <MoonieMascot size={36} animated />
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold">Moonie</h2>
          <p className="truncate text-xs text-muted-foreground">
            Web novel recommendations only
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close Moonie"
        >
          <X aria-hidden="true" />
        </Button>
      </header>

      {!isLoggedIn && (
        <div className="border-b border-border/60 bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
          <a
            href={`/login?callbackUrl=${encodeURIComponent(loginCallbackUrl)}`}
            className="font-medium text-primary hover:underline"
          >
            Log in
          </a>{" "}
          to ask Moonie for personalised recommendations based on your likes and
          saved reviews.
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <MoonieMessageList messages={messages} isLoading={isLoading} />
      </div>

      <div className="border-t border-border/60 bg-background/95 p-3">
        <div
          className="mb-2 flex gap-1.5 overflow-x-auto pb-1"
          role="group"
          aria-label="Quick prompts"
        >
          {MOONIE_QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={!isLoggedIn || isLoading}
              onClick={() => onSubmit(prompt)}
              aria-label={`Quick prompt: ${prompt}`}
              className="shrink-0 rounded-full border border-primary/20 bg-moon-purple-soft px-2.5 py-1 text-xs text-primary transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <label htmlFor="moonie-input" className="sr-only">
            Ask Moonie for web novel recommendations
          </label>
          <Input
            id="moonie-input"
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={
              isLoggedIn
                ? "e.g. fantasy romance with strong female lead"
                : "Log in to ask Moonie…"
            }
            disabled={!isLoggedIn || isLoading}
            maxLength={500}
            autoComplete="off"
          />
          <Button type="submit" disabled={!isLoggedIn || isLoading || !input.trim()}>
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
