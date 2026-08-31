import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { NotificationDetailView } from "@/components/notifications/NotificationDetailView";
import { getSession } from "@/lib/session";
import {
  getEnrichedNotificationForUser,
  markNotificationAsRead,
} from "@/services/notification.service";

export const dynamic = "force-dynamic";

interface NotificationDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: NotificationDetailPageProps) {
  const { id } = await params;
  return {
    title: `Notification · MoonVerse`,
    description: `Notification ${id}`,
  };
}

export default async function NotificationDetailPage({
  params,
}: NotificationDetailPageProps) {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/notifications`);
  }

  const { id } = await params;
  const notification = await getEnrichedNotificationForUser(
    session.user.id,
    id
  );

  if (!notification) {
    notFound();
  }

  if (!notification.isRead) {
    await markNotificationAsRead(id, session.user.id);
    revalidatePath("/notifications");
    revalidatePath("/", "layout");
  }

  return <NotificationDetailView notification={notification} />;
}
