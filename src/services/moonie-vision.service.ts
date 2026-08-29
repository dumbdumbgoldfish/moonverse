import { z } from "zod";
import {
  MOONIE_ALLOWED_IMAGE_MIME,
  normalizeImageMimeType,
  validateImageBase64,
} from "@/lib/moonie/image-attachment";
import { isAcceptedCompareCatalogueMatch } from "@/lib/moonie/compare-acceptance";
import {
  createOpenAiChatCompletion,
  hasOpenAiApiKey,
} from "@/lib/moonie/openai";
import {
  buildNovelBundle,
} from "@/services/moonie-novel-lookup.service";
import {
  scoreCatalogueCandidates,
} from "@/services/moonie-identification.service";
import type {
  MoonieNovelOverview,
  MoonieRecommendation,
  MoonieSpoilerMode,
} from "@/types/moonie";

const visionCandidateSchema = z.object({
  title: z.string().min(1).max(200),
  author: z.string().max(120).nullable().optional(),
  confidence: z.enum(["high", "medium", "low"]),
});

const visionResponseSchema = z.object({
  titles: z.array(visionCandidateSchema).max(8).default([]),
  notes: z.string().max(500).optional(),
});

export type MoonieVisionCandidate = z.infer<typeof visionCandidateSchema>;

export type MoonieVisionError =
  | "no_api"
  | "insufficient_quota"
  | "unavailable"
  | "unsupported_image"
  | "parse_failed"
  | "empty";

export interface MoonieVisionExtraction {
  candidates: MoonieVisionCandidate[];
  notes?: string;
  error?: MoonieVisionError;
}

export function classifyOpenAiVisionHttpError(
  status: number,
  body: string
): MoonieVisionError {
  if (status === 429) {
    try {
      const parsed = JSON.parse(body) as {
        error?: { code?: string; type?: string };
      };
      const code = parsed.error?.code ?? parsed.error?.type ?? "";
      if (code === "insufficient_quota") {
        return "insufficient_quota";
      }
    } catch {
      // fall through
    }
    return "unavailable";
  }

  if (status === 401 || status === 403) {
    return "no_api";
  }

  return "parse_failed";
}

export function visionExtractionUserMessage(
  error: MoonieVisionError | undefined,
  options?: { validationReason?: string }
): string {
  switch (error) {
    case "no_api":
      return "Image understanding is not configured on this server yet. Type the title from your screenshot and I will verify it in the MoonVerse catalogue.";
    case "insufficient_quota":
      return "Moonie's image understanding is temporarily unavailable because the AI service quota has been reached. You can still type the novel title and I'll search the catalogue.";
    case "unavailable":
      return "Moonie's image understanding is temporarily unavailable right now. You can still type the novel title and I'll search the catalogue.";
    case "unsupported_image":
      return (
        options?.validationReason ??
        "Unsupported image type. Use JPEG, PNG, WebP, or GIF."
      );
    case "parse_failed":
      return "I had trouble reading that image. Try a clearer crop, type the title, or send a higher-resolution screenshot.";
    case "empty":
      return "I could not identify a novel title confidently from that image. Try a clearer crop, type the title, or send a higher-resolution screenshot.";
    default:
      return "I could not identify a novel title confidently from that image. Try a clearer crop, type the title, or send a higher-resolution screenshot.";
  }
}

export interface MoonieVerifiedImageMatch {
  extractedTitle: string;
  extractedAuthor?: string | null;
  extractionConfidence: "high" | "medium" | "low";
  verified: boolean;
  recommendation: MoonieRecommendation | null;
  overview: MoonieNovelOverview | null;
}

export function validateImageAttachment(options: {
  base64: string;
  mimeType?: string;
}): { ok: true; mimeType: string } | { ok: false; reason: string } {
  return validateImageBase64(options);
}

export async function extractNovelCandidatesFromImage(options: {
  base64: string;
  mimeType: string;
  userMessage?: string;
}): Promise<MoonieVisionExtraction> {
  if (!hasOpenAiApiKey()) {
    return { candidates: [], error: "no_api" };
  }

  const validation = validateImageAttachment(options);
  if (!validation.ok) {
    return { candidates: [], error: "unsupported_image" };
  }

  let payload = options.base64.trim();
  const mimeType = validation.mimeType;
  if (!payload.startsWith("data:")) {
    payload = `data:${mimeType};base64,${payload}`;
  }

  const prompt = [
    "You extract web-novel or book titles from screenshots.",
    "The image may show: a book cover, a title card, a recommendation post, or a list of novel names.",
    "Return JSON: { titles: [{ title, author|null, confidence: high|medium|low }], notes?: string }.",
    "Rules:",
    "- Only include titles you can actually read in the image.",
    "- Do not invent or guess missing words.",
    "- If text is partial, use confidence low and say so in notes.",
    "- author is null unless clearly visible.",
    "- Maximum 8 titles.",
    options.userMessage
      ? `User request for context: ${options.userMessage}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const result = await createOpenAiChatCompletion({
      modelKind: "vision",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: payload, detail: "high" } },
          ],
        },
      ],
    });

    if (!result.ok) {
      return {
        candidates: [],
        error: classifyOpenAiVisionHttpError(result.status, result.body),
      };
    }

    const content = result.content;

    const parsed = visionResponseSchema.safeParse(JSON.parse(content));
    if (!parsed.success || parsed.data.titles.length === 0) {
      return { candidates: [], error: "empty" };
    }

    return {
      candidates: parsed.data.titles,
      notes: parsed.data.notes,
    };
  } catch {
    return { candidates: [], error: "parse_failed" };
  }
}

export async function verifyVisionCandidates(options: {
  candidates: MoonieVisionCandidate[];
  userId?: string;
  spoilerMode?: MoonieSpoilerMode;
}): Promise<MoonieVerifiedImageMatch[]> {
  const results: MoonieVerifiedImageMatch[] = [];

  for (const candidate of options.candidates.slice(0, 8)) {
    const scored = await scoreCatalogueCandidates({
      query: candidate.title,
      userId: options.userId,
      queryAuthor: candidate.author ?? null,
      visionConfidence: candidate.confidence,
      spoilerMode: options.spoilerMode,
      limit: 3,
    });

    const top = scored[0];
    if (!top || !isAcceptedCompareCatalogueMatch(top)) {
      results.push({
        extractedTitle: candidate.title,
        extractedAuthor: candidate.author ?? null,
        extractionConfidence: candidate.confidence,
        verified: false,
        recommendation: null,
        overview: null,
      });
      continue;
    }

    const bundle = await buildNovelBundle({
      novelId: top.novelId,
      userId: options.userId,
      reason: `Verified MoonVerse match for "${top.title}" from your screenshot.`,
      spoilerMode: options.spoilerMode,
      lookupCandidate: top,
    });

    results.push({
      extractedTitle: candidate.title,
      extractedAuthor: candidate.author ?? null,
      extractionConfidence: candidate.confidence,
      verified: Boolean(bundle.recommendation),
      recommendation: bundle.recommendation,
      overview: bundle.overview,
    });
  }

  return results;
}
