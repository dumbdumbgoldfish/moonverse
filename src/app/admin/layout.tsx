import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { isActiveAdminUser } from "@/lib/admin-auth";
import { getSession } from "@/lib/session";
import { AdminShell } from "@/components/admin/AdminShell";
import { ForbiddenMessage } from "@/components/layout/ForbiddenMessage";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  if (session?.user?.role !== UserRole.ADMIN) {
    return (
      <ForbiddenMessage
        title="Admin access required"
        message="You do not have permission to access the admin dashboard."
        returnHref="/"
        returnLabel="Back to MoonVerse"
      />
    );
  }

  const adminStillActive = await isActiveAdminUser(session.user.id);
  if (!adminStillActive) {
    return (
      <ForbiddenMessage
        title="Admin access revoked"
        message="Your admin privileges are no longer active. Sign in again or contact support if you believe this is a mistake."
        returnHref="/"
        returnLabel="Back to MoonVerse"
      />
    );
  }

  return <AdminShell session={session!}>{children}</AdminShell>;
}
