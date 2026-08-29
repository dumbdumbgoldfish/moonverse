"use client";

import { BookOpen, Tags, UserRound } from "lucide-react";
import { CoverImage } from "@/components/ui/CoverImage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GenreMultiSelect } from "@/components/reviews/write/GenreMultiSelect";
import { CoverImageUpload } from "@/components/reviews/write/CoverImageUpload";
import { TagMultiSelect } from "@/components/reviews/write/TagMultiSelect";
import { WritingStudioFormSection } from "@/components/reviews/write/WritingStudioFormSection";
import { isValidNovelCoverUrl } from "@/lib/novel-cover";
import type { NovelSelectOption } from "@/services/novel.service";
import { Button } from "@/components/ui/button";

interface GenreOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
}

interface NewNovelFieldsProps {
  title: string;
  author: string;
  coverUrl: string;
  synopsis: string;
  originalLanguage: string;
  publicationStatus: string;
  selectedGenreIds: string[];
  selectedTagIds: string[];
  genres: GenreOption[];
  tags: TagOption[];
  duplicates: NovelSelectOption[];
  acknowledgeDuplicate: boolean;
  onTitleChange: (value: string) => void;
  onAuthorChange: (value: string) => void;
  onCoverUrlChange: (value: string) => void;
  onSynopsisChange: (value: string) => void;
  onLanguageChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onGenreIdsChange: (ids: string[]) => void;
  onTagIdsChange: (ids: string[]) => void;
  onAcknowledgeDuplicateChange: (value: boolean) => void;
  onSelectExisting: (novelId: string) => void;
  disabled?: boolean;
  genreError?: string | null;
}

export function NewNovelFields({
  title,
  author,
  coverUrl,
  synopsis,
  originalLanguage,
  publicationStatus,
  selectedGenreIds,
  selectedTagIds,
  genres,
  tags,
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
  onSelectExisting,
  disabled = false,
  genreError = null,
}: NewNovelFieldsProps) {
  const coverPreview = isValidNovelCoverUrl(coverUrl) ? coverUrl : "";
  const selectedGenreNames = selectedGenreIds
    .map((id) => genres.find((genre) => genre.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <div className="space-y-5">
      <WritingStudioFormSection
        eyebrow="New title"
        title="Basic information"
        description="Add the core details for a novel not yet on MoonVerse."
        badge="required"
      >
        <div className="grid gap-5 lg:grid-cols-[120px_minmax(0,1fr)]">
          <div className="mx-auto w-[110px] lg:mx-0 lg:w-full">
            <div className="relative aspect-[2/3] overflow-hidden rounded-xl bg-[var(--mv-surface-soft)] ring-1 ring-[var(--mv-border)]">
              <CoverImage
                src={coverPreview}
                alt={title ? `Cover preview for ${title}` : "Cover preview"}
                title={title || "Untitled novel"}
                author={author || undefined}
                themeSeed={title || "new-novel"}
                sizes="140px"
              />
            </div>
            <p className="mt-2 text-center text-[11px] text-[var(--mv-text-muted)] lg:text-left">
              Live cover preview
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="novel-title" className="inline-flex items-center gap-1.5">
                <BookOpen className="size-3.5 text-[var(--mv-plum)]" aria-hidden />
                Novel title
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="novel-title"
                value={title}
                onChange={(e) => onTitleChange(e.target.value)}
                placeholder="e.g. Lord of the Mysteries"
                required
                disabled={disabled}
                maxLength={200}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="novel-author" className="inline-flex items-center gap-1.5">
                <UserRound className="size-3.5 text-[var(--mv-plum)]" aria-hidden />
                Author
                <span className="text-destructive" aria-hidden>
                  *
                </span>
              </Label>
              <Input
                id="novel-author"
                value={author}
                onChange={(e) => onAuthorChange(e.target.value)}
                placeholder="Author name"
                required
                disabled={disabled}
                maxLength={120}
                className="h-11 rounded-xl"
              />
            </div>

            <CoverImageUpload
              value={coverUrl}
              onChange={onCoverUrlChange}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="grid gap-4 border-t border-[var(--mv-border)]/80 pt-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="original-language">Original language</Label>
            <Input
              id="original-language"
              value={originalLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              placeholder="e.g. Chinese, English"
              disabled={disabled}
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="publication-status">Publication status</Label>
            <select
              id="publication-status"
              value={publicationStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              disabled={disabled}
              className="flex h-11 w-full rounded-xl border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
              <option value="">Not specified</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
              <option value="Hiatus">Hiatus</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="synopsis">Description or synopsis</Label>
          <Textarea
            id="synopsis"
            value={synopsis}
            onChange={(e) => onSynopsisChange(e.target.value)}
            placeholder="A short spoiler-free blurb for the novel page…"
            disabled={disabled}
            rows={4}
            maxLength={2000}
            className="rounded-xl"
          />
        </div>
      </WritingStudioFormSection>

      {duplicates.length > 0 ? (
        <div
          className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4"
          role="status"
        >
          <p className="text-sm font-bold text-amber-950">
            This title may already exist on MoonVerse.
          </p>
          <ul className="space-y-2">
            {duplicates.map((novel) => (
              <li
                key={novel.id}
                className="flex items-center gap-3 rounded-xl bg-white/80 p-2.5 ring-1 ring-amber-100"
              >
                <div className="relative aspect-[2/3] w-10 shrink-0 overflow-hidden rounded-md bg-violet-100">
                  <CoverImage
                    src={novel.coverUrl ?? ""}
                    alt=""
                    title={novel.title}
                    themeSeed={novel.id}
                    sizes="40px"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[var(--mv-ink)]">
                    {novel.title}
                  </p>
                  <p className="truncate text-xs text-[var(--mv-text-muted)]">
                    {novel.author ?? "Author not listed"}
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => onSelectExisting(novel.id)}
                  disabled={disabled}
                >
                  Select existing
                </Button>
              </li>
            ))}
          </ul>
          <label className="flex items-start gap-2 text-sm text-amber-950">
            <input
              type="checkbox"
              checked={acknowledgeDuplicate}
              onChange={(e) => onAcknowledgeDuplicateChange(e.target.checked)}
              disabled={disabled}
              className="mt-1 size-4 rounded border-amber-300"
            />
            <span>
              Continue as new: this is a different work from the matches above.
            </span>
          </label>
        </div>
      ) : null}

      <WritingStudioFormSection
        eyebrow="Taxonomy"
        title="Genres & tags"
        description="Use MoonVerse's controlled taxonomy so readers can discover this title."
        badge="required"
        bodyClassName="space-y-5"
      >
        <GenreMultiSelect
          genres={genres}
          selectedIds={selectedGenreIds}
          onChange={onGenreIdsChange}
          disabled={disabled}
          error={genreError}
        />

        <div className="border-t border-[var(--mv-border)]/80 pt-4">
          <p className="mb-3 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mv-text-muted)]">
            <Tags className="size-3.5" aria-hidden />
            Canonical tags
          </p>
          <TagMultiSelect
            tags={tags}
            selectedIds={selectedTagIds}
            onChange={onTagIdsChange}
            disabled={disabled}
            genreNames={selectedGenreNames}
          />
        </div>
      </WritingStudioFormSection>
    </div>
  );
}
