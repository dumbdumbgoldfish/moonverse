import Link from "next/link";
import { Users } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/date-utils";
import type { ActivityPreview } from "@/types/discovery";

interface CommunityActivityProps {
  activity: ActivityPreview[];
}

export function CommunityActivity({ activity }: CommunityActivityProps) {
  if (activity.length === 0) return null;

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-4 shadow-sm">
      <h2 className="inline-flex items-center gap-1.5 text-sm font-bold text-night-blue">
        <Users className="size-4 text-primary" aria-hidden />
        Community activity
      </h2>
      <ul className="mt-3 divide-y divide-violet-50">
        {activity.slice(0, 6).map((item) => {
          const content = (
            <div className="flex items-start gap-2.5 py-2.5">
              <Avatar size="sm" className="shrink-0">
                <AvatarFallback className="bg-violet-100 text-[10px] font-bold text-primary">
                  {item.actorInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs leading-snug text-slate-700">{item.message}</p>
                <time
                  dateTime={item.createdAt}
                  className="mt-0.5 block text-[10px] font-semibold text-slate-400"
                >
                  {formatRelativeTime(item.createdAt)}
                </time>
              </div>
            </div>
          );

          return (
            <li key={item.id}>
              {item.link ? (
                <Link
                  href={item.link}
                  className="block rounded-lg transition hover:bg-violet-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {content}
                </Link>
              ) : (
                content
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
