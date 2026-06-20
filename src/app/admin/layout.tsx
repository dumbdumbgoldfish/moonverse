import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { auth } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";
import { ForbiddenMessage } from "@/components/layout/ForbiddenMessage";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

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

  return <AdminShell>{children}</AdminShell>;
}
