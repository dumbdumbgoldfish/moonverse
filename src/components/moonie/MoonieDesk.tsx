"use client";

import { useCallback, useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  Flame,
  Heart,
  Moon,
  Send,
  Sparkles,
  Stars,
} from "lucide-react";
import { MoonieGoldSeal } from "@/components/moonie/MoonieGoldSeal";
import {
  MoonieComposerTooltip,
  MoonieComposerTooltipProvider,
} from "@/components/moonie/MoonieComposerTooltip";
import { MoonieVoiceInput } from "@/components/moonie/MoonieVoiceInput";
import { MoonieVoiceRecordingBar } from "@/components/moonie/MoonieVoiceRecordingBar";
import { useMoonieVoiceDictation } from "@/hooks/use-moonie-voice-dictation";
import { mergeDictationIntoComposerText } from "@/lib/moonie/user-message-attachment";
import type { MoonieVariant } from "@/components/brand/MoonieMascot";
import { CatalogLink } from "@/components/ui/CatalogLink";
import type { MoonieAnimationContext } from "@/lib/moonie/animation-states";
import type { MoonieEmotion } from "@/lib/moonie/emotions";
import { MOONIE_DAILY_DISCOVERY_LIMIT } from "@/lib/moonie/constants";
import { moonieNoMatchCopy } from "@/lib/moonie/empty-reason";
import {
  buildGuestRateLimitBody,
  buildMoonieRateLimitBody,
  formatDiscoveryQuotaRemaining,
  formatDiscoveryQuotaRemainingCompact,
  formatDiscoveryQuotaUsed,
  formatGuestQuotaUsed,
  MOONIE_GUEST_RATE_LIMIT_TITLE,
  MOONIE_RATE_LIMIT_TITLE,
} from "@/lib/moonie/quota-copy";
import {
  MOONIE_CONSTRAINT,
  MOONIE_DESK_CHIPS,
  MOONIE_WIDGET_CHIPS,
  MOONIE_WIDGET_HELPER,
  compareDiscoveryCtaLabel,
  compareDiscoveryHref,
  slateDiversityLine,
  tasteUsedLabels,
} from "@/lib/moonie/desk";
import { cn } from "@/lib/utils";
import type {
  MoonieInterpretedPreferences,
  MoonieRecommendation,
} from "@/types/moonie";

export { MoonieGoldSeal };

export const MOONIE_COMPOSER_TOOLBAR_BUTTON =
  "inline-flex shrink-0 items-center justify-center rounded-full border border-violet-100 bg-[#FFFBFF] text-[#6E46C7] transition hover:bg-violet-50 disabled:opacity-50";

export const MOONIE_COMPOSER_TOOLBAR_BUTTON_ACTIVE =
  "border-[#C89B4A]/50 bg-[#FFF8E8] text-[#8A6520] shadow-sm hover:bg-[#FFE9C7]";

const MOONIE_ASSISTANT_TITLE = "Moonie AI Assistant";

function greetingForHour(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function MoonieGreeting({
  firstName,
  className,
}: {
  firstName?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-source-serif)] font-semibold leading-snug tracking-tight",
        "bg-gradient-to-r from-[#C89B4A] via-[#9B6FD6] to-[#6E46C7] bg-clip-text text-transparent",
        className
      )}
    >
      {greetingForHour()}
      {firstName ? `, ${firstName}` : ""}
    </span>
  );
}

export function MoonieAssistantTitle({
  variant = "paper",
  className,
}: {
  variant?: "paper" | "night";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-source-serif)] text-xl font-semibold leading-snug tracking-tight",
        variant === "night"
          ? "bg-gradient-to-br from-[#FFFBFF] via-[#F5E6C8] to-[#E6D2A3] bg-clip-text text-transparent"
          : "bg-gradient-to-r from-[#3D2154] via-[#6E46C7] to-[#9B6FD6] bg-clip-text text-transparent",
        className
      )}
    >
      {MOONIE_ASSISTANT_TITLE}
    </span>
  );
}

