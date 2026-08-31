import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { GuestAskMooniePageShell } from "@/components/moonie/GuestAskMooniePageShell";
import { moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
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
  const session = await getSession();
  if (session?.user?.id) {
    redirect(moonieLoggedInEntryHref(prompt?.trim() || undefined));
  }

  const settings = await getSystemSettings();

  return (
    <GuestAskMooniePageShell
      guestDemoCap={settings.guestMoonieDemoCap}
      initialPrompt={prompt?.trim() || undefined}
    />
  );
}
