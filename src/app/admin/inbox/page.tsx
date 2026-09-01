import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminStatCard,
} from "@/components/admin/AdminUi";
import { AdminInboxTriage } from "@/components/admin/AdminInboxTriage";
import {
  getAdminInboxPage,
  getInboxCounts,
  parseInboxKindFilter,
} from "@/services/admin/inbox.service";

export const metadata = { title: "Moderation Queue · MoonVerse Admin" };
export const dynamic = "force-dynamic";

interface AdminInboxPageProps {
  searchParams: Promise<{ selected?: string; page?: string; kind?: string }>;
}

export default async function AdminInboxPage({
  searchParams,
}: AdminInboxPageProps) {
  const { selected, page: pageParam, kind: kindParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const activeFilter = parseInboxKindFilter(kindParam);
  const inboxFilters = { kind: activeFilter };
  const [result, counts] = await Promise.all([
    getAdminInboxPage(page, 50, inboxFilters),
    getInboxCounts(),
  ]);
  const paginationParams =
    activeFilter === "all" ? undefined : { kind: activeFilter };

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

      {counts.total === 0 ? (
        <AdminEmptyState
          title="Queue clear"
          description="No open moderation items. Use Reports or entity pages to browse historical records."
        />
      ) : (
        <>
          <AdminInboxTriage
            items={result.items}
            initialSelectedId={selected}
            activeFilter={activeFilter}
          />
          <AdminPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/admin/inbox"
            params={paginationParams}
          />
        </>
      )}
    </>
  );
}
