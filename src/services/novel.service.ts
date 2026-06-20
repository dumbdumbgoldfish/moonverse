import { db } from "@/lib/db";
import { resolveCoverUrl } from "@/lib/review-utils";
import { getAllReviews } from "@/services/review.service";
import type { NovelDetail } from "@/types/review";

export interface NovelSelectOption {
  id: string;
  title: string;
  author: string | null;
}

export interface CreateNovelInput {
  title: string;
  author?: string;
  coverUrl?: string;
  externalLink?: string;
  genreIds: string[];
  tagIds: string[];
}

export async function getNovelsForSelect(): Promise<NovelSelectOption[]> {
  return db.novel.findMany({
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      author: true,
    },
  });
}

export async function createNovel(input: CreateNovelInput) {
  const title = input.title.trim();
  if (!title) {
    throw new Error("Novel title is required.");
  }

  return db.novel.create({
    data: {
      title,
      author: input.author?.trim() || null,
      coverUrl: input.coverUrl?.trim() || null,
      externalLink: input.externalLink?.trim() || null,
      genres: {
        connect: input.genreIds.map((id) => ({ id })),
      },
      tags: {
        connect: input.tagIds.map((id) => ({ id })),
      },
    },
  });
}

export async function getNovelById(id: string): Promise<NovelDetail | null> {
  const novel = await db.novel.findUnique({
    where: { id },
    include: {
      genres: true,
      tags: true,
      reviews: {
        select: { rating: true },
      },
    },
  });

  if (!novel) return null;

  const reviewCount = novel.reviews.length;
  const averageRating =
    reviewCount > 0
      ? novel.reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : null;

  return {
    id: novel.id,
    title: novel.title,
    author: novel.author,
    coverUrl: resolveCoverUrl(novel.coverUrl),
    externalLink: novel.externalLink,
    genres: novel.genres.map((g) => g.name),
    tags: novel.tags.map((t) => t.name),
    reviewCount,
    averageRating,
    createdAt: novel.createdAt.toISOString(),
  };
}

export async function getReviewsByNovelId(novelId: string) {
  return getAllReviews({ novelId, sort: "latest" });
}

export async function getAllGenres() {
  return db.genre.findMany({
    orderBy: { name: "asc" },
  });
}

export async function getAllTags() {
  return db.tag.findMany({
    orderBy: { name: "asc" },
  });
}
