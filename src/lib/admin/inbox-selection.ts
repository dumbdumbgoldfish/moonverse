import type { InboxKindFilterId } from "@/lib/admin/inbox-kind-filter";

export interface InboxSelectionResolution {
  /** Id highlighted in the list and shown in the detail panel when matched. */
  activeSelectedId: string | null;
  /** Raw requested id from the URL, if any. */
  requestedSelectedId: string | null;
  /** Whether the requested id exists on the loaded page. */
  selectionMatched: boolean;
  /** User-facing note when a requested id could not be restored. */
  selectionWarning: string | null;
}

export function buildInboxTriageSearchParams(options: {
  kind?: InboxKindFilterId;
  page?: number;
  selected?: string;
}): Record<string, string> {
  const params: Record<string, string> = {};
  if (options.kind && options.kind !== "all") {
    params.kind = options.kind;
  }
  if (options.page && options.page > 1) {
    params.page = String(options.page);
  }
  if (options.selected) {
    params.selected = options.selected;
  }
  return params;
}

export function buildInboxTriageHref(options: {
  kind?: InboxKindFilterId;
  page?: number;
  selected?: string;
}): string {
  const search = new URLSearchParams(buildInboxTriageSearchParams(options));
  const qs = search.toString();
  return qs ? `/admin/inbox?${qs}` : "/admin/inbox";
}

export function buildInboxTriageHrefFromSearch(
  currentSearch: string,
  patch: { selected?: string | null; kind?: InboxKindFilterId | null; page?: number | null }
): string {
  const params = new URLSearchParams(currentSearch);

  if (patch.kind !== undefined) {
    if (!patch.kind || patch.kind === "all") {
      params.delete("kind");
    } else {
      params.set("kind", patch.kind);
    }
  }

  if (patch.page !== undefined) {
    if (!patch.page || patch.page <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(patch.page));
    }
  }

  if (patch.selected !== undefined) {
    if (!patch.selected) {
      params.delete("selected");
    } else {
      params.set("selected", patch.selected);
    }
  }

  const qs = params.toString();
  return qs ? `/admin/inbox?${qs}` : "/admin/inbox";
}

export function findInboxPageForSelectedIndex(
  itemCount: number,
  selectedIndex: number,
  pageSize: number
): number | null {
  if (selectedIndex < 0 || selectedIndex >= itemCount) {
    return null;
  }
  return Math.floor(selectedIndex / pageSize) + 1;
}

export function resolveInboxSelection<T extends { id: string }>(
  items: T[],
  requestedSelectedId?: string | null,
  selectionWarning?: string | null
): InboxSelectionResolution {
  const requested = requestedSelectedId?.trim() || null;

  if (items.length === 0) {
    return {
      activeSelectedId: null,
      requestedSelectedId: requested,
      selectionMatched: false,
      selectionWarning: selectionWarning ?? null,
    };
  }

  if (!requested) {
    return {
      activeSelectedId: items[0].id,
      requestedSelectedId: null,
      selectionMatched: true,
      selectionWarning: null,
    };
  }

  const matched = items.find((item) => item.id === requested);
  if (matched) {
    return {
      activeSelectedId: matched.id,
      requestedSelectedId: requested,
      selectionMatched: true,
      selectionWarning: null,
    };
  }

  return {
    activeSelectedId: items[0].id,
    requestedSelectedId: requested,
    selectionMatched: false,
    selectionWarning:
      selectionWarning ??
      "The linked inbox item is not on this page or no longer matches this view.",
  };
}

export function reconcileInboxSelectionForFilterChange(
  currentSelectedId: string | null,
  nextItems: Array<{ id: string }>
): string | null {
  if (!currentSelectedId) {
    return nextItems[0]?.id ?? null;
  }
  if (nextItems.some((item) => item.id === currentSelectedId)) {
    return currentSelectedId;
  }
  return nextItems[0]?.id ?? null;
}
