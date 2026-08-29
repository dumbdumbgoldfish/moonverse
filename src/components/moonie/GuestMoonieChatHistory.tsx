"use client";

import { useEffect, useRef, useState } from "react";
import { History, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/date-utils";
import type { GuestMoonieConversationSummary } from "@/lib/moonie/guest-chat-storage";
import { cn } from "@/lib/utils";

interface GuestMoonieChatHistoryProps {
  conversations: GuestMoonieConversationSummary[];
  activeConversationId?: string;
  onResume: (conversationId: string) => void;
  onRename: (conversationId: string, title: string) => void;
  onDelete: (conversationId: string) => void;
  onClearAll: () => void;
}

export function GuestMoonieChatHistory({
  conversations,
  activeConversationId,
  onResume,
  onRename,
  onDelete,
  onClearAll,
}: GuestMoonieChatHistoryProps) {
  const [open, setOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renameTarget, setRenameTarget] =
    useState<GuestMoonieConversationSummary | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  function handleResume(conversationId: string) {
    onResume(conversationId);
    setOpen(false);
    setMenuOpenId(null);
  }

  function handleRenameSubmit() {
    if (!renameTarget) return;
    onRename(renameTarget.id, renameValue);
    setRenameTarget(null);
    setRenameValue("");
    setMenuOpenId(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="h-8 shrink-0 rounded-full px-2.5 text-xs text-white/75 hover:bg-white/10 hover:text-white"
      >
        <History className="mr-1 size-3.5" aria-hidden />
        Chat history
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[min(80dvh,560px)] gap-0 overflow-hidden border-[#C89B4A]/20 bg-[#FFFBFF] p-0 sm:max-w-md">
          <DialogHeader className="border-b border-violet-100 px-4 py-3 text-left">
            <DialogTitle className="text-base text-[#1A1224]">
              Previous chats
            </DialogTitle>
            <p className="text-xs text-slate-600">
              Saved on this device only. Create an account to sync chats across
              devices.
            </p>
          </DialogHeader>

          <div className="max-h-[min(52dvh,420px)] overflow-y-auto px-2 py-2">
            {conversations.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-slate-600">
                No saved chats yet. Start a conversation and it will appear
                here.
              </p>
            ) : (
              <ul className="space-y-1">
                {conversations.map((conversation) => {
                  const isActive = conversation.id === activeConversationId;
                  const menuOpen = menuOpenId === conversation.id;

                  return (
                    <li key={conversation.id} className="relative">
                      <div
                        className={cn(
                          "group flex items-start rounded-xl border border-transparent",
                          isActive
                            ? "bg-[#F4ECF8] border-violet-100"
                            : "hover:bg-[#F4ECF8]/60"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleResume(conversation.id)}
                          className="flex min-w-0 flex-1 flex-col gap-0.5 px-3 py-2.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#6E46C7]/30"
                        >
                          <span className="truncate text-sm font-medium text-[#1A1224]">
                            {conversation.title}
                          </span>
                          <span className="line-clamp-1 text-xs text-slate-600">
                            {conversation.preview}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {formatRelativeTime(conversation.updatedAt)}
                          </span>
                        </button>

                        <div className="relative shrink-0 pr-1 pt-1.5" ref={menuOpen ? menuRef : undefined}>
                          <button
                            type="button"
                            aria-label="Conversation options"
                            aria-expanded={menuOpen}
                            onClick={() =>
                              setMenuOpenId((current) =>
                                current === conversation.id
                                  ? null
                                  : conversation.id
                              )
                            }
                            className="flex size-8 items-center justify-center rounded-lg text-slate-600 transition hover:bg-white/80 hover:text-[#1A1224]"
                          >
                            <MoreHorizontal className="size-4" aria-hidden />
                          </button>

                          {menuOpen ? (
                            <div className="absolute right-0 top-9 z-20 min-w-36 rounded-xl border border-violet-100 bg-white p-1 shadow-lg">
                              <button
                                type="button"
                                onClick={() => {
                                  setRenameTarget(conversation);
                                  setRenameValue(conversation.title);
                                  setMenuOpenId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-[#1A1224] hover:bg-[#F4ECF8]"
                              >
                                <Pencil className="size-3.5" aria-hidden />
                                Rename
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onDelete(conversation.id);
                                  setMenuOpenId(null);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-rose-700 hover:bg-rose-50"
                              >
                                <Trash2 className="size-3.5" aria-hidden />
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
            )}
          </div>

          {conversations.length > 0 ? (
            <div className="border-t border-violet-100 px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  onClearAll();
                  setOpen(false);
                }}
                className="h-8 px-2 text-xs text-slate-600 hover:text-rose-700"
              >
                Clear all guest chats
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(renameTarget)}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            setRenameTarget(null);
            setRenameValue("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(event) => setRenameValue(event.target.value)}
            placeholder="Chat title"
            maxLength={80}
            autoFocus
          />
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setRenameTarget(null);
                setRenameValue("");
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleRenameSubmit}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
