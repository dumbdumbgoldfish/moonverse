import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { GuestAskMooniePageShell } from "@/components/moonie/GuestAskMooniePageShell";
import { getSystemSettings } from "@/lib/system-settings";

export const metadata = {
  title: "Ask Moonie · MoonVerse",
  description:
    "Try Moonie for web novel recommendations. Sign up for a personal catalogue desk.",
};

interface AskMoonieGatePageProps {
  searchParams: Promise<{ prompt?: string }>;
}

export default async function AskMoonieGatePage({
  searchParams,
}: AskMoonieGatePageProps) {
  const { prompt } = await searchParams;
  const session = await auth();
  if (session?.user?.id) {
    redirect(
      prompt?.trim()
        ? `/moonie?prompt=${encodeURIComponent(prompt.trim())}`
        : "/moonie",
    );
  }

  const settings = await getSystemSettings();

  return (
    <GuestAskMooniePageShell
      guestDemoCap={settings.guestMoonieDemoCap}
      initialPrompt={prompt?.trim() || undefined}
    />
  );
}
