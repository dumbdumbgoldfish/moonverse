"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import {
  getMoonieTasteProfileAction,
  resetMoonieTasteProfileAction,
  updateMoonieTasteProfileAction,
} from "@/actions/moonie.actions";
import { DEFAULT_PERSONALIZATION_SETTINGS } from "@/lib/moonie/personalization";
import { MoonieCharacter } from "@/components/moonie/MoonieCharacter";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MoonieTasteProfileView } from "@/types/moonie";

interface MoonieTastePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TASTE_GENRES = [
  "Romance",
  "Fantasy",
  "BL",
  "GL",
  "Xianxia",
  "Cultivation",
  "Isekai",
  "System",
  "Reincarnation",
  "Transmigration",
  "Villainess",
  "Horror",
  "Mystery",
  "Action",
  "Comedy",
  "Slice of Life",
  "School Life",
  "Supernatural",
  "LitRPG",
  "Historical",
] as const;

const TASTE_TAGS = [
  "slow-burn",
  "enemies-to-lovers",
  "strong fl",
  "found family",
  "revenge",
  "fluffy",
  "angst",
  "power fantasy",
  "mystery",
  "political intrigue",
] as const;

const AVOID_TAGS = [
  "harem",
  "tragedy",
  "cheating",
  "non-con",
  "heavy angst",
  "cliffhanger ending",
] as const;

const STATUS_OPTIONS = [
  { value: "", label: "Any" },
  { value: "completed", label: "Completed" },
  { value: "ongoing", label: "Ongoing" },
] as const;

function toggleItem(list: string[], value: string): string[] {
  const key = value.toLowerCase();
  const has = list.some((item) => item.toLowerCase() === key);
  if (has) return list.filter((item) => item.toLowerCase() !== key);
  return [...list, value];
}

function Chip({
  label,
  active,
  onClick,
  tone = "default",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  tone?: "default" | "avoid";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold transition",
        active && tone === "default" &&
          "border-primary/40 mv-nav-signup border-0 text-white shadow-sm",
        active && tone === "avoid" &&
          "border-rose-300 bg-rose-50 text-rose-700",
        !active &&
          "border-violet-100 bg-white text-slate-600 hover:border-primary/30 hover:bg-violet-50 hover:text-night-blue"
      )}
    >
      {active ? <Check className="mr-1 size-3" aria-hidden /> : null}
      {label}
    </button>
  );
}

