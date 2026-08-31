import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminStatCard,
} from "@/components/admin/AdminUi";
import { AdminInboxTriage } from "@/components/admin/AdminInboxTriage";
import { getAdminInboxPage, getInboxCounts } from "@/services/admin/inbox.service";

export const metadata = { title: "Moderation Queue · MoonVerse Admin" };
export const dynamic = "force-dynamic";

interface AdminInboxPageProps {
  searchParams: Promise<{ selected?: string; page?: string }>;
}

export default async function AdminInboxPage({
  searchParams,
}: AdminInboxPageProps) {
  const { selected, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [result, counts] = await Promise.all([
    getAdminInboxPage(page),
    getInboxCounts(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Moderation queue"
        description="Triage reports, flagged reviews and comments, reading-link submissions, and tag suggestions."
      />

      <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Total open" value={counts.total} tone="plum" />
        <AdminStatCard label="Reports" value={counts.report} tone="rose" />
        <AdminStatCard
          label="Flagged content"
          value={counts.review_flagged + counts.comment_flagged}
          tone="gold"
        />
        <AdminStatCard
          label="Catalogue review"
          value={
            counts.reading_link +
            counts.reading_link_unhealthy +
            counts.tag_suggestion
          }
          tone="violet"
        />
      </div>

      {result.items.length === 0 ? (
        <AdminEmptyState
          title="Queue clear"
          description="No open moderation items. Use Reports or entity pages to browse historical records."
        />
      ) : (
        <>
          <AdminInboxTriage
            items={result.items}
            initialSelectedId={selected}
          />
          <AdminPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/admin/inbox"
            params={{}}
          />
        </>
      )}
    </>
  );
}
