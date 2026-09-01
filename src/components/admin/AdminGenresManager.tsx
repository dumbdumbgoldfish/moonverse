"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createGenreAction,
  deleteGenreAction,
  updateGenreAction,
} from "@/actions/admin.actions";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import {
  AdminFormCard,
  AdminTableCell,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
  AdminTableTh,
} from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminGenreSummary } from "@/types/admin";

export function AdminGenresManager({ genres }: { genres: AdminGenreSummary[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = editingId
        ? await updateGenreAction(editingId, name, slug || undefined)
        : await createGenreAction(name, slug || undefined);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setName("");
      setSlug("");
      setEditingId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <AdminFormCard
        title={editingId ? "Edit genre" : "Create genre"}
        description="Genres power browse navigation and novel taxonomy."
        className="grid gap-4 sm:grid-cols-2"
      >
        <form onSubmit={handleSubmit} className="contents">
        {error && (
          <p className="sm:col-span-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="genre-name">Name</Label>
          <Input
            id="genre-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="genre-slug">Slug</Label>
          <Input
            id="genre-slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-generated if empty"
            disabled={isPending}
          />
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={isPending}>
            {editingId ? "Save" : "Create"}
          </Button>
          {editingId && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                setName("");
                setSlug("");
              }}
            >
              Cancel
            </Button>
          )}
        </div>
        </form>
      </AdminFormCard>

      <AdminTableShell minWidth="640px">
        <AdminTableHead>
          <tr>
            <AdminTableTh>Name</AdminTableTh>
            <AdminTableTh>Slug</AdminTableTh>
            <AdminTableTh>Novels</AdminTableTh>
            <AdminTableTh>Actions</AdminTableTh>
          </tr>
        </AdminTableHead>
        <tbody>
          {genres.map((genre) => (
            <AdminTableRow key={genre.id}>
              <AdminTableCell className="font-medium">{genre.name}</AdminTableCell>
              <AdminTableCell className="text-white/70">{genre.slug}</AdminTableCell>
              <AdminTableCell>{genre.novelCount}</AdminTableCell>
              <AdminTableCell>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      if (isPending) return;
                      setEditingId(genre.id);
                      setName(genre.name);
                      setSlug(genre.slug);
                    }}
                  >
                    Edit
                  </Button>
                  <AdminConfirmDialog
                    title="Delete genre"
                    description={`Delete "${genre.name}"? Only if unused.`}
                    confirmLabel="Delete"
                    onConfirm={() => deleteGenreAction(genre.id)}
                  />
                </div>
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </tbody>
      </AdminTableShell>
    </div>
  );
}