export function MoonieTastePanel({ open, onOpenChange }: MoonieTastePanelProps) {
  const [pending, startTransition] = useTransition();
  const [profile, setProfile] = useState<MoonieTasteProfileView | null>(null);
  const [genres, setGenres] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [avoided, setAvoided] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const [useTaste, setUseTaste] = useState(true);
  const [privacy, setPrivacy] = useState(DEFAULT_PERSONALIZATION_SETTINGS);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      setMessage(null);
      const data = await getMoonieTasteProfileAction();
      setProfile(data);
      const seedGenres =
        data.favouriteGenres.length > 0
          ? data.favouriteGenres
          : data.preferredGenreNamesFromOnboarding.slice(0, 8);
      setGenres(seedGenres);
      setTags(data.favouriteTags);
      setAvoided(data.avoidedTags);
      setStatus(data.preferredStatus ?? "");
      setUseTaste(data.useTasteByDefault);
      setPrivacy(data.personalization ?? DEFAULT_PERSONALIZATION_SETTINGS);
    });
  }, [open]);

  if (!open) return null;

  const genreActive = (name: string) =>
    genres.some((g) => g.toLowerCase() === name.toLowerCase());
  const tagActive = (name: string) =>
    tags.some((t) => t.toLowerCase() === name.toLowerCase());
  const avoidActive = (name: string) =>
    avoided.some((t) => t.toLowerCase() === name.toLowerCase());

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-3 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-[#1a1224]/40 backdrop-blur-[2px]"
        aria-label="Close taste panel"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="moonie-taste-title"
        className="relative z-[1] max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-violet-100 bg-white p-5 text-night-blue shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start gap-3">
          <MoonieCharacter
            size={64}
            context="chatEmpty"
            emotion="happy"
            compact
            lightweight
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h2
              id="moonie-taste-title"
              className="font-[family-name:var(--font-source-serif)] text-2xl font-semibold"
            >
              Your taste
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Tap what you love. Moonie uses this for recommendations. Chats
              stay on this desk.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
          >
            <X className="size-5" />
          </Button>
        </div>

        {profile ? (
          <div className="mb-4 rounded-2xl border border-violet-100 bg-[#FBF6FC] px-3 py-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#4C2A67]">
              Your Moonie taste
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[...genres, ...tags, ...avoided.map((t) => `Avoid ${t}`)]
                .slice(0, 12)
                .map((item) => (
                  <span
                    key={item}
                    className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-violet-100"
                  >
                    {item}
                  </span>
                ))}
              {status ? (
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-violet-100">
                  {status} preferred
                </span>
              ) : null}
            </div>
          </div>
        ) : null}

        {profile?.preferredGenreNamesFromOnboarding.length ? (
          <p className="mb-4 rounded-2xl bg-[#FBF6FC] px-3 py-2 text-xs text-slate-600 ring-1 ring-violet-100">
            From onboarding:{" "}
            {profile.preferredGenreNamesFromOnboarding.slice(0, 6).join(" · ")}
            {profile.preferredGenreNamesFromOnboarding.length > 6 ? "…" : ""}
          </p>
        ) : null}

        <div className="space-y-5">
          <section>
            <p className="mb-2 text-sm font-semibold text-night-blue">
              Favourite genres
            </p>
            <div className="flex flex-wrap gap-2">
              {TASTE_GENRES.map((genre) => (
                <Chip
                  key={genre}
                  label={genre}
                  active={genreActive(genre)}
                  onClick={() => setGenres((list) => toggleItem(list, genre))}
                />
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-sm font-semibold text-night-blue">
              Vibes you want
            </p>
            <div className="flex flex-wrap gap-2">
              {TASTE_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  active={tagActive(tag)}
                  onClick={() => setTags((list) => toggleItem(list, tag))}
                />
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-sm font-semibold text-night-blue">
              Soft avoids
            </p>
            <div className="flex flex-wrap gap-2">
              {AVOID_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  tone="avoid"
                  active={avoidActive(tag)}
                  onClick={() => setAvoided((list) => toggleItem(list, tag))}
                />
              ))}
            </div>
          </section>

          <section>
            <p className="mb-2 text-sm font-semibold text-night-blue">Status</p>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <Chip
                  key={option.label}
                  label={option.label}
                  active={status === option.value}
                  onClick={() => setStatus(option.value)}
                />
              ))}
            </div>
          </section>

          <label className="flex items-center gap-2.5 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={useTaste}
              onChange={(e) => setUseTaste(e.target.checked)}
              className="size-4 accent-primary"
            />
            Use my taste by default in Moonie chats
          </label>

          <section>
            <p className="mb-2 text-sm font-semibold text-night-blue">
              Personalisation sources
            </p>
            <div className="space-y-2 text-sm text-slate-700">
              {(
                [
                  ["useReadingList", "Reading list"],
                  ["useSavedReviews", "Saved reviews / library"],
                  ["useLikes", "Likes"],
                  ["useSavedNovels", "Saved novels"],
                  ["useFollowedReviewers", "Followed reviewers"],
                  ["useSearchHistory", "Search history"],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={privacy[key]}
                    onChange={(event) =>
                      setPrivacy((current) => ({
                        ...current,
                        [key]: event.target.checked,
                      }))
                    }
                    className="size-4 accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>
        </div>

        {message ? (
          <p className="mt-4 text-sm font-medium text-primary" role="status">
            {message}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={pending}
            className="h-11 min-w-[140px] rounded-xl font-bold"
            onClick={() => {
              startTransition(async () => {
                const result = await updateMoonieTasteProfileAction({
                  favouriteGenres: genres,
                  favouriteTags: tags,
                  avoidedTags: avoided,
                  preferredStatus: status || null,
                  useTasteByDefault: useTaste,
                  personalization: privacy,
                });
                setMessage(
                  result.success ? "Saved. Moonie will remember this." : result.error
                );
              });
            }}
          >
            Save taste
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            className="h-11 rounded-xl"
            onClick={() => {
              startTransition(async () => {
                const result = await resetMoonieTasteProfileAction();
                setMessage(
                  result.success ? "Taste reset." : result.error
                );
                if (result.success) {
                  setGenres([]);
                  setTags([]);
                  setAvoided([]);
                  setStatus("");
                  setUseTaste(true);
                }
              });
            }}
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );
}
