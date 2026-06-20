"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createTagAction,
  deleteTagAction,
  updateTagAction,
} from "@/actions/admin.actions";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AdminTagSummary } from "@/types/admin";

export function AdminTagsManager({ tags }: { tags: AdminTagSummary[] }) {
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
        ? await updateTagAction(editingId, name, slug || undefined)
        : await createTagAction(name, slug || undefined);

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
      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-xl border border-border/60 bg-bg-elevated p-6 sm:grid-cols-2"
      >
        <h2 className="sm:col-span-2 text-lg font-semibold">
          {editingId ? "Edit tag" : "Create tag"}
        </h2>
        {error && (
          <p className="sm:col-span-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="space-y-2">
          <Label htmlFor="tag-name">Name</Label>
          <Input
            id="tag-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isPending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tag-slug">Slug</Label>
          <Input
            id="tag-slug"
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

      <div className="overflow-x-auto rounded-xl border border-border/60">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border/60 bg-muted/30">
            <tr>
              <th className="px-4 py-3 font-medium" scope="col">Name</th>
              <th className="px-4 py-3 font-medium" scope="col">Slug</th>
              <th className="px-4 py-3 font-medium" scope="col">Novels</th>
              <th className="px-4 py-3 font-medium" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tags.map((tag) => (
              <tr key={tag.id} className="border-b border-border/40 last:border-0">
                <td className="px-4 py-3 font-medium">{tag.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{tag.slug}</td>
                <td className="px-4 py-3">{tag.novelCount}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => {
                        setEditingId(tag.id);
                        setName(tag.name);
                        setSlug(tag.slug);
                      }}
                    >
                      Edit
                    </Button>
                    <AdminConfirmDialog
                      title="Delete tag"
                      description={`Delete "${tag.name}"? Only if unused.`}
                      confirmLabel="Delete"
                      onConfirm={() => deleteTagAction(tag.id)}
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
