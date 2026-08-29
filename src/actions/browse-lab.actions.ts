"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { parseGenreBrowseSort, type GenreBrowseSort } from "@/lib/browse-sort";
import { parseBrowseMode, type BrowseMode } from "@/types/browse";
import {
  deleteBrowseLabRecipe,
  listBrowseLabRecipes,
  saveBrowseLabRecipe,
  syncBrowseLabRecipesFromLocal,
  type BrowseLabRecipeRecord,
} from "@/services/browse-lab.service";

export type BrowseLabActionResult =
  | { success: true; recipes: BrowseLabRecipeRecord[] }
  | { success: false; error: string };

function revalidateBrowsePaths(genreSlug?: string) {
  revalidatePath("/browse");
  if (genreSlug) revalidatePath(`/browse/${genreSlug}`);
}

export async function listBrowseLabRecipesAction(): Promise<BrowseLabActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." };
  }
  const recipes = await listBrowseLabRecipes(session.user.id);
  return { success: true, recipes };
}

export async function saveBrowseLabRecipeAction(input: {
  id?: string;
  name: string;
  genreSlug: string;
  genreLabel: string;
  mode: BrowseMode;
  tags: string[];
  sort: GenreBrowseSort;
  officialOnly: boolean;
}): Promise<BrowseLabActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const recipes = await saveBrowseLabRecipe(session.user.id, {
      ...input,
      mode: parseBrowseMode(input.mode),
      sort: parseGenreBrowseSort(input.sort),
      tags: input.tags.slice(0, 5),
    });
    revalidateBrowsePaths(input.genreSlug);
    return { success: true, recipes };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to save this lab recipe." };
  }
}

export async function deleteBrowseLabRecipeAction(
  id: string
): Promise<BrowseLabActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const recipes = await deleteBrowseLabRecipe(session.user.id, id);
    revalidatePath("/browse");
    return { success: true, recipes };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to delete this lab recipe." };
  }
}

export async function syncBrowseLabRecipesAction(
  locals: Array<{
    name: string;
    genreSlug: string;
    genreLabel: string;
    mode: BrowseMode;
    tags: string[];
    sort: GenreBrowseSort;
    officialOnly: boolean;
  }>
): Promise<BrowseLabActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "You must be logged in." };
  }

  try {
    const recipes = await syncBrowseLabRecipesFromLocal(
      session.user.id,
      locals.slice(0, 12).map((row) => ({
        ...row,
        mode: parseBrowseMode(row.mode),
        sort: parseGenreBrowseSort(row.sort),
        tags: row.tags.slice(0, 5),
      }))
    );
    revalidatePath("/browse");
    return { success: true, recipes };
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Unable to sync lab recipes." };
  }
}
