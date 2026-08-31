"use client";

import Link from "next/link";
import { MV_PRIMARY_BTN } from "@/lib/mv-buttons";
import { DETAIL_NOVEL_BTN } from "@/lib/reviews/detail-surface";
import { cn } from "@/lib/utils";

interface ReviewGuestAuthButtonsProps {
  callbackUrl: string;
  className?: string;
}

export function ReviewSignInButton({
  callbackUrl,
  className,
  children,
}: {
  callbackUrl: string;
  className?: string;
  children: React.ReactNode;
}) {
  const href = `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function ReviewGuestAuthButtons({
  callbackUrl,
  className,
}: ReviewGuestAuthButtonsProps) {
  const encoded = encodeURIComponent(callbackUrl);

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      <Link
        href={`/register?callbackUrl=${encoded}`}
        className={cn(MV_PRIMARY_BTN, "h-9 px-3.5 text-xs")}
      >
        Sign up
      </Link>
      <Link
        href={`/login?callbackUrl=${encoded}`}
        className={cn(DETAIL_NOVEL_BTN, "h-9 px-3.5 text-xs")}
      >
        Log in
      </Link>
    </div>
  );
}
