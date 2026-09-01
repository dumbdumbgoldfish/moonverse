import { Suspense } from "react";
import { AdminReadingLinksTable } from "@/components/admin/AdminReadingLinksTable";
import {
  AdminEmptyState,
  AdminFilterChips,
  AdminPageHeader,
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
  searchParams: Promise<{ status?: string }>;
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
  const { status: raw } = await searchParams;
  const status = parseReadingLinkModerationStatusFilter(raw);

  const links = await listReadingLinksForModeration({ status, limit: 150 });

  const rows = links.map((link) => ({
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
        <AdminReadingLinksTable links={rows} />
      )}
    </>
  );
}
