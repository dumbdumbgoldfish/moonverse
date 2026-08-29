"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { PenLine } from "lucide-react";
import {
  createReviewAction,
  getNovelWriteContextAction,
} from "@/actions/review.actions";
import {
  deleteServerReviewDraftAction,
  listServerReviewDraftsAction,
  syncReviewDraftAction,
} from "@/actions/review-draft.actions";
import { ReviewComposeFields } from "@/components/reviews/write/ReviewComposeFields";
import { WritingStudioAttachPanel } from "@/components/reviews/write/WritingStudioAttachPanel";
import { WritingStudioBar } from "@/components/reviews/write/WritingStudioBar";
import { WritingStudioContextRail } from "@/components/reviews/write/WritingStudioContextRail";
import { WritingStudioDraftBanner } from "@/components/reviews/write/WritingStudioDraftBanner";
import { WritingStudioMobileActions } from "@/components/reviews/write/WritingStudioMobileActions";
import { WritingStudioMobileSheet } from "@/components/reviews/write/WritingStudioMobileSheet";
import { WritingStudioPublishDrawer } from "@/components/reviews/write/WritingStudioPublishDrawer";
import {
  FocusModePrimaryButton,
  FocusModeSecondaryButton,
  WritingStudioFocusShell,
} from "@/components/reviews/write/WritingStudioFocusShell";
import { useWritingStudioShortcuts } from "@/components/reviews/write/useWritingStudioShortcuts";
import { type WriteStep } from "@/components/reviews/write/ReviewStepIndicator";
import { WritingStudioCommandPalette } from "@/components/reviews/write/WritingStudioCommandPalette";
import { useWritingStudioCommandPalette } from "@/components/reviews/write/useWritingStudioCommandPalette";
import type { WritingStudioCommand } from "@/components/reviews/write/writing-studio-commands";
import { type ChecklistItem } from "@/components/reviews/write/writing-studio.types";
import { WritingStudioBackdrop } from "@/components/reviews/write/WritingStudioChrome";
import {
  deleteReviewDraft,
  generateDraftId,
  isMeaningfulReviewDraft,
  loadReviewDrafts,
  mergeReviewDrafts,
  persistReviewDraft,
  saveReviewDrafts,
  type ReviewDraftV1,
} from "@/lib/review-draft";
import { normalizeReadingUrl } from "@/lib/normalize-url";
import { REVIEW_SECTION_TEMPLATES } from "@/lib/review-sections";
import { withActionTimeout } from "@/lib/action-timeout";
import { cn } from "@/lib/utils";
import { isValidNovelCoverUrl } from "@/lib/novel-cover";
import { SITE_SHELL_CLASS } from "@/lib/site-shell";
import { isSafeHttpsUrl, LIMITS } from "@/lib/validation";
import type {
  NovelSelectOption,
  NovelWriteContext,
} from "@/services/novel.service";
import type { ReadingStatusNovel } from "@/services/reading-status.service";

interface GenreOption {
  id: string;
  name: string;
}

interface TagOption {
  id: string;
  name: string;
}

interface ReviewFormProps {
  genres: GenreOption[];
  tags: TagOption[];
  novels: NovelSelectOption[];
  initialNovelId?: string;
  /** When true, restore the browser draft immediately (from My Reviews). */
  autoResumeDraft?: boolean;
  /** When true with autoResumeDraft, open the publish drawer after loading the draft. */
  autoOpenPublish?: boolean;
  /** Resume a specific saved draft by id. */
  initialDraftId?: string;
  userId: string;
  userName: string;
  userUsername?: string;
  userImage?: string | null;
  currentlyReading?: ReadingStatusNovel | null;
  recentlyFinished?: ReadingStatusNovel[];
}

function normalizePersonKey(title: string, author: string) {
  return `${title.trim().toLowerCase()}: ${author.trim().toLowerCase()}`;
}

function countChars(value: string) {
  return value.trim().length;
}

/** SSR-safe defaults only. Never read localStorage here (hydration mismatch). */
function createInitialState(
  novels: NovelSelectOption[],
  initialNovelId?: string,
  deferNovelPreselect = false
) {
  const hasInitialNovel =
    !deferNovelPreselect &&
    Boolean(initialNovelId) &&
    novels.some((novel) => novel.id === initialNovelId);

  return {
    step: (hasInitialNovel ? 2 : 1) as WriteStep,
    novelMode: (novels.length > 0 ? "existing" : "new") as "existing" | "new",
    selectedNovelId: hasInitialNovel ? (initialNovelId ?? "") : "",
    changingNovel: !hasInitialNovel,
  };
}

function isDraftNovelStepComplete(draft: ReviewDraftV1): boolean {
  if (draft.novelMode === "existing") {
    return Boolean(draft.selectedNovelId);
  }

  return Boolean(
    draft.novelTitle.trim() &&
      draft.novelAuthor.trim() &&
      draft.selectedGenreIds.length > 0
  );
}

/** Map saved draft step to attach-panel / preview UI state. */
function deriveResumeUiState(draft: ReviewDraftV1): {
  changingNovel: boolean;
  openPublishDrawer: boolean;
} {
  const novelComplete = isDraftNovelStepComplete(draft);

  if (draft.step === 1) {
    return { changingNovel: true, openPublishDrawer: false };
  }

  if (draft.step === 3) {
    return { changingNovel: false, openPublishDrawer: true };
  }

  return {
    changingNovel: !novelComplete,
    openPublishDrawer: false,
  };
}

