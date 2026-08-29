import { z } from "zod";
import {
  createOpenAiChatCompletion,
  hasOpenAiApiKey,
} from "@/lib/moonie/openai";
import type { MoonieInterpretedPreferences } from "@/types/moonie";

export const interpretedPreferencesSchema = z.object({
  genres: z.array(z.string().min(1).max(40)).max(8).default([]),
  tags: z.array(z.string().min(1).max(40)).max(12).default([]),
  excludedTags: z.array(z.string().min(1).max(40)).max(12).default([]),
  status: z.enum(["completed", "ongoing"]).nullable().default(null),
  mood: z.array(z.string().min(1).max(40)).max(8).default([]),
  language: z.string().min(1).max(12).nullable().default(null),
  length: z.enum(["short", "medium", "long"]).nullable().default(null),
});

export type StructuredPreferences = z.infer<typeof interpretedPreferencesSchema>;

export function toInterpretedPreferences(
  value: StructuredPreferences,
  influencedBy: string[] = []
): MoonieInterpretedPreferences {
  return {
    genres: value.genres,
    tags: value.tags,
    excludedTags: value.excludedTags,
    status: value.status,
    mood: value.mood,
    language: value.language,
    length: value.length,
    influencedBy,
  };
}

export function mergeStructuredPreferences(
  base: MoonieInterpretedPreferences,
  extra: StructuredPreferences
): MoonieInterpretedPreferences {
  const unique = (values: string[]) =>
    [...new Set(values.map((v) => v.trim()).filter(Boolean))];
  return {
    genres: unique([...base.genres, ...extra.genres]),
    tags: unique([...base.tags, ...extra.tags]),
    excludedTags: unique([...base.excludedTags, ...extra.excludedTags]),
    status: extra.status ?? base.status,
    mood: unique([...base.mood, ...extra.mood]),
    language: extra.language ?? base.language,
    length: extra.length ?? base.length,
    influencedBy: base.influencedBy ?? [],
  };
}

const explanationItemSchema = z.object({
  novelId: z.string().min(1).max(64),
  reason: z.string().max(400).optional(),
  drawback: z.string().max(280).nullable().optional(),
  confidence: z.enum(["high", "medium", "low"]).optional(),
});

export const explanationResponseSchema = z.object({
  summary: z.string().max(500).optional(),
  followUpQuestion: z.string().max(240).nullable().optional(),
  recommendations: z.array(explanationItemSchema).max(8).default([]),
});

/** Extra explanation IDs are never added to the candidate list. */
export function explanationIdsOutsideAllowlist(
  explanations: Array<{ novelId: string }>,
  allowedIds: ReadonlySet<string>
): string[] {
  return explanations
    .filter((row) => !allowedIds.has(row.novelId))
    .map((row) => row.novelId);
}

/**
 * Explanations may only polish existing cards. Order and membership stay
 * exactly the candidate list.
 */
export function constrainExplanationsToCandidateOrder<
  T extends { novelId: string },
>(candidates: T[], explanations: Array<{ novelId: string }>): T[] {
  void explanationIdsOutsideAllowlist(
    explanations,
    new Set(candidates.map((row) => row.novelId))
  );
  return candidates;
}

export async function extractPreferencesWithOpenAI(
  message: string
): Promise<StructuredPreferences | null> {
  if (!hasOpenAiApiKey()) return null;
  try {
    const result = await createOpenAiChatCompletion({
      modelKind: "text",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Extract web-novel reading preferences. Return JSON with genres, tags, excludedTags, status (completed|ongoing|null), mood, language (en|zh|ko|ja|null), length (short|medium|long|null). Use only values clearly stated. Do not invent titles.",
        },
        { role: "user", content: message },
      ],
    });
    if (!result.ok) return null;
    const content = result.content;
    const parsed = interpretedPreferencesSchema.safeParse(JSON.parse(content));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
