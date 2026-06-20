"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FolderOpen, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import {
  createFolderAction,
  deleteFolderAction,
  updateFolderAction,
} from "@/actions/folder.actions";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FolderFormDialog } from "@/components/folders/FolderFormDialog";
import type { FolderListItem } from "@/types/folder";

interface FoldersListProps {
  folders: FolderListItem[];
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function FoldersList({ folders }: FoldersListProps) {
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageHeader
          title="My Folders"
          description="Organise reviews into personal collections. Save the best finds for later."
        />
        <Button
          className="shrink-0"
          onClick={() => setCreateOpen(true)}
          aria-label="Create folder"
        >
          <Plus data-icon="inline-start" aria-hidden="true" />
          Create folder
        </Button>
      </div>

      {folders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-white px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <FolderOpen size={24} aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold">No folders yet</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your first folder to start saving reviews from any review page.
          </p>
          <Button className="mt-6" onClick={() => setCreateOpen(true)}>
            <Plus data-icon="inline-start" aria-hidden="true" />
            Create folder
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <Card
              key={folder.id}
              className="relative h-full overflow-hidden rounded-2xl border-border/60 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="h-2 gradient-moonverse" aria-hidden="true" />
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-moon-purple-soft text-primary">
                    <FolderOpen size={22} aria-hidden="true" />
                  </div>
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Folder options for ${folder.name}`}
                      aria-expanded={menuOpenId === folder.id}
                      aria-haspopup="menu"
                      onClick={() =>
                        setMenuOpenId((current) =>
                          current === folder.id ? null : folder.id
                        )
                      }
                    >
                      <MoreVertical aria-hidden="true" />
                    </Button>
                    {menuOpenId === folder.id && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          aria-hidden="true"
                          onClick={() => setMenuOpenId(null)}
                        />
                        <div
                          role="menu"
                          className="absolute right-0 z-50 mt-1 min-w-[140px] rounded-lg border border-border/60 bg-popover p-1 shadow-md"
                        >
                          <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-muted"
                            onClick={() => {
                              setMenuOpenId(null);
                              setEditFolder(folder);
                            }}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            Edit
                          </button>
                          <button
                            type="button"
                            role="menuitem"
                            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted"
                            onClick={() => {
                              setMenuOpenId(null);
                              setDeleteFolder(folder);
                              setDeleteError(null);
                            }}
                          >
                            <Trash2 size={14} aria-hidden="true" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                <CardTitle>
                  <Link
                    href={`/folders/${folder.id}`}
                    className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-sm"
                  >
                    {folder.name}
                  </Link>
                </CardTitle>
                {folder.description && (
                  <CardDescription>{folder.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {folder.reviewCount} review
                  {folder.reviewCount !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  {folder.isPublic ? (
                    <Badge variant="secondary">Public</Badge>
                  ) : (
                    <Badge variant="outline">Private</Badge>
                  )}
                  <time
                    dateTime={folder.createdAt}
                    className="text-xs text-muted-foreground"
                  >
                    Created {formatDate(folder.createdAt)}
                  </time>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
          {deleteError && (
            <p className="text-sm text-destructive" role="alert">
              {deleteError}
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteFolder(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              Delete folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
