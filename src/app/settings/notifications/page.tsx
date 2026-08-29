import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NotificationPreferencesForm } from "@/components/settings/NotificationPreferencesForm";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { getNotificationPreference } from "@/services/notification-preference.service";

export const metadata = { title: "Notification Preferences · MoonVerse" };
export const dynamic = "force-dynamic";

export default async function NotificationPreferencesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/settings/notifications");
  }

  const preference = await getNotificationPreference(session.user.id);

  return (
    <SettingsShell
      active="notifications"
      title="Notifications"
      description="Choose how MoonVerse keeps you updated by email."
    >
      <NotificationPreferencesForm preference={preference} />
    </SettingsShell>
  );
}
