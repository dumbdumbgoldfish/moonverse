"use client";

import { ReviewSpoilerGate } from "@/components/reviews/detail/ReviewSpoilerGate";
import { ReviewStructuredBody } from "@/components/reviews/detail/ReviewStructuredBody";

interface ReviewDetailBodyPanelProps {
  body: string;
  containsSpoilers: boolean;
  isLoggedIn: boolean;
  onReadFull?: () => void;
}

export function ReviewDetailBodyPanel({
  body,
  containsSpoilers,
  isLoggedIn,
  onReadFull,
}: ReviewDetailBodyPanelProps) {
  return (
    <ReviewSpoilerGate containsSpoilers={containsSpoilers}>
      <ReviewStructuredBody
        body={body}
        isLoggedIn={isLoggedIn}
        onReadFull={onReadFull}
      />
    </ReviewSpoilerGate>
  );
}