export function MoonieGuestDemoBadge({
  remaining,
  cap,
  compact = false,
  variant = "paper",
  className,
}: {
  remaining: number;
  cap: number;
  compact?: boolean;
  variant?: "paper" | "night";
  className?: string;
}) {
  const label = compact
    ? `${remaining}/${cap} free`
    : `${remaining} free turn${remaining === 1 ? "" : "s"} left`;

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center justify-center rounded-full border px-2 py-0.5 shadow-sm",
        variant === "night"
          ? "border-[#C89B4A]/45 bg-white/10"
          : "border-[#9B6FD6]/45 bg-gradient-to-r from-[#FFF8E8] via-[#F4ECF8] to-[#EDE4FF]",
        className,
      )}
      role="status"
      aria-label={label}
    >
      <span
        className={cn(
          "bg-gradient-to-r bg-clip-text text-center text-[10px] font-bold leading-none tracking-wide text-transparent",
          variant === "night"
            ? "from-[#F5E6C8] via-[#D4B8FF] to-[#FFFBFF]"
            : "from-[#C89B4A] via-[#9B6FD6] to-[#6E46C7]",
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function MoonieDiscoveryQuotaBadge({
  remaining,
  limit = MOONIE_DAILY_DISCOVERY_LIMIT,
  variant = "paper",
  compact = false,
  className,
}: {
  remaining: number;
  limit?: number;
  variant?: "paper" | "night";
  compact?: boolean;
  className?: string;
}) {
  const low = remaining <= 5;
  const label = compact
    ? formatDiscoveryQuotaRemainingCompact(remaining, limit)
    : formatDiscoveryQuotaRemaining(remaining, limit);

  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center justify-center rounded-full border shadow-sm",
        compact ? "px-2 py-0.5" : "px-3 py-1",
        variant === "night"
          ? "border-[#C89B4A]/45 bg-white/10"
          : low
            ? "border-[#C89B4A]/55 bg-gradient-to-r from-[#FFF8E8] via-[#FFE9C7] to-[#F4ECF8]"
            : "border-[#9B6FD6]/45 bg-gradient-to-r from-[#FFF8E8] via-[#F4ECF8] to-[#EDE4FF]",
        className
      )}
      role="status"
      aria-label={formatDiscoveryQuotaRemaining(remaining, limit)}
    >
      <span
        className={cn(
          "bg-gradient-to-r bg-clip-text text-center font-bold leading-none tracking-wide text-transparent",
          compact ? "text-[10px]" : "text-[11px] leading-tight sm:text-xs",
          variant === "night"
            ? "from-[#F5E6C8] via-[#D4B8FF] to-[#FFFBFF]"
            : "from-[#C89B4A] via-[#9B6FD6] to-[#6E46C7]"
        )}
      >
        {label}
      </span>
    </div>
  );
}

const CHIP_ICONS = [Heart, Moon, Sparkles, Compass, Flame, Stars] as const;

export function MoonieConstraintLine({
  className,
  tone = "paper",
}: {
  className?: string;
  tone?: "paper" | "night";
}) {
  return (
    <p
      className={cn(
        "text-sm leading-relaxed",
        tone === "night" ? "text-white/70" : "text-slate-600",
        className
      )}
    >
      {MOONIE_CONSTRAINT}
    </p>
  );
}

