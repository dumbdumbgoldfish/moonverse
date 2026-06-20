import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { MoonieRecommendationCard } from "@/components/moonie/MoonieRecommendationCard";
import { cn } from "@/lib/utils";
import type { MoonieChatMessage } from "@/types/moonie";

interface MoonieMessageListProps {
  messages: MoonieChatMessage[];
  isLoading: boolean;
}

export function MoonieMessageList({ messages, isLoading }: MoonieMessageListProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center px-4 py-8 text-center">
        <MoonieMascot size={64} animated />
        <p className="mt-4 text-sm font-medium">Hi, I&apos;m Moonie!</p>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          Tell me what you enjoy — genres, tropes, or vibes — and I&apos;ll
          recommend web novels from MoonVerse. I never write reviews for you.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4 px-4 py-4" aria-live="polite" aria-relevant="additions">
      {messages.map((message) => (
        <li
          key={message.id}
          className={cn(
            "flex",
            message.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          {message.role === "assistant" && (
            <div className="mr-2 mt-1 shrink-0 text-accent">
              <MoonieMascot size={28} />
            </div>
          )}

          <div
            className={cn(
              "max-w-[92%] space-y-3",
              message.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div
              className={cn(
                "rounded-2xl px-3 py-2 text-sm leading-relaxed",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.isError
                    ? "bg-destructive/10 text-destructive"
                    : "bg-moon-purple-soft text-foreground"
              )}
            >
              {message.content}
            </div>

            {message.recommendations && message.recommendations.length > 0 && (
              <div className="space-y-2">
                {message.recommendations.map((rec, index) => (
                  <MoonieRecommendationCard
                    key={`${message.id}-${rec.title}-${index}`}
                    recommendation={rec}
                  />
                ))}
              </div>
            )}
          </div>
        </li>
      ))}

      {isLoading && (
        <li className="flex justify-start">
          <div className="mr-2 mt-1 shrink-0 text-accent">
            <MoonieMascot size={28} animated />
          </div>
          <div className="rounded-2xl bg-moon-purple-soft px-4 py-3 text-sm text-muted-foreground">
            Moonie is reading the stars…
          </div>
        </li>
      )}
    </ul>
  );
}
