import type { ComponentProps } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const deskActionBase =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border text-sm font-semibold whitespace-nowrap transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]/40 disabled:pointer-events-none disabled:opacity-45";

export const deskSizes = {
  md: "h-11 px-5",
  sm: "h-9 px-3 text-xs",
  xs: "h-9 px-2 text-xs gap-1",
} as const;

export const deskEqualWidth = "w-full min-w-0 justify-center";

export const deskPrimaryClass =
  "!border-transparent !bg-gradient-to-r !from-[var(--mv-violet)] !via-[var(--mv-plum)] !to-[var(--mv-deep-plum)] !text-white shadow-[0_10px_24px_-14px_rgba(76,29,149,0.5)] hover:brightness-105 active:brightness-95";

export const deskSecondaryClass =
  "!border-[var(--mv-plum)]/22 !bg-[var(--mv-surface-soft)] !text-[var(--mv-plum)] shadow-none hover:!border-[var(--mv-plum)]/35 hover:!bg-[var(--mv-glow)]/60";

export const deskOutlineClass =
  "!border-[var(--mv-border)] !bg-white !text-[var(--mv-ink)] shadow-none hover:!border-[var(--mv-plum)]/25 hover:!bg-[var(--mv-paper)]";

export const deskDangerClass =
  "!border-transparent !bg-red-600 !text-white hover:!bg-red-700 active:!bg-red-800 shadow-[0_8px_20px_-14px_rgba(220,38,38,0.4)]";

type DeskSize = keyof typeof deskSizes;

type DeskButtonProps = Omit<ComponentProps<typeof Button>, "size"> & {
  deskSize?: DeskSize;
  showDeleteIcon?: boolean;
};

function deskDeleteIconClass(deskSize: DeskSize = "md") {
  return deskSize === "md" ? "size-4" : "size-3.5";
}

function deskButtonClass(variant: string, deskSize: DeskSize = "md") {
  return cn(deskActionBase, deskSizes[deskSize], variant);
}

export function DeskPrimaryButton({
  deskSize = "md",
  className,
  ...props
}: DeskButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(deskButtonClass(deskPrimaryClass, deskSize), className)}
      {...props}
    />
  );
}

export function DeskSecondaryButton({
  deskSize = "md",
  className,
  ...props
}: DeskButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(deskButtonClass(deskSecondaryClass, deskSize), className)}
      {...props}
    />
  );
}

export function DeskOutlineButton({
  deskSize = "md",
  className,
  ...props
}: DeskButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(deskButtonClass(deskOutlineClass, deskSize), className)}
      {...props}
    />
  );
}

export function DeskDangerButton({
  deskSize = "md",
  className,
  showDeleteIcon = true,
  children,
  ...props
}: DeskButtonProps) {
  return (
    <Button
      variant="ghost"
      className={cn(deskButtonClass(deskDangerClass, deskSize), className)}
      {...props}
    >
      {showDeleteIcon ? (
        <Trash2 className={deskDeleteIconClass(deskSize)} aria-hidden />
      ) : null}
      {children}
    </Button>
  );
}

export function DeskActionRow({
  columns = 3,
  className,
  children,
}: {
  columns?: 2 | 3;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        columns === 2 ? "grid-cols-2" : "grid-cols-3",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DeskTextLink({
  className,
  ...props
}: ComponentProps<typeof Link>) {
  return (
    <Link
      className={cn(deskButtonClass(deskSecondaryClass, "sm"), className)}
      {...props}
    />
  );
}

export function DeskTabButton({
  active = false,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-3 text-sm font-bold transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mv-plum)]/40",
        active
          ? cn(deskActionBase, deskPrimaryClass, "min-h-11 h-11 border-transparent px-4")
          : "text-slate-600 hover:bg-[var(--mv-paper)]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function DeskTabCount({
  active = false,
  children,
}: {
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-bold",
        active ? "bg-white/20 text-white" : "bg-white text-[var(--mv-plum)] ring-1 ring-[var(--mv-plum)]/10"
      )}
    >
      {children}
    </span>
  );
}
