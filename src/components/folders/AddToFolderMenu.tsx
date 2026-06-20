"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bookmark, Plus } from "lucide-react";
import {
  addReviewToFolderAction,
  createFolderAction,
  removeReviewFromFolderAction,
} from "@/actions/folder.actions";
import { FolderFormDialog } from "@/components/folders/FolderFormDialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FolderListItem } from "@/types/folder";

interface AddToFolderMenuProps {
  reviewId: string;
  folders: FolderListItem[];
  savedFolderIds: string[];
  isLoggedIn: boolean;
}

export function AddToFolderMenu({
  reviewId,
  folders,
  savedFolderIds,
  isLoggedIn,
}: AddToFolderMenuProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    if (!isLoggedIn) {
      setAuthMessage("Log in to save this review to a folder.");
      return;
    }
    setAuthMessage(null);
    setError(null);
    setOpen((current) => !current);
  };

  const handleFolderToggle = (folderId: string, checked: boolean) => {
    setError(null);

    startTransition(async () => {
      const result = checked
        ? await addReviewToFolderAction(folderId, reviewId)
        : await removeReviewFromFolderAction(folderId, reviewId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.refresh();
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
    }

    router.refresh();
    setCreateOpen(false);
    return { success: true };
  };

  const savedCount = savedFolderIds.length;

  return (
    <div className="relative" ref={menuRef}>
      {authMessage && (
        <p className="mb-2 text-sm text-muted-foreground" role="status">
          {authMessage}{" "}
          <Link
            href={`/login?callbackUrl=/reviews/${reviewId}`}
            className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
          >
            Log in
          </Link>
        </p>
      )}

      <Button
        variant={savedCount > 0 ? "default" : "outline"}
        size="sm"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={
          savedCount > 0
            ? `Saved to ${savedCount} folder${savedCount !== 1 ? "s" : ""}`
            : "Save to folder"
        }
      >
        <Bookmark
          data-icon="inline-start"
          className={cn(savedCount > 0 && "fill-current")}
          aria-hidden="true"
        />
        {savedCount > 0 ? `Saved (${savedCount})` : "Save to Folder"}
      </Button>

      {open && isLoggedIn && (
        <div
          role="listbox"
          aria-label="Choose folders"
          className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-border/60 bg-popover p-3 shadow-lg"
        >
          <p className="mb-2 text-sm font-medium">Save to folder</p>

          {folders.length === 0 ? (
            <p className="mb-3 text-sm text-muted-foreground">
              You have no folders yet. Create one below.
            </p>
          ) : (
            <ul className="mb-3 max-h-48 space-y-1 overflow-y-auto">
              {folders.map((folder) => {
                const checked = savedFolderIds.includes(folder.id);
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

          {error && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      )}

      <FolderFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSubmit={handleCreateFolder}
      />
    </div>
  );
}
