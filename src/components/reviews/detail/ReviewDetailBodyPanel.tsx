"use client";

import { ReviewSpoilerGate } from "@/components/reviews/detail/ReviewSpoilerGate";
import { ReviewStructuredBody } from "@/components/reviews/detail/ReviewStructuredBody";

interface ReviewDetailBodyPanelProps {
  body: string;
  containsSpoilers: boolean;
  isLoggedIn: boolean;
}

export function ReviewDetailBodyPanel({
  body,
  containsSpoilers,
  isLoggedIn,
}: ReviewDetailBodyPanelProps) {
  return (
    <ReviewSpoilerGate containsSpoilers={containsSpoilers}>
      <ReviewStructuredBody body={body} isLoggedIn={isLoggedIn} forceExpanded />
    </ReviewSpoilerGate>
  );
}
