import { Suspense } from "react";
import { ContentModerationStatus } from "@prisma/client";
import { AdminCommentsTable } from "@/components/admin/AdminCommentsTable";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import {
  AdminEmptyState,
  AdminFilterChips,
  AdminPageHeader,
  AdminPagination,
  AdminSection,
  AdminToolbar,
} from "@/components/admin/AdminUi";
import { getAdminComments } from "@/services/admin/comments.service";

export const metadata = { title: "Admin Comments · MoonVerse" };

const moderationStatuses = Object.values(ContentModerationStatus);

interface AdminCommentsPageProps {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}

export default async function AdminCommentsPage({
  searchParams,
}: AdminCommentsPageProps) {
  const { q, status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const moderationStatus = moderationStatuses.includes(
    status as ContentModerationStatus
  )
    ? (status as ContentModerationStatus)
    : undefined;

  const result = await getAdminComments({ query: q, moderationStatus }, page);

  return (
    <>
      <AdminPageHeader
        title="Comments"
        description="Moderate comments and replies. Hide removes them from public threads; delete is permanent."
      />
      <AdminToolbar>
        <Suspense fallback={null}>
          <AdminSearchBar placeholder="Search comment text" />
        </Suspense>
      </AdminToolbar>
      <AdminSection title="Moderation status" className="mb-6">
        <AdminFilterChips
          items={[undefined, ...moderationStatuses].map((value) => ({
            href: value
              ? `?status=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`
              : q
                ? `?q=${encodeURIComponent(q)}`
                : "/admin/comments",
            label: value ? value.replace(/_/g, " ") : "All statuses",
            active: (value ?? "all") === (moderationStatus ?? "all"),
          }))}
        />
      </AdminSection>
      {result.items.length === 0 ? (
        <AdminEmptyState title="No comments found" description="Try a different search." />
      ) : (
        <>
          <AdminCommentsTable comments={result.items} />
          <AdminPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/admin/comments"
            params={{ q, status: moderationStatus }}
          />
        </>
      )}
    </>
  );
}
