"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bookmark, Plus } from "lucide-react";
import {
  addReviewToFolderAction,
  createFolderAction,
  removeReviewFromFolderAction,
} from "@/actions/folder.actions";
import { useSignInPrompt } from "@/components/auth/SignInPromptProvider";
import { FolderFormDialog } from "@/components/folders/FolderFormDialog";
import { Button } from "@/components/ui/button";
import { publishCommunityReviewSync } from "@/lib/community-feed-sync";
import { cn } from "@/lib/utils";
import type { FolderListItem } from "@/types/folder";

interface AddToFolderMenuProps {
  reviewId: string;
  folders: FolderListItem[];
  savedFolderIds: string[];
  isLoggedIn: boolean;
  /** Flat ghost styling for post action bars. */
  appearance?: "default" | "toolbar" | "pill";
  buttonId?: string;
  saveCount?: number;
}

export function AddToFolderMenu({
  reviewId,
  folders,
  savedFolderIds,
  isLoggedIn,
  appearance = "default",
  buttonId,
  saveCount = 0,
}: AddToFolderMenuProps) {
  const router = useRouter();
  const { promptSignIn } = useSignInPrompt();
  const buttonRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localSavedIds, setLocalSavedIds] = useState(savedFolderIds);
  const [publicSaveCount, setPublicSaveCount] = useState(saveCount);
  const savedFolderKey = savedFolderIds.join("\0");

  useEffect(() => {
    setLocalSavedIds(savedFolderIds);
  }, [savedFolderKey, savedFolderIds]);

  useEffect(() => {
    setPublicSaveCount(saveCount);
  }, [saveCount]);

  const updateMenuPosition = useCallback(() => {
    const anchor = buttonRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - 32);
    const menuHeight = menuRef.current?.offsetHeight ?? 280;
    const gap = 8;
    const isSmUp = window.matchMedia("(min-width: 640px)").matches;

    let left = isSmUp ? rect.left : rect.right - width;
    left = Math.min(Math.max(8, left), window.innerWidth - width - 8);

    const spaceBelow = window.innerHeight - rect.bottom - gap;
    const spaceAbove = rect.top - gap;
    let top =
      spaceBelow >= menuHeight || spaceBelow >= spaceAbove
        ? rect.bottom + gap
        : rect.top - menuHeight - gap;
    top = Math.min(Math.max(8, top), window.innerHeight - menuHeight - 8);

    setMenuCoords({ top, left });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setMenuCoords(null);
      return;
    }
    updateMenuPosition();
  }, [open, updateMenuPosition]);

  useLayoutEffect(() => {
    if (!open || !menuRef.current) return;
    updateMenuPosition();
  }, [open, folders.length, localSavedIds.length, error, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const handleReposition = () => updateMenuPosition();
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleToggle = () => {
    if (!isLoggedIn) {
      promptSignIn(`/reviews/${reviewId}`);
      return;
    }
    setError(null);
    setOpen((current) => !current);
  };

  const handleFolderToggle = (folderId: string, checked: boolean) => {
    setError(null);

    const previous = localSavedIds;
    const previousSaveCount = publicSaveCount;
    const nextIds = checked
      ? previous.includes(folderId)
        ? previous
        : [...previous, folderId]
      : previous.filter((id) => id !== folderId);
    const wasSaved = previous.length > 0;
    const isSaved = nextIds.length > 0;
    const nextSaveCount =
      !wasSaved && isSaved
        ? publicSaveCount + 1
        : wasSaved && !isSaved
          ? Math.max(0, publicSaveCount - 1)
          : publicSaveCount;
    setLocalSavedIds(nextIds);
    setPublicSaveCount(nextSaveCount);
    publishCommunityReviewSync({
      reviewId,
      savedFolderIds: nextIds,
      saveCount: nextSaveCount,
    });

    startTransition(async () => {
      const result = checked
        ? await addReviewToFolderAction(folderId, reviewId)
        : await removeReviewFromFolderAction(folderId, reviewId);

      if (!result.success) {
        setLocalSavedIds(previous);
        setPublicSaveCount(previousSaveCount);
        publishCommunityReviewSync({
          reviewId,
          savedFolderIds: previous,
          saveCount: previousSaveCount,
        });
        setError(result.error);
        return;
      }
      if (result.saveCount !== undefined) {
        setPublicSaveCount(result.saveCount);
        publishCommunityReviewSync({
          reviewId,
          savedFolderIds: nextIds,
          saveCount: result.saveCount,
        });
      }
    });
  };

  const handleCreateFolder = async (values: {
    name: string;
    description: string;
    isPublic: boolean;
  }) => {
    const result = await createFolderAction({
      name: values.name,
      description: values.description || undefined,
      isPublic: values.isPublic,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    if (result.folderId) {
      const addResult = await addReviewToFolderAction(result.folderId, reviewId);
      if (!addResult.success) {
        return { success: false, error: addResult.error };
      }
      if (addResult.saveCount !== undefined) {
        setPublicSaveCount(addResult.saveCount);
      }
      const nextIds = localSavedIds.includes(result.folderId!)
        ? localSavedIds
        : [...localSavedIds, result.folderId!];
      setLocalSavedIds(nextIds);
      publishCommunityReviewSync({ reviewId, savedFolderIds: nextIds });
    }

    router.refresh();
    setCreateOpen(false);
    return { success: true };
  };

  const savedCount = localSavedIds.length;
  const toolbar = appearance === "toolbar";
  const pill = appearance === "pill";

  const menuPanel =
    open && isLoggedIn && menuCoords ? (
      <div
        ref={menuRef}
        role="listbox"
        aria-label="Choose folders"
        style={{ top: menuCoords.top, left: menuCoords.left }}
        className="fixed z-[90] w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-border/60 bg-popover p-3 shadow-lg"
      >
        <p className="mb-2 text-sm font-medium">Save to folder</p>

        {folders.length === 0 ? (
          <p className="mb-3 text-sm text-muted-foreground">
            You have no folders yet. Create one below.
          </p>
        ) : (
          <ul className="mb-3 max-h-48 space-y-1 overflow-y-auto">
            {folders.map((folder) => {
              const checked = localSavedIds.includes(folder.id);
              return (
                <li key={folder.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={isPending}
                      onChange={(event) =>
                        handleFolderToggle(folder.id, event.target.checked)
                      }
                      className="size-4 rounded border-border accent-primary"
                      aria-label={`${checked ? "Remove from" : "Add to"} ${folder.name}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {folder.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {folder.reviewCount}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            setOpen(false);
            setCreateOpen(true);
          }}
          disabled={isPending}
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          Create new folder
        </Button>

        {error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    ) : null;

  return (
    <>
      <div className="relative w-full" ref={buttonRef}>
        <Button
          id={buttonId}
          variant={toolbar || pill ? "ghost" : savedCount > 0 ? "default" : "outline"}
          size="sm"
          onClick={handleToggle}
          aria-expanded={open}
          aria-haspopup="dialog"
          aria-label={
            savedCount > 0
              ? `Saved to ${savedCount} folder${savedCount !== 1 ? "s" : ""}`
              : "Save to folder"
          }
          className={cn(
            toolbar &&
              "min-h-11 w-full rounded-lg px-1 text-[12px] font-semibold text-[var(--mv-text-muted,#746C7D)] sm:min-h-10 sm:px-1.5 sm:text-[13px] hover:bg-[var(--mv-paper,#F5EFE6)] hover:text-[var(--mv-ink,#171329)]",
            toolbar &&
              savedCount > 0 &&
              "text-[var(--mv-gold,#C99B45)] hover:bg-[var(--mv-paper,#F5EFE6)] hover:text-[var(--mv-gold,#C99B45)]",
            pill &&
              "inline-flex h-10 min-w-0 w-full flex-1 items-center justify-center gap-1.5 rounded-full border-0 bg-transparent px-2 text-[13px] font-semibold text-[#5a4d72] shadow-none hover:bg-[#6E46C7]/[0.06] hover:text-[#1a1033] sm:px-3",
            pill &&
              savedCount > 0 &&
              "text-[#6E46C7] hover:bg-[#6E46C7]/[0.06] hover:text-[#6E46C7]"
          )}
        >
          <Bookmark
            data-icon="inline-start"
            className={cn(savedCount > 0 && "fill-current")}
            aria-hidden="true"
          />
          {pill ? (
            <>
              <span>{savedCount > 0 ? "Saved" : "Save"}</span>
              <span className="tabular-nums">{publicSaveCount}</span>
            </>
          ) : savedCount > 0 ? (
            toolbar ? (
              `Saved ${savedCount}`
            ) : (
              `Saved (${savedCount})`
            )
          ) : toolbar ? (
            "Save"
          ) : (
            "Save to Folder"
          )}
        </Button>
      </div>

      {typeof document !== "undefined" && menuPanel
        ? createPortal(menuPanel, document.body)
        : null}

      <FolderFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSubmit={handleCreateFolder}
      />
    </>
  );
}
