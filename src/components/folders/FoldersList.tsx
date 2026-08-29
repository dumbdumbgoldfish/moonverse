"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookOpen, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import {
  createFolderAction,
  deleteFolderAction,
  updateFolderAction,
} from "@/actions/folder.actions";
import { FolderFormDialog } from "@/components/folders/FolderFormDialog";
import { LibraryListCard } from "@/components/folders/LibraryListCard";
import { NovelCoverCard } from "@/components/discovery/NovelCoverCard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FolderListItem } from "@/types/folder";
import type { ReadingListPreview } from "@/types/discovery";
import type { ReviewListItem } from "@/types/review";

interface FoldersListProps {
  folders: FolderListItem[];
  readingLists?: ReadingListPreview[];
  continueReading?: ReviewListItem[];
}

export function FoldersList({
  folders,
  readingLists = [],
  continueReading = [],
}: FoldersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editFolder, setEditFolder] = useState<FolderListItem | null>(null);
  const [deleteFolder, setDeleteFolder] = useState<FolderListItem | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const handleCreate = async (values: {
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

    router.refresh();
    return { success: true };
  };

  const handleEdit = async (values: {
    name: string;
    description: string;
    isPublic: boolean;
  }) => {
    if (!editFolder) {
      return { success: false, error: "No folder selected." };
    }

    const result = await updateFolderAction(editFolder.id, {
      name: values.name,
      description: values.description || null,
      isPublic: values.isPublic,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    router.refresh();
    return { success: true };
  };

  const handleDelete = () => {
    if (!deleteFolder) return;

    setDeleteError(null);
    startTransition(async () => {
      const result = await deleteFolderAction(deleteFolder.id);
      if (!result.success) {
        setDeleteError(result.error);
        return;
      }
      setDeleteFolder(null);
      router.refresh();
    });
  };

  const isEmpty = folders.length === 0 && continueReading.length === 0;

  return (
    <div className={cn(SITE_SHELL_CLASS, "space-y-8 py-6")}>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E46C7]">
            Your shelf
          </p>
          <h1 className="mt-1 font-serif text-2xl font-medium tracking-tight text-[#1A1224] sm:text-[1.75rem]">
            Library
          </h1>
          <p className="mt-1 text-[13px] text-[#1A1224]/55">
            Continue reading, saved stories, and your lists.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)} aria-label="Create reading list">
          <Plus data-icon="inline-start" aria-hidden />
          New list
        </Button>
      </header>

      {continueReading.length > 0 ? (
        <section className="rounded-[1.25rem] border border-[#1A1224]/8 bg-white p-4 shadow-[0_20px_48px_-36px_rgba(26,18,36,0.15)] sm:p-5">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E46C7]">
              In progress
            </p>
            <h2 className="mt-1 font-serif text-xl font-medium tracking-tight text-[#1A1224]">
              Continue reading
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {continueReading.map((review, index) => (
              <NovelCoverCard
                key={review.id}
                href={`/reviews/${review.id}`}
                coverUrl={review.coverUrl}
                title={review.novelTitle}
                viewCount={review.likeCount}
                tags={review.genres}
                progress={40 + (index % 3) * 20}
                size="lg"
                showTitle
                className="w-full"
              />
            ))}
          </div>
        </section>
      ) : null}

      {isEmpty ? (
        <div className="rounded-[1.25rem] border border-dashed border-[#1A1224]/15 bg-[#FBF7F1]/60 px-6 py-16 text-center">
          <BookOpen className="mx-auto size-10 text-[#6E46C7]/40" aria-hidden />
          <p className="mt-4 font-serif text-lg text-[#1A1224]">Your library is empty</p>
          <p className="mx-auto mt-2 max-w-sm text-[13px] text-[#1A1224]/55">
            Save reviews while browsing and they&apos;ll show up here.
          </p>
          <Button onClick={() => setCreateOpen(true)} className="mt-5" size="sm">
            <Plus data-icon="inline-start" aria-hidden />
            Create reading list
          </Button>
        </div>
      ) : folders.length > 0 ? (
        <section>
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E46C7]">
                Collections
              </p>
              <h2 className="mt-1 font-serif text-xl font-medium tracking-tight text-[#1A1224]">
                Reading lists
              </h2>
            </div>
            <span className="text-[13px] text-[#1A1224]/45">
              {folders.length} {folders.length === 1 ? "list" : "lists"}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {readingLists.length > 0
              ? readingLists.map((list) => {
                  const folder = folders.find((item) => item.id === list.id);
                  return (
                    <div key={list.id} className="relative">
                      <LibraryListCard list={list} />
                      {folder ? (
                        <div className="absolute right-2 top-2">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            className="bg-white/90 shadow-sm backdrop-blur-sm"
                            aria-label={`Options for ${folder.name}`}
                            onClick={() =>
                              setMenuOpenId((current) =>
                                current === folder.id ? null : folder.id,
                              )
                            }
                          >
                            <MoreVertical aria-hidden />
                          </Button>
                          {menuOpenId === folder.id ? (
                            <>
                              <div
                                className="fixed inset-0 z-40"
                                onClick={() => setMenuOpenId(null)}
                              />
                              <div className="absolute right-0 z-50 mt-1 min-w-[120px] rounded-lg bg-white p-1 shadow-lg ring-1 ring-[#1A1224]/8">
                                <button
                                  type="button"
                                  className="flex w-full gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setEditFolder(folder);
                                  }}
                                >
                                  <Pencil size={14} /> Edit
                                </button>
                                <button
                                  type="button"
                                  className="flex w-full gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted"
                                  onClick={() => {
                                    setMenuOpenId(null);
                                    setDeleteFolder(folder);
                                  }}
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  );
                })
              : folders.map((folder) => (
                  <Link
                    key={folder.id}
                    href={`/folders/${folder.id}`}
                    className="rounded-[1.25rem] border border-[#1A1224]/8 bg-white p-4 transition hover:border-[#6E46C7]/25 hover:shadow-[0_12px_28px_-20px_rgba(110,70,199,0.35)]"
                  >
                    <p className="font-serif text-lg font-medium text-[#1A1224]">
                      {folder.name}
                    </p>
                    <p className="mt-1 text-[13px] text-[#1A1224]/50">
                      {folder.reviewCount}{" "}
                      {folder.reviewCount === 1 ? "story" : "stories"}
                    </p>
                  </Link>
                ))}
          </div>
        </section>
      ) : null}

      <FolderFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        mode="create"
        onSubmit={handleCreate}
      />

      <FolderFormDialog
        open={!!editFolder}
        onOpenChange={(open) => {
          if (!open) setEditFolder(null);
        }}
        mode="edit"
        initialFolder={editFolder ?? undefined}
        onSubmit={handleEdit}
      />

      <Dialog
        open={!!deleteFolder}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteFolder(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete folder</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteFolder?.name}&rdquo;?
              Saved reviews will be removed from this folder but will remain on
              MoonVerse.
            </DialogDescription>
          </DialogHeader>
          {deleteError ? (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteFolder(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="size-4" aria-hidden />
              Delete folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
