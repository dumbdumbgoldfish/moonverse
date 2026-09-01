import { Suspense } from "react";
import { AdminReadingLinksTable } from "@/components/admin/AdminReadingLinksTable";
import {
  AdminEmptyState,
  AdminFilterChips,
  AdminPageHeader,
  AdminPagination,
  AdminSection,
} from "@/components/admin/AdminUi";
import {
  parseReadingLinkModerationStatusFilter,
  readingLinkModerationFilterHref,
  type ReadingLinkModerationFilterValue,
} from "@/lib/admin/reading-link-moderation-filter";
import { listReadingLinksForModeration } from "@/services/reading-link.service";

export const metadata = { title: "Admin Reading Links · MoonVerse" };

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

const FILTERS: Array<{
  value: ReadingLinkModerationFilterValue;
  label: string;
}> = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "NEEDS_REVIEW", label: "Needs review" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

export default async function AdminReadingLinksPage({ searchParams }: PageProps) {
  const { status: raw, page: pageParam } = await searchParams;
  const status = parseReadingLinkModerationStatusFilter(raw);
  const page = Math.max(1, Number(pageParam) || 1);

  const result = await listReadingLinksForModeration({ status, page });

  const rows = result.items.map((link) => ({
    id: link.id,
    url: link.url,
    platform: link.platform,
    category: link.category,
    moderationStatus: link.moderationStatus,
    healthStatus: link.healthStatus,
    lastCheckedAt: link.lastCheckedAt?.toISOString() ?? null,
    createdAt: link.createdAt.toISOString(),
    novel: link.novel,
    submittedByUser: link.submittedByUser,
    submittedViaReview: link.submittedViaReview,
  }));

  const paginationParams =
    status !== "ALL" ? { status } : undefined;

  return (
    <>
      <AdminPageHeader
        title="Reading links"
        description="Moderate shared “Where to read” sources. Links belong to the novel, not a single review."
      />
      <Suspense fallback={null}>
        <AdminSection title="Moderation status" className="mb-6">
          <AdminFilterChips
            items={FILTERS.map((filter) => ({
              href: readingLinkModerationFilterHref(filter.value),
              label: filter.label,
              active: status === filter.value,
            }))}
          />
        </AdminSection>
      </Suspense>
      {rows.length === 0 ? (
        <AdminEmptyState
          title="No links in this filter"
          description="User-submitted sources awaiting review will show up here."
        />
      ) : (
        <>
          <AdminReadingLinksTable links={rows} />
          <AdminPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/admin/reading-links"
            params={paginationParams}
          />
        </>
      )}
    </>
  );
}
