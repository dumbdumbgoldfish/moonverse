export interface ReviewQualitySignal {
  id: string;
  label: string;
  score: number;
  tip?: string;
}

export interface ReviewQualityReport {
  overall: number;
  signals: ReviewQualitySignal[];
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(max, Math.max(min, value));
}

/** Rule-based quality signals for the Writing Studio coach. */
export function analyzeReviewQuality(params: {
  reviewTitle: string;
  reviewBody: string;
  rating: number;
}): ReviewQualityReport {
  const { reviewTitle, reviewBody, rating } = params;
  const body = reviewBody.trim();
  const words = body.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const paragraphs = body.split(/\n{2,}/).filter(Boolean);

  let specificity = 35;
  if (body.includes("> ")) specificity += 12;
  if (/\d/.test(body)) specificity += 5;
  if (paragraphs.length >= 2) specificity += 12;
  if (wordCount >= 80) specificity += 15;
  if (wordCount >= 160) specificity += 10;
  if (/(chapter|arc|pacing|protagonist|worldbuilding|character)/i.test(body)) {
    specificity += 12;
  }
  specificity = clamp(specificity);

  let balance = 52;
  const positive = /(loved|enjoyed|great|strong|compelling|beautiful|recommend|highlight)/i.test(
    body
  );
  const critical = /(however|but|dragged|slow|weak|disappoint|frustrat|issue)/i.test(
    body
  );
  if (positive && critical) balance = 88;
  else if (positive || critical) balance = 68;
  if (rating <= 2 && positive && !critical) balance -= 12;
  if (rating >= 4 && critical && !positive) balance -= 8;
  balance = clamp(balance);

  let structure = 30;
  if (paragraphs.length >= 3) structure += 28;
  else if (paragraphs.length >= 2) structure += 16;
  if (
    /^(what worked|what dragged|overall|verdict|who should)/im.test(body)
  ) {
    structure += 28;
  }
  if (body.includes("> ")) structure += 8;
  structure = clamp(structure);

  let titleFit = 55;
  const title = reviewTitle.trim();
  if (title.length >= 12) titleFit += 22;
  else if (title.length >= 6) titleFit += 10;
  if (wordCount > 0 && title.length > 0) titleFit += 12;
  titleFit = clamp(titleFit);

  const signals: ReviewQualitySignal[] = [
    {
      id: "specificity",
      label: "Specificity",
      score: specificity,
      tip:
        specificity < 65
          ? "Name a scene, character, or moment that stuck with you."
          : undefined,
    },
    {
      id: "balance",
      label: "Balance",
      score: balance,
      tip:
        balance < 65
          ? "Pair praise with one honest caveat, or vice versa."
          : undefined,
    },
    {
      id: "structure",
      label: "Structure",
      score: structure,
      tip:
        structure < 65
          ? 'Add section headings like "What worked" or "What dragged."'
          : undefined,
    },
    {
      id: "title",
      label: "Headline",
      score: titleFit,
      tip:
        titleFit < 72
          ? "Sharpen your headline so it matches your verdict."
          : undefined,
    },
  ];

  const overall = Math.round(
    signals.reduce((sum, signal) => sum + signal.score, 0) / signals.length
  );

  return { overall, signals };
}
