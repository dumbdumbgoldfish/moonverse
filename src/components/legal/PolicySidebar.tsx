import Link from "next/link";
import { Flag, HelpCircle, Mail } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { RelatedPolicyCard } from "@/components/legal/RelatedPolicyCard";
import type { PolicyRelatedLink } from "@/components/legal/types";
import { cn } from "@/lib/utils";

interface PolicySidebarProps {
  relatedLinks?: PolicyRelatedLink[];
  showMoonieHelp?: boolean;
  className?: string;
}

export function PolicySidebar({
  relatedLinks = [],
  showMoonieHelp = false,
  className,
}: PolicySidebarProps) {
  return (
    <aside
      className={cn(
        "h-fit space-y-4 self-start lg:sticky lg:top-28",
        className
      )}
    >
      <div className="overflow-hidden rounded-[22px] border border-violet-200/80 bg-gradient-to-br from-violet-50 to-white p-5 shadow-[0_10px_30px_-18px_rgba(76,29,149,0.18)]">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-950">Need help?</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Find answers or report a concern.
            </p>
          </div>
          {showMoonieHelp && (
            <div className="shrink-0" aria-hidden>
              <MoonieMascot size={40} variant="happy" display="clean" lightweight />
            </div>
          )}
        </div>

        <div className="mt-4 space-y-2">
          <Link
            href="/help"
            className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-violet-700 transition-colors hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <HelpCircle className="size-4" aria-hidden />
            Visit Help Centre
          </Link>
          <Link
            href="/reporting-abuse"
            className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-violet-700 transition-colors hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Flag className="size-4" aria-hidden />
            Report a concern
          </Link>
          <Link
            href="/contact"
            className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-semibold text-violet-700 transition-colors hover:bg-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Mail className="size-4" aria-hidden />
            Contact support
          </Link>
        </div>
      </div>

      {relatedLinks.length > 0 && (
        <div className="rounded-[22px] border border-violet-200/70 bg-white p-5 shadow-[0_10px_30px_-18px_rgba(76,29,149,0.14)]">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
            Related policies
          </p>
          <div className="mt-3 space-y-2">
            {relatedLinks.map((link) => (
              <RelatedPolicyCard key={link.href} link={link} />
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
