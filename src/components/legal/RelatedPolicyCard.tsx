import Link from "next/link";
import type { PolicyRelatedLink } from "@/components/legal/types";
import { cn } from "@/lib/utils";

interface RelatedPolicyCardProps {
  link: PolicyRelatedLink;
}

export function RelatedPolicyCard({ link }: RelatedPolicyCardProps) {
  return (
    <Link
      href={link.href}
      className={cn(
        "group flex min-h-14 items-start justify-between gap-2 rounded-2xl border border-violet-100 bg-white px-3.5 py-3",
        "transition-colors hover:border-violet-200 hover:bg-violet-50/70",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{link.label}</p>
        {link.description && (
          <p className="mt-0.5 text-xs leading-5 text-slate-500">{link.description}</p>
        )}
      </div>
    </Link>
  );
}
