import { Suspense } from "react";
import { AdminCommentsTable } from "@/components/admin/AdminCommentsTable";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminUi";
import { getAdminComments } from "@/services/admin/comments.service";

export const metadata = { title: "Admin Comments — MoonVerse" };

interface AdminCommentsPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminCommentsPage({
  searchParams,
}: AdminCommentsPageProps) {
  const { q } = await searchParams;
  const comments = await getAdminComments(q);

  return (
    <>
      <AdminPageHeader
        title="Comments"
        description="Moderate comments and replies."
      />
      <Suspense fallback={null}>
        <div className="mb-6">
          <AdminSearchBar placeholder="Search comment text" />
        </div>
      </Suspense>
      {comments.length === 0 ? (
        <AdminEmptyState title="No comments found" description="Try a different search." />
      ) : (
        <AdminCommentsTable comments={comments} />
      )}
    </>
  );
}
