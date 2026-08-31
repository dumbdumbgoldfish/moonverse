import type { ReactNode } from "react";
import Link from "next/link";
import { ExternalLink, Megaphone, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/date-utils";
import {
  isPlatformAnnouncementMessage,
  parsePlatformAnnouncementMessage,
} from "@/lib/notifications/platform-announcement";
import { SITE_PAGE_SHELL_CLASS } from "@/lib/site-shell";
import { cn } from "@/lib/utils";
import type { EnrichedNotificationItem } from "@/types/notification";

const PLATFORM_DETAIL_HEADLINE = "MoonVerse System Announcement";

interface NotificationDetailViewProps {
  notification: EnrichedNotificationItem;
}

function renderMessageBody(message: string): ReactNode {
  const paragraphs = message
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  if (paragraphs.length <= 1) {
    return (
      <p className="whitespace-pre-wrap leading-relaxed text-[#2A1F38]">
        {message}
      </p>
    );
  }
  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph) => (
        <p
          key={paragraph}
          className="whitespace-pre-wrap leading-relaxed text-[#2A1F38]"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

export function NotificationDetailView({
  notification,
}: NotificationDetailViewProps) {
  const isPlatform = isPlatformAnnouncementMessage(notification.message);
  const title = isPlatform
    ? PLATFORM_DETAIL_HEADLINE
    : notification.headline;
  const body = isPlatform
    ? parsePlatformAnnouncementMessage(notification.message)
    : notification.message;
  const externalLink =
    notification.link && !notification.link.startsWith("/messages")
      ? notification.link
      : null;

  return (
    <div className="bg-[#FFFBFF] pb-12">
      <div className={cn(SITE_PAGE_SHELL_CLASS, "py-6 sm:py-10")}>
        <article
          className={cn(
            "relative overflow-hidden rounded-2xl border p-6 sm:p-8",
            isPlatform
              ? "border-[#E4D8C8]/90 bg-[linear-gradient(165deg,#FFFDF9_0%,#FAF4F8_42%,#F3EAF6_100%)] shadow-[0_20px_56px_-32px_rgba(36,22,48,0.32)] ring-1 ring-[#C89B4A]/18"
              : "border-violet-100/80 bg-white shadow-[0_12px_40px_-24px_rgba(26,16,51,0.35)]"
          )}
          aria-labelledby="notification-detail-title"
        >
          {isPlatform ? (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-14 border-b border-[#C89B4A]/20 bg-[linear-gradient(180deg,rgba(255,252,247,0.95)_0%,rgba(250,244,248,0.55)_100%)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute -right-10 -top-10 size-28 rotate-45 border border-[#D9CCE8]/50 bg-[#EDE4F4]/70 shadow-sm"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute left-8 top-0 h-0 w-[calc(100%-4rem)] border-b border-dashed border-[#C89B4A]/22"
                aria-hidden
              />
            </>
          ) : null}

          <div className="relative flex items-start gap-4 sm:gap-5">
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl shadow-sm ring-2 ring-white sm:size-12",
                isPlatform
                  ? "bg-gradient-to-br from-[#4C2A67] to-[#6E46C7] text-white"
                  : "bg-violet-100 text-[#4C2A67]"
              )}
            >
              {isPlatform ? (
                <Sparkles className="size-5" aria-hidden />
              ) : (
                <span className="text-sm font-bold">MV</span>
              )}
            </div>

            <div className="min-w-0 flex-1 pt-0.5">
              <h1
                id="notification-detail-title"
                className={cn(
                  "flex flex-wrap items-center gap-x-2 gap-y-1 font-serif font-semibold tracking-tight",
                  isPlatform
                    ? "text-[1.35rem] leading-snug text-[#3D2454] sm:text-[1.65rem]"
                    : "text-2xl text-[#1A1224] sm:text-3xl"
                )}
              >
                <span
                  className={cn(
                    isPlatform &&
                      "bg-gradient-to-r from-[#3D2454] via-[#4C2A67] to-[#5A3880] bg-clip-text text-transparent"
                  )}
                >
                  {title}
                </span>
                {isPlatform ? (
                  <Megaphone
                    className="size-[1.1em] shrink-0 text-[#B8873A]"
                    strokeWidth={2}
                    aria-hidden
                  />
                ) : null}
              </h1>
              <time
                dateTime={notification.createdAt}
                className="mt-2 block text-sm font-medium text-[#7A7284]"
              >
                {formatRelativeTime(notification.createdAt)}
              </time>
            </div>
          </div>

          <div
            className={cn(
              "relative mt-6 text-base sm:mt-7",
              isPlatform &&
                "rounded-xl border border-[#E8DFD0]/80 bg-white/55 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:px-5 sm:py-5"
            )}
          >
            {renderMessageBody(body)}
          </div>

          {externalLink ? (
            <div className="relative mt-6 border-t border-[#E8DFD0]/70 pt-6 sm:mt-8">
              <Button
                variant="outline"
                render={
                  <Link
                    href={externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
              >
                <ExternalLink data-icon="inline-start" aria-hidden />
                Open related link
              </Button>
            </div>
          ) : null}

          <div className="relative mt-8 flex justify-end pt-2 sm:mt-10">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 rounded-full border-[#4C2A67]/22 bg-white/90 px-4 text-sm font-semibold text-[#4C2A67]",
                "hover:border-[#6E46C7]/35 hover:bg-[#F8F1FA] hover:text-[#3D2454]",
                "focus-visible:border-[#6E46C7]/45 focus-visible:ring-[#6E46C7]/30"
              )}
              render={<Link href="/notifications" />}
            >
              Back to notifications
            </Button>
          </div>
        </article>
      </div>
    </div>
  );
}
