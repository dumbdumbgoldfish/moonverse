import { redirect } from "next/navigation";
import { MoonieDeskRoute } from "@/components/moonie/MoonieDeskRoute";
import {
  readMoonieDeskRouteFromSearch,
  type MoonieDeskRouteState,
} from "@/lib/moonie/conversation-url";
import { moonieEntryHref } from "@/lib/moonie/open-moonie";
import { getSession } from "@/lib/session";

export const metadata = {
  title: "Ask Moonie · MoonVerse",
  description: "Chat with Moonie for personal novel recommendations.",
};

interface MooniePageProps {
  searchParams: Promise<{
    prompt?: string;
    conversation?: string;
    new?: string;
  }>;
}

function readServerDeskRoute(params: {
  prompt?: string;
  conversation?: string;
  new?: string;
}): MoonieDeskRouteState {
  const query = new URLSearchParams();
  const conversation = params.conversation?.trim();
  const prompt = params.prompt?.trim();
  if (conversation) {
    query.set("conversation", conversation);
  } else if (params.new === "1") {
    query.set("new", "1");
  }
  if (prompt) {
    query.set("prompt", prompt);
  }
  return readMoonieDeskRouteFromSearch(query.toString());
}

export default async function MooniePage({ searchParams }: MooniePageProps) {
  const params = await searchParams;
  const session = await getSession();
  if (!session?.user?.id) {
    redirect(moonieEntryHref(params.prompt?.trim() || undefined));
  }

  const serverRoute = readServerDeskRoute(params);

  return (
    <MoonieDeskRoute
      displayName={session.user.name ?? session.user.username ?? undefined}
      serverRoute={serverRoute}
    />
  );
}
