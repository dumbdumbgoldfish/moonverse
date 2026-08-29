"use client";

import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Sparkles } from "lucide-react";
import {
  MV_MOONIE_BTN,
  MV_MOONIE_BTN_ON_DARK,
  MV_MOONIE_BTN_SOFT,
  MV_MOONIE_ICON,
  MV_MOONIE_ICON_ON_DARK,
  MV_MOONIE_SIZE,
} from "@/lib/mv-buttons";
import { moonieEntryHref, openMoonie } from "@/lib/moonie/open-moonie";
import { cn } from "@/lib/utils";

type AskMoonieButtonVariant = "solid" | "soft";
type AskMoonieButtonTone = "light" | "dark";
type AskMoonieButtonSize = keyof typeof MV_MOONIE_SIZE;

type AskMoonieButtonProps = {
  prompt?: string;
  href?: string;
  variant?: AskMoonieButtonVariant;
  tone?: AskMoonieButtonTone;
  size?: AskMoonieButtonSize;
  showIcon?: boolean;
  children?: ReactNode;
  className?: string;
} & Omit<ComponentPropsWithoutRef<"button">, "children" | "className">;

function moonieBtnClasses({
  variant = "solid",
  tone = "light",
  size = "md",
  className,
}: {
  variant?: AskMoonieButtonVariant;
  tone?: AskMoonieButtonTone;
  size?: AskMoonieButtonSize;
  className?: string;
}) {
  const base =
    tone === "dark"
      ? MV_MOONIE_BTN_ON_DARK
      : variant === "solid"
        ? MV_MOONIE_BTN
        : MV_MOONIE_BTN_SOFT;

  return cn(base, MV_MOONIE_SIZE[size], className);
}

function moonieIconClass(tone: AskMoonieButtonTone, size: AskMoonieButtonSize) {
  if (tone === "dark") {
    return size === "lg" ? "size-4 shrink-0 text-[#E8C36A]" : MV_MOONIE_ICON_ON_DARK;
  }
  return size === "lg" ? "size-4 shrink-0 text-[#6246ea]" : MV_MOONIE_ICON;
}

export function AskMoonieButton({
  prompt,
  href,
  variant = "solid",
  tone = "light",
  size = "md",
  showIcon = true,
  children = "Ask Moonie",
  className,
  onClick,
  type = "button",
  ...props
}: AskMoonieButtonProps) {
  const classes = moonieBtnClasses({ variant, tone, size, className });
  const iconClass = moonieIconClass(tone, size);

  const content = (
    <>
      {showIcon ? <Sparkles className={iconClass} aria-hidden /> : null}
      {children}
    </>
  );

  if (href !== undefined) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented) {
          openMoonie(prompt);
        }
      }}
      {...props}
    >
      {content}
    </button>
  );
}

/** Link-style Ask Moonie CTA (deep links with prompt in URL). */
export function AskMoonieLink({
  prompt,
  href,
  variant = "solid",
  tone = "light",
  size = "md",
  showIcon = true,
  children = "Ask Moonie",
  className,
}: Omit<AskMoonieButtonProps, "onClick" | "type">) {
  return (
    <Link
      href={href ?? moonieEntryHref(prompt)}
      className={moonieBtnClasses({ variant, tone, size, className })}
    >
      {showIcon ? (
        <Sparkles className={moonieIconClass(tone, size)} aria-hidden />
      ) : null}
      {children}
    </Link>
  );
}

export { MV_MOONIE_BTN, MV_MOONIE_BTN_ON_DARK, MV_MOONIE_BTN_SOFT };
