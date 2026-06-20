import { db } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import type { AdminGenreSummary, AdminNovelSummary, AdminTagSummary } from "@/types/admin";

export async function getAdminNovels(query?: string): Promise<AdminNovelSummary[]> {
  const q = query?.trim();

  const novels = await db.novel.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { author: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { title: "asc" },
    include: {
      genres: { select: { id: true, name: true } },
      tags: { select: { id: true, name: true } },
      _count: { select: { reviews: true } },
    },
  });

  return novels.map((novel) => ({
    id: novel.id,
    title: novel.title,
    author: novel.author,
    coverUrl: novel.coverUrl,
    externalLink: novel.externalLink,
    reviewCount: novel._count.reviews,
    genreNames: novel.genres.map((g) => g.name),
    tagNames: novel.tags.map((t) => t.name),
    genreIds: novel.genres.map((g) => g.id),
    tagIds: novel.tags.map((t) => t.id),
    createdAt: novel.createdAt.toISOString(),
  }));
}

export async function getAdminNovelById(novelId: string) {
  return db.novel.findUnique({
    where: { id: novelId },
    include: {
      genres: true,
      tags: true,
      _count: { select: { reviews: true } },
    },
  });
}

export async function adminCreateNovel(input: {
  title: string;
  author?: string;
  coverUrl?: string;
  externalLink?: string;
  genreIds: string[];
  tagIds: string[];
}) {
  const title = input.title.trim();
  if (!title) throw new Error("Novel title is required.");

  return db.novel.create({
    data: {
      title,
      author: input.author?.trim() || null,
      coverUrl: input.coverUrl?.trim() || null,
      externalLink: input.externalLink?.trim() || null,
      genres: { connect: input.genreIds.map((id) => ({ id })) },
      tags: { connect: input.tagIds.map((id) => ({ id })) },
    },
  });
}

export async function adminUpdateNovel(
  novelId: string,
  input: {
    title: string;
    author?: string;
    coverUrl?: string;
    externalLink?: string;
    genreIds: string[];
    tagIds: string[];
  }
) {
  const title = input.title.trim();
  if (!title) throw new Error("Novel title is required.");

  return db.novel.update({
    where: { id: novelId },
    data: {
      title,
      author: input.author?.trim() || null,
      coverUrl: input.coverUrl?.trim() || null,
      externalLink: input.externalLink?.trim() || null,
      genres: { set: input.genreIds.map((id) => ({ id })) },
      tags: { set: input.tagIds.map((id) => ({ id })) },
    },
  });
}

export async function adminDeleteNovel(novelId: string): Promise<void> {
  const novel = await db.novel.findUnique({
    where: { id: novelId },
    include: { _count: { select: { reviews: true } } },
  });

  if (!novel) throw new Error("Novel not found.");
  if (novel._count.reviews > 0) {
    throw new Error("Cannot delete a novel that has reviews.");
  }

  await db.novel.delete({ where: { id: novelId } });
}

export async function getAdminGenres(): Promise<AdminGenreSummary[]> {
  const genres = await db.genre.findMany({ orderBy: { name: "asc" } });

  return Promise.all(
    genres.map(async (genre) => ({
      id: genre.id,
      name: genre.name,
      slug: genre.slug,
      novelCount: await db.novel.count({
        where: { genres: { some: { id: genre.id } } },
      }),
    }))
  );
}

export async function adminCreateGenre(name: string, slug?: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Genre name is required.");

  const finalSlug = slugify(slug?.trim() || trimmed);
  if (!finalSlug) throw new Error("Genre slug is required.");

  return db.genre.create({
    data: { name: trimmed, slug: finalSlug },
  });
}

export async function adminUpdateGenre(
  genreId: string,
  name: string,
  slug?: string
) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Genre name is required.");

  const finalSlug = slugify(slug?.trim() || trimmed);
  if (!finalSlug) throw new Error("Genre slug is required.");

  return db.genre.update({
    where: { id: genreId },
    data: { name: trimmed, slug: finalSlug },
  });
}

export async function adminDeleteGenre(genreId: string): Promise<void> {
  const count = await db.novel.count({
    where: { genres: { some: { id: genreId } } },
  });

  if (count > 0) {
    throw new Error("Cannot delete a genre that is assigned to novels.");
  }

  await db.genre.delete({ where: { id: genreId } });
}

export async function getAdminTags(): Promise<AdminTagSummary[]> {
  const tags = await db.tag.findMany({ orderBy: { name: "asc" } });

  return Promise.all(
    tags.map(async (tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      novelCount: await db.novel.count({
        where: { tags: { some: { id: tag.id } } },
      }),
    }))
  );
}

export async function adminCreateTag(name: string, slug?: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required.");

  const finalSlug = slugify(slug?.trim() || trimmed);
  if (!finalSlug) throw new Error("Tag slug is required.");

  return db.tag.create({
    data: { name: trimmed, slug: finalSlug },
  });
}

export async function adminUpdateTag(tagId: string, name: string, slug?: string) {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Tag name is required.");

  const finalSlug = slugify(slug?.trim() || trimmed);
  if (!finalSlug) throw new Error("Tag slug is required.");

  return db.tag.update({
    where: { id: tagId },
    data: { name: trimmed, slug: finalSlug },
  });
}

export async function adminDeleteTag(tagId: string): Promise<void> {
  const count = await db.novel.count({
    where: { tags: { some: { id: tagId } } },
  });

  if (count > 0) {
    throw new Error("Cannot delete a tag that is assigned to novels.");
  }

  await db.tag.delete({ where: { id: tagId } });
}
