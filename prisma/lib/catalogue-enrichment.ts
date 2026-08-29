import type { PrismaClient } from "@prisma/client";
import { lexicalHashEmbedding } from "../../src/lib/moonie/ranking";
import { CONTENT_WARNING_SEED, tagKindForSlug } from "../../src/lib/tags";

function aliasTitles(title: string): string[] {
  const aliases = new Set<string>();
  for (const sep of [":", " - "]) {
    const part = title.split(sep)[0]?.trim();
    if (part && part !== title && part.length > 3) aliases.add(part);
  }
  return [...aliases];
}

function inferLengthBand(chapterCount: number | null): string | null {
  if (!chapterCount || chapterCount <= 0) return null;
  if (chapterCount < 80) return "short";
  if (chapterCount < 300) return "medium";
  return "long";
}

/**
 * Classify tags, seed warnings, aliases, provenance, hashed metadata embeddings.
 * Uses title/author/genres/tags/synopsis only: never novel body text.
 */
export async function enrichCatalogue(db: PrismaClient): Promise<void> {
  const tags = await db.tag.findMany({ select: { id: true, slug: true } });
  for (const tag of tags) {
    await db.tag.update({
      where: { id: tag.id },
      data: { kind: tagKindForSlug(tag.slug) },
    });
  }

  const warnings = [];
  for (const warning of CONTENT_WARNING_SEED) {
    warnings.push(
      await db.contentWarning.upsert({
        where: { slug: warning.slug },
        update: { name: warning.name, description: warning.description },
        create: {
          name: warning.name,
          slug: warning.slug,
          description: warning.description,
        },
      }),
    );
  }

  const novels = await db.novel.findMany({
    select: {
      id: true,
      title: true,
      author: true,
      synopsis: true,
      chapterCount: true,
      genres: { select: { name: true } },
      tags: { select: { name: true, slug: true } },
    },
  });

  const warningBySlug = Object.fromEntries(
    warnings.map((warning) => [warning.slug, warning]),
  );

  for (const novel of novels) {
    const aliases = aliasTitles(novel.title);
    if (aliases.length) {
      await db.novelAlias.createMany({
        data: aliases.map((title) => ({ novelId: novel.id, title })),
        skipDuplicates: true,
      });
    }

    const tagSlugs = new Set(novel.tags.map((tag) => tag.slug));
    for (const warning of CONTENT_WARNING_SEED) {
      if (!warning.tagSlugs.some((slug) => tagSlugs.has(slug))) continue;
      const row = warningBySlug[warning.slug];
      if (!row) continue;
      await db.novelContentWarning.upsert({
        where: {
          novelId_warningId: { novelId: novel.id, warningId: row.id },
        },
        update: {},
        create: { novelId: novel.id, warningId: row.id },
      });
    }

    const embedding = lexicalHashEmbedding(
      [
        novel.title,
        novel.author ?? "",
        novel.synopsis ?? "",
        ...novel.genres.map((genre) => genre.name),
        ...novel.tags.map((tag) => tag.name),
      ].join(" "),
    );

    await db.novel.update({
      where: { id: novel.id },
      data: {
        lengthBand: inferLengthBand(novel.chapterCount),
        metadataSource: "seed-catalog",
        lastVerifiedAt: new Date(),
        embedding,
      },
    });
  }
}
