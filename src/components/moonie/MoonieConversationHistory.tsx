"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ChevronDown,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Pin,
  SquarePen,
  Trash2,
} from "lucide-react";
import {
  deleteMoonieConversationAction,
  listMoonieConversationsAction,
  loadMoonieConversationAction,
  pinMoonieConversationAction,
  renameMoonieConversationAction,
  type MoonieConversationListItem,
} from "@/actions/moonie.actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MOONIE_MAX_PINNED_CONVERSATIONS } from "@/lib/moonie/constants";
import type { MoonieChatMessage } from "@/types/moonie";

interface MoonieConversationHistoryProps {
  activeConversationId?: string;
  onResume: (options: {
    conversationId: string;
    messages: MoonieChatMessage[];
  }) => void;
  onStartNew: () => void;
  className?: string;
  layout?: "card" | "sidebar";
}

function sortConversationItems(items: MoonieConversationListItem[]) {
  return [...items].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function ConversationRows({
  items,
  activeConversationId,
  menuOpenId,
  menuRef,
  onResume,
  onOpenMenu,
  onCloseMenu,
  onRename,
  onTogglePin,
  onDelete,
  pinLimitReached,
}: {
  items: MoonieConversationListItem[];
  activeConversationId?: string;
  menuOpenId: string | null;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onResume: (itemId: string) => void;
  onOpenMenu: (itemId: string) => void;
  onCloseMenu: () => void;
  onRename: (item: MoonieConversationListItem) => void;
  onTogglePin: (item: MoonieConversationListItem) => void;
  onDelete: (itemId: string) => void;
  pinLimitReached: boolean;
}) {
  if (items.length === 0) {
    return (
      <p className="px-2 py-1.5 text-xs text-slate-600">No chats here yet.</p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive = item.id === activeConversationId;
        const menuOpen = menuOpenId === item.id;

        return (
          <li key={item.id} className="relative">
            <div
              className={cn(
                "group flex items-center rounded-lg",
                isActive ? "bg-[#F4ECF8]" : "hover:bg-[#F4ECF8]/60"
              )}
            >
              <button
                type="button"
                onClick={() => onResume(item.id)}
                className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6E46C7]/30"
              >
                <MessageCircle
                  className="size-4 shrink-0 text-slate-500"
                  aria-hidden
                />
                <span className="truncate text-sm text-[#1A1224]">
                  {item.title}
                </span>
              </button>

              <div className="relative shrink-0 pr-1">
                <button
                  type="button"
                  aria-label="Conversation options"
                  aria-expanded={menuOpen}
                  onClick={() => onOpenMenu(item.id)}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/80 hover:text-[#1A1224] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/30",
                    menuOpen
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                  )}
                >
                  <MoreHorizontal className="size-4" aria-hidden />
                </button>

                {menuOpen ? (
                  <div
                    ref={menuRef}
                    role="menu"
                    className="absolute right-0 top-full z-20 mt-1 min-w-[10rem] rounded-xl border border-violet-100 bg-white py-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onCloseMenu();
                        onRename(item);
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#1A1224] transition hover:bg-[#F4ECF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6E46C7]/30"
                    >
                      <Pencil className="size-4 shrink-0" aria-hidden />
                      Rename
                    </button>
                    <div
                      className="my-1 border-t border-violet-100"
                      aria-hidden
                    />
                      <button
                        type="button"
                        role="menuitem"
                        disabled={!item.pinned && pinLimitReached}
                        onClick={() => {
                          if (!item.pinned && pinLimitReached) return;
                          onCloseMenu();
                          onTogglePin(item);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#1A1224] transition hover:bg-[#F4ECF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6E46C7]/30 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-transparent"
                      >
                        <Pin className="size-4 shrink-0" aria-hidden />
                        {item.pinned ? "Unpin chat" : "Pin chat"}
                      </button>
                    <div
                      className="my-1 border-t border-violet-100"
                      aria-hidden
                    />
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => onDelete(item.id)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-200"
                    >
                      <Trash2 className="size-4 shrink-0" aria-hidden />
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function MoonieConversationHistory({
  activeConversationId,
  onResume,
  onStartNew,
  className,
  layout = "card",
}: MoonieConversationHistoryProps) {
  const isSidebar = layout === "sidebar";
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [recentsOpen, setRecentsOpen] = useState(true);
  const [items, setItems] = useState<MoonieConversationListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] =
    useState<MoonieConversationListItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const lastConversationIdRef = useRef<string | undefined>(activeConversationId);

  const shouldLoad = isSidebar || recentsOpen || pinnedOpen;
  const pinnedItems = items.filter((item) => item.pinned);
  const recentItems = items.filter((item) => !item.pinned);
  const pinLimitReached =
    pinnedItems.length >= MOONIE_MAX_PINNED_CONVERSATIONS;

  const refreshConversations = useCallback(async () => {
    const result = await listMoonieConversationsAction();
    if (!result.success) {
      setError(result.error);
      setItems([]);
      return false;
    }
    setError(null);
    setItems(result.conversations);
    if (result.conversations.some((item) => item.pinned)) {
      setPinnedOpen(true);
    }
    return true;
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    startTransition(() => {
      void refreshConversations();
    });
  }, [shouldLoad, refreshConversations]);

  useEffect(() => {
    const previousId = lastConversationIdRef.current;
    lastConversationIdRef.current = activeConversationId;
    if (!shouldLoad || !activeConversationId || previousId === activeConversationId) {
      return;
    }
    if (!previousId) {
      startTransition(() => {
        void refreshConversations();
      });
    }
  }, [activeConversationId, shouldLoad, refreshConversations]);

  useEffect(() => {
    if (!menuOpenId) return;

    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpenId]);

  function resumeConversation(itemId: string) {
    startTransition(async () => {
      const loaded = await loadMoonieConversationAction(itemId);
      if (!loaded.success) {
        setError(loaded.error);
        return;
      }
      onResume({
        conversationId: loaded.conversationId,
        messages: loaded.messages,
      });
    });
  }

  function deleteConversation(itemId: string) {
    setMenuOpenId(null);
    startTransition(async () => {
      const result = await deleteMoonieConversationAction(itemId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      if (itemId === activeConversationId) onStartNew();
      await refreshConversations();
    });
  }

  function togglePin(item: MoonieConversationListItem) {
    const nextPinned = !item.pinned;
    if (nextPinned && pinLimitReached) {
      setError(`You can pin up to ${MOONIE_MAX_PINNED_CONVERSATIONS} chats.`);
      return;
    }
    setMenuOpenId(null);
    setPinnedOpen(true);

    setItems((current) =>
      sortConversationItems(
        current.map((entry) =>
          entry.id === item.id ? { ...entry, pinned: nextPinned } : entry
        )
      )
    );

    startTransition(async () => {
      const result = await pinMoonieConversationAction(item.id, nextPinned);
      if (!result.success) {
        setError(result.error);
        await refreshConversations();
        return;
      }
      await refreshConversations();
    });
  }

  function openRename(item: MoonieConversationListItem) {
    setRenameTarget(item);
    setRenameValue(item.title);
    setRenameError(null);
  }

  function submitRename() {
    if (!renameTarget) return;
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setRenameError("Enter a title.");
      return;
    }

    startTransition(async () => {
      const result = await renameMoonieConversationAction(
        renameTarget.id,
        trimmed
      );
      if (!result.success) {
        setRenameError(result.error);
        return;
      }
      setRenameTarget(null);
      setRenameValue("");
      setRenameError(null);
      await refreshConversations();
    });
  }

  const rowProps = {
    activeConversationId,
    menuOpenId,
    menuRef,
    onResume: resumeConversation,
    onOpenMenu: (itemId: string) =>
      setMenuOpenId((current) => (current === itemId ? null : itemId)),
    onCloseMenu: () => setMenuOpenId(null),
    onRename: openRename,
    onTogglePin: togglePin,
    onDelete: deleteConversation,
    pinLimitReached,
  };

  return (
    <>
      <div
        className={cn(
          "flex min-h-0 flex-col overflow-hidden",
          isSidebar
            ? "h-full rounded-2xl border border-violet-100/80 bg-[#FFFBFF] py-2"
            : "rounded-2xl border border-violet-100 bg-[#FFFBFF] p-2",
          className
        )}
      >
        <button
          type="button"
          onClick={onStartNew}
          className="mx-2 flex shrink-0 items-center gap-3 rounded-xl px-2 py-2.5 text-left text-sm font-medium text-[#1A1224] transition hover:bg-[#F4ECF8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/30"
        >
          <SquarePen className="size-4 shrink-0 text-[#4C2A67]" aria-hidden />
          New chat
        </button>

        <div
          className={cn(
            "mt-1 flex min-h-0 flex-1 flex-col overscroll-contain px-1.5",
            isSidebar ? "overflow-y-auto" : "max-h-[40dvh] overflow-y-auto"
          )}
        >
          {error ? (
            <p className="px-2 py-1.5 text-xs text-red-600">{error}</p>
          ) : null}
          {isPending && items.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-slate-600">
              Loading conversations…
            </p>
          ) : null}
          {!isPending && items.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-slate-600">
              No saved Moonie chats yet.
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => setPinnedOpen((value) => !value)}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-left text-xs font-semibold text-slate-600 transition hover:bg-[#F4ECF8]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/30"
            aria-expanded={pinnedOpen}
          >
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 transition-transform",
                !pinnedOpen && "-rotate-90"
              )}
              aria-hidden
            />
            Pinned
          </button>

          {pinnedOpen ? (
            <div className="mb-2">
              <ConversationRows items={pinnedItems} {...rowProps} />
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setRecentsOpen((value) => !value)}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-2 text-left text-xs font-semibold text-slate-600 transition hover:bg-[#F4ECF8]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/30"
            aria-expanded={recentsOpen}
          >
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 transition-transform",
                !recentsOpen && "-rotate-90"
              )}
              aria-hidden
            />
            Recents
          </button>

          {recentsOpen ? (
            <ConversationRows items={recentItems} {...rowProps} />
          ) : null}
        </div>
      </div>

      <Dialog
        open={renameTarget != null}
        onOpenChange={(open) => {
          if (!open) {
            setRenameTarget(null);
            setRenameValue("");
            setRenameError(null);
          }
        }}
      >
        <DialogContent showCloseButton className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Input
              value={renameValue}
              onChange={(event) => setRenameValue(event.target.value)}
              maxLength={80}
              placeholder="Chat title"
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  submitRename();
                }
              }}
            />
            {renameError ? (
              <p className="text-xs text-red-600">{renameError}</p>
            ) : null}
          </div>
          <DialogFooter className="mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRenameTarget(null);
                setRenameValue("");
                setRenameError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={submitRename} disabled={isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
