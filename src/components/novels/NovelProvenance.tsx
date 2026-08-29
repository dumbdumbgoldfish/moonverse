"use client";

import Link from "next/link";
import { ReportTargetType } from "@prisma/client";
import { BadgeCheck } from "lucide-react";
import { ReportButton } from "@/components/moderation/ReportButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { NovelDetail } from "@/types/review";
import { cn } from "@/lib/utils";

interface NovelProvenanceProps {
  novel: NovelDetail;
  isLoggedIn: boolean;
  tone?: "light" | "dark";
}

function formatVerified(iso: string | null): string | null {
  if (!iso) return null;
  try {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
    }).format(new Date(iso));
  } catch {
    return null;
  }
}

export function NovelProvenance({
  novel,
  isLoggedIn,
  tone = "light",
}: NovelProvenanceProps) {
  const verified = formatVerified(novel.lastVerifiedAt);
  const officialCount = novel.readingLinks.filter(
    (link) => link.category === "OFFICIAL"
  ).length;
  const dark = tone === "dark";

  return (
    <Dialog>
      <DialogTrigger
        nativeButton
        className={cn(
          "inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-full px-3 text-left text-xs font-semibold focus-visible:outline-none focus-visible:ring-2",
          dark
            ? "border border-[#E8C36A]/55 bg-[#E8C36A]/8 text-[#E8C36A] hover:bg-[#E8C36A]/14 focus-visible:ring-[#E8C36A]"
            : "bg-[#F4ECF8] text-[#4C35C4] ring-1 ring-[#6E46C7]/15 mv-hover-signup focus-visible:ring-[#6E46C7]"
        )}
      >
        <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
        <span className="truncate">
          Catalogue
          {verified ? ` · ${verified}` : ""}
          {` · ${officialCount} official source${officialCount === 1 ? "" : "s"}`}
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg">Catalogue record</DialogTitle>
          <DialogDescription>
            MoonVerse stores catalogue metadata and community reviews. It does
            not host novel text.
          </DialogDescription>
        </DialogHeader>
        <dl className="space-y-2 text-sm text-[#3f3a50]">
          <div className="flex justify-between gap-4">
            <dt>Metadata source</dt>
            <dd className="font-medium text-[#1a1033]">
              {novel.metadataSource || "MoonVerse catalogue"}
            </dd>
          </div>
          {verified ? (
            <div className="flex justify-between gap-4">
              <dt>Last verified</dt>
              <dd className="font-medium text-[#1a1033]">{verified}</dd>
            </div>
          ) : null}
          {novel.chapterCount ? (
            <div className="flex justify-between gap-4">
              <dt>Listed chapters</dt>
              <dd className="font-medium text-[#1a1033]">{novel.chapterCount}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-4">
            <dt>Reading sources</dt>
            <dd className="font-medium text-[#1a1033]">
              {novel.readingLinks.length}
            </dd>
          </div>
        </dl>
        {novel.publicLists.length > 0 ? (
          <div>
            <h3 className="text-sm font-semibold text-[#1a1033]">
              Public lists including this work
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {novel.publicLists.map((list) => (
                <li key={list.id}>
                  <Link
                    href={`/folders/${list.id}`}
                    className="inline-flex min-h-10 items-center rounded-full bg-[#F4ECF8] px-3 text-xs font-semibold text-[#4C35C4]"
                  >
                    {list.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <ReportButton
          targetType={ReportTargetType.NOVEL}
          targetId={novel.id}
          isLoggedIn={isLoggedIn}
          variant="chip"
          label="Report incorrect metadata"
          title="Report incorrect information"
          description="Tell us what is wrong with this catalogue record so moderators can check it."
          reasons={[
            "Wrong title or alias",
            "Wrong author",
            "Broken or unofficial reading link",
            "Incorrect status, language, or length",
            "Missing or incorrect content warning",
            "Duplicate listing",
            "Other",
          ]}
        />
      </DialogContent>
    </Dialog>
  );
}
