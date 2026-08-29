import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AuthPanelProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AuthPanel({
  eyebrow,
  title,
  description,
  children,
  footer,
  className,
}: AuthPanelProps) {
  return (
    <div className={cn("mv-auth-card relative overflow-hidden", className)}>
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#C89B4A]/70 to-transparent"
        aria-hidden
      />
      <div className="relative p-6 sm:p-8">
        {eyebrow ? (
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#6E46C7]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-serif text-[1.85rem] font-black leading-tight text-night-blue sm:text-[2.05rem]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[#1A1224]/62">{description}</p>
        ) : null}
        <div className="mt-6">{children}</div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}
