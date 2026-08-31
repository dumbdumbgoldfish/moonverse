import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { AdminUserDetailView } from "@/components/admin/AdminUserDetailView";
import { formatDate } from "@/lib/date-utils";
import { getSession } from "@/lib/session";
import { getAdminUserDetail } from "@/services/admin/user-detail.service";

export const metadata = { title: "User · MoonVerse Admin" };
export const dynamic = "force-dynamic";

interface AdminUserDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { id } = await params;
  const [user, session] = await Promise.all([
    getAdminUserDetail(id),
    getSession(),
  ]);
  if (!user) notFound();

  return (
    <>
      <AdminPageHeader
        title={user.displayName}
        description={`@${user.username} · joined ${formatDate(user.createdAt)}`}
      >
        <Link
          href="/admin/users"
          className="text-sm font-medium text-[#e6d2a3] hover:underline"
        >
          All users
        </Link>
      </AdminPageHeader>
      <AdminUserDetailView
        user={user}
        currentAdminId={session!.user!.id}
      />
    </>
  );
}
