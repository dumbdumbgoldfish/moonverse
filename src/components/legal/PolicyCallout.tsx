import {
  AlertTriangle,
  CheckCircle2,
  Info,
  ShieldAlert,
} from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { cn } from "@/lib/utils";

type CalloutType = "info" | "important" | "safety" | "practice" | "moonie";

interface PolicyCalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

const STYLES: Record<
  CalloutType,
  { wrap: string; icon: string; title: string }
> = {
  info: {
    wrap: "border-sky-200/80 bg-sky-50/80",
    icon: "bg-sky-100 text-sky-700",
    title: "text-sky-950",
  },
  important: {
    wrap: "border-amber-200/80 bg-amber-50/80",
    icon: "bg-amber-100 text-amber-800",
    title: "text-amber-950",
  },
  safety: {
    wrap: "border-rose-200/80 bg-rose-50/80",
    icon: "bg-rose-100 text-rose-700",
    title: "text-rose-950",
  },
  practice: {
    wrap: "border-emerald-200/80 bg-emerald-50/80",
    icon: "bg-emerald-100 text-emerald-700",
    title: "text-emerald-950",
  },
  moonie: {
    wrap: "border-violet-200/80 bg-violet-50/80",
    icon: "bg-violet-100 text-violet-700",
    title: "text-violet-950",
  },
};

export function PolicyCallout({
  type = "info",
  title,
  children,
  className,
}: PolicyCalloutProps) {
  const style = STYLES[type];

  return (
    <aside
      className={cn(
        "my-5 flex gap-3 rounded-2xl border p-4 sm:p-5",
        style.wrap,
        className
      )}
      role="note"
    >
      {type === "moonie" ? (
        <div className="shrink-0 pt-0.5" aria-hidden>
          <MoonieMascot size={36} variant="thinking" display="clean" lightweight />
        </div>
      ) : (
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            style.icon
          )}
        >
          {type === "info" && <Info className="size-4" aria-hidden />}
          {type === "important" && <AlertTriangle className="size-4" aria-hidden />}
          {type === "safety" && <ShieldAlert className="size-4" aria-hidden />}
          {type === "practice" && <CheckCircle2 className="size-4" aria-hidden />}
        </div>
      )}
      <div className="min-w-0 flex-1">
        {title && (
          <p className={cn("text-sm font-bold", style.title)}>{title}</p>
        )}
        <div
          className={cn(
            "text-sm leading-relaxed text-slate-700 [&_a]:font-semibold [&_a]:text-violet-700",
            title && "mt-1"
          )}
        >
          {children}
        </div>
      </div>
    </aside>
  );
}
