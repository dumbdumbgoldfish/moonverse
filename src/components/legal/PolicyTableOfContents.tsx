"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { PolicySectionMeta } from "@/components/legal/types";
import { cn } from "@/lib/utils";

interface PolicyTableOfContentsProps {
  sections: PolicySectionMeta[];
  backHref?: string;
  backLabel?: string;
}

export function PolicyTableOfContents({
  sections,
  backHref = "/",
  backLabel = "Back to home",
}: PolicyTableOfContentsProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    if (sections.length === 0) return;

    const elements = sections
      .map((section) => document.getElementById(section.id))
      .filter((el): el is HTMLElement => Boolean(el));

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="On this page" className="space-y-4">
      <Link
        href={backHref}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-violet-700 transition-colors hover:text-violet-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {backLabel}
      </Link>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
          On this page
        </p>
        <ul className="mt-3 space-y-1">
          {sections.map((section) => {
            const active = activeId === section.id;
            return (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={cn(
                    "group flex min-h-11 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                    active
                      ? "bg-violet-50 font-semibold text-violet-800"
                      : "text-slate-600 hover:bg-violet-50/70 hover:text-violet-700"
                  )}
                  aria-current={active ? "location" : undefined}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                      active ? "bg-violet-600" : "bg-violet-200 group-hover:bg-violet-400"
                    )}
                    aria-hidden
                  />
                  {section.title}
                </a>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
