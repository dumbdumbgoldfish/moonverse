export interface CommunitySalonPrompt {
  id: string;
  title: string;
  question: string;
  lane: string;
  writeHint: string;
}

const PROMPTS: CommunitySalonPrompt[] = [
  {
    id: "tournament",
    title: "This week in the salon",
    question: "Which tournament or exam arc actually earned its tension?",
    lane: "magic-academy",
    writeHint: "Write about the pressure cooker, not the prize.",
  },
  {
    id: "slow-burn",
    title: "This week in the salon",
    question: "Where did a slow-burn finally pay off for you?",
    lane: "slow-burn",
    writeHint: "Name the chapter where the wait became worth it.",
  },
  {
    id: "found-family",
    title: "This week in the salon",
    question: "Which found-family story felt like a real circle, not a slogan?",
    lane: "found-family",
    writeHint: "Who stayed, and why did that matter?",
  },
  {
    id: "dark",
    title: "This week in the salon",
    question: "Which dark story stayed with you after you closed the tab?",
    lane: "cosmic-horror",
    writeHint: "Stay spoiler-safe unless you mark it.",
  },
  {
    id: "cozy",
    title: "This week in the salon",
    question: "What cozy or slice-of-life read reset your week?",
    lane: "slice-of-life",
    writeHint: "Small scenes count as much as plot twists.",
  },
  {
    id: "villainess",
    title: "This week in the salon",
    question: "Which villainess or anti-hero rewrite actually changed the rules?",
    lane: "villainess",
    writeHint: "Focus on the turn, not the tropes list.",
  },
];

/** ISO week number, Monday-based, for a stable weekly rotation. */
export function isoWeekNumber(date = new Date()): number {
  const utc = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  return Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getWeeklySalonPrompt(date = new Date()): CommunitySalonPrompt {
  return PROMPTS[isoWeekNumber(date) % PROMPTS.length];
}
