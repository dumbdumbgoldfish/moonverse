import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getUserSettings } from "@/services/user.service";

export const metadata = {
  title: "Settings — MoonVerse",
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
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="Settings"
        description="Manage your profile and account preferences."
      />
      <SettingsForm settings={settings} />
    </div>
  );
}
