import Link from "next/link";
import { BookOpen, PencilLine, Sparkles, Users } from "lucide-react";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { HOME_SURFACE } from "@/lib/home-atelier";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { moonieVariantFor } from "@/lib/moonie/variants";
import type { HomeFeedTab } from "@/lib/feed";

interface CommunityEmptyStateProps {
  feed: HomeFeedTab;
  followingCount: number;
  /** True when For You has no taste signals yet. */
  learningTaste?: boolean;
}

function EmptyShell({
  children,
  actions,
}: {
  children: React.ReactNode;
  actions: React.ReactNode;
}) {
  return (
    <div className={`${HOME_SURFACE} px-6 py-12 text-center`}>
      {children}
      <div className="mt-6 flex flex-wrap justify-center gap-2">{actions}</div>
    </div>
  );
}

function PrimaryAction({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[var(--mv-deep-plum)] px-4 text-sm font-semibold text-white transition hover:bg-[var(--mv-plum)]"
    >
      {children}
    </Link>
  );
}

function SecondaryAction({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[var(--mv-border)] bg-white px-4 text-sm font-semibold text-[var(--mv-ink)] transition hover:border-[var(--mv-violet)]/30"
    >
      {children}
    </Link>
  );
}

export function CommunityEmptyState({
  feed,
  followingCount,
  learningTaste = false,
}: CommunityEmptyStateProps) {
  if (feed === "following" && followingCount === 0) {
    return (
      <EmptyShell
        actions={
          <>
            <PrimaryAction href="/search">
              <Users className="size-4" aria-hidden />
              Discover reviewers
            </PrimaryAction>
            <SecondaryAction href="/community?feed=trending">
              See what everyone is reading
            </SecondaryAction>
          </>
        }
      >
        <Users className="mx-auto size-8 text-[var(--mv-violet)]" aria-hidden />
        <h2 className="mt-4 font-serif text-2xl font-medium text-[var(--mv-ink)]">
          Following is quiet
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--mv-text-muted)]">
          Follow a few reviewers whose taste you trust. Start with three
          readers from Discover, then their latest reviews will land here first.
        </p>
      </EmptyShell>
    );
  }

  if (feed === "for-you") {
    return (
      <EmptyShell
        actions={
          <>
            <AskMoonieLink
              prompt="Recommend something for my taste"
              size="sm"
            />
            <SecondaryAction href="/browse">
              <BookOpen className="size-4" aria-hidden />
              Browse catalogue
            </SecondaryAction>
          </>
        }
      >
        <div className="mx-auto w-fit">
          <MoonieMascot
            variant={moonieVariantFor("emptyState")}
            size={72}
            display="badge"
            lightweight
          />
        </div>
        <h2 className="mt-4 font-serif text-2xl font-medium text-[var(--mv-ink)]">
          {learningTaste ? "We’re learning your taste" : "No picks yet"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--mv-text-muted)]">
          Save novels, follow reviewers, or ask Moonie. Your personalised feed
          will fill in quickly.
        </p>
      </EmptyShell>
    );
  }

  return (
    <EmptyShell
      actions={
        <>
          <PrimaryAction href="/reviews/new">
            <PencilLine className="size-4" aria-hidden />
            Write a review
          </PrimaryAction>
          <SecondaryAction href="/community?feed=trending">
            <BookOpen className="size-4" aria-hidden />
            Browse trending
          </SecondaryAction>
        </>
      }
    >
      <div className="mx-auto w-fit">
        <MoonieMascot
          variant={moonieVariantFor("emptyState")}
          size={72}
          display="badge"
          lightweight
        />
      </div>
      <h2 className="mt-4 font-serif text-2xl font-medium text-[var(--mv-ink)]">
        Quiet in this feed
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--mv-text-muted)]">
        Try a different sort, or be the first to share something worth
        discussing.
      </p>
    </EmptyShell>
  );
}
