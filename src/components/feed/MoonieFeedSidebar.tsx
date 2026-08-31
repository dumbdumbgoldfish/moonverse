import Link from "next/link";
import { Sparkles } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { MoonieDailyPick } from "@/components/moonie/MoonieDailyPick";
import { ActivityFeedItem } from "@/components/discovery/ActivityFeedItem";
import { Button } from "@/components/ui/button";
import { moonieLoggedInEntryHref } from "@/lib/moonie/open-moonie";
import { moonieVariantFor } from "@/lib/moonie/variants";
import type { ActivityPreview } from "@/types/discovery";
import type { ReviewListItem } from "@/types/review";

interface MoonieFeedSidebarProps {
  topPick?: ReviewListItem;
  activity: ActivityPreview[];
}

export function MoonieFeedSidebar({ topPick, activity }: MoonieFeedSidebarProps) {
  return (
    <aside className="hidden min-w-0 space-y-4 lg:block">
      <div className="mv-moonie-panel sticky top-24 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <MoonieMascot
            variant={moonieVariantFor("chat")}
            size={48}
            display="badge"
            lightweight
          />
          <div className="min-w-0">
            <p className="font-semibold text-foreground">Ask Moonie</p>
            <p className="text-xs text-muted-foreground">Personal picks & mood chat</p>
          </div>
        </div>
        <Button
          className="mt-4 w-full rounded-full"
          size="sm"
          render={<Link href={moonieLoggedInEntryHref()} />}
        >
          <Sparkles className="size-4" aria-hidden />
          Chat with Moonie
        </Button>
      </div>

      {topPick && <MoonieDailyPick review={topPick} compact />}

      {activity.length > 0 && (
        <section className="rounded-2xl border border-border/60 bg-white p-3 shadow-sm">
          <h2 className="mb-2 text-sm font-bold text-foreground">Community pulse</h2>
          <ul className="-mx-1 divide-y divide-border/50">
            {activity.slice(0, 4).map((item) => (
              <li key={item.id}>
                <ActivityFeedItem activity={item} compact />
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
