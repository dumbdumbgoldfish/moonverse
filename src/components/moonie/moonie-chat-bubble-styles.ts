/** Grows beside the avatar; wide attachments sit in a sibling block below the bubble row. */
export const MOONIE_CHAT_MESSAGE_BODY = "flex min-w-0 flex-1 flex-col gap-3";

/** Indents attachment blocks to line up with text beside the Moonie avatar (40px circle + gap). */
export const MOONIE_CHAT_ATTACHMENT_INDENT =
  "ml-12 min-w-0 w-[calc(100%-3rem)] max-w-[calc(100%-3rem)]";

/** Recommendation / lookup cards inside chat attachments. */
export const MOONIE_CHAT_CARD_STACK =
  "grid min-w-0 w-full max-w-sm gap-3";

/** 16px gap between the comparison panel and the novel-card group. */
export const MOONIE_COMPARE_ATTACHMENT_STACK =
  "flex min-w-0 flex-col gap-4";

/** Single attachment panel (reviews, reviewers, series) in chat. */
export const MOONIE_CHAT_ATTACHMENT_CARD = "w-full max-w-sm min-w-0";

/** Content-sized assistant bubble wrapper — never stretches with sibling cards. */
export const MOONIE_ASSISTANT_BUBBLE_SHELL =
  "relative w-fit max-w-[75%] shrink-0 grow-0 basis-auto self-start";

/** Content-sized user bubble. */
export const MOONIE_USER_BUBBLE_SHELL =
  "w-fit max-w-[75%] shrink-0 grow-0 basis-auto self-end select-text";

export const MOONIE_CHAT_BUBBLE_TEXT =
  "whitespace-pre-wrap break-words text-left";

/** @deprecated Use MOONIE_CHAT_MESSAGE_BODY — kept for gradual migration. */
export const MOONIE_CHAT_BUBBLE_COLUMN = MOONIE_CHAT_MESSAGE_BODY;

/** @deprecated Use MOONIE_ASSISTANT_BUBBLE_SHELL. */
export const MOONIE_CHAT_BUBBLE_SHELL = MOONIE_ASSISTANT_BUBBLE_SHELL;
