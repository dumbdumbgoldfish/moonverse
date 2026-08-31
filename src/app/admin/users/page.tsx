import { Suspense } from "react";
import { getSession } from "@/lib/session";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminEmptyState, AdminPageHeader, AdminPagination } from "@/components/admin/AdminUi";
import { getAdminUsers } from "@/services/admin/users.service";

export const metadata = { title: "Admin Users · MoonVerse" };

interface AdminUsersPageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const [result, session] = await Promise.all([
    getAdminUsers(q, page),
    getSession(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Manage accounts, roles and suspensions."
      />
      <Suspense fallback={null}>
        <div className="mb-6">
          <AdminSearchBar placeholder="Search username, email or display name" />
        </div>
      </Suspense>
      {result.items.length === 0 ? (
        <AdminEmptyState title="No users found" description="Try a different search." />
      ) : (
        <>
          <AdminUsersTable
            users={result.items}
            currentAdminId={session!.user!.id}
          />
          <AdminPagination
            page={result.page}
            totalPages={result.totalPages}
            total={result.total}
            basePath="/admin/users"
            params={{ q }}
          />
        </>
      )}
    </>
  );
}
