import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/AdminUi";
import { AdminUserDetailView } from "@/components/admin/AdminUserDetailView";
import { formatDate } from "@/lib/date-utils";
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
  const user = await getAdminUserDetail(id);
  if (!user) notFound();

  return (
    <>
      <AdminPageHeader
        title={user.displayName}
        description={`@${user.username} · joined ${formatDate(user.createdAt)}`}
      >
        <Link
          href="/admin/users"
          className="text-sm font-medium text-[#fcd34d] hover:underline"
        >
          ← All users
        </Link>
      </AdminPageHeader>
      <AdminUserDetailView user={user} />
    </>
  );
}
