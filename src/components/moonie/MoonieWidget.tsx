"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { MoonieChatPanel } from "@/components/moonie/MoonieChatPanel";
import { MoonieFab } from "@/components/moonie/MoonieFab";
import {
  createMessageId,
  MOONIE_OPEN_STORAGE_KEY,
} from "@/lib/moonie/constants";
import type {
  MoonieChatMessage,
  MoonieRecommendErrorResponse,
  MoonieRecommendResponse,
} from "@/types/moonie";

interface MoonieWidgetProps {
  isLoggedIn: boolean;
}

const openListeners = new Set<() => void>();

function subscribeMoonieOpen(onStoreChange: () => void): () => void {
  openListeners.add(onStoreChange);
  return () => openListeners.delete(onStoreChange);
}

function getMoonieOpenSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(MOONIE_OPEN_STORAGE_KEY) === "true";
}

function setMoonieOpenStorage(open: boolean): void {
  sessionStorage.setItem(MOONIE_OPEN_STORAGE_KEY, open ? "true" : "false");
  openListeners.forEach((listener) => listener());
}

export function MoonieWidget({ isLoggedIn }: MoonieWidgetProps) {
  const pathname = usePathname();
  const open = useSyncExternalStore(
    subscribeMoonieOpen,
    getMoonieOpenSnapshot,
    () => false
  );
  const [messages, setMessages] = useState<MoonieChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleOpen = (event: Event) => {
      setMoonieOpenStorage(true);
      const detail = (event as CustomEvent<{ prompt?: string }>).detail;
      if (detail?.prompt) {
        setInput(detail.prompt);
      }
    };
    window.addEventListener("moonie:open", handleOpen);
    return () => window.removeEventListener("moonie:open", handleOpen);
  }, []);

  const setPanelOpen = useCallback((next: boolean) => {
    setMoonieOpenStorage(next);
  }, []);

  const handleSubmit = useCallback(
    async (message: string) => {
      if (!isLoggedIn || isLoading) return;

      const userMessage: MoonieChatMessage = {
        id: createMessageId(),
        role: "user",
        content: message,
      };

      setMessages((current) => [...current, userMessage]);
      setInput("");
      setIsLoading(true);

      try {
        const response = await fetch("/api/moonie/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });

        const data = (await response.json()) as
          | MoonieRecommendResponse
          | MoonieRecommendErrorResponse;

        if (!response.ok || "error" in data) {
          const errorData = data as MoonieRecommendErrorResponse;
          setMessages((current) => [
            ...current,
            {
              id: createMessageId(),
              role: "assistant",
              content: errorData.error,
              isError: true,
            },
          ]);
          return;
        }

        const success = data as MoonieRecommendResponse;
        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: "assistant",
            content: success.reply,
            recommendations: success.recommendations,
          },
        ]);
      } catch {
        setMessages((current) => [
          ...current,
          {
            id: createMessageId(),
            role: "assistant",
            content:
              "Something went wrong reaching Moonie. Please check your connection and try again.",
            isError: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoggedIn, isLoading]
  );

  return (
    <>
      <MoonieFab open={open} onToggle={() => setPanelOpen(!open)} />
      <div id="moonie-chat-panel">
        <MoonieChatPanel
          open={open}
          onClose={() => setPanelOpen(false)}
          isLoggedIn={isLoggedIn}
          messages={messages}
          isLoading={isLoading}
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          loginCallbackUrl={pathname}
        />
      </div>
    </>
  );
}
