"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createFeaturedNovelAction,
  deleteFeaturedNovelAction,
} from "@/actions/admin.actions";
import { AdminConfirmDialog } from "@/components/admin/AdminConfirmDialog";
import { ADMIN_LIGHT_FIELD_CLASS } from "@/components/admin/admin-styles";
import {
  AdminFormCard,
  AdminTableCell,
  AdminTableHead,
  AdminTableRow,
  AdminTableShell,
  AdminTableTh,
} from "@/components/admin/AdminUi";
import { NovelSearchPicker } from "@/components/reviews/NovelSearchPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  datetimeLocalToIso,
  formatNovelSelectLabel,
  findNovelSelectOption,
} from "@/lib/admin/featured-novel-form";
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

  const selectedNovel = findNovelSelectOption(novels, novelId);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!novelId) {
      setError("Select a novel to feature.");
      return;
    }

    const endsAtIso = datetimeLocalToIso(endsAt);
    if (endsAtIso === null) {
      setError("Enter a valid end date and time, or leave the field empty.");
      return;
    }

    startTransition(async () => {
      const result = await createFeaturedNovelAction({
        novelId,
        slot: Number(slot) || 0,
        endsAt: endsAtIso,
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
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="featured-novel-search">Novel</Label>
              <NovelSearchPicker
                novels={novels}
                value={novelId}
                onChange={setNovelId}
                disabled={isPending}
              />
              {selectedNovel ? (
                <p className="text-xs text-[#e9d5ff]" role="status">
                  Selected for spotlight:{" "}
                  <span className="font-medium text-white">
                    {formatNovelSelectLabel(selectedNovel)}
                  </span>
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="featured-slot">Slot (order)</Label>
              <Input
                id="featured-slot"
                type="number"
                value={slot}
                onChange={(e) => setSlot(e.target.value)}
                disabled={isPending}
                className={ADMIN_LIGHT_FIELD_CLASS}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="featured-ends">Ends at (optional)</Label>
              <input
                id="featured-ends"
                type="datetime-local"
                step={60}
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                disabled={isPending}
                className={ADMIN_LIGHT_FIELD_CLASS}
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
                  <p className="text-xs text-white/70">by {item.novelAuthor}</p>
                ) : null}
              </AdminTableCell>
              <AdminTableCell>{item.slot}</AdminTableCell>
              <AdminTableCell className="text-xs text-white/70">
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
