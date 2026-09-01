"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ExternalLink,
  EyeOff,
  ShieldAlert,
  X,
} from "lucide-react";
import {
  inboxApproveLinkAction,
  inboxDismissReportAction,
  inboxHideCommentAction,
  inboxHideReviewAction,
  inboxRejectLinkAction,
  inboxRestoreCommentAction,
  inboxRestoreReviewAction,
  resolveReportWithRemediationAction,
} from "@/actions/inbox.actions";
import {
  approveTagSuggestionAction,
  rejectTagSuggestionAction,
} from "@/actions/admin.actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRelativeTime } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { AdminWorkspace } from "@/components/admin/AdminLayoutPrimitives";
import {
  ADMIN_FILTER_CHIP_ACTIVE,
  ADMIN_FILTER_CHIP_BASE,
  ADMIN_FILTER_CHIP_IDLE,
  ADMIN_FILTER_CHIP_ROW_CLASS,
} from "@/components/admin/admin-styles";
import {
  INBOX_KIND_FILTER_OPTIONS,
  inboxKindFilterCountKey,
  inboxKindFilterEmptyMessage,
  inboxKindFilterHref,
  type InboxKindFilterId,
} from "@/lib/admin/inbox-kind-filter";
import {
  getReportRemediationOptions,
  type InboxItem,
  type InboxItemKind,
} from "@/services/admin/inbox.service";

interface AdminInboxTriageProps {
  items: InboxItem[];
  counts?: Record<InboxItemKind | "total", number>;
  initialSelectedId?: string;
  activeFilter?: InboxItemKind | "all";
}

const INBOX_PANEL_CLASS =
  "flex min-h-0 flex-col overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#1c1729] text-white shadow-[0_20px_48px_-32px_rgba(0,0,0,0.45)]";

function slaTone(hours: number) {
  if (hours >= 72) return "text-red-300 bg-red-500/15 ring-red-400/25";
  if (hours >= 24) return "text-amber-200 bg-amber-500/15 ring-amber-400/25";
  return "text-white/55 bg-white/[0.06] ring-white/10";
}

