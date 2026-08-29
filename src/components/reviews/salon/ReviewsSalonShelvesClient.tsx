"use client";

import { useEffect, useState } from "react";
import { ReviewsSalonShelvesSkeleton, ReviewsSalonShelvesView } from "./ReviewsSalonShelvesView";
import type { ReviewsSalonShelfData } from "./reviews-salon-shelf-data";

export function ReviewsSalonShelvesClient() {
  const [data, setData] = useState<ReviewsSalonShelfData | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/reviews/shelves")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: ReviewsSalonShelfData | null) => {
        if (!cancelled && payload) setData(payload);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!data) return <ReviewsSalonShelvesSkeleton />;
  return <ReviewsSalonShelvesView data={data} />;
}
