"use client";

import { BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NewNovelFields } from "@/components/reviews/write/NewNovelFields";
import { NovelModeSelector } from "@/components/reviews/write/NovelModeSelector";
import { NovelSearchCombobox } from "@/components/reviews/write/NovelSearchCombobox";
import { ReadingSourceFields } from "@/components/reviews/write/ReadingSourceFields";
import { SelectedNovelCard } from "@/components/reviews/write/SelectedNovelCard";
import { WritingStudioQuickPicks } from "@/components/reviews/write/WritingStudioQuickPicks";
import type { NovelSelectOption, NovelWriteContext } from "@/services/novel.service";
import type { ReadingStatusNovel } from "@/services/reading-status.service";
import { cn } from "@/lib/utils";

interface GenreOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
}

interface WritingStudioAttachPanelProps {
  collapsed?: boolean;
  novelMode: "existing" | "new";
  onNovelModeChange: (mode: "existing" | "new") => void;
  novels: NovelSelectOption[];
  selectedNovel: NovelSelectOption | null;
  selectedNovelId: string;
  changingNovel: boolean;
  onSelectNovel: (id: string) => void;
  onChangeNovel: () => void;
  onContinue?: () => void;
  novelStepComplete: boolean;
  deskReadingInCatalog: ReadingStatusNovel | null;
  finishedInCatalog: ReadingStatusNovel[];
  catalogIds: Set<string>;
  readingLinks: string[];
  onReadingLinksChange: (links: string[]) => void;
  activeNovelContext: NovelWriteContext | null;
  contextLoading: boolean;
  readingLinkErrors: string[];
  genres: GenreOption[];
  tags: TagOption[];
  novelTitle: string;
  novelAuthor: string;
  coverUrl: string;
  synopsis: string;
  originalLanguage: string;
  publicationStatus: string;
  selectedGenreIds: string[];
  selectedTagIds: string[];
  duplicates: NovelSelectOption[];
  acknowledgeDuplicate: boolean;
  onTitleChange: (v: string) => void;
  onAuthorChange: (v: string) => void;
  onCoverUrlChange: (v: string) => void;
  onSynopsisChange: (v: string) => void;
  onLanguageChange: (v: string) => void;
  onStatusChange: (v: string) => void;
  onGenreIdsChange: (ids: string[]) => void;
  onTagIdsChange: (ids: string[]) => void;
  onAcknowledgeDuplicateChange: (v: boolean) => void;
  onSelectExistingFromDuplicate: (id: string) => void;
  isPending: boolean;
  className?: string;
}

