import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { SettingsShell } from "@/components/settings/SettingsShell";
import { getUserSettings } from "@/services/user.service";

export const metadata = {
  title: "Settings · MoonVerse",
  description: "Manage your MoonVerse account settings.",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/settings");
  }

  const settings = await getUserSettings(session.user.id);
  if (!settings) {
    redirect("/login?callbackUrl=/settings");
  }

  return (
    <SettingsShell
      active="profile"
      title="Profile"
      description="Update the details shown on your public profile."
    >
      <SettingsForm settings={settings} />
    </SettingsShell>
  );
}
