"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Search, Sparkles } from "lucide-react";
import { saveTasteOnboardingAction } from "@/actions/preference.actions";
import { getGenreIcon } from "@/components/browse/genre-icon";
import { SETTINGS_SECTION_CARD_CLASS } from "@/components/settings/SettingsShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type {
  PreferredGenreOption,
  SelectableTagOption,
  TasteOnboardingState,
} from "@/services/preference.service";

const PLATFORMS = [
  "Webnovel",
  "Royal Road",
  "Wattpad",
  "Tapas",
  "KakaoPage",
  "Novel Updates",
];
const STATUSES = [
  { value: "completed", label: "Completed" },
  { value: "ongoing", label: "Ongoing" },
];
const LENGTHS = [
  { value: "short", label: "Short" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
];
const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "Chinese" },
  { value: "ko", label: "Korean" },
  { value: "ja", label: "Japanese" },
];
const AVOID_PRESETS = [
  "harem",
  "tragedy",
  "non-con",
  "cheating",
  "heavy angst",
  "cliffhanger ending",
];

const SETTINGS_SECTIONS = [
  {
    id: "taste",
    label: "Taste",
    title: "Favourite genres, tropes and moods",
    description: "Pick what you enjoy. Moonie uses these for recommendations and Discover.",
  },
  {
    id: "avoid",
    label: "Avoid",
    title: "Things to avoid",
    description: "Tags and themes you would rather skip in recommendations.",
  },
  {
    id: "rules",
    label: "Reading rules",
    title: "Status, language, length and platforms",
    description: "Optional filters for completion status, language, length and where you read.",
  },
] as const;

const ONBOARDING_HEADINGS = [
  "Favourite genres, tropes and moods",
  "Things to avoid",
  "Status, language, length and platforms",
];

const LIGHT_PANEL_CLASS =
  "rounded-[1.25rem] border border-[#1A1224]/8 bg-white shadow-[0_20px_48px_-36px_rgba(26,18,36,0.12)]";
const LIGHT_SCROLL_PANEL_CLASS =
  "max-h-[min(34vh,320px)] overflow-y-auto overscroll-contain rounded-xl border border-[#1A1224]/8 bg-[#FBF7F1]/40 p-3";
const LIGHT_CHIP_SCROLL_CLASS =
  "max-h-[min(24vh,220px)] overflow-y-auto overscroll-contain rounded-xl border border-[#1A1224]/8 bg-[#FBF7F1]/40 p-3";

function toggleValue(list: string[], value: string): string[] {
  const key = value.toLowerCase();
  return list.some((item) => item.toLowerCase() === key)
    ? list.filter((item) => item.toLowerCase() !== key)
    : [...list, value];
}

function filterByQuery(values: string[], query: string): string[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return values;
  return values.filter((value) => value.toLowerCase().includes(needle));
}

interface TasteOnboardingWizardProps {
  genres: PreferredGenreOption[];
  tropes: SelectableTagOption[];
  moods: SelectableTagOption[];
  initial: TasteOnboardingState;
  displayName?: string;
  redirectTo?: string;
  mode?: "onboarding" | "settings";
}