export function MoonieDeskHeader({
  title,
  status,
  sealSize = "md",
  variant,
  emotion,
  context,
  priority,
  onClose,
  widget,
}: {
  title: string;
  status: string;
  sealSize?: "xs" | "sm" | "md" | "lg";
  variant?: MoonieVariant;
  emotion?: MoonieEmotion;
  context?: MoonieAnimationContext;
  priority?: boolean;
  onClose?: () => void;
  widget?: boolean;
}) {
  const showStatus =
    Boolean(status) && (!widget || status !== "Ready when you are");

  return (
    <header
      className={cn(
        "relative flex shrink-0 items-center border-b border-white/10",
        widget ? "gap-2 px-2.5 py-2 pr-10" : "items-end gap-4 px-4 pb-4 pt-5 pr-12"
      )}
    >
      <MoonieGoldSeal
        size={sealSize}
        variant={variant}
        emotion={emotion}
        context={context}
        priority={priority}
      />
      <div className={cn("min-w-0 flex-1", widget ? "" : "pb-0.5")}>
        <div className="flex flex-wrap items-center gap-1">
          {widget ? (
            <h2 className="min-w-0">
              <MoonieAssistantTitle variant="night" />
            </h2>
          ) : (
            <h2
              className={cn(
                "font-[family-name:var(--font-source-serif)] font-semibold leading-tight text-[#FFFBFF]",
                "text-xl sm:text-2xl"
              )}
            >
              {title}
            </h2>
          )}
        </div>
        {showStatus ? (
          <p
            className={cn(
              "leading-snug text-white/70",
              widget ? "mt-0.5 text-[11px]" : "mt-1.5 text-sm"
            )}
          >
            {status}
          </p>
        ) : null}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Moonie"
          className={cn(
            "absolute flex items-center justify-center rounded-full text-white/80 hover:bg-white/10 hover:text-white",
            widget ? "right-1.5 top-1.5 size-7" : "right-3 top-3 size-10"
          )}
        >
          <span className={cn("leading-none", widget ? "text-base" : "text-lg")} aria-hidden>
            ×
          </span>
        </button>
      ) : null}
    </header>
  );
}

export function MoonieTasteStrip({
  prefs,
  useTaste,
  completedOnly,
  className,
}: {
  prefs?: MoonieInterpretedPreferences | null;
  useTaste?: boolean;
  completedOnly?: boolean;
  className?: string;
}) {
  const used = tasteUsedLabels(prefs);
  const excluded = prefs?.excludedTags ?? [];
  const ignored: string[] = [];
  if (useTaste === false) ignored.push("saved taste (off this turn)");

  if (
    used.length === 0 &&
    excluded.length === 0 &&
    ignored.length === 0 &&
    !completedOnly
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-[#C89B4A]/25 bg-[#FFFBFF] px-3.5 py-3",
        className
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8f711e]">
        This request
      </p>
      {used.length > 0 ? (
        <p className="mt-1.5 text-sm text-[#1A1224]">
          <span className="font-semibold text-[#4C2A67]">Used: </span>
          {used.join(", ")}
        </p>
      ) : null}
      {ignored.length > 0 ? (
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-semibold">Ignored this turn: </span>
          {ignored.join(", ")}
        </p>
      ) : null}
      {excluded.length > 0 ? (
        <p className="mt-1 text-sm text-slate-600">
          <span className="font-semibold">Excluded: </span>
          {excluded.join(", ")}
        </p>
      ) : null}
      {completedOnly && prefs?.status !== "completed" ? (
        <p className="mt-1 text-sm font-semibold text-[#4C2A67]">
          Completed only
        </p>
      ) : null}
    </div>
  );
}

export function MoonieSlateMeta({
  recommendations,
  hiddenCount = 0,
  className,
}: {
  recommendations: MoonieRecommendation[];
  hiddenCount?: number;
  className?: string;
}) {
  if (recommendations.length === 0) return null;
  return (
    <p className={cn("text-xs font-semibold text-slate-500", className)}>
      {slateDiversityLine(recommendations, hiddenCount)}
    </p>
  );
}

export function MoonieCompareChip({
  userQuery,
  className,
}: {
  userQuery?: string;
  className?: string;
}) {
  const router = useRouter();
  const href = compareDiscoveryHref(userQuery);
  const label = href ? compareDiscoveryCtaLabel(href) : null;
  const navigate = useCallback(() => {
    if (href) router.push(href);
  }, [href, router]);

  if (!href) return null;

  return (
    <Link
      href={href}
      prefetch={false}
      className={cn(
        "mv-catalog-link mv-catalog-link--compact relative z-10",
        className
      )}
      onClick={(event) => {
        event.stopPropagation();
        event.preventDefault();
        navigate();
      }}
    >
      {label}
    </Link>
  );
}

