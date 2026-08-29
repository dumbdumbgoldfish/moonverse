import { AdminBroadcastForm } from "@/components/admin/AdminBroadcastForm";
import { AdminPageHeader } from "@/components/admin/AdminUi";

export const metadata = { title: "Announcements · MoonVerse Admin" };

export default function AdminNotificationsPage() {
  return (
    <>
      <AdminPageHeader
        title="Announcements"
        description="Send a platform-wide notification for maintenance windows, policy updates, or trust & safety notices. Broadcasts are recorded in the audit log."
      />
      <AdminBroadcastForm />
    </>
  );
}
