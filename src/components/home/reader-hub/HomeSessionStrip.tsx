"use client";

import type { ReadingTasteSnapshot } from "@/services/feed.service";
import { useReaderHub } from "./reader-hub-context";

interface HomeSessionStripProps {
  taste: ReadingTasteSnapshot;
  greetingName: string;
}

function timeGreeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function HomeSessionStrip({ taste, greetingName }: HomeSessionStripProps) {
  const { displaySection } = useReaderHub();
  const hour = new Date().getHours();
  const greeting = timeGreeting(hour);

  const parts = [
    taste.reviewCount > 0
      ? `${taste.reviewCount} review${taste.reviewCount === 1 ? "" : "s"}`
      : null,
    taste.savedNovelCount > 0
      ? `${taste.savedNovelCount} saved`
      : null,
    taste.followingCount > 0
      ? `${taste.followingCount} followed`
      : null,
  ].filter(Boolean);

  const sectionHint =
    displaySection === "community"
      ? "Reviews from your circle and the wider salon."
      : "Tonight's desk: picks, continue reading, and taste rows.";

  return (
    <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[#1A1224]/70">
        <span className="font-medium text-[#1A1224]">
          {greeting}, {greetingName}
        </span>
        {parts.length > 0 ? (
          <span className="text-[#1A1224]/50"> · {parts.join(" · ")}</span>
        ) : null}
      </p>
      <p className="text-xs text-[#1A1224]/45 sm:text-right">{sectionHint}</p>
    </div>
  );
}
