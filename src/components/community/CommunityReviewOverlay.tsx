"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CommunityReviewModalLoader } from "@/components/community/CommunityReviewModalLoader";
import { prefetchCommunityReview } from "@/lib/community-review-prefetch";

type OverlayState = {
  reviewId: string;
  focusComments: boolean;
} | null;

type CommunityReviewOverlayValue = {
  openReview: (reviewId: string, options?: { focusComments?: boolean }) => void;
  closeReview: () => void;
  prefetchReview: (reviewId: string) => void;
};

const CommunityReviewOverlayContext =
  createContext<CommunityReviewOverlayValue | null>(null);

const HISTORY_KEY = "mvCommunityReview";

function historyRecord(state: unknown): Record<string, unknown> {
  return state && typeof state === "object"
    ? { ...(state as Record<string, unknown>) }
    : {};
}

export function useCommunityReviewOverlayOptional() {
  return useContext(CommunityReviewOverlayContext);
}

export function useCommunityReviewOverlay() {
  const value = useCommunityReviewOverlayOptional();
  if (!value) {
    throw new Error(
      "useCommunityReviewOverlay must be used within CommunityReviewOverlay"
    );
  }
  return value;
}

export function CommunityReviewOverlay({
  communityPath,
  children,
}: {
  communityPath: string;
  children: ReactNode;
}) {
  const [overlay, setOverlay] = useState<OverlayState>(null);
  const communityUrlRef = useRef(communityPath);

  const openReview = useCallback(
    (reviewId: string, options?: { focusComments?: boolean }) => {
      const focusComments = Boolean(options?.focusComments);
      setOverlay({ reviewId, focusComments });
      const url = focusComments
        ? `/reviews/${reviewId}#comments`
        : `/reviews/${reviewId}`;
      const current = historyRecord(window.history.state);
      const alreadyOpen = Boolean(current[HISTORY_KEY]);
      if (!alreadyOpen) {
        communityUrlRef.current = `${window.location.pathname}${window.location.search}`;
      }
      const payload = { ...current, [HISTORY_KEY]: reviewId, focusComments };
      if (alreadyOpen) {
        window.history.replaceState(payload, "", url);
      } else {
        window.history.pushState(payload, "", url);
      }
    },
    []
  );

  const prefetchReview = useCallback((reviewId: string) => {
    prefetchCommunityReview(reviewId);
  }, []);

  const closeReview = useCallback(() => {
    if (historyRecord(window.history.state)[HISTORY_KEY]) {
      window.history.back();
      return;
    }
    setOverlay(null);
    if (window.location.pathname.startsWith("/reviews/")) {
      window.history.replaceState(
        { ...historyRecord(window.history.state), [HISTORY_KEY]: undefined },
        "",
        communityUrlRef.current
      );
    }
  }, []);

  useEffect(() => {
    const onPopState = () => {
      const id = historyRecord(window.history.state)[HISTORY_KEY];
      if (typeof id === "string" && id) {
        setOverlay({
          reviewId: id,
          focusComments: Boolean(
            historyRecord(window.history.state).focusComments
          ),
        });
        return;
      }
      setOverlay(null);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  return (
    <CommunityReviewOverlayContext.Provider
      value={{ openReview, closeReview, prefetchReview }}
    >
      {children}
      {overlay ? (
        <CommunityReviewModalLoader
          key={`${overlay.reviewId}:${overlay.focusComments ? "comments" : "top"}`}
          reviewId={overlay.reviewId}
          focusComments={overlay.focusComments}
          onClose={closeReview}
        />
      ) : null}
    </CommunityReviewOverlayContext.Provider>
  );
}
