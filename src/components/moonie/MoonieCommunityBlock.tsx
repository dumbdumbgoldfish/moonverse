"use client";

import Link from "next/link";
import type { MoonieCommunityInsight } from "@/types/moonie";

interface MoonieCommunityBlockProps {
  community: MoonieCommunityInsight;
  novelId: string;
  className?: string;
  compact?: boolean;
}

function ThemeRow({
  label,
  items,
}: {
  label: string;
  items: Array<{ label: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-xs text-slate-700">
        {items.map((item) => item.label).join(" · ")}
      </p>
    </div>
  );
}

export function MoonieCommunityBlock({
  community,
  novelId,
  className,
  compact = false,
}: MoonieCommunityBlockProps) {
  const hasThemes =
    (community.praised?.length ?? 0) > 0 ||
    (community.criticised?.length ?? 0) > 0 ||
    (community.mixed?.length ?? 0) > 0 ||
    (community.divisive?.length ?? 0) > 0;

  if (community.reviewCount === 0) return null;

  if (compact) {
    const praised = (community.praised ?? []).slice(0, 2).map((t) => t.label);
    const mixed = (community.mixed ?? []).slice(0, 1).map((t) => t.label);

    return (
      <div
        className={`inline-block max-w-full min-w-0 w-fit rounded-xl border border-violet-100 bg-[#FBF6FC] px-3 py-2 text-xs text-slate-700 ${className ?? ""}`}
      >
        <p>
          {community.averageRating != null
            ? `${community.averageRating.toFixed(1)} ★`
            : "No rating yet"}
          {" · "}
          {community.reviewCount} review{community.reviewCount === 1 ? "" : "s"}
          {community.signalLabel ? ` · ${community.signalLabel}` : ""}
        </p>
        {praised.length > 0 ? (
          <p className="mt-1">
            <span className="font-semibold text-[#4C2A67]">Praised:</span>{" "}
            {praised.join(", ")}
          </p>
        ) : null}
        {mixed.length > 0 ? (
          <p className="mt-0.5">
            <span className="font-semibold text-[#4C2A67]">Mixed:</span>{" "}
            {mixed.join(", ")}
          </p>
        ) : null}
        <Link
          href={`/novels/${novelId}`}
          className="mt-1 inline-block text-[11px] font-semibold text-primary hover:underline"
        >
          Open salon
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`max-w-full min-w-0 rounded-2xl border border-violet-100 bg-[#FBF6FC] px-3 py-2.5 ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4C2A67]">
          Community
        </p>
        {community.signalLabel ? (
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-violet-100">
            {community.signalLabel}
          </span>
        ) : null}
      </div>

      <p className="mt-1 text-sm text-slate-700">
        {community.averageRating != null
          ? `${community.averageRating.toFixed(1)} ★`
          : "No rating yet"}
        {" · "}
        {community.reviewCount} review{community.reviewCount === 1 ? "" : "s"}
      </p>

      {community.disclaimer ? (
        <p className="mt-1 text-xs text-slate-500">{community.disclaimer}</p>
      ) : null}

      {hasThemes ? (
        <div className="mt-2 space-y-2">
          <ThemeRow label="Readers often praise" items={community.praised ?? []} />
          <ThemeRow label="Mixed" items={community.mixed ?? []} />
          <ThemeRow label="Divisive" items={community.divisive ?? []} />
          <ThemeRow
            label="Often criticised"
            items={community.criticised ?? []}
          />
        </div>
      ) : community.consensus ? (
        <p className="mt-2 text-xs text-slate-600">{community.consensus}</p>
      ) : null}

      <Link
        href={`/novels/${novelId}#reviews`}
        className="mt-2 inline-block text-xs font-semibold text-[#6E46C7] hover:underline"
      >
        View reviews
      </Link>
    </div>
  );
}
