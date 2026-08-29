import type { ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  Bookmark,
  BookOpen,
  Compass,
  Heart,
  Sparkles,
  Users,
} from "lucide-react";
import { CatalogLink } from "@/components/ui/CatalogLink";
import { cn } from "@/lib/utils";

const WHY_ITEMS = [
  { icon: Compass, label: "Discover web novels", href: "/discover" },
  { icon: BookOpen, label: "Read community reviews", href: "/community" },
  { icon: Heart, label: "Save favourites", href: "/register" },
  { icon: Users, label: "Follow reviewers", href: "/register" },
] as const;

const UNLOCK_ITEMS = [
  "Personal recommendations",
  "Saved folders",
  "Reading status",
  "Notification preferences",
] as const;

function RailCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[#C89B4A]/15 bg-gradient-to-br from-[#2A1840]/90 via-[#1A1224]/95 to-[#241535]/90 p-3 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.65)] backdrop-blur-sm sm:p-3.5",
        className,
      )}
    >
      <h2 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#E6D2A3]">
        {title}
      </h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

export function GuestAskMoonieDiscoveryRail() {
  return (
    <aside className="flex min-h-0 min-w-0 flex-col gap-3 overflow-y-auto overscroll-contain lg:gap-3 lg:pr-0.5">
      <RailCard title="Why MoonVerse?">
        <ul className="space-y-1.5">
          {WHY_ITEMS.map(({ icon: Icon, label, href }) => (
            <li key={label}>
              <Link
                href={href}
                className="flex items-center gap-2 rounded-lg px-1 py-0.5 text-sm text-white/80 transition hover:text-[#FFFBFF]"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#6E46C7]/20 text-[#D4B8FF]">
                  <Icon className="size-3.5" aria-hidden />
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </RailCard>

      <RailCard title="Unlock more with an account" className="border-[#6E46C7]/25">
        <ul className="space-y-1 text-sm text-white/70">
          {UNLOCK_ITEMS.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-3.5 shrink-0 text-[#C89B4A]" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-xs leading-relaxed text-white/55">
          Save picks, follow readers you trust, and let Moonie learn your taste over time.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <CatalogLink href="/register" size="compact">
            Create free account
          </CatalogLink>
          <CatalogLink href="/login?callbackUrl=/ask-moonie" size="compact">
            Log in
          </CatalogLink>
        </div>
        <div className="mt-2.5 flex items-center gap-2 text-[11px] text-white/45">
          <Bookmark className="size-3.5" aria-hidden />
          Shelves
          <Bell className="size-3.5" aria-hidden />
          Alerts
        </div>
      </RailCard>
    </aside>
  );
}
