import { Suspense } from "react";
import { ContentModerationStatus } from "@prisma/client";
import { AdminReviewsTable } from "@/components/admin/AdminReviewsTable";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import {
  AdminEmptyState,
  AdminFilterChips,
  AdminPageHeader,
  AdminPagination,
  AdminSection,
  AdminToolbar,
} from "@/components/admin/AdminUi";
import { getAdminReviews } from "@/services/admin/reviews.service";

export const metadata = { title: "Admin Reviews · MoonVerse" };

const moderationStatuses = Object.values(ContentModerationStatus);

interface AdminReviewsPageProps {
  searchParams: Promise<{ q?: string; rating?: string; status?: string; page?: string }>;
}

function buildHref(
  q?: string,
  rating?: number,
  status?: string,
  page?: number
): string {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (rating) params.set("rating", String(rating));
  if (status) params.set("status", status);
  if (page && page > 1) params.set("page", String(page));
  const qs = params.toString();
  return qs ? `?${qs}` : "/admin/reviews";
}

export default async function AdminReviewsPage({
  searchParams,
}: AdminReviewsPageProps) {
  const { q, rating, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const ratingNum = rating ? Number(rating) : undefined;
  const moderationStatus = moderationStatuses.includes(
    status as ContentModerationStatus
  )
    ? (status as ContentModerationStatus)
    : undefined;

  const result = await getAdminReviews(
    {
      query: q,
      rating: ratingNum && ratingNum >= 1 && ratingNum <= 5 ? ratingNum : undefined,
      moderationStatus,
    },
    page
  );

  return (
    <>
      <AdminPageHeader
        title="Reviews"
        description="Search and moderate reviews. Hide removes them from public feeds; delete is permanent."
      />
      <AdminToolbar>
        <Suspense fallback={null}>
          <AdminSearchBar placeholder="Search title, novel or username" />
        </Suspense>
      </AdminToolbar>
      <AdminSection title="Rating" className="mb-4">
        <AdminFilterChips
          items={[undefined, 1, 2, 3, 4, 5].map((value) => ({
            href: buildHref(q, value, moderationStatus),
            label: value ? `${value} stars` : "All ratings",
            active: (value ?? "all") === (ratingNum ?? "all"),
          }))}
        />
      </AdminSection>
      <AdminSection title="Moderation status" className="mb-6">
        <AdminFilterChips
          items={[undefined, ...moderationStatuses].map((value) => ({
            href: buildHref(q, ratingNum, value),
            label: value ? value.replace(/_/g, " ") : "All statuses",
            active: (value ?? "all") === (moderationStatus ?? "all"),
          }))}
        />
      </AdminSection>
      {result.items.length === 0 ? (
        <AdminEmptyState title="No reviews found" description="Try another search or filter." />
      ) : (
        <>
          <AdminReviewsTable reviews={result.items} />
          <AdminPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/admin/reviews"
            params={{
              q,
              rating: ratingNum ? String(ratingNum) : undefined,
              status: moderationStatus,
            }}
          />
        </>
      )}
    </>
  );
}