function applyDraftToForm(
  draft: ReviewDraftV1,
  setters: {
    setStep: (v: WriteStep) => void;
    setNovelMode: (v: "existing" | "new") => void;
    setSelectedNovelId: (v: string) => void;
    setChangingNovel: (v: boolean) => void;
    setNovelTitle: (v: string) => void;
    setNovelAuthor: (v: string) => void;
    setCoverUrl: (v: string) => void;
    setSynopsis: (v: string) => void;
    setOriginalLanguage: (v: string) => void;
    setPublicationStatus: (v: string) => void;
    setSelectedGenreIds: (v: string[]) => void;
    setSelectedTagIds: (v: string[]) => void;
    setReadingLinks: (v: string[]) => void;
    setAcknowledgeDuplicate: (v: boolean) => void;
    setRating: (v: number) => void;
    setReviewTitle: (v: string) => void;
    setReviewBody: (v: string) => void;
    setContainsSpoilers: (v: boolean) => void;
    setDraftSavedAt: (v: string | null) => void;
    setDraftRestored: (v: boolean) => void;
  }
) {
  const resumeUi = deriveResumeUiState(draft);

  setters.setStep(draft.step);
  setters.setNovelMode(draft.novelMode);
  setters.setSelectedNovelId(draft.selectedNovelId);
  setters.setChangingNovel(resumeUi.changingNovel);
  setters.setNovelTitle(draft.novelTitle);
  setters.setNovelAuthor(draft.novelAuthor);
  setters.setCoverUrl(draft.coverUrl);
  setters.setSynopsis(draft.synopsis);
  setters.setOriginalLanguage(draft.originalLanguage);
  setters.setPublicationStatus(draft.publicationStatus);
  setters.setSelectedGenreIds(draft.selectedGenreIds);
  setters.setSelectedTagIds(draft.selectedTagIds);
  setters.setReadingLinks(
    draft.readingLinks.length > 0 ? draft.readingLinks : [""]
  );
  setters.setAcknowledgeDuplicate(draft.acknowledgeDuplicate);
  setters.setRating(draft.rating);
  setters.setReviewTitle(draft.reviewTitle);
  setters.setReviewBody(draft.reviewBody);
  setters.setContainsSpoilers(draft.containsSpoilers);
  setters.setDraftSavedAt(draft.savedAt);
  setters.setDraftRestored(true);
}

