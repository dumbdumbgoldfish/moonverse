import { db } from "@/lib/db";
import { TagKind } from "@prisma/client";

export interface PreferredGenreOption {
  id: string;
  name: string;
  slug: string;
}

export interface SelectableTagOption {
  id: string;
  name: string;
  slug: string;
  kind: TagKind;
}

export interface TasteOnboardingInput {
  genreIds: string[];
  favouriteTags: string[];
  favouriteMoods: string[];
  avoidedTags: string[];
  preferredStatus: string | null;
  preferredLanguage: string | null;
  preferredLength: string | null;
  preferredPlatforms: string[];
  completeOnboarding?: boolean;
}

export interface TasteOnboardingState {
  genreIds: string[];
  favouriteTags: string[];
  favouriteMoods: string[];
  avoidedTags: string[];
  preferredStatus: string | null;
  preferredLanguage: string | null;
  preferredLength: string | null;
  preferredPlatforms: string[];
}

export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { onboardingCompletedAt: true },
  });
  return Boolean(user?.onboardingCompletedAt);
}

export async function getPreferredGenres(
  userId: string
): Promise<PreferredGenreOption[]> {
  const rows = await db.userPreferredGenre.findMany({
    where: { userId },
    include: { genre: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "asc" },
  });
  return rows.map((row) => row.genre);
}

export async function getPreferredGenreSlugs(
  userId: string
): Promise<string[]> {
  const genres = await getPreferredGenres(userId);
  return genres.map((genre) => genre.slug);
}

export async function savePreferredGenres(
  userId: string,
  genreIds: string[]
): Promise<void> {
  const uniqueIds = [...new Set(genreIds.map((id) => id.trim()).filter(Boolean))];
  if (uniqueIds.length < 3) {
    throw new Error("Pick at least 3 genres.");
  }
  if (uniqueIds.length > 10) {
    throw new Error("You can pick up to 10 genres.");
  }

  const valid = await db.genre.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });
  if (valid.length !== uniqueIds.length) {
    throw new Error("One or more genres are invalid.");
  }

  await db.$transaction(async (tx) => {
    await tx.userPreferredGenre.deleteMany({ where: { userId } });
    await tx.userPreferredGenre.createMany({
      data: uniqueIds.map((genreId) => ({ userId, genreId })),
    });
    await tx.user.update({
      where: { id: userId },
      data: { onboardingCompletedAt: new Date() },
    });
  });
}

export async function listSelectableGenres(): Promise<PreferredGenreOption[]> {
  return db.genre.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function listSelectableTags(
  kind?: TagKind
): Promise<SelectableTagOption[]> {
  return db.tag.findMany({
    where: kind ? { kind } : undefined,
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, kind: true },
  });
}

export async function getTasteOnboardingState(
  userId: string
): Promise<TasteOnboardingState> {
  const [genres, taste] = await Promise.all([
    getPreferredGenres(userId),
    db.moonieTasteProfile.findUnique({ where: { userId } }),
  ]);
  return {
    genreIds: genres.map((genre) => genre.id),
    favouriteTags: taste?.favouriteTags ?? [],
    favouriteMoods: taste?.favouriteMoods ?? [],
    avoidedTags: taste?.avoidedTags ?? [],
    preferredStatus: taste?.preferredStatus ?? null,
    preferredLanguage: taste?.preferredLanguage ?? null,
    preferredLength: taste?.preferredLength ?? null,
    preferredPlatforms: taste?.preferredPlatforms ?? [],
  };
}

export async function saveTasteOnboarding(
  userId: string,
  input: TasteOnboardingInput
): Promise<void> {
  const uniqueIds = [
    ...new Set(input.genreIds.map((id) => id.trim()).filter(Boolean)),
  ].slice(0, 10);

  if (uniqueIds.length > 0) {
    const valid = await db.genre.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true, name: true },
    });
    if (valid.length !== uniqueIds.length) {
      throw new Error("One or more genres are invalid.");
    }

    const favouriteGenres = valid.map((genre) => genre.name);
    await db.$transaction(async (tx) => {
      await tx.userPreferredGenre.deleteMany({ where: { userId } });
      await tx.userPreferredGenre.createMany({
        data: uniqueIds.map((genreId) => ({ userId, genreId })),
      });
      await tx.moonieTasteProfile.upsert({
        where: { userId },
        create: {
          userId,
          favouriteGenres,
          favouriteTags: input.favouriteTags,
          favouriteMoods: input.favouriteMoods,
          avoidedTags: input.avoidedTags,
          preferredStatus: input.preferredStatus,
          preferredLanguage: input.preferredLanguage,
          preferredLength: input.preferredLength,
          preferredPlatforms: input.preferredPlatforms,
        },
        update: {
          favouriteGenres,
          favouriteTags: input.favouriteTags,
          favouriteMoods: input.favouriteMoods,
          avoidedTags: input.avoidedTags,
          preferredStatus: input.preferredStatus,
          preferredLanguage: input.preferredLanguage,
          preferredLength: input.preferredLength,
          preferredPlatforms: input.preferredPlatforms,
        },
      });
      if (input.completeOnboarding !== false) {
        await tx.user.update({
          where: { id: userId },
          data: { onboardingCompletedAt: new Date() },
        });
      }
    });
    return;
  }

  await db.$transaction(async (tx) => {
    await tx.moonieTasteProfile.upsert({
      where: { userId },
      create: {
        userId,
        favouriteTags: input.favouriteTags,
        favouriteMoods: input.favouriteMoods,
        avoidedTags: input.avoidedTags,
        preferredStatus: input.preferredStatus,
        preferredLanguage: input.preferredLanguage,
        preferredLength: input.preferredLength,
        preferredPlatforms: input.preferredPlatforms,
      },
      update: {
        favouriteTags: input.favouriteTags,
        favouriteMoods: input.favouriteMoods,
        avoidedTags: input.avoidedTags,
        preferredStatus: input.preferredStatus,
        preferredLanguage: input.preferredLanguage,
        preferredLength: input.preferredLength,
        preferredPlatforms: input.preferredPlatforms,
      },
    });
    if (input.completeOnboarding !== false) {
      await tx.user.update({
        where: { id: userId },
        data: { onboardingCompletedAt: new Date() },
      });
    }
  });
}
