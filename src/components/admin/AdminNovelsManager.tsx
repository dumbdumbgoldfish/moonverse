"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createNovelAction,
  deleteNovelAction,
  updateNovelAction,
} from "@/actions/admin.actions";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/date-utils";
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

  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [genreIds, setGenreIds] = useState<string[]>([]);
  const [tagIds, setTagIds] = useState<string[]>([]);

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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const payload = {
        title,
        author,
        coverUrl,
        externalLink,
        genreIds,
        tagIds,
      };

      const result = editingId
        ? await updateNovelAction(editingId, payload)
        : await createNovelAction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      resetForm();
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-border/60 bg-bg-elevated p-6"
      >
        <h2 className="text-lg font-semibold">
          {editingId ? "Edit novel" : "Create novel"}
        </h2>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="novel-title">Title</Label>
            <Input
              id="novel-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="novel-author">Author</Label>
            <Input
              id="novel-author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="novel-cover">Cover URL</Label>
            <Input
              id="novel-cover"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="novel-link">External link</Label>
            <Input
              id="novel-link"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Genres</p>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <button
                key={genre.id}
                type="button"
                disabled={isPending}
                onClick={() => setGenreIds((c) => toggleId(c, genre.id))}
                className={`rounded-full border px-3 py-1 text-xs ${
                  genreIds.includes(genre.id)
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium">Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                disabled={isPending}
                onClick={() => setTagIds((c) => toggleId(c, tag.id))}
                className={`rounded-full border px-3 py-1 text-xs ${
                  tagIds.includes(tag.id)
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-muted-foreground"
                }`}
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
          {editingId && (
            <Button type="button" variant="outline" onClick={resetForm}>
              Cancel edit
            </Button>
          )}
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full min-w-[700px] text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              <th className="px-4 py-3 font-medium" scope="col">Novel</th>
              <th className="px-4 py-3 font-medium" scope="col">Reviews</th>
              <th className="px-4 py-3 font-medium" scope="col">Taxonomy</th>
              <th className="px-4 py-3 font-medium" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {novels.map((novel) => (
              <tr key={novel.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium">{novel.title}</p>
                  {novel.author && (
                    <p className="text-xs text-muted-foreground">by {novel.author}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formatDate(novel.createdAt)}
                  </p>
                </td>
                <td className="px-4 py-3">{novel.reviewCount}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {novel.genreNames.join(", ") || "—"}
                  <br />
                  {novel.tagNames.join(", ") || "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setEditingId(novel.id);
                        setTitle(novel.title);
                        setAuthor(novel.author ?? "");
                        setCoverUrl(novel.coverUrl ?? "");
                        setExternalLink(novel.externalLink ?? "");
                        setGenreIds(novel.genreIds);
                        setTagIds(novel.tagIds);
                      }}
                    >
                      Edit
                    </Button>
                    <AdminConfirmDialog
                      title="Delete novel"
                      description={`Delete "${novel.title}"? Only allowed if it has no reviews.`}
                      confirmLabel="Delete"
                      onConfirm={() => deleteNovelAction(novel.id)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