export function ReviewForm({
  genres,
  tags,
  novels,
  initialNovelId,
  autoResumeDraft = false,
  autoOpenPublish = false,
  initialDraftId,
  userId,
  userName,
  userUsername,
  userImage,
  currentlyReading = null,
  recentlyFinished = [],
}: ReviewFormProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const isPending = isPublishing;
  const [error, setError] = useState<string | null>(null);
  const [initial] = useState(() =>
    createInitialState(novels, initialNovelId, autoResumeDraft)
  );
  const [step, setStep] = useState<WriteStep>(initial.step);
  const [novelMode, setNovelMode] = useState<"existing" | "new">(
    initial.novelMode
  );
  const [selectedNovelId, setSelectedNovelId] = useState(
    initial.selectedNovelId
  );
  const [changingNovel, setChangingNovel] = useState(initial.changingNovel);
  const [novelContext, setNovelContext] = useState<NovelWriteContext | null>(
    null
  );

  const [novelTitle, setNovelTitle] = useState("");
  const [novelAuthor, setNovelAuthor] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [originalLanguage, setOriginalLanguage] = useState("");
  const [publicationStatus, setPublicationStatus] = useState("");
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [acknowledgeDuplicate, setAcknowledgeDuplicate] = useState(false);
  const [readingLinks, setReadingLinks] = useState<string[]>([""]);

  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewBody, setReviewBody] = useState("");
  const [containsSpoilers, setContainsSpoilers] = useState(false);

  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftJustSaved, setDraftJustSaved] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [draftBackedUp, setDraftBackedUp] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<ReviewDraftV1 | null>(null);
  const [savedDraftCount, setSavedDraftCount] = useState(0);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(() =>
    initialDraftId ?? null
  );
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [publishDrawerOpen, setPublishDrawerOpen] = useState(false);
  const skipNextAutosaveRef = useRef(true);
  const draftHydratedRef = useRef(false);
  const autoResumedRef = useRef(false);
  const draftResumeReadyRef = useRef(!autoResumeDraft);
  const dirtyRef = useRef(false);
  const formSnapshotRef = useRef<ReviewDraftV1 | null>(null);
  const formPanelRef = useRef<HTMLDivElement>(null);

  const draftSetters = {
    setStep,
    setNovelMode,
    setSelectedNovelId,
    setChangingNovel,
    setNovelTitle,
    setNovelAuthor,
    setCoverUrl,
    setSynopsis,
    setOriginalLanguage,
    setPublicationStatus,
    setSelectedGenreIds,
    setSelectedTagIds,
    setReadingLinks,
    setAcknowledgeDuplicate,
    setRating,
    setReviewTitle,
    setReviewBody,
    setContainsSpoilers,
    setDraftSavedAt,
    setDraftRestored,
  };

  const selectedNovel = useMemo(
    () => novels.find((novel) => novel.id === selectedNovelId) ?? null,
    [novels, selectedNovelId]
  );

  const catalogIds = useMemo(
    () => new Set(novels.map((novel) => novel.id)),
    [novels]
  );

  const deskReadingInCatalog = useMemo(() => {
    if (!currentlyReading || !catalogIds.has(currentlyReading.novelId)) {
      return null;
    }
    return currentlyReading;
  }, [currentlyReading, catalogIds]);

  const finishedInCatalog = useMemo(
    () => recentlyFinished.filter((novel) => catalogIds.has(novel.novelId)),
    [recentlyFinished, catalogIds]
  );

  const clientDuplicates = useMemo(() => {
    if (novelMode !== "new") return [];
    const key = normalizePersonKey(novelTitle, novelAuthor);
    if (!novelTitle.trim() || !novelAuthor.trim()) return [];
    return novels
      .filter(
        (novel) =>
          normalizePersonKey(novel.title, novel.author ?? "") === key
      )
      .slice(0, 5);
  }, [novelMode, novelTitle, novelAuthor, novels]);

  const effectiveDuplicates = clientDuplicates;

  const bodyLength = countChars(reviewBody);
  const titleLength = countChars(reviewTitle);
  const wordCount = reviewBody.trim()
    ? reviewBody.trim().split(/\s+/).filter(Boolean).length
    : 0;

  const novelStepComplete =
    novelMode === "existing"
      ? Boolean(selectedNovelId)
      : Boolean(
          novelTitle.trim() &&
            novelAuthor.trim() &&
            selectedGenreIds.length > 0 &&
            (effectiveDuplicates.length === 0 || acknowledgeDuplicate)
        );

  const reviewStepComplete =
    rating > 0 &&
    titleLength >= LIMITS.reviewTitle.min &&
    bodyLength >= LIMITS.reviewBody.min;

  const canPreview = novelStepComplete && reviewStepComplete;
  const canPublish = canPreview;

  const showAttachPanel = !novelStepComplete || changingNovel;
  const showCompose = novelStepComplete && !changingNovel;
  const prevShowComposeRef = useRef(showCompose);

  const checklist: ChecklistItem[] = useMemo(() => {
    const items: ChecklistItem[] = [];

    if (novelMode === "existing") {
      items.push({
        id: "novel",
        label: "Novel attached",
        complete: Boolean(selectedNovelId),
      });
    } else {
      items.push(
      {
        id: "novel-title",
          label: "Novel title",
        complete: Boolean(novelTitle.trim()),
      },
      {
        id: "author",
          label: "Author",
        complete: Boolean(novelAuthor.trim()),
      },
      {
        id: "genre",
          label: "Genre",
        complete: selectedGenreIds.length > 0,
        }
      );
      if (effectiveDuplicates.length > 0) {
        items.push({
          id: "duplicate",
          label: "Duplicate acknowledged",
          complete: acknowledgeDuplicate,
        });
      }
    }

    items.push(
      { id: "rating", label: "Rating", complete: rating > 0 },
      {
        id: "title",
        label: "Headline",
        complete: titleLength >= LIMITS.reviewTitle.min,
      },
      {
        id: "body",
        label: "Review body",
        complete: bodyLength >= LIMITS.reviewBody.min,
      }
    );

    return items;
  }, [
    novelMode,
    selectedNovelId,
    novelTitle,
    novelAuthor,
    selectedGenreIds.length,
    effectiveDuplicates.length,
    acknowledgeDuplicate,
    rating,
    titleLength,
    bodyLength,
  ]);

  const missingLabels = checklist
    .filter((item) => !item.complete)
    .map((item) => item.label);

  const workspaceProgress = useMemo(() => {
    if (checklist.length === 0) return 0;
    return Math.round(
      (checklist.filter((item) => item.complete).length / checklist.length) *
        100
    );
  }, [checklist]);

  const hasDiscardableContent = Boolean(
    draftSavedAt ||
      draftRestored ||
      selectedNovelId ||
      novelTitle.trim() ||
      reviewTitle.trim() ||
      reviewBody.trim() ||
      rating > 0 ||
      selectedGenreIds.length > 0
  );

  const activeNovelContext =
    novelMode === "existing" &&
    selectedNovelId &&
    novelContext?.id === selectedNovelId
      ? novelContext
      : null;

  const contextLoading =
    novelMode === "existing" &&
    Boolean(selectedNovelId) &&
    novelContext?.id !== selectedNovelId;

  const readingLinkErrors = useMemo(() => {
    const errors: string[] = [];
    const seen = new Set<string>();
    const existing = new Set(activeNovelContext?.existingNormalizedUrls ?? []);

    for (const raw of readingLinks) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      if (!isSafeHttpsUrl(trimmed)) {
        errors.push("Every reading source must be a valid HTTPS URL.");
        continue;
      }
      const normalized = normalizeReadingUrl(trimmed);
      if (!normalized) {
        errors.push("One of the reading sources could not be normalized.");
        continue;
      }
      if (existing.has(normalized) || seen.has(normalized)) {
        errors.push("Duplicate reading sources are not allowed.");
      }
      seen.add(normalized);
    }
    return [...new Set(errors)];
  }, [readingLinks, activeNovelContext?.existingNormalizedUrls]);

  const selectedSummary = useMemo(() => {
    if (novelMode === "existing" && selectedNovel) {
      return {
        title: selectedNovel.title,
        author: selectedNovel.author,
        coverUrl: selectedNovel.coverUrl ?? null,
      };
    }
    if (novelMode === "new" && novelTitle.trim()) {
      return {
        title: novelTitle.trim(),
        author: novelAuthor.trim() || null,
        coverUrl: isValidNovelCoverUrl(coverUrl) ? coverUrl.trim() : null,
      };
    }
    return null;
  }, [novelMode, selectedNovel, novelTitle, novelAuthor, coverUrl]);

  const selectedTagNames = selectedTagIds
    .map((id) => tags.find((tag) => tag.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  const previewGenreNames = useMemo(() => {
    if (novelMode === "existing" && selectedNovel) {
      return selectedNovel.genres.slice(0, 4);
    }
    if (novelMode === "new") {
      return selectedGenreIds
        .map((id) => genres.find((genre) => genre.id === id)?.name)
        .filter((name): name is string => Boolean(name));
    }
    return [];
  }, [novelMode, selectedNovel, selectedGenreIds, genres]);

  const previewTagNames = novelMode === "new" ? selectedTagNames : [];

  const cleanedReadingUrls = readingLinks
    .map((url) => url.trim())
    .filter(Boolean);

  function buildDraftSnapshot(): ReviewDraftV1 {
    const selectedCatalogNovel =
      novelMode === "existing"
        ? novels.find((novel) => novel.id === selectedNovelId)
        : undefined;

    return {
      id: activeDraftId ?? generateDraftId(),
      version: 1,
      savedAt: new Date().toISOString(),
      step,
      novelMode,
      selectedNovelId,
      novelTitle:
        novelMode === "existing"
          ? (selectedCatalogNovel?.title ?? novelTitle)
          : novelTitle,
      novelAuthor:
        novelMode === "existing"
          ? (selectedCatalogNovel?.author ?? novelAuthor ?? "")
          : novelAuthor,
      coverUrl,
      synopsis,
      originalLanguage,
      publicationStatus,
      selectedGenreIds,
      selectedTagIds,
      readingLinks,
      acknowledgeDuplicate,
      rating,
      reviewTitle,
      reviewBody,
      containsSpoilers,
    };
  }

  formSnapshotRef.current = buildDraftSnapshot();

  function scrollToFormPanel() {
    window.requestAnimationFrame(() => {
      formPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function resumeDraftIntoForm(
    draft: ReviewDraftV1,
    options?: { notice?: string; openPublish?: boolean }
  ) {
    const resumeUi = deriveResumeUiState(draft);
    const shouldOpenPublish =
      options?.openPublish ?? resumeUi.openPublishDrawer;

      skipNextAutosaveRef.current = true;
    draftResumeReadyRef.current = true;
    applyDraftToForm(draft, draftSetters);
    setActiveDraftId(draft.id);
          setPendingDraft(null);
    setConfirmDiscard(false);
    setPublishDrawerOpen(shouldOpenPublish);
          setActionNotice(
      options?.notice ??
        "Draft resumed. You can keep editing this one, or use Start new review anytime."
    );

    window.requestAnimationFrame(() => {
      scrollToFormPanel();
      if (draft.step === 2 && isDraftNovelStepComplete(draft)) {
        const focusTarget =
          draft.reviewBody.trim().length > 0
            ? document.getElementById("review-body")
            : document.getElementById("review-title");
        focusTarget?.focus();
      }
    });
  }

  // Detect saved drafts after mount. Auto-resume when requested;
  // otherwise offer the latest draft without blocking a fresh review.
  useLayoutEffect(() => {
    const resumeNotice = autoOpenPublish
      ? "Draft loaded. Review the preview below, then publish when you're ready."
      : "Draft resumed from My Reviews. Continue editing, then preview or publish.";

    function finishWithDraft(resolved: ReviewDraftV1) {
      if (autoResumeDraft && !autoResumedRef.current) {
        autoResumedRef.current = true;
        resumeDraftIntoForm(resolved, {
          notice: resumeNotice,
          openPublish: autoOpenPublish,
        });
          return;
        }

      skipNextAutosaveRef.current = true;
        setPendingDraft(resolved);
        setDraftSavedAt(resolved.savedAt);
    }

    function hydrateDrafts(localDrafts: ReviewDraftV1[]) {
      const targetId = initialDraftId;
      const resolved = targetId
        ? localDrafts.find((draft) => draft.id === targetId) ?? null
        : autoResumeDraft
          ? localDrafts[0] ?? null
          : null;

      setSavedDraftCount(localDrafts.length);

      if (resolved) {
        finishWithDraft(resolved);
        return;
      }

      if (!autoResumeDraft && !initialNovelId && localDrafts[0]) {
        skipNextAutosaveRef.current = true;
        setPendingDraft(localDrafts[0]);
        setDraftSavedAt(localDrafts[0].savedAt);
        setActiveDraftId(generateDraftId());
        return;
      }

      if (!autoResumeDraft && !initialDraftId) {
    skipNextAutosaveRef.current = false;
        setActiveDraftId(generateDraftId());
      }
    }

    // Client navigation to ?resume=1 can reuse this component instance.
    if (autoResumeDraft && !autoResumedRef.current && draftHydratedRef.current) {
      const localDrafts = loadReviewDrafts(userId);
      const resolved = initialDraftId
        ? localDrafts.find((draft) => draft.id === initialDraftId) ?? null
        : localDrafts[0] ?? null;
      if (resolved && isMeaningfulReviewDraft(resolved)) {
        finishWithDraft(resolved);
        return;
      }
    }

    if (draftHydratedRef.current) return;
    draftHydratedRef.current = true;

    let resumedOnHydrate = false;

    const localDrafts = loadReviewDrafts(userId);
    if (localDrafts.length > 0) {
      const targetId = initialDraftId;
      const wouldResume = Boolean(
        targetId
          ? localDrafts.find((draft) => draft.id === targetId)
          : autoResumeDraft
            ? localDrafts[0]
            : null
      );
      if (wouldResume) resumedOnHydrate = true;
      hydrateDrafts(localDrafts);
    } else if (!initialDraftId) {
      setActiveDraftId(generateDraftId());
      draftResumeReadyRef.current = true;
      skipNextAutosaveRef.current = false;
    }

    if (!resumedOnHydrate && !initialDraftId) {
      draftResumeReadyRef.current = true;
      skipNextAutosaveRef.current = false;
    }

    void listServerReviewDraftsAction().then((serverDrafts) => {
      const merged = mergeReviewDrafts(loadReviewDrafts(userId), serverDrafts);
      saveReviewDrafts(userId, merged);
      setSavedDraftCount(merged.length);

      if (merged.length === 0) return;

      const targetId = initialDraftId;
      const resolved = targetId
        ? merged.find((draft) => draft.id === targetId) ?? null
        : autoResumeDraft
          ? merged[0]
          : null;

      if (resolved) {
        if (autoResumeDraft) {
          finishWithDraft(resolved);
          return;
        }

        const snapshot = formSnapshotRef.current;
        if (snapshot && isMeaningfulReviewDraft(snapshot)) {
          return;
        }

        if (!initialNovelId) {
          setPendingDraft(resolved);
          setDraftSavedAt(resolved.savedAt);
        }
        return;
      }

      if (!autoResumeDraft && !initialNovelId && merged[0]) {
        const snapshot = formSnapshotRef.current;
        if (snapshot && isMeaningfulReviewDraft(snapshot)) return;
        setPendingDraft(merged[0]);
        setDraftSavedAt(merged[0].savedAt);
      }

      if (autoResumeDraft && !autoResumedRef.current) {
        draftResumeReadyRef.current = true;
        skipNextAutosaveRef.current = false;
        if (!resolved) {
          setActionNotice(
            "Could not find that saved draft on this device. Try refreshing My Reviews, or start a new review."
          );
          if (!initialDraftId) {
            setActiveDraftId(generateDraftId());
          }
        }
      }
    });
    // draftSetters is stable enough for one-shot hydration
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, autoResumeDraft, autoOpenPublish, initialDraftId, initialNovelId]);

  // Load novel write context for existing selection
  useEffect(() => {
    if (novelMode !== "existing" || !selectedNovelId) {
      return;
    }

    const novelId = selectedNovelId;
    let cancelled = false;

    void getNovelWriteContextAction(novelId).then((context) => {
      if (!cancelled) setNovelContext(context);
    });

    return () => {
      cancelled = true;
    };
  }, [novelMode, selectedNovelId]);

  // Autosave draft only after the user has entered real content.
  useEffect(() => {
    // Wait until the user chooses Resume / Start new for an existing draft.
    if (pendingDraft) return;
    if (!draftResumeReadyRef.current) return;

    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    const draftId = activeDraftId ?? generateDraftId();
    if (!activeDraftId) {
      setActiveDraftId(draftId);
    }

    const draft: ReviewDraftV1 = {
      id: draftId,
      version: 1,
      savedAt: new Date().toISOString(),
      step,
      novelMode,
      selectedNovelId,
      novelTitle,
      novelAuthor,
      coverUrl,
      synopsis,
      originalLanguage,
      publicationStatus,
      selectedGenreIds,
      selectedTagIds,
      readingLinks,
      acknowledgeDuplicate,
      rating,
      reviewTitle,
      reviewBody,
      containsSpoilers,
    };

    if (!isMeaningfulReviewDraft(draft)) {
      if (activeDraftId) {
        deleteReviewDraft(userId, activeDraftId);
      }
      dirtyRef.current = false;
      const frame = window.requestAnimationFrame(() => {
        setDraftSavedAt(null);
        setDraftRestored(false);
        setDraftJustSaved(false);
      });
      return () => window.cancelAnimationFrame(frame);
    }

    dirtyRef.current = true;

    const timer = window.setTimeout(() => {
      const result = persistReviewDraft(userId, draft);
      if (!result.ok) return;
      setDraftSavedAt(result.savedAt);
      setDraftRestored(false);
      void syncReviewDraftAction({ ...draft, savedAt: result.savedAt }).then(
        (server) => setDraftBackedUp(server.success)
      );
    }, 600);

    return () => window.clearTimeout(timer);
  }, [
    userId,
    step,
    novelMode,
    selectedNovelId,
    novelTitle,
    novelAuthor,
    coverUrl,
    synopsis,
    originalLanguage,
    publicationStatus,
    selectedGenreIds,
    selectedTagIds,
    readingLinks,
    acknowledgeDuplicate,
    rating,
    reviewTitle,
    reviewBody,
    containsSpoilers,
    pendingDraft,
    activeDraftId,
  ]);

  // Unsaved changes warning
  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirtyRef.current || isPending) return;
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isPending]);

  function openAttachPanel() {
    setChangingNovel(true);
    setFocusMode(false);
    setPublishDrawerOpen(false);
    setConfirmDiscard(false);
    scrollToFormPanel();
  }

  function startComposing() {
    if (!novelStepComplete) return;
    setChangingNovel(false);
    setConfirmDiscard(false);
    scrollToFormPanel();
  }

  function selectQuickPick(novelId: string) {
    if (!catalogIds.has(novelId)) return;
    setNovelMode("existing");
    setSelectedNovelId(novelId);
    setChangingNovel(false);
    const title =
      novels.find((novel) => novel.id === novelId)?.title ?? "this title";
    setActionNotice(`Reviewing ${title} from your library.`);
    scrollToFormPanel();
  }

  function resetFormToBlank() {
    skipNextAutosaveRef.current = true;
    setConfirmDiscard(false);
    setPendingDraft(null);
    setDraftSavedAt(null);
    setDraftRestored(false);
    setDraftJustSaved(false);
    setDraftBackedUp(false);
    setStep(1);
    setNovelMode(novels.length > 0 ? "existing" : "new");
    setSelectedNovelId(initialNovelId ?? "");
    setChangingNovel(!initialNovelId);
    setNovelTitle("");
    setNovelAuthor("");
    setCoverUrl("");
    setSynopsis("");
    setOriginalLanguage("");
    setPublicationStatus("");
    setSelectedGenreIds([]);
    setSelectedTagIds([]);
    setReadingLinks([""]);
    setAcknowledgeDuplicate(false);
    setRating(0);
    setReviewTitle("");
    setReviewBody("");
    setContainsSpoilers(false);
    setError(null);
    dirtyRef.current = false;
  }

  function handleResumeDraft() {
    if (!pendingDraft) return;
    resumeDraftIntoForm(pendingDraft, {
      openPublish: pendingDraft.step >= 3,
    });
  }

  function handleStartNewReview() {
    const snapshot = buildDraftSnapshot();
    const currentId = activeDraftId ?? snapshot.id;

    if (isMeaningfulReviewDraft(snapshot)) {
      const savedDraft: ReviewDraftV1 = {
        ...snapshot,
        id: currentId,
        savedAt: new Date().toISOString(),
      };
      persistReviewDraft(userId, savedDraft);
      void syncReviewDraftAction(savedDraft);
      setSavedDraftCount((count) => Math.max(count, loadReviewDrafts(userId).length));
    }

    const newId = generateDraftId();
    setActiveDraftId(newId);
    setPendingDraft(null);
    resetFormToBlank();
    setActionNotice(
      "Fresh review started. Your other drafts stay saved in My Reviews."
    );
    scrollToFormPanel();
  }

  async function handleSaveDraft() {
    const draftId = activeDraftId ?? generateDraftId();
    if (!activeDraftId) {
      setActiveDraftId(draftId);
    }

    const draft = pendingDraft
      ? { ...pendingDraft, savedAt: new Date().toISOString() }
      : { ...buildDraftSnapshot(), id: draftId };

    if (!isMeaningfulReviewDraft(draft)) {
      if (draftId) {
        deleteReviewDraft(userId, draftId);
      }
      setDraftSavedAt(null);
      setDraftJustSaved(false);
      setActionNotice(
        "Nothing to save yet. Add a novel, rating, title, or review text first."
      );
      return;
    }

    setIsSavingDraft(true);
    setError(null);
    setConfirmDiscard(false);

    const result = persistReviewDraft(userId, draft);
    if (!result.ok) {
      setIsSavingDraft(false);
      setActionNotice(
        result.reason === "quota"
          ? "Could not save draft: this browser is out of storage. Try removing the cover image or clearing old site data."
          : "Could not save draft in this browser. Check that storage is enabled and try again."
      );
      return;
    }

    const savedDraft: ReviewDraftV1 = { ...draft, id: draftId, savedAt: result.savedAt };
    setActiveDraftId(draftId);
    setDraftSavedAt(result.savedAt);
    setDraftRestored(false);
    setDraftJustSaved(true);
    if (pendingDraft) {
      setPendingDraft(savedDraft);
    }
    setSavedDraftCount(loadReviewDrafts(userId).length);

    const server = await syncReviewDraftAction(savedDraft);
    setIsSavingDraft(false);
    setDraftBackedUp(server.success);

    const coverNote = result.coverOmitted
      ? " Cover image was omitted to fit browser storage; you can re-upload it after resuming."
      : "";

    setActionNotice(
      server.success
        ? `Draft saved in this browser and backed up to your account.${coverNote}`
        : `Draft saved in this browser.${coverNote} Cloud backup did not complete, but your work is safe on this device.`
    );
    window.setTimeout(() => setDraftJustSaved(false), 2500);
  }

  function handleDiscardDraft() {
    if (!confirmDiscard) {
      setConfirmDiscard(true);
      setActionNotice(null);
      return;
    }

    if (activeDraftId) {
      deleteReviewDraft(userId, activeDraftId);
      void deleteServerReviewDraftAction(activeDraftId);
    }

    const newId = generateDraftId();
    setActiveDraftId(newId);
    resetFormToBlank();
    setSavedDraftCount(loadReviewDrafts(userId).length);
    setActionNotice(
      "Draft discarded. Your other saved drafts are still in My Reviews."
    );
    scrollToFormPanel();
  }

  function openPublishDrawer() {
    setConfirmDiscard(false);
    setError(null);

    if (!canPreview) {
      setActionNotice(
        missingLabels.length > 0
          ? `Still needed before publishing: ${missingLabels.join(", ")}.`
          : "Complete your review before publishing."
      );
      if (!novelStepComplete || changingNovel) {
        openAttachPanel();
    }
    } else {
    setActionNotice(
        "Salon preview opened. This is how your review will look before you publish."
      );
    }

    setPublishDrawerOpen(true);
  }

  function getReviewBodyTextarea(): HTMLTextAreaElement | null {
    return (
      (document.getElementById("review-body-focus") as HTMLTextAreaElement | null) ??
      (document.getElementById("review-body") as HTMLTextAreaElement | null)
    );
  }

  function insertAtCursor(text: string) {
    const el = getReviewBodyTextarea();
    const start = el?.selectionStart ?? reviewBody.length;
    const end = el?.selectionEnd ?? reviewBody.length;
    const prefix = reviewBody.length > 0 && start > 0 && !reviewBody.slice(0, start).endsWith("\n\n")
      ? "\n\n"
      : "";
    const next = reviewBody.slice(0, start) + prefix + text + reviewBody.slice(end);
    setReviewBody(next);
    requestAnimationFrame(() => {
      if (!el) return;
      const cursor = start + prefix.length + text.length;
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  function insertQuote() {
    const el = getReviewBodyTextarea();
    const start = el?.selectionStart ?? reviewBody.length;
    const end = el?.selectionEnd ?? reviewBody.length;
    const selected = reviewBody.slice(start, end) || "Your quote here";
    const quoted = selected
      .split("\n")
      .map((line) => (line.startsWith("> ") ? line : `> ${line}`))
      .join("\n");
    const next = reviewBody.slice(0, start) + quoted + reviewBody.slice(end);
    setReviewBody(next);
  }

  function insertSection(text: string) {
    insertAtCursor(text);
  }

  function finishPublishRedirect(reviewId: string) {
    if (activeDraftId) {
      deleteReviewDraft(userId, activeDraftId);
      void deleteServerReviewDraftAction(activeDraftId);
    }
    dirtyRef.current = false;
    setPublishDrawerOpen(false);
    setActionNotice(null);
    router.push(`/reviews/${reviewId}`);
  }

  async function publish() {
    if (isPublishing) return;

    setError(null);
    setActionNotice(null);

    if (!canPublish) {
      if (!novelStepComplete || changingNovel) {
        openAttachPanel();
        setError(`Complete the novel step first: ${missingLabels.join(", ")}.`);
      } else {
        setError(`Complete your review first: ${missingLabels.join(", ")}.`);
      }
      setPublishDrawerOpen(false);
      scrollToFormPanel();
      return;
    }
    if (readingLinkErrors.length > 0) {
      openAttachPanel();
      setError(readingLinkErrors[0]);
      setPublishDrawerOpen(false);
      scrollToFormPanel();
      return;
    }

    setIsPublishing(true);
    try {
      const result = await withActionTimeout(
        createReviewAction({
        novelMode,
        novelId: novelMode === "existing" ? selectedNovelId : undefined,
        novelTitle: novelMode === "new" ? novelTitle : undefined,
        novelAuthor: novelMode === "new" ? novelAuthor : undefined,
        coverUrl: novelMode === "new" ? coverUrl : undefined,
        synopsis: novelMode === "new" ? synopsis : undefined,
        originalLanguage: novelMode === "new" ? originalLanguage : undefined,
        publicationStatus:
          novelMode === "new" ? publicationStatus : undefined,
        readingUrls: cleanedReadingUrls,
        genreIds: novelMode === "new" ? selectedGenreIds : [],
        tagIds: novelMode === "new" ? selectedTagIds : [],
        acknowledgeDuplicate,
        reviewTitle: reviewTitle.trim(),
        reviewBody: reviewBody.trim(),
        rating,
        containsSpoilers,
        }),
        30_000,
        "Publishing timed out. Check your connection and try again."
      );

      if (!result.success) {
        if (result.reviewId) {
          finishPublishRedirect(result.reviewId);
          return;
        }
        setError(result.error);
        return;
      }

      finishPublishRedirect(result.reviewId);
    } catch (publishError) {
      setError(
        publishError instanceof Error
          ? publishError.message
          : "Failed to publish review. Please try again."
      );
    } finally {
      setIsPublishing(false);
    }
  }

  function handleSelectExistingFromDuplicate(novelId: string) {
    setNovelMode("existing");
    setSelectedNovelId(novelId);
    setChangingNovel(false);
    setAcknowledgeDuplicate(false);
  }

  const publishReady = canPublish && readingLinkErrors.length === 0;
  const commandPalette = useWritingStudioCommandPalette(!pendingDraft);

  const saveHint = useMemo(() => {
    if (isSavingDraft) return "Saving…";
    if (draftJustSaved) {
      return draftBackedUp ? "Saved & backed up" : "Saved just now";
    }
    if (draftSavedAt && draftBackedUp) return "Backed up";
    if (draftSavedAt) return "Saved in this browser";
    return null;
  }, [isSavingDraft, draftJustSaved, draftBackedUp, draftSavedAt]);

  const novelLabel = selectedSummary?.title?.trim();
  const mooniePrompt = novelLabel
    ? `Help me polish a review for ${novelLabel}`
    : "Help me write a web novel review";

  const studioCommands: WritingStudioCommand[] = [
    ...REVIEW_SECTION_TEMPLATES.map((section) => ({
      id: `insert-${section.id}`,
      label: `Insert ${section.label.toLowerCase()}`,
      hint: "Adds a section block in the body",
      keywords: [section.label, section.id, "insert", "section"],
      group: "Insert" as const,
      disabled: !showCompose || isPending,
      onSelect: () => insertSection(section.insert),
    })),
    {
      id: "insert-quote",
      label: "Insert quote",
      hint: "Blockquote from selected text",
      keywords: ["quote", "blockquote"],
      group: "Insert",
      disabled: !showCompose || isPending,
      onSelect: insertQuote,
    },
    {
      id: "toggle-spoilers",
      label: containsSpoilers ? "Remove spoiler flag" : "Mark as spoilers",
      group: "Writing",
      disabled: !showCompose || isPending,
      onSelect: () => setContainsSpoilers((value) => !value),
    },
    {
      id: "focus-mode",
      label: "Enter focus mode",
      hint: "Distraction-free writing",
      group: "Studio",
      disabled: !showCompose || focusMode || isPending,
      onSelect: () => setFocusMode(true),
    },
    {
      id: "save-draft",
      label: "Save draft",
      hint: "⌘S",
      group: "Studio",
      disabled: isPending || isSavingDraft,
      onSelect: () => void handleSaveDraft(),
    },
    {
      id: "ask-moonie",
      label: "Ask Moonie for help",
      hint: novelLabel ? `About ${novelLabel}` : "Open Moonie assistant",
      keywords: ["moonie", "ai", "help"],
      group: "Studio",
      onSelect: () =>
        router.push(`/moonie?prompt=${encodeURIComponent(mooniePrompt)}`),
    },
    {
      id: "preview-review",
      label: "Preview review",
      hint: "⌘⇧P",
      group: "Publish",
      disabled: isPending,
      onSelect: openPublishDrawer,
    },
    {
      id: "publish-review",
      label: "Publish review",
      hint: canPreview ? "Ready when you are" : "Complete checklist first",
      group: "Publish",
      disabled: isPending || !publishReady,
      onSelect: publish,
    },
    {
      id: "change-novel",
      label: "Change attached novel",
      group: "Studio",
      disabled: isPending,
      onSelect: openAttachPanel,
    },
  ];

  useWritingStudioShortcuts({
    enabled: !pendingDraft && !focusMode,
    onSaveDraft: handleSaveDraft,
    onPreview: openPublishDrawer,
    onPublish: publish,
    canPreview,
    canPublish: publishReady,
    isPending,
  });

  useEffect(() => {
    const nextStep: WriteStep = showAttachPanel
      ? 1
      : publishDrawerOpen
        ? 3
        : 2;
    setStep((prev) => (prev === nextStep ? prev : nextStep));
  }, [showAttachPanel, publishDrawerOpen]);

  useEffect(() => {
    if (
      showCompose &&
      prevShowComposeRef.current !== showCompose &&
      !focusMode &&
      !pendingDraft
    ) {
      window.requestAnimationFrame(() => {
        document.getElementById("review-title")?.focus();
      });
    }
    prevShowComposeRef.current = showCompose;
  }, [showCompose, focusMode, pendingDraft]);

  return (
    <div
      className={cn(
        "safe-bottom-pad relative bg-[var(--mv-paper)]",
        pendingDraft
          ? "flex min-h-[calc(100dvh-var(--mv-nav-offset))] flex-col"
          : "min-h-[70vh]",
        showCompose && !pendingDraft
          ? "pb-24 lg:pb-8"
          : !pendingDraft
            ? "pb-8"
            : ""
      )}
    >
      <WritingStudioBackdrop className="opacity-60" />

      <WritingStudioBar
        focusMode={focusMode}
        showFocusToggle={showCompose && !pendingDraft && !focusMode}
        onFocusToggle={() => setFocusMode(true)}
        subtitle={selectedSummary?.title ?? null}
        progress={workspaceProgress}
        saveHint={saveHint}
        onShip={pendingDraft ? undefined : openPublishDrawer}
        canShip={canPreview}
        isPending={isPending}
        showMyReviewsLink={!pendingDraft}
      />

      <main
        className={cn(
          SITE_SHELL_CLASS,
          "relative w-full",
          pendingDraft
            ? "flex flex-1 flex-col justify-center py-6 sm:py-8"
            : "py-5 lg:py-6"
        )}
      >
        <div
          className={cn(
            "w-full",
            pendingDraft
              ? "mx-auto max-w-4xl"
              : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8"
          )}
        >
          <div
            ref={formPanelRef}
            id="review-form-panel"
            className={cn(
              "w-full space-y-4 scroll-mt-[calc(var(--mv-nav-offset)+var(--mv-studio-bar-h)+0.75rem)]",
              pendingDraft
                ? "mx-auto"
                : "mx-auto max-w-[960px] lg:mx-0 lg:max-w-none"
            )}
          >
            {pendingDraft ? (
              <WritingStudioDraftBanner
                draft={pendingDraft}
                draftCount={savedDraftCount}
                savedAt={draftSavedAt}
                onResume={handleResumeDraft}
                onStartNew={handleStartNewReview}
              />
            ) : null}

            {error ? (
              <p
                className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            {actionNotice ? (
              <p
                className="rounded-2xl border border-[var(--mv-plum)]/20 bg-[var(--mv-plum)]/[0.06] px-4 py-3 text-sm text-[var(--mv-ink)]"
                role="status"
              >
                {actionNotice}
              </p>
            ) : null}

            {!pendingDraft ? (
              <>
                {showAttachPanel ? (
                  <WritingStudioAttachPanel
                    novelMode={novelMode}
                    onNovelModeChange={(mode) => {
                      setNovelMode(mode);
                      setChangingNovel(true);
                      if (mode === "new") setSelectedNovelId("");
                    }}
                            novels={novels}
                    selectedNovel={selectedNovel}
                    selectedNovelId={selectedNovelId}
                    changingNovel={changingNovel}
                    onSelectNovel={selectQuickPick}
                    onChangeNovel={() => setChangingNovel(true)}
                    onContinue={startComposing}
                    novelStepComplete={novelStepComplete}
                    deskReadingInCatalog={deskReadingInCatalog}
                    finishedInCatalog={finishedInCatalog}
                    catalogIds={catalogIds}
                    readingLinks={readingLinks}
                    onReadingLinksChange={setReadingLinks}
                    activeNovelContext={activeNovelContext}
                    contextLoading={contextLoading}
                    readingLinkErrors={readingLinkErrors}
                    genres={genres}
                    tags={tags}
                    novelTitle={novelTitle}
                    novelAuthor={novelAuthor}
                        coverUrl={coverUrl}
                        synopsis={synopsis}
                        originalLanguage={originalLanguage}
                        publicationStatus={publicationStatus}
                        selectedGenreIds={selectedGenreIds}
                        selectedTagIds={selectedTagIds}
                        duplicates={effectiveDuplicates}
                        acknowledgeDuplicate={acknowledgeDuplicate}
                        onTitleChange={(value) => {
                          setNovelTitle(value);
                          setAcknowledgeDuplicate(false);
                        }}
                        onAuthorChange={(value) => {
                          setNovelAuthor(value);
                          setAcknowledgeDuplicate(false);
                        }}
                        onCoverUrlChange={setCoverUrl}
                        onSynopsisChange={setSynopsis}
                        onLanguageChange={setOriginalLanguage}
                        onStatusChange={setPublicationStatus}
                        onGenreIdsChange={setSelectedGenreIds}
                        onTagIdsChange={setSelectedTagIds}
                        onAcknowledgeDuplicateChange={setAcknowledgeDuplicate}
                    onSelectExistingFromDuplicate={handleSelectExistingFromDuplicate}
                    isPending={isPending}
                  />
                ) : (
                  <WritingStudioAttachPanel
                    collapsed
                    novelMode={novelMode}
                    onNovelModeChange={setNovelMode}
                    novels={novels}
                    selectedNovel={selectedNovel}
                    selectedNovelId={selectedNovelId}
                    changingNovel={changingNovel}
                    onSelectNovel={setSelectedNovelId}
                    onChangeNovel={openAttachPanel}
                    novelStepComplete={novelStepComplete}
                    deskReadingInCatalog={deskReadingInCatalog}
                    finishedInCatalog={finishedInCatalog}
                    catalogIds={catalogIds}
                    readingLinks={readingLinks}
                    onReadingLinksChange={setReadingLinks}
                    activeNovelContext={activeNovelContext}
                    contextLoading={contextLoading}
                    readingLinkErrors={readingLinkErrors}
                    genres={genres}
                    tags={tags}
                    novelTitle={novelTitle}
                    novelAuthor={novelAuthor}
                    coverUrl={coverUrl}
                    synopsis={synopsis}
                    originalLanguage={originalLanguage}
                    publicationStatus={publicationStatus}
                    selectedGenreIds={selectedGenreIds}
                    selectedTagIds={selectedTagIds}
                    duplicates={effectiveDuplicates}
                    acknowledgeDuplicate={acknowledgeDuplicate}
                    onTitleChange={setNovelTitle}
                    onAuthorChange={setNovelAuthor}
                    onCoverUrlChange={setCoverUrl}
                    onSynopsisChange={setSynopsis}
                    onLanguageChange={setOriginalLanguage}
                    onStatusChange={setPublicationStatus}
                    onGenreIdsChange={setSelectedGenreIds}
                    onTagIdsChange={setSelectedTagIds}
                    onAcknowledgeDuplicateChange={setAcknowledgeDuplicate}
                    onSelectExistingFromDuplicate={handleSelectExistingFromDuplicate}
                    isPending={isPending}
                  />
                )}

                {showCompose ? (
                  <section
                    className="rounded-2xl border border-[var(--mv-border)] bg-white shadow-[var(--mv-card-shadow)]"
                    aria-label="Write your review"
                  >
                    <div className="border-b border-[var(--mv-border)] px-5 py-4">
                      <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--mv-plum)]">
                        <PenLine className="size-3.5" aria-hidden />
                        Compose
                      </p>
                      <h2 className="mt-1 font-serif text-xl font-semibold text-[var(--mv-ink)]">
                        Write your review
                      </h2>
                      <p className="mt-1 text-sm text-[var(--mv-text-muted)]">
                        Rate honestly, title your take, then write with clarity.
                      </p>
                    </div>
                    <div className="px-5 py-5">
                      <ReviewComposeFields
                        selectedSummary={selectedSummary}
                  rating={rating}
                        onRatingChange={setRating}
                  containsSpoilers={containsSpoilers}
                        onSpoilersChange={setContainsSpoilers}
                        reviewTitle={reviewTitle}
                        onReviewTitleChange={setReviewTitle}
                        reviewBody={reviewBody}
                        onReviewBodyChange={setReviewBody}
                        titleLength={titleLength}
                        bodyLength={bodyLength}
                        wordCount={wordCount}
                        isPending={isPending}
                        onChangeNovel={openAttachPanel}
                      />
                </div>
              </section>
            ) : null}

                <WritingStudioMobileSheet
                  checklist={checklist}
                  missingLabels={missingLabels}
                  canPublish={publishReady}
                  progress={workspaceProgress}
                  isSavingDraft={isSavingDraft}
                  onSaveDraft={handleSaveDraft}
                  onDiscardDraft={handleDiscardDraft}
                  confirmDiscard={confirmDiscard}
                  onCancelDiscard={() => setConfirmDiscard(false)}
                  hasDiscardableContent={hasDiscardableContent}
                  onStartNewReview={handleStartNewReview}
                />
              </>
            ) : null}
          </div>

          {!pendingDraft ? (
            <div className="hidden lg:block">
              <WritingStudioContextRail
                checklist={checklist}
                missingLabels={missingLabels}
                canPublish={publishReady}
                isPending={isPending}
                isSavingDraft={isSavingDraft}
                confirmDiscard={confirmDiscard}
                hasDiscardableContent={hasDiscardableContent}
                selectedSummary={selectedSummary}
                onSaveDraft={handleSaveDraft}
                onDiscardDraft={handleDiscardDraft}
                onCancelDiscard={() => setConfirmDiscard(false)}
                onStartNewReview={handleStartNewReview}
              />
            </div>
          ) : null}
        </div>
      </main>

      {!pendingDraft && !focusMode ? (
        <WritingStudioMobileActions
          show={showCompose || publishDrawerOpen}
          drawerOpen={publishDrawerOpen}
          canPublish={publishReady}
          isPending={isPending}
          onShip={openPublishDrawer}
          onCloseDrawer={() => setPublishDrawerOpen(false)}
          onPublish={publish}
        />
      ) : null}

      <WritingStudioPublishDrawer
        open={publishDrawerOpen && !pendingDraft}
        onClose={() => setPublishDrawerOpen(false)}
        canPublish={publishReady}
        isPending={isPending}
          onPublish={publish}
          publishError={error}
          preview={{
          novelTitle: selectedSummary?.title || "Untitled novel",
          novelAuthor: selectedSummary?.author ?? null,
          coverUrl: selectedSummary?.coverUrl ?? null,
          userName,
          userUsername,
          userImage,
          rating,
          reviewTitle: reviewTitle.trim(),
          reviewBody: reviewBody.trim(),
          containsSpoilers,
          genreNames: previewGenreNames,
          tagNames: previewTagNames,
          readingSources: cleanedReadingUrls,
          onEditNovel: openAttachPanel,
          onEditReview: () => {
            setPublishDrawerOpen(false);
            scrollToFormPanel();
          },
        }}
      />

      <WritingStudioFocusShell
        open={focusMode && showCompose && !pendingDraft}
        title={selectedSummary?.title ?? "Write your review"}
        novelAuthor={selectedSummary?.author}
        coverUrl={selectedSummary?.coverUrl}
        wordCount={wordCount}
        onClose={() => setFocusMode(false)}
        onChangeNovel={() => {
          setFocusMode(false);
          openAttachPanel();
        }}
        footer={
          <>
            <FocusModeSecondaryButton
              deskSize="sm"
              onClick={() => setFocusMode(false)}
            >
              Done writing
            </FocusModeSecondaryButton>
            <FocusModePrimaryButton
              deskSize="sm"
              onClick={() => {
                setFocusMode(false);
                openPublishDrawer();
              }}
              disabled={!canPreview || isPending}
            >
              Preview review
            </FocusModePrimaryButton>
          </>
        }
      >
        <ReviewComposeFields
          selectedSummary={selectedSummary}
          rating={rating}
          onRatingChange={setRating}
          containsSpoilers={containsSpoilers}
          onSpoilersChange={setContainsSpoilers}
          reviewTitle={reviewTitle}
          onReviewTitleChange={setReviewTitle}
          reviewBody={reviewBody}
          onReviewBodyChange={setReviewBody}
          titleLength={titleLength}
          bodyLength={bodyLength}
          wordCount={wordCount}
          isPending={isPending}
          variant="focus"
          showNovelChip={false}
        />
      </WritingStudioFocusShell>

      <WritingStudioCommandPalette
        open={commandPalette.open}
        onOpenChange={commandPalette.setOpen}
        commands={studioCommands}
      />
    </div>
  );
}
