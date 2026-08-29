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

interface FolderMenuState {
  reviewId: string;
  baselineSavedFolderKey: string;
  baselineSaveCount: number;
  localSavedIds: string[];
  publicSaveCount: number;
  mutationPending: boolean;
}

function savedFolderIdsKey(folderIds: string[]) {
  return [...folderIds].sort().join("\0");
}

function createFolderMenuState(
  reviewId: string,
  savedFolderIds: string[],
  saveCount: number
): FolderMenuState {
  return {
    reviewId,
    baselineSavedFolderKey: savedFolderIdsKey(savedFolderIds),
    baselineSaveCount: saveCount,
    localSavedIds: savedFolderIds,
    publicSaveCount: saveCount,
    mutationPending: false,
  };
}

function nextPublicSaveCount(
  previousIds: string[],
  nextIds: string[],
  previousSaveCount: number
) {
  const wasSaved = previousIds.length > 0;
  const isSaved = nextIds.length > 0;
  if (!wasSaved && isSaved) return previousSaveCount + 1;
  if (wasSaved && !isSaved) return Math.max(0, previousSaveCount - 1);
  return previousSaveCount;
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
  const mutationGenerationRef = useRef(0);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [menuCoords, setMenuCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [errorRecord, setErrorRecord] = useState<{
    reviewId: string;
    message: string;
  } | null>(null);
  const [folderMenu, setFolderMenu] = useState(() =>
    createFolderMenuState(reviewId, savedFolderIds, saveCount)
  );

  let nextFolderMenu = folderMenu;
  if (folderMenu.reviewId !== reviewId) {
    nextFolderMenu = createFolderMenuState(reviewId, savedFolderIds, saveCount);
    setFolderMenu(nextFolderMenu);
  } else if (!folderMenu.mutationPending && !isPending) {
    const incomingKey = savedFolderIdsKey(savedFolderIds);
    const idsChanged = incomingKey !== folderMenu.baselineSavedFolderKey;
    const countChanged = saveCount !== folderMenu.baselineSaveCount;
    if (idsChanged || countChanged) {
      nextFolderMenu = {
        ...folderMenu,
        baselineSavedFolderKey: idsChanged
          ? incomingKey
          : folderMenu.baselineSavedFolderKey,
        localSavedIds: idsChanged ? savedFolderIds : folderMenu.localSavedIds,
        baselineSaveCount: countChanged ? saveCount : folderMenu.baselineSaveCount,
        publicSaveCount: countChanged ? saveCount : folderMenu.publicSaveCount,
      };
      setFolderMenu(nextFolderMenu);
    }
  }

  const localSavedIds = nextFolderMenu.localSavedIds;
  const publicSaveCount = nextFolderMenu.publicSaveCount;
  const error =
    errorRecord && errorRecord.reviewId === reviewId ? errorRecord.message : null;

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

  const closeMenu = useCallback(() => {
    setOpen(false);
    setMenuCoords(null);
  }, []);

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
      closeMenu();
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [closeMenu, open]);

  const handleToggle = () => {
    if (!isLoggedIn) {
      promptSignIn(`/reviews/${reviewId}`);
      return;
    }
    setErrorRecord(null);
    if (open) {
      closeMenu();
      return;
    }
    updateMenuPosition();
    setOpen(true);
  };

  const handleFolderToggle = (folderId: string, checked: boolean) => {
    setErrorRecord(null);

    const previous = nextFolderMenu.localSavedIds;
    const previousSaveCount = nextFolderMenu.publicSaveCount;
    const nextIds = checked
      ? previous.includes(folderId)
        ? previous
        : [...previous, folderId]
      : previous.filter((id) => id !== folderId);
    const nextSaveCount = nextPublicSaveCount(
      previous,
      nextIds,
      previousSaveCount
    );
    const requestReviewId = reviewId;
    const requestId = mutationGenerationRef.current + 1;
    mutationGenerationRef.current = requestId;

    setFolderMenu((current) => {
      if (current.reviewId !== requestReviewId) return current;
      return {
        ...current,
        localSavedIds: nextIds,
        publicSaveCount: nextSaveCount,
        mutationPending: true,
      };
    });
    publishCommunityReviewSync({
      reviewId: requestReviewId,
      savedFolderIds: nextIds,
      saveCount: nextSaveCount,
    });

    startTransition(async () => {
      try {
        const result = checked
          ? await addReviewToFolderAction(folderId, requestReviewId)
          : await removeReviewFromFolderAction(folderId, requestReviewId);

        if (mutationGenerationRef.current !== requestId) return;

        if (!result.success) {
          setFolderMenu((current) => {
            if (current.reviewId !== requestReviewId) return current;
            return {
              ...current,
              localSavedIds: previous,
              publicSaveCount: previousSaveCount,
              mutationPending: false,
            };
          });
          publishCommunityReviewSync({
            reviewId: requestReviewId,
            savedFolderIds: previous,
            saveCount: previousSaveCount,
          });
          setErrorRecord({
            reviewId: requestReviewId,
            message: result.error,
          });
          return;
        }
        if (result.saveCount !== undefined) {
          const serverSaveCount = result.saveCount;
          setFolderMenu((current) => {
            if (current.reviewId !== requestReviewId) return current;
            return {
              ...current,
              publicSaveCount: serverSaveCount,
              mutationPending: false,
            };
          });
          publishCommunityReviewSync({
            reviewId: requestReviewId,
            savedFolderIds: nextIds,
            saveCount: serverSaveCount,
          });
        }
      } finally {
        if (mutationGenerationRef.current !== requestId) return;
        setFolderMenu((current) => {
          if (current.reviewId !== requestReviewId) return current;
          if (!current.mutationPending) return current;
          return { ...current, mutationPending: false };
        });
      }
    });
  };

  const handleCreateFolder = async (values: {
    name: string;
    description: string;
    isPublic: boolean;
  }) => {
    const requestReviewId = reviewId;
    const snapshotIds = nextFolderMenu.localSavedIds;
    const snapshotSaveCount = nextFolderMenu.publicSaveCount;
    const requestId = mutationGenerationRef.current + 1;
    mutationGenerationRef.current = requestId;

    setFolderMenu((current) => {
      if (current.reviewId !== requestReviewId) return current;
      return { ...current, mutationPending: true };
    });

    try {
      const result = await createFolderAction({
        name: values.name,
        description: values.description || undefined,
        isPublic: values.isPublic,
      });

      if (!result.success) {
        return { success: false, error: result.error };
      }

      if (result.folderId) {
        const addResult = await addReviewToFolderAction(
          result.folderId,
          requestReviewId
        );
        if (!addResult.success) {
          return { success: false, error: addResult.error };
        }

        if (mutationGenerationRef.current === requestId) {
          const nextIds = snapshotIds.includes(result.folderId)
            ? snapshotIds
            : [...snapshotIds, result.folderId];
          const optimisticCount = nextPublicSaveCount(
            snapshotIds,
            nextIds,
            snapshotSaveCount
          );
          const nextSaveCount =
            addResult.saveCount !== undefined
              ? addResult.saveCount
              : optimisticCount;

          setFolderMenu((current) => {
            if (current.reviewId !== requestReviewId) return current;
            return {
              ...current,
              localSavedIds: nextIds,
              publicSaveCount: nextSaveCount,
              mutationPending: false,
            };
          });
          publishCommunityReviewSync({
            reviewId: requestReviewId,
            savedFolderIds: nextIds,
          });
        }
      }

      router.refresh();
      setCreateOpen(false);
      return { success: true };
    } finally {
      if (mutationGenerationRef.current === requestId) {
        setFolderMenu((current) => {
          if (current.reviewId !== requestReviewId) return current;
          if (!current.mutationPending) return current;
          return { ...current, mutationPending: false };
        });
      }
    }
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
            closeMenu();
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