export function MoonieVibeChips({
  disabled,
  onSelect,
  hrefForPrompt,
  compact,
  inline,
  row,
  chips = MOONIE_DESK_CHIPS,
  className,
}: {
  disabled?: boolean;
  onSelect?: (prompt: string) => void;
  hrefForPrompt?: (prompt: string) => string;
  compact?: boolean;
  /** Four micro chips in one row (widget panel). */
  inline?: boolean;
  /** Three-column grid, two rows (desk empty state). */
  row?: boolean;
  chips?: readonly { label: string; prompt: string }[];
  className?: string;
}) {
  const inlineChipClass = cn(
    "flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-xl border border-violet-100/90",
    "bg-gradient-to-b from-[#FFFBFF] to-[#F6EFFA] px-1 py-1.5 text-center",
    "shadow-[0_1px_3px_rgba(110,70,199,0.07)] transition",
    "hover:-translate-y-px hover:border-[#C89B4A]/40 hover:from-white hover:to-[#F4ECF8]",
    "hover:shadow-[0_4px_10px_rgba(110,70,199,0.1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/25",
    "motion-reduce:transform-none active:scale-[0.98] disabled:opacity-50"
  );

  const rowChipClass = cn(
    "flex min-h-[3.75rem] flex-col items-center justify-center gap-1.5 rounded-xl border border-violet-100/90",
    "bg-gradient-to-b from-[#FFFBFF] to-[#F6EFFA] px-1.5 py-2 text-center",
    "shadow-[0_1px_3px_rgba(110,70,199,0.07)] transition",
    "hover:-translate-y-px hover:border-[#C89B4A]/40 hover:from-white hover:to-[#F4ECF8]",
    "hover:shadow-[0_4px_10px_rgba(110,70,199,0.1)]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/25",
    "motion-reduce:transform-none active:scale-[0.98] disabled:opacity-50"
  );

  return (
    <div
      className={cn(
        row
          ? "grid w-full grid-cols-3 gap-2"
          : inline
            ? "grid w-full grid-cols-4 gap-1.5"
            : compact
              ? "flex flex-wrap gap-1.5"
              : "grid gap-2.5 sm:grid-cols-2",
        className
      )}
    >
      {chips.map((chip, index) => {
        const Icon = CHIP_ICONS[index] ?? Sparkles;

        if (row) {
          const content = (
            <>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[#6E46C7] shadow-sm ring-1 ring-violet-100/90">
                <Icon className="size-3.5" aria-hidden />
              </span>
              <span className="text-xs font-semibold leading-[1.15] text-[#4C2A67]">
                {chip.label}
              </span>
            </>
          );

          if (hrefForPrompt) {
            return (
              <Link
                key={chip.label}
                href={hrefForPrompt(chip.prompt)}
                className={rowChipClass}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={chip.label}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(chip.prompt)}
              className={rowChipClass}
            >
              {content}
            </button>
          );
        }

        if (inline) {
          const content = (
            <>
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white text-[#6E46C7] shadow-sm ring-1 ring-violet-100/90">
                <Icon className="size-3" aria-hidden />
              </span>
              <span className="text-[10px] font-semibold leading-[1.15] text-[#4C2A67]">
                {chip.label}
              </span>
            </>
          );

          if (hrefForPrompt) {
            return (
              <Link
                key={chip.label}
                href={hrefForPrompt(chip.prompt)}
                className={inlineChipClass}
              >
                {content}
              </Link>
            );
          }

          return (
            <button
              key={chip.label}
              type="button"
              disabled={disabled}
              onClick={() => onSelect?.(chip.prompt)}
              className={inlineChipClass}
            >
              {content}
            </button>
          );
        }

        const className = compact
          ? undefined
          : cn(
              "group flex min-h-[72px] w-full items-center gap-3 rounded-2xl border border-violet-100 bg-[#FFFBFF] p-3.5 text-left text-sm font-semibold text-[#1A1224] transition",
              "hover:-translate-y-0.5 hover:border-[#C89B4A]/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              "motion-reduce:transform-none motion-reduce:transition-none disabled:opacity-50"
            );

        if (hrefForPrompt) {
          return compact ? (
            <CatalogLink
              key={chip.label}
              href={hrefForPrompt(chip.prompt)}
              size="compact"
            >
              {chip.label}
            </CatalogLink>
          ) : (
            <Link key={chip.label} href={hrefForPrompt(chip.prompt)} className={className}>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F4ECF8] text-[#6E46C7] ring-1 ring-violet-100">
                <Icon className="size-4" aria-hidden />
              </span>
              {chip.label}
            </Link>
          );
        }

        return compact ? (
          <CatalogLink
            key={chip.label}
            onClick={() => onSelect?.(chip.prompt)}
            size="compact"
            className={disabled ? "pointer-events-none opacity-50" : undefined}
          >
            {chip.label}
          </CatalogLink>
        ) : (
          <button
            key={chip.label}
            type="button"
            disabled={disabled}
            onClick={() => onSelect?.(chip.prompt)}
            className={className}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#F4ECF8] text-[#6E46C7] ring-1 ring-violet-100">
              <Icon className="size-4" aria-hidden />
            </span>
            {chip.label}
          </button>
        );
      })}
    </div>
  );
}

export function MoonieLoadingTicks({
  useTaste,
  label = "Searching the archive",
  className,
}: {
  useTaste?: boolean;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-violet-100 bg-[#FFFBFF] px-4 py-3 text-sm text-slate-600",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <p className="font-semibold text-[#4C2A67]">{label}</p>
      <ul className="mt-2 space-y-1 text-xs">
        <li>Request read</li>
        {useTaste != null ? (
          <li>{useTaste === false ? "Taste off this turn" : "Taste on"}</li>
        ) : null}
        <li>Allowlist on</li>
      </ul>
    </div>
  );
}

export function MoonieNoMatch({
  onBroaden,
  browseHref = "/browse",
  reason,
  emptyReason,
  className,
}: {
  onBroaden?: () => void;
  browseHref?: string;
  reason?: string;
  emptyReason?: import("@/types/moonie").MoonieEmptyReason;
  className?: string;
}) {
  const inferred: import("@/types/moonie").MoonieEmptyReason | undefined =
    emptyReason ??
    (/could not verify any MoonVerse novels as/i.test(
      reason ?? ""
    )
      ? "unknown_status"
      : /no additional unseen/i.test(reason ?? "")
        ? "unseen_exhausted"
        : /(?:after (?:respecting )?(?:the )?titles you (?:hid|rejected)|after your exclusions)/i.test(
              reason ?? ""
            )
          ? "excluded_exhausted"
          : /Verified retrieval incomplete|Could not verify this batch yet/i.test(
              reason ?? ""
            )
            ? "retrieval_incomplete"
            : undefined);
  const copy = moonieNoMatchCopy(inferred);
  return (
    <div
      className={cn(
        "rounded-2xl border border-violet-100 bg-[#FFFBFF] px-4 py-4",
        className
      )}
    >
      <p className="font-[family-name:var(--font-source-serif)] text-lg font-semibold text-[#1A1224]">
        {copy.title}
      </p>
      <p className="mt-1 text-sm text-slate-600">{copy.description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {onBroaden ? (
          <CatalogLink onClick={onBroaden} size="compact">
            Drop one constraint
          </CatalogLink>
        ) : null}
        <CatalogLink href={browseHref} size="compact">
          Open browse
        </CatalogLink>
      </div>
    </div>
  );
}

export function MoonieRateLimit({
  className,
  quotaRemaining,
  dailyLimit = MOONIE_DAILY_DISCOVERY_LIMIT,
  compact = false,
}: {
  className?: string;
  quotaRemaining?: number | null;
  dailyLimit?: number;
  compact?: boolean;
}) {
  const used =
    typeof quotaRemaining === "number"
      ? Math.max(0, dailyLimit - quotaRemaining)
      : dailyLimit;

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4",
        className
      )}
      role="alert"
    >
      <p className="font-[family-name:var(--font-source-serif)] text-lg font-semibold text-[#1A1224]">
        {MOONIE_RATE_LIMIT_TITLE}
      </p>
      <p className="mt-1 text-xs font-medium text-amber-900/80">
        {formatDiscoveryQuotaUsed(used, dailyLimit)}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        {buildMoonieRateLimitBody({ compact })}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <CatalogLink href="/browse" size="compact">
          Browse catalogue
        </CatalogLink>
        <CatalogLink href="/discover" size="compact">
          Open discover
        </CatalogLink>
      </div>
    </div>
  );
}

export function MoonieGuestRateLimit({
  className,
  remaining,
  cap,
  compact = false,
}: {
  className?: string;
  remaining?: number | null;
  cap: number;
  compact?: boolean;
}) {
  const used =
    typeof remaining === "number" ? Math.max(0, cap - remaining) : cap;

  return (
    <div
      className={cn(
        "rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4",
        className
      )}
      role="alert"
    >
      <p className="font-[family-name:var(--font-source-serif)] text-lg font-semibold text-[#1A1224]">
        {MOONIE_GUEST_RATE_LIMIT_TITLE}
      </p>
      <p className="mt-1 text-xs font-medium text-amber-900/80">
        {formatGuestQuotaUsed(used, cap)}
      </p>
      <p className="mt-1 text-sm text-slate-700">
        {buildGuestRateLimitBody({ compact })}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <CatalogLink href="/register" size="compact">
          Create free account
        </CatalogLink>
        <CatalogLink href="/login?callbackUrl=/ask-moonie" size="compact">
          Log in
        </CatalogLink>
      </div>
    </div>
  );
}

export function MoonieChatError({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900",
        className
      )}
      role="alert"
    >
      {message}
    </div>
  );
}

