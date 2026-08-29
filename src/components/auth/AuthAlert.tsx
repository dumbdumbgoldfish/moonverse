import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthAlertProps {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}

export function AuthAlert({ tone = "error", children }: AuthAlertProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-2xl px-3.5 py-2.5 text-sm leading-6",
        tone === "error" &&
          "border border-rose-200 bg-rose-50 text-rose-800",
        tone === "success" &&
          "border border-emerald-200 bg-emerald-50 text-emerald-800",
        tone === "info" &&
          "border border-[#6E46C7]/15 bg-[#F4ECF8] text-night-blue"
      )}
    >
      {children}
    </div>
  );
}
