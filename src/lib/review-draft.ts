import { isNovelCoverDataUrl } from "@/lib/novel-cover";

export interface ReviewDraftV1 {
  id: string;
  version: 1;
  savedAt: string;
  step: 1 | 2 | 3;
  novelMode: "existing" | "new";
  selectedNovelId: string;
  novelTitle: string;
  novelAuthor: string;
  coverUrl: string;
  synopsis: string;
  originalLanguage: string;
  publicationStatus: string;
  selectedGenreIds: string[];
  selectedTagIds: string[];
  readingLinks: string[];
  acknowledgeDuplicate: boolean;
  rating: number;
  reviewTitle: string;
  reviewBody: string;
  containsSpoilers: boolean;
}

export type PersistReviewDraftResult =
  | { ok: true; savedAt: string; coverOmitted?: boolean }
  | { ok: false; reason: "empty" | "quota" | "storage" };

interface DraftStoreV2 {
  version: 2;
  drafts: ReviewDraftV1[];
}

const LEGACY_DRAFT_KEY = (userId: string) =>
  `moonverse:review-draft:v1:${userId}`;

const DRAFT_STORE_KEY = (userId: string) =>
  `moonverse:review-drafts:v2:${userId}`;

export function generateDraftId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `draft-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isQuotaError(error: unknown): boolean {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.code === 22 ||
    error.code === 1014
  );
}

function normalizeDraft(
  raw: Partial<ReviewDraftV1> & { version?: number }
): ReviewDraftV1 | null {
  if (raw.version !== 1) return null;

  const draft: ReviewDraftV1 = {
    ...createEmptyReviewDraft(),
    ...raw,
    id: raw.id?.trim() || generateDraftId(),
    version: 1,
  };

  if (!isMeaningfulReviewDraft(draft)) return null;
  return draft;
}

function readDraftStore(userId: string): DraftStoreV2 {
  if (typeof window === "undefined" || !userId) {
    return { version: 2, drafts: [] };
  }

  try {
    const raw = window.localStorage.getItem(DRAFT_STORE_KEY(userId));
    if (raw) {
      const parsed = JSON.parse(raw) as DraftStoreV2;
      if (parsed?.version === 2 && Array.isArray(parsed.drafts)) {
        const drafts = parsed.drafts
          .map((draft) => normalizeDraft(draft))
          .filter((draft): draft is ReviewDraftV1 => Boolean(draft));
        return { version: 2, drafts };
      }
    }
  } catch {
    // Fall through to legacy migration.
  }

  try {
    const legacyRaw = window.localStorage.getItem(LEGACY_DRAFT_KEY(userId));
    if (!legacyRaw) return { version: 2, drafts: [] };

    const legacy = JSON.parse(legacyRaw) as Partial<ReviewDraftV1> & {
      version?: number;
    };
    const migrated = normalizeDraft(legacy);
    const store: DraftStoreV2 = {
      version: 2,
      drafts: migrated ? [migrated] : [],
    };
    writeDraftStore(userId, store);
    window.localStorage.removeItem(LEGACY_DRAFT_KEY(userId));
    return store;
  } catch {
    return { version: 2, drafts: [] };
  }
}

function writeDraftStore(userId: string, store: DraftStoreV2): void {
  window.localStorage.setItem(DRAFT_STORE_KEY(userId), JSON.stringify(store));
}

function sortDraftsNewestFirst(drafts: ReviewDraftV1[]): ReviewDraftV1[] {
  return [...drafts].sort(
    (a, b) => (Date.parse(b.savedAt) || 0) - (Date.parse(a.savedAt) || 0)
  );
}

export function createEmptyReviewDraft(
  overrides: Partial<ReviewDraftV1> = {}
): ReviewDraftV1 {
  return {
    id: overrides.id ?? generateDraftId(),
    version: 1,
    savedAt: new Date().toISOString(),
    step: 1,
    novelMode: "existing",
    selectedNovelId: "",
    novelTitle: "",
    novelAuthor: "",
    coverUrl: "",
    synopsis: "",
    originalLanguage: "",
    publicationStatus: "",
    selectedGenreIds: [],
    selectedTagIds: [],
    readingLinks: [],
    acknowledgeDuplicate: false,
    rating: 0,
    reviewTitle: "",
    reviewBody: "",
    containsSpoilers: false,
    ...overrides,
  };
}

/** True only when the user has entered real content worth keeping. */
export function isMeaningfulReviewDraft(
  draft: Pick<
    ReviewDraftV1,
    | "selectedNovelId"
    | "novelTitle"
    | "novelAuthor"
    | "coverUrl"
    | "synopsis"
    | "originalLanguage"
    | "publicationStatus"
    | "selectedGenreIds"
    | "selectedTagIds"
    | "readingLinks"
    | "rating"
    | "reviewTitle"
    | "reviewBody"
    | "containsSpoilers"
  >
): boolean {
  if (draft.selectedNovelId.trim()) return true;
  if (draft.novelTitle.trim()) return true;
  if (draft.novelAuthor.trim()) return true;
  if (draft.coverUrl.trim()) return true;
  if (draft.synopsis.trim()) return true;
  if (draft.originalLanguage.trim()) return true;
  if (draft.publicationStatus.trim()) return true;
  if (draft.selectedGenreIds.length > 0) return true;
  if (draft.selectedTagIds.length > 0) return true;
  if (draft.readingLinks.some((url) => url.trim().length > 0)) return true;
  if (draft.rating > 0) return true;
  if (draft.reviewTitle.trim()) return true;
  if (draft.reviewBody.trim()) return true;
  if (draft.containsSpoilers) return true;
  return false;
}

export function loadReviewDrafts(userId: string): ReviewDraftV1[] {
  return sortDraftsNewestFirst(readDraftStore(userId).drafts);
}

export function loadReviewDraft(
  userId: string,
  draftId?: string
): ReviewDraftV1 | null {
  const drafts = loadReviewDrafts(userId);
  if (draftId) {
    return drafts.find((draft) => draft.id === draftId) ?? null;
  }
  return drafts[0] ?? null;
}

export function saveReviewDrafts(
  userId: string,
  drafts: ReviewDraftV1[]
): PersistReviewDraftResult {
  if (typeof window === "undefined" || !userId) {
    return { ok: false, reason: "storage" };
  }

  const meaningful = sortDraftsNewestFirst(
    drafts
      .map((draft) => normalizeDraft(draft))
      .filter((draft): draft is ReviewDraftV1 => Boolean(draft))
  );

  try {
    writeDraftStore(userId, { version: 2, drafts: meaningful });
    return { ok: true, savedAt: new Date().toISOString() };
  } catch (error) {
    if (isQuotaError(error)) {
      return { ok: false, reason: "quota" };
    }
    return { ok: false, reason: "storage" };
  }
}

/** Persist a draft locally with quota recovery (drops cover image if needed). */
export function persistReviewDraft(
  userId: string,
  draft: ReviewDraftV1
): PersistReviewDraftResult {
  if (typeof window === "undefined" || !userId) {
    return { ok: false, reason: "storage" };
  }

  if (!isMeaningfulReviewDraft(draft)) {
    if (draft.id) {
      deleteReviewDraft(userId, draft.id);
    }
    return { ok: false, reason: "empty" };
  }

  const savedAt = draft.savedAt || new Date().toISOString();
  const payload: ReviewDraftV1 = {
    ...draft,
    id: draft.id?.trim() || generateDraftId(),
    savedAt,
  };

  const store = readDraftStore(userId);
  const nextDrafts = store.drafts.filter((item) => item.id !== payload.id);
  nextDrafts.unshift(payload);

  try {
    writeDraftStore(userId, {
      version: 2,
      drafts: sortDraftsNewestFirst(nextDrafts),
    });
    return { ok: true, savedAt };
  } catch (error) {
    if (
      isQuotaError(error) &&
      payload.coverUrl &&
      isNovelCoverDataUrl(payload.coverUrl)
    ) {
      try {
        const slim: ReviewDraftV1 = { ...payload, coverUrl: "" };
        const slimDrafts = store.drafts.filter((item) => item.id !== slim.id);
        slimDrafts.unshift(slim);
        writeDraftStore(userId, {
          version: 2,
          drafts: sortDraftsNewestFirst(slimDrafts),
        });
        return { ok: true, savedAt, coverOmitted: true };
      } catch (retryError) {
        if (isQuotaError(retryError)) {
          return { ok: false, reason: "quota" };
        }
        return { ok: false, reason: "storage" };
      }
    }

    if (isQuotaError(error)) {
      return { ok: false, reason: "quota" };
    }
    return { ok: false, reason: "storage" };
  }
}

export function saveReviewDraft(userId: string, draft: ReviewDraftV1): void {
  persistReviewDraft(userId, draft);
}

export function deleteReviewDraft(userId: string, draftId: string): void {
  if (typeof window === "undefined" || !userId || !draftId) return;
  try {
    const store = readDraftStore(userId);
    const nextDrafts = store.drafts.filter((draft) => draft.id !== draftId);
    writeDraftStore(userId, { version: 2, drafts: nextDrafts });
  } catch {
    // Ignore.
  }
}

/** @deprecated Use deleteReviewDraft(userId, draftId) instead. */
export function clearReviewDraft(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.removeItem(DRAFT_STORE_KEY(userId));
    window.localStorage.removeItem(LEGACY_DRAFT_KEY(userId));
  } catch {
    // Ignore.
  }
}

export function pickNewerReviewDraft(
  a: ReviewDraftV1 | null,
  b: ReviewDraftV1 | null
): ReviewDraftV1 | null {
  if (!a) return b;
  if (!b) return a;
  const aTime = Date.parse(a.savedAt) || 0;
  const bTime = Date.parse(b.savedAt) || 0;
  return bTime > aTime ? b : a;
}

export function mergeReviewDrafts(
  localDrafts: ReviewDraftV1[],
  serverDrafts: ReviewDraftV1[]
): ReviewDraftV1[] {
  const byId = new Map<string, ReviewDraftV1>();

  for (const draft of serverDrafts) {
    const normalized = normalizeDraft(draft);
    if (normalized) byId.set(normalized.id, normalized);
  }

  for (const draft of localDrafts) {
    const normalized = normalizeDraft(draft);
    if (!normalized) continue;
    const existing = byId.get(normalized.id);
    byId.set(
      normalized.id,
      existing ? pickNewerReviewDraft(existing, normalized) ?? normalized : normalized
    );
  }

  return sortDraftsNewestFirst(Array.from(byId.values()));
}
