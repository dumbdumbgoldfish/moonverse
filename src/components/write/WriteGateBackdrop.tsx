import { PenLine, Star } from "lucide-react";

const BLURRED_FIELDS = [
  { label: "Novel", value: "Choose a web novel" },
  { label: "Rating", value: "★★★★★" },
  { label: "Review title", value: "Your review title" },
  { label: "Review text", value: "Share what you thought…" },
  { label: "Genres and tags", value: "Add genres" },
];

/** Inactive blurred preview for the write gate; it contains no synthetic novel data. */
export function WriteGateBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-white to-amber-50/80" />
      <div className="absolute -left-16 top-20 size-56 rounded-full bg-violet-200/25 blur-3xl" />
      <div className="absolute bottom-10 right-0 size-64 rounded-full bg-amber-100/30 blur-3xl" />
      <div className="absolute right-[12%] top-[18%] flex gap-1 text-violet-200/70">
        <Star className="size-3 fill-violet-200/60" />
        <span className="mt-2 size-1.5 rounded-full bg-amber-200/80" />
      </div>

      <div className="absolute left-1/2 top-8 w-full max-w-xl -translate-x-1/2 px-6 opacity-[0.26] blur-[4px] sm:top-10">
        <div className="rounded-2xl border border-violet-100 bg-white/90 p-5 shadow-lg">
          <div className="mb-3 flex items-center gap-2 text-violet-400">
            <PenLine className="size-5" />
            <span className="text-lg font-bold">Write a review</span>
          </div>
          <div className="space-y-3">
            {BLURRED_FIELDS.map((field) => (
              <div key={field.label}>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {field.label}
                </p>
                <div className="mt-1.5 h-9 rounded-xl border border-violet-100 bg-violet-50/80 px-3 py-2 text-sm text-slate-500">
                  {field.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
