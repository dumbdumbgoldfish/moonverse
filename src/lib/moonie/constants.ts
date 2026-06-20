export const MOONIE_QUICK_PROMPTS = [
  "Strong female lead",
  "Revenge fantasy",
  "Slow-burn romance",
  "Completed novel",
  "Action with clever MC",
] as const;

export const MOONIE_OPEN_STORAGE_KEY = "moonie:open";

export function createMessageId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
