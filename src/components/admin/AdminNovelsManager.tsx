"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createNovelAction,
  deleteNovelAction,
  mergeNovelsAction,
  updateNovelAction,
} from "@/actions/admin.actions";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { AdminScrollPanel, AdminTabs } from "@/components/admin/AdminLayoutPrimitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ADMIN_FILTER_CHIP_ACTIVE, ADMIN_FILTER_CHIP_BASE, ADMIN_FILTER_CHIP_IDLE, ADMIN_FILTER_CHIP_ROW_CLASS, ADMIN_FORM_CARD_CLASS, ADMIN_LIGHT_FIELD_CLASS } from "@/components/admin/admin-styles";
import {
  AdminTableCell,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
  AdminTableTh,
} from "@/components/admin/AdminUi";
import { formatDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import type { AdminNovelSummary } from "@/types/admin";

interface Option {
  id: string;
  name: string;
}

interface AdminNovelsManagerProps {
  novels: AdminNovelSummary[];
  genres: Option[];
  tags: Option[];
}

export function AdminNovelsManager({
  novels,
  genres,
  tags,
}: AdminNovelsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("catalog");

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);
  const [mergeSourceId, setMergeSourceId] = useState("");
  const [mergeTargetId, setMergeTargetId] = useState("");
  const [mergeError, setMergeError] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setAuthor("");
    setCoverUrl("");
    setExternalLink("");
    setGenreIds([]);
    setTagIds([]);
    setError(null);
  };

  const toggleId = (list: string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

  const startEdit = (novel: AdminNovelSummary) => {
    setEditingId(novel.id);
    setTitle(novel.title);
    setAuthor(novel.author ?? "");
    setCoverUrl(novel.coverUrl ?? "");
    setExternalLink(novel.externalLink ?? "");
    setGenreIds(novel.genreIds);
    setTagIds(novel.tagIds);
    setActiveTab("editor");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const payload = { title, author, coverUrl, externalLink, genreIds, tagIds };
      const result = editingId
        ? await updateNovelAction(editingId, payload)
        : await createNovelAction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      resetForm();
      setActiveTab("catalog");
      router.refresh();
    });
  };

  const catalogPanel = (
    <AdminScrollPanel maxHeight="calc(100dvh - 14rem)">
      <AdminTableShell minWidth="700px">
        <AdminTableHead>
          <tr>
            <AdminTableTh>Novel</AdminTableTh>
            <AdminTableTh>Reviews</AdminTableTh>
            <AdminTableTh>Taxonomy</AdminTableTh>
            <AdminTableTh>Actions</AdminTableTh>
          </tr>
        </AdminTableHead>
        <tbody>
          {novels.map((novel) => (
            <AdminTableRow key={novel.id}>
              <AdminTableCell>
                <p className="font-semibold text-white/90">{novel.title}</p>
                {novel.author ? (
                  <p className="text-xs text-white/70">by {novel.author}</p>
                ) : null}
                <p className="text-xs text-white/70">{formatDate(novel.createdAt)}</p>
              </AdminTableCell>
              <AdminTableCell>{novel.reviewCount}</AdminTableCell>
              <AdminTableCell className="text-xs text-white/70">
                {novel.genreNames.join(", ") || "—"}
                <br />
                {novel.tagNames.join(", ") || "—"}
              </AdminTableCell>
              <AdminTableCell>
                <div className="flex flex-wrap gap-2">
                  <Button size="xs" variant="outline" onClick={() => startEdit(novel)}>
                    Edit
                  </Button>
                  <AdminConfirmDialog
                    title="Delete novel"
                    description={`Delete "${novel.title}"? Only allowed if it has no reviews.`}
                    confirmLabel="Delete"
                    onConfirm={() => deleteNovelAction(novel.id)}
                  />
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </tbody>
      </AdminTableShell>
    </AdminScrollPanel>
  );

  const editorPanel = (
    <form onSubmit={handleSubmit} className={cn("space-y-4", ADMIN_FORM_CARD_CLASS)}>
      <h2 className="text-lg font-semibold">{editingId ? "Edit novel" : "Create novel"}</h2>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="novel-title">Title</Label>
          <Input id="novel-title" value={title} onChange={(e) => setTitle(e.target.value)} required disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="novel-author">Author</Label>
          <Input id="novel-author" value={author} onChange={(e) => setAuthor(e.target.value)} disabled={isPending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="novel-cover">Cover URL</Label>
          <Input id="novel-cover" value={coverUrl} onChange={(e) => setCoverUrl(e.target.value)} disabled={isPending} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="novel-link">External link</Label>
          <Input id="novel-link" value={externalLink} onChange={(e) => setExternalLink(e.target.value)} disabled={isPending} />
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Genres</p>
        <div className={ADMIN_FILTER_CHIP_ROW_CLASS}>
          {genres.map((genre) => (
            <button
              key={genre.id}
              type="button"
              disabled={isPending}
              onClick={() => setGenreIds((c) => toggleId(c, genre.id))}
              className={cn(
                ADMIN_FILTER_CHIP_BASE,
                "text-xs",
                genreIds.includes(genre.id)
                  ? ADMIN_FILTER_CHIP_ACTIVE
                  : ADMIN_FILTER_CHIP_IDLE
              )}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Tags</p>
        <div className={ADMIN_FILTER_CHIP_ROW_CLASS}>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              disabled={isPending}
              onClick={() => setTagIds((c) => toggleId(c, tag.id))}
              className={cn(
                ADMIN_FILTER_CHIP_BASE,
                "text-xs",
                tagIds.includes(tag.id)
                  ? ADMIN_FILTER_CHIP_ACTIVE
                  : ADMIN_FILTER_CHIP_IDLE
              )}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={isPending}>
          {editingId ? "Save novel" : "Create novel"}
        </Button>
        {editingId ? (
          <Button type="button" variant="outline" onClick={resetForm}>
            Cancel edit
          </Button>
        ) : null}
      </div>
    </form>
  );

  const mergePanel = (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setMergeError(null);
        if (!mergeSourceId || !mergeTargetId) {
          setMergeError("Select both a source and target novel.");
          return;
        }
        if (mergeSourceId === mergeTargetId) {
          setMergeError("Source and target must be different novels.");
          return;
        }
        startTransition(async () => {
          const result = await mergeNovelsAction(mergeSourceId, mergeTargetId);
          if (!result.success) {
            setMergeError(result.error);
            return;
          }
          setMergeSourceId("");
          setMergeTargetId("");
          router.refresh();
        });
      }}
      className={cn("space-y-4", ADMIN_FORM_CARD_CLASS)}
    >
      <h2 className="text-lg font-semibold">Merge duplicate novels</h2>
      <p className="text-sm text-muted-foreground">
        Moves reviews, links, and taxonomy from the source novel into the target, then deletes the source.
      </p>
      {mergeError ? (
        <p className="text-sm text-destructive" role="alert">
          {mergeError}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="merge-source">Source (will be removed)</Label>
          <select
            id="merge-source"
            value={mergeSourceId}
            onChange={(e) => setMergeSourceId(e.target.value)}
            disabled={isPending}
            className={ADMIN_LIGHT_FIELD_CLASS}
          >
            <option value="">Select novel…</option>
            {novels.map((novel) => (
              <option key={novel.id} value={novel.id}>
                {novel.title}
                {novel.author ? ` · ${novel.author}` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="merge-target">Target (kept)</Label>
          <select
            id="merge-target"
            value={mergeTargetId}
            onChange={(e) => setMergeTargetId(e.target.value)}
            disabled={isPending}
            className={ADMIN_LIGHT_FIELD_CLASS}
          >
            <option value="">Select novel…</option>
            {novels.map((novel) => (
              <option key={novel.id} value={novel.id}>
                {novel.title}
                {novel.author ? ` · ${novel.author}` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>
      <Button type="submit" variant="destructive" disabled={isPending}>
        Merge novels
      </Button>
    </form>
  );

  const handleTabChange = (tabId: string) => {
    if (activeTab === "editor" && tabId !== "editor") {
      resetForm();
    }
    setActiveTab(tabId);
  };

  return (
    <AdminTabs
      activeId={activeTab}
      onActiveChange={handleTabChange}
      tabs={[
        { id: "catalog", label: "Catalogue", badge: novels.length, content: catalogPanel },
        { id: "editor", label: editingId ? "Edit novel" : "Create novel", content: editorPanel },
        { id: "merge", label: "Merge duplicates", content: mergePanel },
      ]}
    />
  );
}
