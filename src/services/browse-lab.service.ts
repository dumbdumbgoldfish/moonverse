import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import type { GenreBrowseSort } from "@/lib/browse-sort";
import type { BrowseMode } from "@/types/browse";

export interface BrowseLabRecipeRecord {
  id: string;
  name: string;
  genreSlug: string;
  genreLabel: string;
  mode: BrowseMode;
  tags: string[];
  sort: GenreBrowseSort;
  officialOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

const MAX_RECIPES = 12;

function storageKey(userId: string) {
  return `browse-lab:${userId}`;
}

function isRecipe(value: unknown): value is BrowseLabRecipeRecord {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.name === "string" &&
    typeof row.genreSlug === "string" &&
    typeof row.genreLabel === "string" &&
    (row.mode === "works" || row.mode === "reviews") &&
    Array.isArray(row.tags)
  );
}

async function readRecipes(userId: string): Promise<BrowseLabRecipeRecord[]> {
  const row = await db.systemSetting.findUnique({
    where: { key: storageKey(userId) },
  });
  if (!row || !Array.isArray(row.value)) return [];
  return (row.value as unknown[]).filter(isRecipe).slice(0, MAX_RECIPES);
}

async function writeRecipes(
  userId: string,
  recipes: BrowseLabRecipeRecord[]
): Promise<BrowseLabRecipeRecord[]> {
  const next = recipes.slice(0, MAX_RECIPES);
  const value = next as unknown as Prisma.InputJsonValue;
  await db.systemSetting.upsert({
    where: { key: storageKey(userId) },
    create: { key: storageKey(userId), value },
    update: { value },
  });
  return next;
}

export async function listBrowseLabRecipes(
  userId: string
): Promise<BrowseLabRecipeRecord[]> {
  return readRecipes(userId);
}

export async function saveBrowseLabRecipe(
  userId: string,
  input: {
    id?: string;
    name: string;
    genreSlug: string;
    genreLabel: string;
    mode: BrowseMode;
    tags: string[];
    sort: GenreBrowseSort;
    officialOnly: boolean;
  }
): Promise<BrowseLabRecipeRecord[]> {
  const now = new Date().toISOString();
  const existing = await readRecipes(userId);
  const id = input.id?.trim() || `lab_${Date.now().toString(36)}`;
  const recipe: BrowseLabRecipeRecord = {
    id,
    name: input.name.trim().slice(0, 80) || "Untitled lab",
    genreSlug: input.genreSlug,
    genreLabel: input.genreLabel,
    mode: input.mode,
    tags: input.tags.slice(0, 5),
    sort: input.sort,
    officialOnly: Boolean(input.officialOnly),
    createdAt: existing.find((row) => row.id === id)?.createdAt ?? now,
    updatedAt: now,
  };
  const next = [recipe, ...existing.filter((row) => row.id !== id)];
  return writeRecipes(userId, next);
}

export async function deleteBrowseLabRecipe(
  userId: string,
  id: string
): Promise<BrowseLabRecipeRecord[]> {
  const existing = await readRecipes(userId);
  return writeRecipes(
    userId,
    existing.filter((row) => row.id !== id)
  );
}

export async function syncBrowseLabRecipesFromLocal(
  userId: string,
  locals: Array<{
    name: string;
    genreSlug: string;
    genreLabel: string;
    mode: BrowseMode;
    tags: string[];
    sort: GenreBrowseSort;
    officialOnly: boolean;
  }>
): Promise<BrowseLabRecipeRecord[]> {
  const existing = await readRecipes(userId);
  const now = new Date().toISOString();
  const incoming = locals.map((row, index) => {
    const match = existing.find(
      (item) =>
        item.genreSlug === row.genreSlug &&
        item.name.trim().toLowerCase() === row.name.trim().toLowerCase()
    );
    return {
      id: match?.id ?? `lab_sync_${Date.now().toString(36)}_${index}`,
      name: row.name.trim().slice(0, 80) || "Untitled lab",
      genreSlug: row.genreSlug,
      genreLabel: row.genreLabel,
      mode: row.mode,
      tags: row.tags.slice(0, 5),
      sort: row.sort,
      officialOnly: Boolean(row.officialOnly),
      createdAt: match?.createdAt ?? now,
      updatedAt: now,
    } satisfies BrowseLabRecipeRecord;
  });

  const merged = [...incoming];
  for (const row of existing) {
    if (!merged.some((item) => item.id === row.id)) merged.push(row);
  }
  return writeRecipes(userId, merged);
}
