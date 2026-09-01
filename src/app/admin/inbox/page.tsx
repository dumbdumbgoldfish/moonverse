import { Suspense } from "react";
import { redirect } from "next/navigation";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPagination,
  AdminStatCard,
} from "@/components/admin/AdminUi";
import { AdminInboxTriage } from "@/components/admin/AdminInboxTriage";
import {
  buildInboxTriageHref,
  buildInboxTriageSearchParams,
  resolveInboxSelection,
} from "@/lib/admin/inbox-selection";
import { getAdminTags } from "@/services/admin/catalog.service";
import {
  findInboxPageForSelectedItem,
  getAdminInboxPage,
  getInboxCounts,
  parseInboxKindFilter,
} from "@/services/admin/inbox.service";

export const metadata = { title: "Moderation Queue · MoonVerse Admin" };
export const dynamic = "force-dynamic";

const INBOX_PAGE_SIZE = 50;

interface AdminInboxPageProps {
  searchParams: Promise<{ selected?: string; page?: string; kind?: string }>;
}

export default async function AdminInboxPage({
  searchParams,
}: AdminInboxPageProps) {
  const { selected, page: pageParam, kind: kindParam } = await searchParams;
  const requestedSelectedId = selected?.trim() || undefined;
  const page = Math.max(1, Number(pageParam) || 1);
  const activeFilter = parseInboxKindFilter(kindParam);
  const inboxFilters = { kind: activeFilter };

  if (requestedSelectedId) {
    const selectedPage = await findInboxPageForSelectedItem(
      requestedSelectedId,
      INBOX_PAGE_SIZE,
      inboxFilters
    );
    if (selectedPage && selectedPage !== page) {
      redirect(
        buildInboxTriageHref({
          kind: activeFilter,
          page: selectedPage,
          selected: requestedSelectedId,
        })
      );
    }
  }

  const [result, counts, canonicalTags] = await Promise.all([
    getAdminInboxPage(page, INBOX_PAGE_SIZE, inboxFilters),
    getInboxCounts(),
    getAdminTags(),
  ]);

  let selectionWarning: string | undefined;
  if (
    requestedSelectedId &&
    !result.items.some((item) => item.id === requestedSelectedId)
  ) {
    const existsInAll = await findInboxPageForSelectedItem(
      requestedSelectedId,
      INBOX_PAGE_SIZE,
      { kind: "all" }
    );
    selectionWarning = existsInAll
      ? "The linked inbox item is not in this filter. Switch to All to view it."
      : "This inbox item is no longer in the moderation queue.";
  }

  const selection = resolveInboxSelection(
    result.items,
    requestedSelectedId,
    selectionWarning
  );

  const paginationParams = buildInboxTriageSearchParams({
    kind: activeFilter,
    page: result.page,
    selected: selection.selectionMatched
      ? selection.activeSelectedId ?? undefined
      : undefined,
  });

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
          <Suspense fallback={null}>
            <AdminInboxTriage
              items={result.items}
              counts={counts}
              canonicalTags={canonicalTags}
              activeFilter={activeFilter}
              selection={selection}
            />
          </Suspense>
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
