import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { MoonieAssistantView } from "@/components/moonie/MoonieAssistantView";

export const metadata = {
  title: "Ask Moonie · MoonVerse",
  description: "Chat with Moonie for personal novel recommendations.",
};

interface MooniePageProps {
  searchParams: Promise<{ prompt?: string; conversation?: string }>;
}

export default async function MooniePage({ searchParams }: MooniePageProps) {
  const { prompt, conversation } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(
      prompt?.trim()
        ? `/ask-moonie?prompt=${encodeURIComponent(prompt.trim())}`
        : "/ask-moonie"
    );
  }

  return (
    <Suspense fallback={null}>
      <MoonieAssistantView
        isLoggedIn
        variant="page"
        displayName={session.user.name ?? session.user.username ?? undefined}
        initialPrompt={prompt?.trim() || undefined}
        initialConversationId={conversation?.trim() || undefined}
      />
    </Suspense>
  );
}
