import type { LucideIcon } from "lucide-react";
import { SectionAnchorButton } from "@/components/legal/SectionAnchorButton";
import { cn } from "@/lib/utils";

interface PolicySectionProps {
  id: string;
  title: string;
  number?: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
}

export function PolicySection({
  id,
  title,
  number,
  icon: Icon,
  children,
  className,
}: PolicySectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-28 rounded-[22px] border border-violet-200/70 bg-white p-6 shadow-[0_10px_30px_-18px_rgba(76,29,149,0.18)] sm:p-7",
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3.5">
          {number ? (
            <span className="mt-0.5 font-serif text-2xl font-bold tabular-nums text-violet-300 sm:text-3xl">
              {number}
            </span>
          ) : Icon ? (
            <div className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Icon className="size-5" aria-hidden />
            </div>
          ) : null}
          <h2 className="font-serif text-[1.625rem] font-bold leading-snug tracking-tight text-slate-950 sm:text-[1.875rem]">
            {title}
          </h2>
        </div>
        <SectionAnchorButton sectionId={id} label={title} />
      </div>
      <div className="mt-5 space-y-4 text-[1.0625rem] leading-[1.75] text-slate-700 [&_a]:font-semibold [&_a]:text-violet-700 [&_a]:underline-offset-2 hover:[&_a]:underline [&_li]:leading-relaxed [&_strong]:font-semibold [&_strong]:text-slate-900 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
        {children}
      </div>
    </section>
  );
}
