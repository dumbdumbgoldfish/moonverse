import { PrismaClient } from "@prisma/client";

/**
 * Shared helpers for catalog seeding.
 * Intentionally contains no review/user/content generators: community data must be real.
 */

export async function clearDatabase(db: PrismaClient): Promise<void> {
 await db.notification.deleteMany();
 await db.folderReview.deleteMany();
 await db.folder.deleteMany();
 await db.follow.deleteMany();
 await db.like.deleteMany();
 await db.comment.deleteMany();
 await db.review.deleteMany();
 await db.readingLink.deleteMany();
 await db.novel.deleteMany();
 await db.genre.deleteMany();
 await db.tag.deleteMany();
 await db.user.deleteMany();
}
