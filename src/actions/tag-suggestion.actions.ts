"use server";

import { auth } from "@/lib/auth";
import {
  createTagSuggestion,
  evaluateTagSuggestionInput,
  getUserPendingTagSuggestions,
} from "@/services/tag-suggestion.service";
import type { TagSuggestionBlockCode } from "@/lib/tag-similarity";
import type { TagSimilarityResult } from "@/lib/tag-similarity";

export type SuggestTagResult =
  | {
      success: true;
      suggestion: { id: string; name: string; createdAt: Date };
    }
  | {
      success: false;
      error: string;
      code: TagSuggestionBlockCode;
      existingTag?: { id: string; name: string };
      similarity?: TagSimilarityResult;
    };

export type EvaluateTagSuggestionResult =
  | {
      success: true;
      canSuggest: true;
      normalizedName: string;
      similarity: TagSimilarityResult;
    }
  | {
      success: true;
      canSuggest: false;
      code: TagSuggestionBlockCode;
      error: string;
      existingTag?: { id: string; name: string };
      similarity?: TagSimilarityResult;
    }
  | { success: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("You must be signed in to suggest a tag.");
  }
  return session.user.id;
}

export async function evaluateTagSuggestionAction(
  rawName: string
): Promise<EvaluateTagSuggestionResult> {
  try {
    const evaluation = await evaluateTagSuggestionInput(rawName);

    if (!evaluation.ok) {
      return {
        success: true,
        canSuggest: false,
        code: evaluation.code,
        error: evaluation.error,
        existingTag:
          "existingTag" in evaluation ? evaluation.existingTag : undefined,
        similarity:
          "similarity" in evaluation ? evaluation.similarity : undefined,
      };
    }

    return {
      success: true,
      canSuggest: true,
      normalizedName: evaluation.normalizedName,
      similarity: evaluation.similarity,
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Could not evaluate tag.",
    };
  }
}

export async function suggestTagAction(input: {
  name: string;
  novelId?: string | null;
  reason?: string | null;
}): Promise<SuggestTagResult> {
  try {
    const userId = await requireUserId();
    const result = await createTagSuggestion({
      userId,
      rawName: input.name,
      novelId: input.novelId,
      reason: input.reason,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        code: result.code,
        existingTag: result.existingTag,
        similarity: result.similarity,
      };
    }

    return {
      success: true,
      suggestion: result.suggestion,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Could not suggest tag.",
      code: "INVALID",
    };
  }
}

export async function getMyPendingTagSuggestionsAction() {
  try {
    const userId = await requireUserId();
    const suggestions = await getUserPendingTagSuggestions(userId);
    return { success: true as const, suggestions };
  } catch (error) {
    return {
      success: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Could not load pending suggestions.",
    };
  }
}
