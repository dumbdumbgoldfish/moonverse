"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

interface AuthRequiredLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  "aria-label"?: string;
}

/** Guests go to login with a return path; signed-in users get `href`. */
export function AuthRequiredLink({
  href,
  children,
  className,
  ...rest
}: AuthRequiredLinkProps) {
  const { status } = useSession();
  const target =
    status === "unauthenticated"
      ? `/login?callbackUrl=${encodeURIComponent(href)}`
      : href;

  return (
    <Link href={target} className={cn(className)} {...rest}>
      {children}
    </Link>
  );
}
