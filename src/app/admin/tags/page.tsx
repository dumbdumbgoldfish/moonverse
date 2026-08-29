import Link from "next/link";
import { AdminTagsManager } from "@/components/admin/AdminTagsManager";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminUi";
import { getAdminTags } from "@/services/admin/catalog.service";
import { db } from "@/lib/db";

export const metadata = { title: "Admin Tags · MoonVerse" };

export default async function AdminTagsPage() {
  const [tags, pendingTagSuggestions] = await Promise.all([
    getAdminTags(),
    db.tagSuggestion.count({ where: { status: "PENDING" } }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Tags"
        description="Manage the canonical tag taxonomy. Reader-submitted tags are reviewed in the moderation queue."
      />
      {pendingTagSuggestions > 0 ? (
        <p className="mb-6 rounded-xl border border-amber-200/80 bg-amber-50/60 px-4 py-3 text-sm text-amber-950">
          {pendingTagSuggestions} pending tag suggestion
          {pendingTagSuggestions === 1 ? "" : "s"} —{" "}
          <Link href="/admin/inbox" className="font-semibold underline">
            review in moderation queue
          </Link>
          .
        </p>
      ) : null}
      {tags.length === 0 ? (
        <AdminEmptyState title="No tags yet" description="Create your first tag below." />
      ) : null}
      <AdminTagsManager tags={tags} />
    </>
  );
}