export function MoonieGuestGate({
  remaining,
  className,
}: {
  remaining?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-violet-100 bg-[#FFFBFF] px-4 py-4 text-center sm:px-5",
        className
      )}
    >
      <p className="font-[family-name:var(--font-source-serif)] text-lg font-semibold text-[#1A1224]">
        {typeof remaining === "number" && remaining > 0
          ? `${remaining} free turn${remaining === 1 ? "" : "s"} left`
          : "Demo limit reached"}
      </p>
      <p className="mt-1 text-sm text-slate-600">
        Create an account to keep taste, shelves and multi-turn refine on this
        desk.
      </p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <CatalogLink href="/register" size="compact">
          Create free account
        </CatalogLink>
        <CatalogLink href="/login?callbackUrl=/ask-moonie" size="compact">
          Log in
        </CatalogLink>
      </div>
    </div>
  );
}

export function MoonieDeskEmpty({
  title,
  onSelect,
  hrefForPrompt,
  disabled,
  compact,
  showConstraint = true,
  widget,
  centered = false,
}: {
  title?: string;
  onSelect?: (prompt: string) => void;
  hrefForPrompt?: (prompt: string) => string;
  disabled?: boolean;
  compact?: boolean;
  showConstraint?: boolean;
  widget?: boolean;
  centered?: boolean;
}) {
  if (widget) {
    return (
      <div>
        <p className="mb-2.5 text-sm leading-snug text-slate-500">
          {MOONIE_WIDGET_HELPER}
        </p>
        <MoonieVibeChips
          disabled={disabled}
          onSelect={onSelect}
          hrefForPrompt={hrefForPrompt}
          compact
          chips={MOONIE_WIDGET_CHIPS}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        centered ? "mx-auto w-full max-w-2xl" : !compact && "mx-auto max-w-2xl"
      )}
    >
      <p
        className={cn(
          "mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500",
          centered && "text-center"
        )}
      >
        {title ?? "Start with a vibe"}
      </p>
      {showConstraint ? <MoonieConstraintLine className="mb-4" /> : null}
      <MoonieVibeChips
        disabled={disabled}
        onSelect={onSelect}
        hrefForPrompt={hrefForPrompt}
        compact={compact}
        row={centered}
      />
    </div>
  );
}

