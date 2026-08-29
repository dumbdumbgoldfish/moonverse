import type { ReactNode } from "react";
import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthFieldNoteProps {
  tone?: "muted" | "ok" | "error";
  children: ReactNode;
}

export function AuthFieldNote({ tone = "muted", children }: AuthFieldNoteProps) {
  return (
    <p
      className={cn(
        "text-xs leading-5",
        tone === "muted" && "text-[#1A1224]/50",
        tone === "ok" && "font-medium text-emerald-700",
        tone === "error" && "font-medium text-rose-700"
      )}
    >
      {children}
    </p>
  );
}

interface AuthRequirement {
  id: string;
  label: string;
  met: boolean;
}

export function AuthRequirementList({
  items,
  started,
}: {
  items: AuthRequirement[];
  started: boolean;
}) {
  return (
    <ul className="space-y-1" aria-live="polite">
      {items.map((item) => {
        const done = started && item.met;
        return (
          <li key={item.id} className="flex items-center gap-1.5 text-xs">
            {done ? (
              <Check className="size-3.5 text-emerald-600" aria-hidden />
            ) : (
              <Circle
                className={cn(
                  "size-3.5",
                  started && !item.met ? "text-rose-400" : "text-[#1A1224]/28"
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                done ? "text-emerald-800" : started && !item.met ? "text-rose-700" : "text-[#1A1224]/50"
              )}
            >
              {item.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