export function WritingStudioAttachPanel({
  collapsed = false,
  novelMode,
  onNovelModeChange,
  novels,
  selectedNovel,
  selectedNovelId,
  changingNovel,
  onSelectNovel,
  onChangeNovel,
  onContinue,
  novelStepComplete,
  deskReadingInCatalog,
  finishedInCatalog,
  catalogIds,
  readingLinks,
  onReadingLinksChange,
  activeNovelContext,
  contextLoading,
  readingLinkErrors,
  genres,
  tags,
  novelTitle,
  novelAuthor,
  coverUrl,
  synopsis,
  originalLanguage,
  publicationStatus,
  selectedGenreIds,
  selectedTagIds,
  duplicates,
  acknowledgeDuplicate,
  onTitleChange,
  onAuthorChange,
  onCoverUrlChange,
  onSynopsisChange,
  onLanguageChange,
  onStatusChange,
  onGenreIdsChange,
  onTagIdsChange,
  onAcknowledgeDuplicateChange,
  onSelectExistingFromDuplicate,
  isPending,
  className,
}: WritingStudioAttachPanelProps) {
  if (collapsed && selectedNovel && !changingNovel) {
    return (
      <div className={cn("rounded-2xl border border-[var(--mv-border)] bg-white p-4", className)}>
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-[var(--mv-ink)]">Attached novel</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onChangeNovel}
            disabled={isPending}
            className="h-8 rounded-lg text-xs text-[var(--mv-plum)]"
          >
            Change
          </Button>
        </div>
        <SelectedNovelCard
          novel={selectedNovel}
          onChange={onChangeNovel}
          disabled={isPending}
        />
      </div>
    );
  }

  return (
    <section
      className={cn(
        "rounded-2xl border border-[var(--mv-border)] bg-white shadow-[var(--mv-card-shadow)]",
        className
      )}
      aria-label="Attach a novel"
    >
      <div className="border-b border-[var(--mv-border)] px-5 py-4">
        <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mv-plum)]">
          <BookOpen className="size-3.5" aria-hidden />
          Attach
        </p>
        <h2 className="mt-1 font-serif text-xl font-semibold text-[var(--mv-ink)]">
          What are you reviewing?
        </h2>
        <p className="mt-1 text-sm text-[var(--mv-text-muted)]">
          Search the catalogue, pick from your shelf, or add a new title.
        </p>
      </div>

      <div className="space-y-5 px-5 py-5">
        <NovelModeSelector
          value={novelMode}
          onChange={onNovelModeChange}
          disableExisting={novels.length === 0}
          disabled={isPending}
        />

        {novelMode === "existing" && (!selectedNovelId || changingNovel) ? (
          <div className="space-y-4">
            <WritingStudioQuickPicks
              currentlyReading={deskReadingInCatalog}
              recentlyFinished={finishedInCatalog}
              catalogIds={catalogIds}
              selectedNovelId={selectedNovelId}
              onSelect={onSelectNovel}
            />
            <div className="space-y-2">
              <Label htmlFor="novel-search">Search novels</Label>
              <NovelSearchCombobox
                novels={novels}
                value={selectedNovelId}
                onChange={onSelectNovel}
                disabled={isPending}
              />
            </div>
          </div>
        ) : null}

        {novelMode === "existing" && selectedNovel && !changingNovel ? (
          <div className="space-y-4">
            <SelectedNovelCard
              novel={selectedNovel}
              onChange={onChangeNovel}
              disabled={isPending}
            />
            {contextLoading ? (
              <p className="text-sm text-[var(--mv-text-muted)]">
                Loading reading sources…
              </p>
            ) : null}
            <ReadingSourceFields
              mode="existing"
              links={readingLinks}
              onChange={onReadingLinksChange}
              verifiedSources={activeNovelContext?.verifiedSources}
              existingNormalizedUrls={activeNovelContext?.existingNormalizedUrls}
              disabled={isPending}
              errors={readingLinkErrors}
              embedded
            />
          </div>
        ) : null}

        {novelMode === "new" ? (
          <div className="space-y-5">
            <NewNovelFields
              title={novelTitle}
              author={novelAuthor}
              coverUrl={coverUrl}
              synopsis={synopsis}
              originalLanguage={originalLanguage}
              publicationStatus={publicationStatus}
              selectedGenreIds={selectedGenreIds}
              selectedTagIds={selectedTagIds}
              genres={genres}
              tags={tags}
              duplicates={duplicates}
              acknowledgeDuplicate={acknowledgeDuplicate}
              onTitleChange={onTitleChange}
              onAuthorChange={onAuthorChange}
              onCoverUrlChange={onCoverUrlChange}
              onSynopsisChange={onSynopsisChange}
              onLanguageChange={onLanguageChange}
              onStatusChange={onStatusChange}
              onGenreIdsChange={onGenreIdsChange}
              onTagIdsChange={onTagIdsChange}
              onAcknowledgeDuplicateChange={onAcknowledgeDuplicateChange}
              onSelectExisting={onSelectExistingFromDuplicate}
              disabled={isPending}
              genreError={
                selectedGenreIds.length === 0 ? "Select at least one genre." : null
              }
            />
            <ReadingSourceFields
              mode="new"
              links={readingLinks}
              onChange={onReadingLinksChange}
              disabled={isPending}
              errors={readingLinkErrors}
              embedded
            />
          </div>
        ) : null}

        {onContinue && novelStepComplete ? (
          <div className="flex justify-end border-t border-[var(--mv-border)] pt-4">
            <Button
              type="button"
              onClick={onContinue}
              disabled={isPending}
              className="min-h-10 rounded-xl bg-[var(--mv-deep-plum)] font-semibold text-white hover:bg-[var(--mv-plum)]"
            >
              Start writing
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
