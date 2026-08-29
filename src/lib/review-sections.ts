export interface ReviewSectionTemplate {
  id: string;
  label: string;
  insert: string;
}

export const REVIEW_SECTION_TEMPLATES: ReviewSectionTemplate[] = [
  {
    id: "what-worked",
    label: "What worked",
    insert: "What worked:\n\n",
  },
  {
    id: "what-dragged",
    label: "What dragged",
    insert: "What dragged:\n\n",
  },
  {
    id: "who-should-read",
    label: "Who should read",
    insert: "Who should read this:\n\n",
  },
  {
    id: "verdict",
    label: "Verdict",
    insert: "Overall:\n\n",
  },
];