export function MoonieDeskComposer({
  id,
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder,
  sendDisabled,
  variant = "default",
  leading,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: (messageOverride?: string) => void;
  disabled?: boolean;
  placeholder: string;
  sendDisabled?: boolean;
  variant?: "default" | "widget";
  leading?: ReactNode;
}) {
  const isWidget = variant === "widget";
  const valueRef = useRef(value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxComposerHeight = isWidget ? 128 : 160;

  useLayoutEffect(() => {
    valueRef.current = value;
  });

  const syncComposerHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxComposerHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY =
      textarea.scrollHeight > maxComposerHeight ? "auto" : "hidden";
  }, [maxComposerHeight]);

  useLayoutEffect(() => {
    syncComposerHeight();
  }, [value, syncComposerHeight]);

  const voice = useMoonieVoiceDictation({
    disabled,
    onDictation: (text) => {
      onChange(mergeDictationIntoComposerText(valueRef.current, text));
    },
  });

  const controlSize = isWidget ? "size-8" : "size-10";
  const controlClass = cn(
    MOONIE_COMPOSER_TOOLBAR_BUTTON,
    controlSize
  );

  if (voice.isRecording) {
    return (
      <form
        className={cn("flex min-w-0 flex-col overflow-visible", isWidget ? "gap-1" : "gap-1.5")}
        onSubmit={(event) => event.preventDefault()}
      >
        <MoonieVoiceRecordingBar
          state={voice.state as "listening" | "transcribing"}
          elapsedLabel={voice.elapsedLabel}
          waveformLevels={voice.waveformLevels}
          waveformVisibleCount={voice.waveformVisibleCount}
          onStop={voice.stopListening}
          onCancel={voice.cancel}
          onSend={voice.stopListening}
          variant={isWidget ? "widget" : "default"}
        />
      </form>
    );
  }

  return (
    <form
      className={cn("flex min-w-0 flex-col overflow-visible", isWidget ? "gap-1" : "gap-1.5")}
        onSubmit={(event) => {
        event.preventDefault();
        if (sendDisabled || disabled) return;
        onSubmit(value.trim() || undefined);
      }}
    >
      <div className="flex min-w-0 items-end gap-1.5 overflow-visible sm:gap-2">
      <MoonieComposerTooltipProvider>
        {leading ? (
          <div className="flex shrink-0 items-center gap-1 overflow-visible">
            {leading}
          </div>
        ) : null}
        <MoonieComposerTooltip
          id="moonie-composer-mic"
          label="Voice dictation"
          hint="Tap to speak your message"
          align="center"
        >
          <MoonieVoiceInput
            disabled={disabled}
            className={controlClass}
            state={voice.state}
            statusMessage={voice.statusMessage}
            onStart={voice.startListening}
            onDismissError={voice.dismissError}
          />
        </MoonieComposerTooltip>
      </MoonieComposerTooltipProvider>
      <label className="sr-only" htmlFor={id}>
        Tell Moonie what you feel like reading
      </label>
      <textarea
        ref={textareaRef}
        id={id}
        rows={1}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "min-w-0 flex-1 border border-violet-100 bg-[#FFFBFF] text-[#1A1224] placeholder:text-slate-500 focus:border-[#6E46C7]/40 focus:outline-none focus:ring-2 focus:ring-[#6E46C7]/20",
          isWidget
            ? "max-h-32 min-h-[36px] resize-none overflow-hidden rounded-xl px-3 py-2 text-sm leading-snug"
            : "max-h-40 min-h-[40px] resize-none overflow-hidden rounded-xl px-3 py-2 text-sm leading-snug"
        )}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            if (sendDisabled || disabled) return;
            onSubmit(value.trim() || undefined);
          }
        }}
      />
      {isWidget ? (
        <button
          type="submit"
          disabled={sendDisabled || disabled}
          aria-label="Send message"
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/35 focus-visible:ring-offset-1",
            sendDisabled || disabled
              ? "cursor-not-allowed bg-slate-100 text-slate-300"
              : "bg-[#6E46C7] text-white shadow-sm hover:bg-[#5a3aa8] active:scale-95"
          )}
        >
          <Send className="size-4" aria-hidden />
        </button>
      ) : (
        <button
          type="submit"
          disabled={sendDisabled || disabled}
          aria-label="Send message"
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6E46C7]/35 focus-visible:ring-offset-1",
            sendDisabled || disabled
              ? "cursor-not-allowed bg-slate-100 text-slate-300"
              : "bg-[#6E46C7] text-white shadow-sm hover:bg-[#5a3aa8] active:scale-95"
          )}
        >
          <Send className="size-4" aria-hidden />
        </button>
      )}
      </div>
    </form>
  );
}
