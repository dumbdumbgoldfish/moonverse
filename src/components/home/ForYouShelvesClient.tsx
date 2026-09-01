"use client";

import { useEffect, useState } from "react";
import { ForYouFeed } from "@/components/home/ForYouFeed";
import { ForYouShelvesUnavailable } from "@/components/home/ForYouShelvesUnavailable";
import { ReviewsSalonShelvesSkeleton } from "@/components/reviews/salon/ReviewsSalonShelvesView";
import {
  fetchHomeForYouShelves,
  resolveForYouShelvesLoadState,
  type ForYouShelvesLoadState,
} from "@/lib/home-for-you-shelves-fetch";
import type { ForYouShelfData } from "@/services/home-shelves.service";

export function ForYouShelvesClient() {
  const [shelves, setShelves] = useState<ForYouShelfData[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void fetchHomeForYouShelves()
      .then((data) => {
        if (cancelled) return;
        setShelves(data);
        setError(false);
      })
      .catch(() => {
        if (cancelled) return;
        setShelves(null);
        setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const state: ForYouShelvesLoadState = resolveForYouShelvesLoadState({
    loading,
    error,
    shelves,
  });

  if (state === "loading") {
    return <ReviewsSalonShelvesSkeleton />;
  }

  if (state === "error") {
    return (
      <ForYouShelvesUnavailable
        onRetry={() => {
          setLoading(true);
          setError(false);
          setAttempt((current) => current + 1);
        }}
        retrying={loading}
      />
    );
  }

  return <ForYouFeed shelves={shelves ?? []} />;
}
