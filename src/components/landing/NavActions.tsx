import Link from "next/link";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { cn } from "@/lib/utils";

interface NavGuestActionsProps {
  moonieHref?: string;
  className?: string;
}

export function NavGuestActions({
  moonieHref = "/ask-moonie",
  className,
}: NavGuestActionsProps) {
  return (
    <nav className={cn("flex items-center gap-2 xl:gap-3", className)} aria-label="Account actions">
      <AskMoonieLink href={moonieHref} size="md">
        <span className="hidden xl:inline">Ask Moonie</span>
        <span className="xl:hidden">Moonie</span>
      </AskMoonieLink>

      <div className="ml-1 flex items-center gap-2 border-l border-[#1A1224]/10 pl-3 xl:ml-1.5 xl:pl-3.5">
        <Link
          href="/login"
          prefetch={false}
          className={cn(
            "mv-nav-login inline-flex h-11 min-h-[44px] items-center justify-center rounded-full px-4 text-[13px] font-semibold tracking-wide sm:px-5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
        >
          Log in
        </Link>

        <Link
          href="/register"
          prefetch={false}
          className={cn(
            "mv-nav-signup inline-flex h-11 min-h-[44px] items-center justify-center rounded-full px-5 text-[13px] font-semibold tracking-wide text-white sm:px-6",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          )}
        >
          Sign up
        </Link>
      </div>
    </nav>
  );
}

interface NavAuthActionsProps {
  moonieHref: string;
  className?: string;
}

export function NavAuthActions({ moonieHref, className }: NavAuthActionsProps) {
  return (
    <div className={cn("flex items-center gap-2 xl:gap-3", className)}>
      <AskMoonieLink href={moonieHref} size="md">
        <span className="hidden xl:inline">Ask Moonie</span>
        <span className="xl:hidden">Moonie</span>
      </AskMoonieLink>
    </div>
  );
}