export function TasteOnboardingWizard({
  genres,
  tropes,
  moods,
  initial,
  displayName,
  redirectTo = "/home",
  mode = "onboarding",
}: TasteOnboardingWizardProps) {
  const router = useRouter();
  const isSettings = mode === "settings";
  const [step, setStep] = useState(0);
  const [genreQuery, setGenreQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [genreIds, setGenreIds] = useState<Set<string>>(
    () => new Set(initial.genreIds),
  );
  const [favouriteTags, setFavouriteTags] = useState(initial.favouriteTags);
  const [favouriteMoods, setFavouriteMoods] = useState(initial.favouriteMoods);
  const [avoidedTags, setAvoidedTags] = useState(initial.avoidedTags);
  const [preferredStatus, setPreferredStatus] = useState(initial.preferredStatus);
  const [preferredLanguage, setPreferredLanguage] = useState(initial.preferredLanguage);
  const [preferredLength, setPreferredLength] = useState(initial.preferredLength);
  const [preferredPlatforms, setPreferredPlatforms] = useState(initial.preferredPlatforms);
  const [error, setError] = useState<string | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const firstName = displayName?.trim().split(/\s+/)[0];

  const filteredGenres = useMemo(() => {
    const needle = genreQuery.trim().toLowerCase();
    if (!needle) return genres;
    return genres.filter((genre) => genre.name.toLowerCase().includes(needle));
  }, [genreQuery, genres]);

  const tropeNames = useMemo(() => tropes.map((tag) => tag.name), [tropes]);
  const moodNames = useMemo(() => moods.map((tag) => tag.name), [moods]);
  const avoidValues = useMemo(
    () => [...new Set([...AVOID_PRESETS, ...tropes.slice(0, 12).map((tag) => tag.name)])],
    [tropes],
  );

  function payload(completeOnboarding: boolean) {
    return {
      genreIds: [...genreIds],
      favouriteTags,
      favouriteMoods,
      avoidedTags,
      preferredStatus,
      preferredLanguage,
      preferredLength,
      preferredPlatforms,
      completeOnboarding,
    };
  }

  function save(complete: boolean, nextHref?: string) {
    setError(null);
    startTransition(async () => {
      const result = await saveTasteOnboardingAction(payload(complete));
      if (!result.success) {
        setError(result.error);
        return;
      }
      setLiveMessage("Reading taste saved.");
      if (nextHref) {
        router.push(nextHref);
        router.refresh();
      }
    });
  }

  const tastePanel = (
    <div className="space-y-5">
      <GenreSection
        genres={filteredGenres}
        genreIds={genreIds}
        setGenreIds={setGenreIds}
        genreQuery={genreQuery}
        setGenreQuery={setGenreQuery}
        variant={isSettings ? "settings" : "onboarding"}
        embedded
      />
      <ChipGroup
        title="Tropes"
        values={filterByQuery(tropeNames, tagQuery)}
        selected={favouriteTags}
        onToggle={(value) => setFavouriteTags((prev) => toggleValue(prev, value))}
        search={
          <TagSearch
            value={tagQuery}
            onChange={setTagQuery}
            label="Filter tropes"
            variant={isSettings ? "settings" : "onboarding"}
          />
        }
        variant={isSettings ? "settings" : "onboarding"}
        embedded
      />
      <ChipGroup
        title="Moods"
        values={filterByQuery(moodNames, tagQuery)}
        selected={favouriteMoods}
        onToggle={(value) => setFavouriteMoods((prev) => toggleValue(prev, value))}
        variant={isSettings ? "settings" : "onboarding"}
        embedded
      />
    </div>
  );

  const avoidPanel = (
    <ChipGroup
      title="I would rather skip"
      values={filterByQuery(avoidValues, tagQuery)}
      selected={avoidedTags}
      onToggle={(value) => setAvoidedTags((prev) => toggleValue(prev, value))}
      search={
        <TagSearch
          value={tagQuery}
          onChange={setTagQuery}
          label="Filter exclusions"
          variant={isSettings ? "settings" : "onboarding"}
        />
      }
      variant={isSettings ? "settings" : "onboarding"}
      embedded
    />
  );

  const rulesPanel = (
    <div className="space-y-5">
      <OptionRow
        title="Publication status"
        options={STATUSES}
        value={preferredStatus}
        onChange={setPreferredStatus}
        variant={isSettings ? "settings" : "onboarding"}
      />
      <OptionRow
        title="Original language"
        options={LANGUAGES}
        value={preferredLanguage}
        onChange={setPreferredLanguage}
        variant={isSettings ? "settings" : "onboarding"}
      />
      <OptionRow
        title="Length"
        options={LENGTHS}
        value={preferredLength}
        onChange={setPreferredLength}
        variant={isSettings ? "settings" : "onboarding"}
      />
      <ChipGroup
        title="Preferred platforms"
        description="Where you usually read. Moonie will prefer links on these sites."
        values={PLATFORMS}
        selected={preferredPlatforms}
        onToggle={(value) =>
          setPreferredPlatforms((prev) => toggleValue(prev, value))
        }
        variant={isSettings ? "settings" : "onboarding"}
        embedded
      />
    </div>
  );

  return (
    <div
      className={cn(
        isSettings
          ? "space-y-8"
          : "mx-auto flex w-full max-w-4xl flex-col pb-8",
      )}
    >
      <p className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </p>

      {!isSettings ? (
        <header className="text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-[0.18em] text-[#6E46C7]">
            <Sparkles className="size-3.5" aria-hidden />
            {firstName ? `Hi, ${firstName}` : "Personalise MoonVerse"}
          </p>
          <h1 className="mt-2 font-heading text-2xl font-bold tracking-tight text-[#1A1224] sm:text-3xl">
            {ONBOARDING_HEADINGS[step]}
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-[#1A1224]/55">
            Step {step + 1} of 3. Skip any step: you can edit this later in Settings.
          </p>
          <div className="mt-6 flex gap-2" aria-hidden>
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  index <= step ? "bg-[#6E46C7]" : "bg-[#6E46C7]/20",
                )}
              />
            ))}
          </div>
        </header>
      ) : (
        <nav
          aria-label="Preference sections"
          className="flex flex-wrap gap-2 rounded-[1.25rem] border border-[#1A1224]/8 bg-[#FBF7F1]/70 p-2"
        >
          {SETTINGS_SECTIONS.map((item) => (
            <a
              key={item.id}
              href={`#preferences-${item.id}`}
              className="inline-flex min-h-10 items-center rounded-xl px-3.5 py-2 text-[13px] font-semibold text-[#1A1224]/75 transition hover:bg-white hover:text-[#6E46C7]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}

      {isSettings ? (
        <div className="space-y-8">
          {SETTINGS_SECTIONS.map((item) => (
            <section
              key={item.id}
              id={`preferences-${item.id}`}
              className={cn(
                SETTINGS_SECTION_CARD_CLASS,
                "scroll-mt-28 p-4 sm:p-5",
              )}
            >
              <div className="mb-5 border-b border-[#1A1224]/8 pb-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#6E46C7]">
                  {item.label}
                </p>
                <h3 className="mt-1 font-serif text-lg font-medium tracking-tight text-[#1A1224]">
                  {item.title}
                </h3>
                <p className="mt-1 text-[13px] leading-relaxed text-[#1A1224]/55">
                  {item.description}
                </p>
              </div>
              {item.id === "taste"
                ? tastePanel
                : item.id === "avoid"
                  ? avoidPanel
                  : rulesPanel}
            </section>
          ))}
        </div>
      ) : (
        <div className={cn("mt-6 p-4 sm:p-5", LIGHT_PANEL_CLASS)}>
          {step === 0 ? tastePanel : null}
          {step === 1 ? avoidPanel : null}
          {step === 2 ? rulesPanel : null}
        </div>
      )}

      {error ? (
        <p
          className={cn(
            "text-sm text-destructive",
            !isSettings && "text-center",
          )}
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3",
          isSettings
            ? "sticky bottom-[calc(var(--mv-mobile-nav-h,0px)+env(safe-area-inset-bottom,0px)+0.75rem)] z-10 rounded-[1.25rem] border border-[#1A1224]/8 bg-white/95 p-4 shadow-[0_16px_40px_-24px_rgba(26,18,36,0.25)] backdrop-blur-sm lg:bottom-4"
            : "sticky bottom-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] z-10 mt-8 rounded-[1.25rem] border border-[#1A1224]/8 bg-white/95 p-4 shadow-[0_16px_40px_-24px_rgba(26,18,36,0.25)] backdrop-blur-sm",
        )}
      >
        {isSettings ? (
          <p className="text-[12px] text-[#1A1224]/50">
            Changes apply to Moonie and Discover recommendations.
          </p>
        ) : (
          <Button
            type="button"
            variant="ghost"
            className="min-h-11 text-[#1A1224]/75"
            disabled={isPending || step === 0}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
          >
            Back
          </Button>
        )}

        <div className="flex flex-wrap gap-2">
          {!isSettings ? (
            <Button
              type="button"
              variant="outline"
              className="min-h-11 border-[#1A1224]/12 bg-white text-[#1A1224]"
              disabled={isPending}
              onClick={() => {
                if (step < 2) setStep((value) => value + 1);
                else save(true, redirectTo);
              }}
            >
              Skip
            </Button>
          ) : null}
          {!isSettings && step < 2 ? (
            <Button
              type="button"
              className="min-h-11 px-5"
              disabled={isPending}
              onClick={() => setStep((value) => value + 1)}
            >
              Continue
            </Button>
          ) : (
            <Button
              type="button"
              className="min-h-11 px-5"
              disabled={isPending}
              onClick={() => save(true, isSettings ? undefined : redirectTo)}
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : isSettings ? (
                "Save preferences"
              ) : (
                "Build my home feed"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function ScrollPanel({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: "settings" | "onboarding";
}) {
  return (
    <div
      className={cn(
        variant === "settings"
          ? "max-h-[min(34vh,320px)] overflow-y-auto overscroll-contain rounded-xl border border-[#1A1224]/8 bg-[#FBF7F1]/40 p-3"
          : LIGHT_SCROLL_PANEL_CLASS,
      )}
    >
      {children}
    </div>
  );
}

function GenreSection({
  genres,
  genreIds,
  setGenreIds,
  genreQuery,
  setGenreQuery,
  variant,
  embedded = false,
}: {
  genres: PreferredGenreOption[];
  genreIds: Set<string>;
  setGenreIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  genreQuery: string;
  setGenreQuery: (value: string) => void;
  variant: "settings" | "onboarding";
  embedded?: boolean;
}) {
  const isSettings = variant === "settings";
  const genreBody =
    genres.length === 0 ? (
      <p className="py-8 text-center text-sm text-[#1A1224]/50">
        No genres match your search.
      </p>
    ) : (
      <ul
        className={cn(
          "grid gap-2",
          isSettings
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {genres.map((genre) => {
          const Icon = getGenreIcon(genre.slug);
          const active = genreIds.has(genre.id);
          return (
            <li key={genre.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() =>
                  setGenreIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(genre.id)) next.delete(genre.id);
                    else if (next.size < 10) next.add(genre.id);
                    return next;
                  })
                }
                className={cn(
                  "relative flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
                  active
                    ? "border-[#6E46C7] bg-[#F4ECF8] text-[#1A1224]"
                    : "border-[#1A1224]/10 bg-[#FBF7F1]/50 text-[#1A1224] hover:border-[#6E46C7]/25",
                )}
              >
                <span
                  className={cn(
                    "inline-flex size-8 shrink-0 items-center justify-center rounded-lg",
                    active ? "bg-[#6E46C7] text-white" : "bg-white text-[#6E46C7]",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 text-sm font-bold leading-snug">
                  {genre.name}
                </span>
                {active ? (
                  <Check className="size-4 shrink-0 text-[#6E46C7]" aria-hidden />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    );

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1224]">Genres</h3>
          <p className="text-[12px] text-[#1A1224]/50">
            {genreIds.size} selected · up to 10
          </p>
        </div>
        <TagSearch
          value={genreQuery}
          onChange={setGenreQuery}
          label="Filter genres"
          variant={variant}
        />
      </div>
      {embedded ? (
        genreBody
      ) : (
        <ScrollPanel variant={variant}>{genreBody}</ScrollPanel>
      )}
    </section>
  );
}

function TagSearch({
  value,
  onChange,
  label,
  variant,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  variant: "settings" | "onboarding";
}) {
  return (
    <div className="relative w-full max-w-xs">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#1A1224]/35"
        aria-hidden
      />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Filter…"
        className="h-9 pl-9"
        aria-label={label}
      />
    </div>
  );
}

function ChipGroup({
  title,
  values,
  selected,
  onToggle,
  search,
  description,
  variant,
  embedded = false,
}: {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
  search?: React.ReactNode;
  description?: string;
  variant: "settings" | "onboarding";
  embedded?: boolean;
}) {
  const isSettings = variant === "settings";
  const unique = [...new Set(values)];

  const chipBody =
    unique.length === 0 ? (
      <p className="py-6 text-center text-sm text-[#1A1224]/50">No matches.</p>
    ) : (
      <div className="flex flex-wrap gap-2">
        {unique.map((value) => {
          const active = selected.some(
            (item) => item.toLowerCase() === value.toLowerCase(),
          );
          return (
            <button
              key={value}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
                active
                  ? "border-[#6E46C7] bg-[#6E46C7] text-white"
                  : "border-[#1A1224]/12 bg-white text-[#1A1224]/75 hover:border-[#6E46C7]/30",
              )}
            >
              {value}
            </button>
          );
        })}
      </div>
    );

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#1A1224]">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-[12px] leading-relaxed text-[#1A1224]/50">
              {description}
            </p>
          ) : null}
        </div>
        {search}
      </div>
      {embedded ? (
        chipBody
      ) : (
        <div
          className={cn(
            variant === "settings"
              ? "max-h-[min(24vh,220px)] overflow-y-auto overscroll-contain rounded-xl border border-[#1A1224]/8 bg-[#FBF7F1]/40 p-3"
              : LIGHT_CHIP_SCROLL_CLASS,
          )}
        >
          {chipBody}
        </div>
      )}
    </section>
  );
}

function OptionRow({
  title,
  options,
  value,
  onChange,
  variant,
}: {
  title: string;
  options: readonly { value: string; label: string }[];
  value: string | null;
  onChange: (value: string | null) => void;
  variant: "settings" | "onboarding";
}) {
  const isSettings = variant === "settings";
  const chipClass = (active: boolean) =>
    cn(
      "rounded-full border px-3 py-1.5 text-[12px] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]",
      active
        ? "border-[#6E46C7] bg-[#6E46C7] text-white"
        : "border-[#1A1224]/12 bg-white text-[#1A1224]/75",
    );

  return (
    <section>
      <h3 className="text-sm font-semibold text-[#1A1224]">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-pressed={!value}
          onClick={() => onChange(null)}
          className={chipClass(!value)}
        >
          Any
        </button>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={value === option.value}
            onClick={() => onChange(option.value)}
            className={chipClass(value === option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}
