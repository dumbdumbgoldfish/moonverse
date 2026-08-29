"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { PolicySectionMeta } from "@/components/legal/types";
import { cn } from "@/lib/utils";

interface PolicyMobileTocProps {
  sections: PolicySectionMeta[];
}

export function PolicyMobileToc({ sections }: PolicyMobileTocProps) {
  const [open, setOpen] = useState(false);

  if (sections.length === 0) return null;

  return (
    <div className="print:hidden lg:hidden">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className={cn(
          "flex h-12 min-h-[44px] w-full items-center justify-between rounded-2xl border border-violet-200 bg-white px-4 text-sm font-semibold text-slate-900",
          "shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        )}
      >
        On this page
        <ChevronDown
          className={cn(
            "size-4 text-violet-500 transition-transform duration-200",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
      {open && (
        <ul className="mt-2 space-y-1 rounded-2xl border border-violet-100 bg-white p-2 shadow-sm">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-violet-50 hover:text-violet-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
