"use client";

import { Link2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeReadingUrl } from "@/lib/normalize-url";
import {
  getPlatformLabel,
  inferPlatformFromUrl,
} from "@/lib/reading-platforms";
import { isSafeHttpsUrl } from "@/lib/validation";

interface VerifiedSource {
  id: string;
  platform: string;
  label: string | null;
  url: string;
}

interface ReadingSourceFieldsProps {
  mode: "existing" | "new";
  links: string[];
  onChange: (links: string[]) => void;
  verifiedSources?: VerifiedSource[];
  existingNormalizedUrls?: string[];
  disabled?: boolean;
  max?: number;
  errors?: string[];
  embedded?: boolean;
}

const MAX_DEFAULT = 3;

export function ReadingSourceFields({
  mode,
  links,
  onChange,
  verifiedSources = [],
  existingNormalizedUrls = [],
  disabled = false,
  max = MAX_DEFAULT,
  errors = [],
  embedded = false,
}: ReadingSourceFieldsProps) {
  function updateLink(index: number, value: string) {
    onChange(links.map((link, i) => (i === index ? value : link)));
  }

  function addLink() {
    if (links.length >= max) return;
    onChange([...links, ""]);
  }

  function removeLink(index: number) {
    if (links.length <= 1) {
      onChange([""]);
      return;
    }
    onChange(links.filter((_, i) => i !== index));
  }

  const existingSet = new Set(existingNormalizedUrls);

  return (
    <div className="space-y-3">
      {!embedded ? (
        <div>
          <Label className="inline-flex items-center gap-1.5">
            <Link2 className="size-3.5 text-[var(--mv-plum)]" aria-hidden />
            {mode === "existing"
              ? "Suggest another reading source"
              : "Legitimate reading sources"}
            <span className="font-normal text-[var(--mv-text-muted)]">
              (optional)
            </span>
          </Label>
          <p className="mt-1 text-sm text-[var(--mv-text-muted)]">
            This will be reviewed before it appears publicly. Only add HTTPS links
            you actually use.
          </p>
        </div>
      ) : (
        <p className="text-sm text-[var(--mv-text-muted)]">
          Only add HTTPS links you actually use. Sources are reviewed before they
          appear publicly.
        </p>
      )}

      {mode === "existing" && verifiedSources.length > 0 ? (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-800">
            Verified sources already on MoonVerse
          </p>
          <ul className="mt-2 space-y-1.5">
            {verifiedSources.map((source) => (
              <li key={source.id} className="text-sm text-emerald-900">
                <span className="font-semibold">
                  {source.label || getPlatformLabel(source.platform)}
                </span>
                <span className="ml-2 text-emerald-700/80 break-all">
                  {source.url}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="space-y-2">
        {links.map((link, index) => {
          const trimmed = link.trim();
          const normalized = trimmed ? normalizeReadingUrl(trimmed) : null;
          const invalid =
            trimmed.length > 0 &&
            (!isSafeHttpsUrl(trimmed) || !normalized);
          const duplicate =
            Boolean(normalized) &&
            (existingSet.has(normalized!) ||
              links.some(
                (other, otherIndex) =>
                  otherIndex !== index &&
                  normalizeReadingUrl(other.trim()) === normalized
              ));
          const inferred = trimmed ? inferPlatformFromUrl(trimmed) : null;

          return (
            <div key={index} className="space-y-1">
              <div className="flex gap-2">
                <Input
                  type="url"
                  inputMode="url"
                  value={link}
                  onChange={(e) => updateLink(index, e.target.value)}
                  placeholder="https://…"
                  disabled={disabled}
                  aria-invalid={invalid || duplicate || undefined}
                  className="h-11 rounded-xl"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeLink(index)}
                  disabled={disabled}
                  className="size-11 shrink-0 rounded-xl"
                  aria-label={`Remove reading source ${index + 1}`}
                >
                  <Trash2 className="size-4" aria-hidden />
                </Button>
              </div>
              {inferred ? (
                <p className="text-xs text-slate-500">
                  Detected platform: {inferred.label} · Pending review
                </p>
              ) : trimmed && !invalid ? (
                <p className="text-xs text-slate-500">
                  Unknown domain · will be stored as pending review
                </p>
              ) : null}
              {invalid ? (
                <p className="text-xs text-destructive">
                  Enter a valid HTTPS URL (no javascript: or data: links).
                </p>
              ) : null}
              {duplicate ? (
                <p className="text-xs text-destructive">
                  This URL is already attached to the novel or listed twice.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {links.length < max ? (
        <Button
          type="button"
          variant="outline"
          onClick={addLink}
          disabled={disabled}
          className="min-h-10 gap-1.5 rounded-xl"
        >
          <Plus className="size-4" aria-hidden />
          Add another source
        </Button>
      ) : null}

      {errors.map((message) => (
        <p key={message} className="text-sm text-destructive" role="alert">
          {message}
        </p>
      ))}
    </div>
  );
}
