import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { AdminSearchBar } from "@/components/admin/AdminSearchBar";
import { AdminUsersTable } from "@/components/admin/AdminUsersTable";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminUi";
import { getAdminUsers } from "@/services/admin/users.service";

export const metadata = { title: "Admin Users — MoonVerse" };

interface AdminUsersPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
  const { q } = await searchParams;
  const [users, session] = await Promise.all([
    getAdminUsers(q),
    auth(),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Users"
        description="Manage accounts, roles, and suspensions."
      />
      <Suspense fallback={null}>
        <div className="mb-6">
          <AdminSearchBar placeholder="Search username, email, or display name" />
        </div>
      </Suspense>
      {users.length === 0 ? (
        <AdminEmptyState title="No users found" description="Try a different search." />
      ) : (
        <AdminUsersTable
          users={users}
          currentAdminId={session!.user!.id}
        />
      )}
    </>
  );
}
