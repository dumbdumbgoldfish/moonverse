"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { TagKind } from "@prisma/client";
import {
  createTagAction,
  deleteTagAction,
  updateTagAction,
} from "@/actions/admin.actions";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import {
  AdminTableCell,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
  AdminTableTh,
} from "@/components/admin/AdminUi";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AdminTagSummary } from "@/types/admin";
import { cn } from "@/lib/utils";
import { ADMIN_FORM_CARD_CLASS } from "@/components/admin/admin-styles";

export function AdminTagsManager({ tags }: { tags: AdminTagSummary[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [kind, setKind] = useState<TagKind>("TROPE");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = editingId
        ? await updateTagAction(editingId, name, slug || undefined, kind)
        : await createTagAction(name, slug || undefined, kind);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setName("");
      setSlug("");
      setKind("TROPE");
      setEditingId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      <form
        onSubmit={handleSubmit}
        className={cn("grid gap-4 sm:grid-cols-2", ADMIN_FORM_CARD_CLASS)}
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
        <div className="space-y-2">
          <Label htmlFor="tag-kind">Kind</Label>
          <Select
            value={kind}
            onValueChange={(value) => setKind(value as TagKind)}
            disabled={isPending}
          >
            <SelectTrigger id="tag-kind">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TROPE">Trope</SelectItem>
              <SelectItem value="MOOD">Mood</SelectItem>
              <SelectItem value="STYLE">Style</SelectItem>
            </SelectContent>
          </Select>
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
                setKind("TROPE");
              }}
            >
              Cancel
            </Button>
          )}
        </div>
      </form>

      <AdminTableShell>
        <AdminTableHead>
          <tr>
            <AdminTableTh>Name</AdminTableTh>
            <AdminTableTh>Slug</AdminTableTh>
            <AdminTableTh>Kind</AdminTableTh>
            <AdminTableTh>Novels</AdminTableTh>
            <AdminTableTh>Actions</AdminTableTh>
          </tr>
        </AdminTableHead>
        <tbody>
          {tags.map((tag) => (
            <AdminTableRow key={tag.id}>
              <AdminTableCell className="font-semibold">{tag.name}</AdminTableCell>
              <AdminTableCell className="text-white/70">{tag.slug}</AdminTableCell>
              <AdminTableCell className="capitalize">{tag.kind.toLowerCase()}</AdminTableCell>
              <AdminTableCell>{tag.novelCount}</AdminTableCell>
              <AdminTableCell>
                <div className="flex gap-2">
                  <Button
                    size="xs"
                    variant="outline"
                    disabled={isPending}
                    onClick={() => {
                      if (isPending) return;
                      setEditingId(tag.id);
                      setName(tag.name);
                      setSlug(tag.slug);
                      setKind(tag.kind);
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
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </tbody>
      </AdminTableShell>
    </div>
  );
}
