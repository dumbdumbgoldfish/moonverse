"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createFeaturedNovelAction,
  deleteFeaturedNovelAction,
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/date-utils";
import type { AdminFeaturedNovelItem } from "@/services/featured.service";
import type { NovelSelectOption } from "@/services/novel.service";

interface AdminFeaturedManagerProps {
  featured: AdminFeaturedNovelItem[];
  novels: NovelSelectOption[];
}

export function AdminFeaturedManager({
  featured,
  novels,
}: AdminFeaturedManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [novelId, setNovelId] = useState("");
  const [slot, setSlot] = useState("0");
  const [endsAt, setEndsAt] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!novelId) {
      setError("Select a novel to feature.");
      return;
    }

    startTransition(async () => {
      const result = await createFeaturedNovelAction({
        novelId,
        slot: Number(slot) || 0,
        endsAt: endsAt ? new Date(endsAt).toISOString() : undefined,
      });
      if (!result.success) {
        setError(result.error);
        return;
      }
      setNovelId("");
      setSlot("0");
      setEndsAt("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <AdminFormCard
        title="Feature a novel"
        description="Spotlight titles on the home and discover surfaces."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="featured-novel">Novel</Label>
            <select
              id="featured-novel"
              value={novelId}
              onChange={(e) => setNovelId(e.target.value)}
              disabled={isPending}
              className="h-10 w-full rounded-xl border border-[#241630]/15 bg-white px-3 text-sm shadow-[0_10px_24px_-18px_rgba(110,70,199,0.12)]"
            >
              <option value="">Select a novel…</option>
              {novels.map((novel) => (
                <option key={novel.id} value={novel.id}>
                  {novel.title} {novel.author ? `:  ${novel.author}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="featured-slot">Slot (order)</Label>
            <Input
              id="featured-slot"
              type="number"
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="featured-ends">Ends at (optional)</Label>
            <Input
              id="featured-ends"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              disabled={isPending}
            />
          </div>
        </div>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Add to spotlight"}
        </Button>
        </form>
      </AdminFormCard>

      <AdminTableShell minWidth="700px">
        <AdminTableHead>
          <tr>
            <AdminTableTh>Novel</AdminTableTh>
            <AdminTableTh>Slot</AdminTableTh>
            <AdminTableTh>Window</AdminTableTh>
            <AdminTableTh>Status</AdminTableTh>
            <AdminTableTh>Actions</AdminTableTh>
          </tr>
        </AdminTableHead>
        <tbody>
          {featured.map((item) => (
            <AdminTableRow key={item.id}>
              <AdminTableCell>
                <p className="font-medium">{item.novelTitle}</p>
                {item.novelAuthor ? (
                  <p className="text-xs text-white">by {item.novelAuthor}</p>
                ) : null}
              </AdminTableCell>
              <AdminTableCell>{item.slot}</AdminTableCell>
              <AdminTableCell className="text-xs text-white">
                {formatDate(item.startsAt)}
                {item.endsAt ? ` → ${formatDate(item.endsAt)}` : " → open"}
              </AdminTableCell>
              <AdminTableCell>
                <Badge variant={item.isActive ? "default" : "secondary"}>
                  {item.isActive ? "Active" : "Inactive"}
                </Badge>
              </AdminTableCell>
              <AdminTableCell>
                <AdminConfirmDialog
                  title="Remove from spotlight"
                  description={`Remove "${item.novelTitle}" from the featured spotlight?`}
                  confirmLabel="Remove"
                  onConfirm={() => deleteFeaturedNovelAction(item.id)}
                />
              </AdminTableCell>
            </AdminTableRow>
          ))}
        </tbody>
      </AdminTableShell>
    </div>
  );
}
