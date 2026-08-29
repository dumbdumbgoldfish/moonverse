import Link from "next/link";
import { BookMarked, PencilLine, Stars } from "lucide-react";
import { AskMoonieLink } from "@/components/moonie/AskMoonieButton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ReviewComposerProps {
  displayName: string;
  avatarInitials: string;
}

export function ReviewComposer({
  displayName,
  avatarInitials,
}: ReviewComposerProps) {
  const firstName = displayName.split(" ")[0] || "reader";

  return (
    <section className="rounded-[20px] border border-[var(--mv-border,#E6DFF8)] bg-white p-3 shadow-sm sm:p-4">
      <div className="flex items-center gap-3">
        <Avatar className="size-11 shrink-0">
          <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary">
            {avatarInitials}
          </AvatarFallback>
        </Avatar>
        <Link
          href="/reviews/new"
          className="flex min-h-11 min-w-0 flex-1 items-center rounded-full border border-[var(--mv-border,#E6DFF8)] bg-[var(--mv-surface-soft,#F3EFFF)] px-4 text-sm text-[var(--mv-muted,#6F6884)] transition hover:border-violet-200 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          What did you finish reading, {firstName}?
        </Link>
        <Link
          href="/reviews/new"
          className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-[var(--mv-primary,#6542E8)] px-3.5 text-sm font-bold text-white transition hover:bg-[var(--mv-primary-hover,#5634D6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:px-4"
        >
          <PencilLine className="size-4" aria-hidden />
          <span className="hidden sm:inline">Write review</span>
          <span className="sm:hidden">Write</span>
        </Link>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[var(--mv-border,#E6DFF8)] pt-3">
        <Link
          href="/reviews/new"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--mv-muted,#6F6884)] transition hover:bg-[var(--mv-surface-soft,#F3EFFF)] hover:text-primary"
        >
          <PencilLine className="size-3.5" aria-hidden />
          Review a novel
        </Link>
        <AskMoonieLink
          href="/moonie"
          size="xs"
          showIcon
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-none ring-0"
        />
        <Link
          href="/folders"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--mv-muted,#6F6884)] transition hover:bg-[var(--mv-surface-soft,#F3EFFF)] hover:text-primary"
        >
          <BookMarked className="size-3.5" aria-hidden />
          Open saved list
        </Link>
        <Link
          href="/search"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[var(--mv-muted,#6F6884)] transition hover:bg-[var(--mv-surface-soft,#F3EFFF)] hover:text-primary"
        >
          <Stars className="size-3.5" aria-hidden />
          Recommend a story
        </Link>
      </div>
    </section>
  );
}
