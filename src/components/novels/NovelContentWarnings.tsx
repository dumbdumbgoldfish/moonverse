"use client";

import { ShieldAlert } from "lucide-react";

interface NovelContentWarningsProps {
  warnings: { name: string; slug: string }[];
}

export function NovelContentWarnings({ warnings }: NovelContentWarningsProps) {
  if (warnings.length === 0) return null;

  return (
    <section
      aria-labelledby="content-warnings-heading"
      className="rounded-[22px] border border-amber-200/80 bg-[#fffdf8] p-4 sm:p-5"
    >
      <h2
        id="content-warnings-heading"
        className="flex items-center gap-2 font-heading text-xl font-semibold text-[#1a1033]"
      >
        <ShieldAlert className="size-5 text-amber-700" aria-hidden />
        Content warnings
      </h2>
      <details className="group mt-3">
        <summary className="flex min-h-11 cursor-pointer list-none items-center text-sm font-semibold text-amber-900 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]">
          <span className="group-open:hidden">
            Show {warnings.length} warning{warnings.length === 1 ? "" : "s"}
          </span>
          <span className="hidden group-open:inline">Hide warnings</span>
        </summary>
        <ul className="mt-3 flex flex-wrap gap-2">
          {warnings.map((warning) => (
            <li
              key={warning.slug}
              className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-950 ring-1 ring-amber-200"
            >
              {warning.name}
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}
