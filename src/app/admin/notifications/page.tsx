import Link from "next/link";
import { NotificationType } from "@prisma/client";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/AdminUi";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeTime } from "@/lib/date-utils";
import { getAdminNotifications } from "@/services/admin/notifications.service";

export const metadata = { title: "Admin Notifications — MoonVerse" };

const notificationTypes = Object.values(NotificationType);

interface AdminNotificationsPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function AdminNotificationsPage({
  searchParams,
}: AdminNotificationsPageProps) {
  const { type } = await searchParams;
  const filterType = notificationTypes.includes(type as NotificationType)
    ? (type as NotificationType)
    : undefined;

  const notifications = await getAdminNotifications(filterType);

  return (
    <>
      <AdminPageHeader
        title="Notifications"
        description="Read-only view of recent platform notifications."
      />
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/notifications"
          className={`rounded-full border px-3 py-1 text-xs ${
            !filterType
              ? "border-primary bg-primary/10 text-primary"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          All types
        </Link>
        {notificationTypes.map((t) => (
          <Link
            key={t}
            href={`/admin/notifications?type=${t}`}
            className={`rounded-full border px-3 py-1 text-xs ${
              filterType === t
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted"
            }`}
          >
            {t.replace(/_/g, " ")}
          </Link>
        ))}
      </div>
      {notifications.length === 0 ? (
        <AdminEmptyState
          title="No notifications"
          description="Notifications will appear here as users interact."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border/60">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="border-b border-border/60 bg-muted/30">
              <tr>
                <th className="px-4 py-3 font-medium" scope="col">Message</th>
                <th className="px-4 py-3 font-medium" scope="col">Recipient</th>
                <th className="px-4 py-3 font-medium" scope="col">Type</th>
                <th className="px-4 py-3 font-medium" scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((notification) => (
                <tr
                  key={notification.id}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-4 py-3">
                    {notification.link ? (
                      <Link
                        href={notification.link}
                        className="hover:text-primary"
                      >
                        {notification.message}
                      </Link>
                    ) : (
                      notification.message
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)} ·{" "}
                      {formatDate(notification.createdAt)}
                    </p>
                  </td>
                  <td className="px-4 py-3">@{notification.recipientUsername}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{notification.type}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={notification.isRead ? "secondary" : "default"}>
                      {notification.isRead ? "Read" : "Unread"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