export function AdminInboxTriage({
  items,
  counts,
  initialSelectedId,
  activeFilter = "all",
}: AdminInboxTriageProps) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(
    initialSelectedId ?? items[0]?.id ?? ""
  );
  const [resolution, setResolution] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = items.find((item) => item.id === selectedId) ?? items[0] ?? null;

  function navigateFilter(nextFilter: InboxKindFilterId) {
    router.push(inboxKindFilterHref(nextFilter));
  }

  function filterChipLabel(option: { id: InboxKindFilterId; label: string }): string {
    if (!counts) {
      return option.label;
    }
    const count = counts[inboxKindFilterCountKey(option.id)];
    return `${option.label} (${count})`;
  }

  function run(action: () => Promise<{ success: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.success) {
        setError(result.error ?? "Action failed.");
        return;
      }
      setResolution("");
      router.refresh();
    });
  }

  return (
    <AdminWorkspace>
      <div className={INBOX_PANEL_CLASS}>
        <div className={cn(ADMIN_FILTER_CHIP_ROW_CLASS, "border-b border-white/10 bg-white/[0.04]")}>
          {INBOX_KIND_FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => navigateFilter(option.id)}
              className={cn(
                ADMIN_FILTER_CHIP_BASE,
                "text-[11px]",
                activeFilter === option.id ? ADMIN_FILTER_CHIP_ACTIVE : ADMIN_FILTER_CHIP_IDLE
              )}
            >
              {filterChipLabel(option)}
            </button>
          ))}
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-white/[0.06] overflow-y-auto">
          {items.length === 0 ? (
            <li className="px-4 py-12 text-center text-sm text-white/70">
              {inboxKindFilterEmptyMessage(activeFilter)}
            </li>
          ) : (
            items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={cn(
                    "w-full px-4 py-3.5 text-left transition",
                    selected?.id === item.id
                      ? "bg-gradient-to-r from-[#6e46c7]/20 to-transparent"
                      : "hover:bg-white/[0.04]"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant="outline"
                      className="border-[#f9db7e]/35 bg-[#6e46c7]/25 text-[10px] font-semibold text-[#e6d2a3]"
                    >
                      {item.badge}
                    </Badge>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1",
                        slaTone(item.ageHours)
                      )}
                    >
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 truncate text-sm font-semibold text-white">
                    {item.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-[#c4b5fd]/80">
                    {item.subtitle}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className={cn(INBOX_PANEL_CLASS, "p-5 sm:p-6")}>
        <div className="min-h-0 flex-1 overflow-y-auto">
        {!selected ? (
          <p className="text-sm text-white/70">Select an item to triage.</p>
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className="bg-[#6e46c7]/30 text-[#e6d2a3]">{selected.badge}</Badge>
                <h2 className="mt-2 font-serif text-xl font-medium text-white">
                  {selected.title}
                </h2>
                <p className="mt-1 text-sm text-[#c4b5fd]/80">{selected.subtitle}</p>
              </div>
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
                  slaTone(selected.ageHours)
                )}
              >
                Open {Math.floor(selected.ageHours)}h
              </span>
            </div>

            {selected.detail ? (
              <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm leading-relaxed text-white/85">
                {selected.detail}
              </p>
            ) : null}

            {error ? (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-6 space-y-3">
              <InboxDetailActions
                item={selected}
                resolution={resolution}
                onResolutionChange={setResolution}
                isPending={isPending}
                onRun={run}
              />
            </div>
          </>
        )}
        </div>
      </div>
    </AdminWorkspace>
  );
}

const INBOX_LINK_CLASS =
  "inline-flex h-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] px-3 text-xs font-medium text-[#e6d2a3] transition hover:bg-white/[0.1]";

function InboxDetailActions({
  item,
  resolution,
  onResolutionChange,
  isPending,
  onRun,
}: {
  item: InboxItem;
  resolution: string;
  onResolutionChange: (value: string) => void;
  isPending: boolean;
  onRun: (action: () => Promise<{ success: boolean; error?: string }>) => void;
}) {
  if (item.kind === "report") {
    const options = getReportRemediationOptions(item.report.targetType);
    return (
      <>
        <Input
          value={resolution}
          onChange={(e) => onResolutionChange(e.target.value)}
          placeholder="Resolution note (optional)"
          disabled={isPending}
          className="h-9 rounded-xl border-white/10 bg-white/[0.06] text-sm text-white placeholder:text-white/35"
        />
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <Button
              key={option.id}
              size="sm"
              disabled={isPending}
              onClick={() =>
                onRun(() =>
                  resolveReportWithRemediationAction({
                    reportId: item.report.id,
                    remediation: option.id as
                      | "resolve_only"
                      | "hide_review"
                      | "hide_comment"
                      | "suspend_user",
                    resolution,
                  })
                )
              }
            >
              <Check size={14} className="mr-1.5" />
              {option.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              onRun(() => inboxDismissReportAction(item.report.id, resolution))
            }
          >
            <X size={14} className="mr-1.5" />
            Dismiss
          </Button>
          {item.report.targetLink ? (
            <Link href={item.report.targetLink} target="_blank" className={INBOX_LINK_CLASS}>
              <ExternalLink size={14} className="mr-1.5" />
              View target
            </Link>
          ) : null}
        </div>
      </>
    );
  }

  if (item.kind === "review_flagged") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => onRun(() => inboxHideReviewAction(item.reviewId))}
        >
          <EyeOff size={14} className="mr-1.5" />
          Hide review
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => onRun(() => inboxRestoreReviewAction(item.reviewId))}
        >
          Mark OK
        </Button>
        <Link href={`/reviews/${item.reviewId}`} target="_blank" className={INBOX_LINK_CLASS}>
          Open review
        </Link>
      </div>
    );
  }

  if (item.kind === "comment_flagged") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => onRun(() => inboxHideCommentAction(item.commentId))}
        >
          <EyeOff size={14} className="mr-1.5" />
          Hide comment
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() => onRun(() => inboxRestoreCommentAction(item.commentId))}
        >
          Mark OK
        </Button>
        <Link href={`/reviews/${item.reviewId}#comments`} target="_blank" className={INBOX_LINK_CLASS}>
          Open thread
        </Link>
      </div>
    );
  }

  if (item.kind === "reading_link" || item.kind === "reading_link_unhealthy") {
    return (
      <div className="flex flex-wrap gap-2">
        {item.kind === "reading_link" ? (
          <>
            <Button
              size="sm"
              disabled={isPending}
              onClick={() => onRun(() => inboxApproveLinkAction(item.linkId))}
            >
              Approve link
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending}
              onClick={() => onRun(() => inboxRejectLinkAction(item.linkId))}
            >
              Reject
            </Button>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-amber-200">
            <ShieldAlert size={16} />
            Approved link failing health checks — review in reading links.
          </p>
        )}
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className={INBOX_LINK_CLASS}
        >
          Open URL
        </a>
      </div>
    );
  }

  if (item.kind === "tag_suggestion") {
    return (
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={isPending}
          onClick={() =>
            onRun(() => approveTagSuggestionAction(item.suggestionId))
          }
        >
          Approve as new tag
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={isPending}
          onClick={() =>
            onRun(() => rejectTagSuggestionAction(item.suggestionId, ""))
          }
        >
          Reject
        </Button>
        <Link href="/admin/tags" className={INBOX_LINK_CLASS}>
          Open tag manager
        </Link>
      </div>
    );
  }

  return null;
}
