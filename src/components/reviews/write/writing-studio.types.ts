import type { WriteStep } from "@/components/reviews/write/ReviewStepIndicator";

export interface ChecklistItem {
  id: string;
  label: string;
  complete: boolean;
}

export type WritingStudioRailTab = "status" | "salon";

export const WRITE_STEP_LABELS: Record<WriteStep, string> = {
  1: "Novel",
  2: "Review",
  3: "Preview",
};

export const WRITE_STEP_DESCRIPTIONS: Record<WriteStep, string> = {
  1: "Choose or add the title you are reviewing",
  2: "Rate honestly and write your take",
  3: "Check the salon preview, then publish",
};

export const WRITE_STEP_NEXT: Record<WriteStep, string | null> = {
  1: "Next: write your review",
  2: "Next: preview before publishing",
  3: null,
};
