"use client";

import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CoverImage } from "@/components/ui/CoverImage";
import { cn } from "@/lib/utils";
import type { BrowseWorkItem } from "@/types/browse";

interface BrowseComparePanelProps {
  works: BrowseWorkItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function cell(key: string, value: string) {
  return (
    <td key={key} className="px-3 py-2 align-top text-sm text-[#4c3d6e]">
      {value}
    </td>
  );
}

export function BrowseComparePanel({
  works,
  open,
  onOpenChange,
}: BrowseComparePanelProps) {
  if (works.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-h-[90dvh] w-full max-w-[calc(100%-1.5rem)] overflow-y-auto bg-[#FBF7F1] sm:max-w-4xl",
        )}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="font-serif text-xl text-[#1a1033]">
            Compare works
          </DialogTitle>
          <DialogDescription>
            Side-by-side catalogue evidence only. No invented stats.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 bg-[#FBF7F1] px-3 py-2 text-left text-xs font-bold uppercase tracking-wide text-[#1a1033]/45">
                  Signal
                </th>
                {works.map((work) => (
                  <th key={work.novelId} className="px-3 py-2 text-left">
                    <div className="flex items-start gap-2">
                      <span className="relative aspect-[2/3] w-12 shrink-0 overflow-hidden rounded-md bg-[#f4ecf8]">
                        <CoverImage
                          src={work.coverUrl}
                          alt=""
                          title={work.title}
                          author={work.author}
                          themeSeed={work.novelId}
                          sizes="48px"
                          compactFallback
                        />
                      </span>
                      <div className="min-w-0">
                        <Link
                          href={work.href}
                          className="line-clamp-2 font-serif text-sm font-bold text-[#1a1033] hover:text-primary"
                        >
                          {work.title}
                        </Link>
                        <p className="mt-0.5 line-clamp-1 text-xs text-[#1a1033]/50">
                          {work.author}
                        </p>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#1a1033]/08">
                <th className="sticky left-0 bg-[#FBF7F1] px-3 py-2 text-left text-xs font-semibold text-[#1a1033]">
                  Average rating
                </th>
                {works.map((work) =>
                  cell(
                    work.novelId,
                    work.reviewCount > 0
                      ? `${work.averageRating.toFixed(1)} (${work.reviewCount})`
                      : "-",
                  ),
                )}
              </tr>
              <tr>
                <th className="sticky left-0 bg-[#FBF7F1] px-3 py-2 text-left text-xs font-semibold text-[#1a1033]">
                  Bayesian strength
                </th>
                {works.map((work) =>
                  cell(
                    work.novelId,
                    work.bayesianRating > 0
                      ? work.bayesianRating.toFixed(2)
                      : "-",
                  ),
                )}
              </tr>
              <tr>
                <th className="sticky left-0 bg-[#FBF7F1] px-3 py-2 text-left text-xs font-semibold text-[#1a1033]">
                  Official link
                </th>
                {works.map((work) => (
                  <td key={work.novelId} className="px-3 py-2 text-sm">
                    {work.hasOfficialLink ? (
                      <span className="inline-flex items-center gap-1 text-emerald-800">
                        <ExternalLink className="size-3.5" aria-hidden />
                        Yes
                      </span>
                    ) : (
                      <span className="text-[#1a1033]/45">No</span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <th className="sticky left-0 bg-[#FBF7F1] px-3 py-2 text-left text-xs font-semibold text-[#1a1033]">
                  Genres
                </th>
                {works.map((work) =>
                  cell(work.novelId, work.genres.join(", ") || "-"),
                )}
              </tr>
              <tr>
                <th className="sticky left-0 bg-[#FBF7F1] px-3 py-2 text-left text-xs font-semibold text-[#1a1033]">
                  Tags
                </th>
                {works.map((work) =>
                  cell(work.novelId, work.tags.slice(0, 6).join(", ") || "-"),
                )}
              </tr>
              <tr>
                <th className="sticky left-0 bg-[#FBF7F1] px-3 py-2 text-left text-xs font-semibold text-[#1a1033]">
                  Status
                </th>
                {works.map((work) =>
                  cell(
                    work.novelId,
                    work.publicationStatus
                      ? work.publicationStatus.replace(/_/g, " ")
                      : "-",
                  ),
                )}
              </tr>
              <tr>
                <th className="sticky left-0 bg-[#FBF7F1] px-3 py-2 text-left text-xs font-semibold text-[#1a1033]">
                  Why this rank
                </th>
                {works.map((work) => (
                  <td
                    key={work.novelId}
                    className="px-3 py-2 text-sm text-[#4c3d6e]"
                  >
                    <ul className="space-y-1">
                      {work.rankExplain.reasons.slice(0, 3).map((reason) => (
                        <li key={reason} className="flex gap-1.5">
                          <Star
                            className="mt-0.5 size-3 shrink-0 text-[#C89B4A]"
                            aria-hidden
                          />
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
