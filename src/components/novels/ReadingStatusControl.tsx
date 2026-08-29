"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { BookmarkCheck, BookOpenCheck, ListPlus } from "lucide-react";
import { ReadingStatusValue } from "@prisma/client";
import {
  clearReadingStatusAction,
  setReadingStatusAction,
} from "@/actions/reading-status.actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReadingStatusControlProps {
  novelId: string;
  isLoggedIn: boolean;
  initialStatus: ReadingStatusValue | null;
  tone?: "day" | "night";
}

const OPTIONS: { value: ReadingStatusValue; label: string; icon: typeof ListPlus }[] = [
  { value: "WANT", label: "Want to read", icon: ListPlus },
  { value: "READING", label: "Reading", icon: BookOpenCheck },
  { value: "FINISHED", label: "Finished", icon: BookmarkCheck },
];

export function ReadingStatusControl({
  novelId,
  isLoggedIn,
  initialStatus,
  tone = "day",
}: ReadingStatusControlProps) {
  const [status, setStatus] = useState(initialStatus);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const night = tone === "night";

  if (!isLoggedIn) {
    return (
      <Button
        type="button"
        variant="outline"
        className={cn(
          "min-h-11 rounded-full font-bold",
          night ? "mv-night-chip" : "mv-nav-login"
        )}
        render={<Link href={`/login?callbackUrl=/novels/${novelId}`} />}
      >
        <ListPlus data-icon="inline-start" aria-hidden />
        Add to library
      </Button>
    );
  }

  function handleSelect(value: ReadingStatusValue) {
    setError(null);
    const next = status === value ? null : value;
    startTransition(async () => {
      const result = next
        ? await setReadingStatusAction(novelId, next)
        : await clearReadingStatusAction(novelId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setStatus(next);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const active = status === option.value;
        return (
          <Button
            key={option.value}
            type="button"
            variant={active ? "default" : "outline"}
            disabled={isPending}
            onClick={() => handleSelect(option.value)}
            className={cn(
              "min-h-11 rounded-full",
              active && "shadow-sm",
              !active && night && "mv-night-chip"
            )}
            aria-pressed={active}
          >
            <Icon data-icon="inline-start" aria-hidden />
            {option.label}
          </Button>
        );
      })}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
