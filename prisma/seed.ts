import { NotificationType, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const PASSWORD = "Password123!";

async function main() {
  console.log("🌙 Seeding MoonVerse database…");

  // Clear existing data (reverse dependency order)
  await db.notification.deleteMany();
  await db.folderReview.deleteMany();
  await db.folder.deleteMany();
  await db.follow.deleteMany();
  await db.like.deleteMany();
  await db.comment.deleteMany();
  await db.review.deleteMany();
  await db.novel.deleteMany();
  await db.genre.deleteMany();
  await db.tag.deleteMany();
  await db.user.deleteMany();

  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  // ─── Users ───────────────────────────────────────────────────────────────
  const [starReader, questLog, cosmoReads, romanceFan] = await Promise.all([
    db.user.create({
      data: {
        email: "starreader@example.com",
        username: "starreader",
        passwordHash,
        displayName: "StarReader",
        avatarUrl: null,
        bio: "Xianxia enthusiast. Always chasing the next cultivation breakthrough.",
        role: "ADMIN",
      },
    }),
    db.user.create({
      data: {
        email: "questlog@example.com",
        username: "questlog",
        passwordHash,
        displayName: "QuestLog",
        bio: "LitRPG and dungeon crawler specialist. Stats are my love language.",
      },
    }),
    db.user.create({
      data: {
        email: "cosmoreads@example.com",
        username: "cosmoreads",
        passwordHash,
        displayName: "CosmoReads",
        bio: "Sci-fi reader exploring the far reaches of web fiction.",
      },
    }),
    db.user.create({
      data: {
        email: "romancefan@example.com",
        username: "romancefan42",
        passwordHash,
        displayName: "RomanceFan42",
        bio: "Slow-burn romance advocate. Will wait 200 chapters for a payoff.",
      },
    }),
  ]);

  console.log(`  ✓ ${4} users`);

  // ─── Genres ──────────────────────────────────────────────────────────────
  const genreData = [
    { name: "Xianxia", slug: "xianxia" },
    { name: "LitRPG", slug: "litrpg" },
    { name: "Romance", slug: "romance" },
    { name: "Fantasy", slug: "fantasy" },
    { name: "Sci-Fi", slug: "sci-fi" },
    { name: "Action", slug: "action" },
    { name: "Horror", slug: "horror" },
    { name: "Comedy", slug: "comedy" },
  ];

  const genres = await Promise.all(
    genreData.map((g) => db.genre.create({ data: g }))
  );
  const genreBySlug = Object.fromEntries(genres.map((g) => [g.slug, g]));

  console.log(`  ✓ ${genres.length} genres`);

  // ─── Tags ────────────────────────────────────────────────────────────────
  const tagData = [
    { name: "OP MC", slug: "op-mc" },
    { name: "slow-burn", slug: "slow-burn" },
    { name: "cultivation", slug: "cultivation" },
    { name: "dungeon-crawl", slug: "dungeon-crawl" },
    { name: "character-driven", slug: "character-driven" },
    { name: "beginner-friendly", slug: "beginner-friendly" },
    { name: "satire", slug: "satire" },
    { name: "cosmic-horror", slug: "cosmic-horror" },
    { name: "sect-politics", slug: "sect-politics" },
    { name: "earned-power", slug: "earned-power" },
    { name: "magic-academy", slug: "magic-academy" },
    { name: "hard-sci-fi", slug: "hard-sci-fi" },
  ];

  const tags = await Promise.all(tagData.map((t) => db.tag.create({ data: t })));
  const tagBySlug = Object.fromEntries(tags.map((t) => [t.slug, t]));

  console.log(`  ✓ ${tags.length} tags`);

  // ─── Novels ──────────────────────────────────────────────────────────────
  const novelSpecs = [
    {
      title: "Heavenly Dao Chronicles",
      author: "CloudWalker",
      coverUrl: "https://picsum.photos/seed/heavenly/200/280",
      externalLink: "https://www.royalroad.com",
      genreSlugs: ["xianxia"],
      tagSlugs: ["cultivation", "sect-politics", "earned-power"],
    },
    {
      title: "Dungeon Core Online",
      author: "PixelSage",
      coverUrl: "https://picsum.photos/seed/dungeon/200/280",
      externalLink: "https://www.royalroad.com",
      genreSlugs: ["litrpg"],
      tagSlugs: ["dungeon-crawl", "op-mc"],
    },
    {
      title: "Moonlit Academy",
      author: "LunaWrites",
      coverUrl: "https://picsum.photos/seed/moonlit/200/280",
      genreSlugs: ["romance", "fantasy"],
      tagSlugs: ["slow-burn", "magic-academy", "character-driven"],
    },
    {
      title: "Void Station Alpha",
      author: "NebulaDrift",
      coverUrl: "https://picsum.photos/seed/void/200/280",
      externalLink: "https://www.royalroad.com",
      genreSlugs: ["sci-fi"],
      tagSlugs: ["hard-sci-fi", "character-driven"],
    },
    {
      title: "Sovereign of Ash",
      author: "EmberKnight",
      coverUrl: "https://picsum.photos/seed/sovereign/200/280",
      genreSlugs: ["xianxia", "action"],
      tagSlugs: ["op-mc", "cultivation"],
    },
    {
      title: "The Last Summoner",
      author: "ArcanePen",
      coverUrl: "https://picsum.photos/seed/summoner/200/280",
      genreSlugs: ["fantasy"],
      tagSlugs: ["beginner-friendly", "character-driven"],
    },
    {
      title: "The Hollow Archive",
      author: "NightQuill",
      coverUrl: "https://picsum.photos/seed/hollow/200/280",
      genreSlugs: ["horror"],
      tagSlugs: ["cosmic-horror"],
    },
    {
      title: "Adventurer's Union Local 404",
      author: "FunnyBone",
      coverUrl: "https://picsum.photos/seed/union/200/280",
      genreSlugs: ["comedy", "fantasy"],
      tagSlugs: ["satire", "beginner-friendly"],
    },
  ];

  const novels = await Promise.all(
    novelSpecs.map((spec) =>
      db.novel.create({
        data: {
          title: spec.title,
          author: spec.author,
          coverUrl: spec.coverUrl,
          externalLink: spec.externalLink ?? null,
          genres: {
            connect: spec.genreSlugs.map((slug) => ({ id: genreBySlug[slug].id })),
          },
          tags: {
            connect: spec.tagSlugs.map((slug) => ({ id: tagBySlug[slug].id })),
          },
        },
      })
    )
  );

  const novelByTitle = Object.fromEntries(novels.map((n) => [n.title, n]));

  console.log(`  ✓ ${novels.length} novels`);

  // ─── Reviews ─────────────────────────────────────────────────────────────
  const reviewSpecs = [
    {
      userId: starReader.id,
      novelTitle: "Heavenly Dao Chronicles",
      title: "A cultivation journey that actually delivers",
      body: `After 400 chapters, I can confidently say this is one of the best xianxia novels I've read this year. The power scaling feels earned rather than arbitrary, and the protagonist's growth mirrors the world's expanding scope.

The sect politics are a highlight: every alliance feels fragile and every betrayal hits hard. CloudWalker avoids the common pitfall of making the MC invincible too early.`,
      rating: 5,
    },
    {
      userId: questLog.id,
      novelTitle: "Dungeon Core Online",
      title: "LitRPG done right: stats without the grind fatigue",
      body: `The system mechanics are clever without being overwhelming. Each level-up feels meaningful and the dungeon crawls keep you hooked without becoming repetitive.

PixelSage strikes a balance between stat-heavy litRPG and narrative-driven storytelling.`,
      rating: 4,
    },
    {
      userId: romanceFan.id,
      novelTitle: "Moonlit Academy",
      title: "Slow burn romance worth the wait",
      body: `200 chapters of tension finally pay off. The character development between the leads is subtle, realistic, and deeply satisfying.

Romance readers should note: this is slow burn done right, not slow burn as filler.`,
      rating: 5,
    },
    {
      userId: cosmoReads.id,
      novelTitle: "Void Station Alpha",
      title: "Underrated sci-fi gem on Royal Road",
      body: `Hard sci-fi meets character drama. The world-building is meticulous and the political intrigue keeps every arc fresh.

Void Station Alpha treats its setting with respect: orbital mechanics, resource economics, and faction politics all feel researched.`,
      rating: 4,
    },
    {
      userId: starReader.id,
      novelTitle: "Sovereign of Ash",
      title: "OP MC but with actual consequences",
      body: `Yes the protagonist is overpowered, but the story never lets them off easy. Every victory comes with a cost that matters.

Sovereign of Ash subverts the OP MC trope by making power a burden.`,
      rating: 4,
    },
    {
      userId: questLog.id,
      novelTitle: "The Last Summoner",
      title: "Perfect gateway novel for new readers",
      body: `If you're new to web novels, start here. Accessible prose, likeable cast, and hooks from chapter one.

Not the most innovative plot, but executed with charm and consistency.`,
      rating: 5,
    },
    {
      userId: cosmoReads.id,
      novelTitle: "The Hollow Archive",
      title: "Horror that genuinely unsettled me",
      body: `Rare for a web novel to create real dread. The atmosphere builds slowly and the monster reveals are earned.

The Hollow Archive uses found-document structure effectively.`,
      rating: 5,
    },
    {
      userId: romanceFan.id,
      novelTitle: "Adventurer's Union Local 404",
      title: "Comedy gold with surprising depth",
      body: `I came for the jokes and stayed for the character arcs. Balances humour and heart better than most published novels.

FunnyBone's comedic timing is excellent.`,
      rating: 4,
    },
    {
      userId: questLog.id,
      novelTitle: "Heavenly Dao Chronicles",
      title: "Great for litRPG fans crossing over",
      body: `Coming from litRPG, I was surprised how much I enjoyed the cultivation system here. It scratches a similar progression itch with more narrative weight.`,
      rating: 4,
    },
    {
      userId: cosmoReads.id,
      novelTitle: "Moonlit Academy",
      title: "Fantasy elements elevate the romance",
      body: `The magic school setting adds texture without overwhelming the romance. A solid pick for readers who want both genres in one package.`,
      rating: 4,
    },
    {
      userId: romanceFan.id,
      novelTitle: "The Last Summoner",
      title: "Charming comfort read",
      body: `Low stakes but high warmth. Perfect when you want something cosy after a heavy series.`,
      rating: 5,
    },
    {
      userId: starReader.id,
      novelTitle: "Void Station Alpha",
      title: "Dense but rewarding",
      body: `Took me a while to get into the jargon, but once I did I couldn't stop. The faction dynamics are brilliantly written.`,
      rating: 4,
    },
    {
      userId: questLog.id,
      novelTitle: "Sovereign of Ash",
      title: "Action sequences are top tier",
      body: `EmberKnight writes fight scenes with clarity and impact. Even when you know the MC will win, the how keeps you reading.`,
      rating: 4,
    },
    {
      userId: cosmoReads.id,
      novelTitle: "Dungeon Core Online",
      title: "The AI antagonist is brilliant",
      body: `Without spoiling too much: the dungeon master AI arc is peak litRPG horror. Genuinely tense.`,
      rating: 5,
    },
    {
      userId: romanceFan.id,
      novelTitle: "Heavenly Dao Chronicles",
      title: "Romance reader's surprise xianxia pick",
      body: `I picked this up on a whim and stayed for the character relationships between disciples. The romance is subtle, but the emotional stakes between allies hit harder than most dedicated romance novels.

A great crossover pick if you usually read Moonlit Academy-style stories but want something with more action.`,
      rating: 4,
    },
  ];

  const reviews = await Promise.all(
    reviewSpecs.map((spec) =>
      db.review.create({
        data: {
          userId: spec.userId,
          novelId: novelByTitle[spec.novelTitle].id,
          title: spec.title,
          body: spec.body,
          rating: spec.rating,
        },
      })
    )
  );

  console.log(`  ✓ ${reviews.length} reviews`);

  // ─── Comments (with replies) ───────────────────────────────────────────────
  const heavenlyReview = reviews.find(
    (r) => r.title === "A cultivation journey that actually delivers"
  )!;
  const dungeonReview = reviews.find(
    (r) => r.title === "LitRPG done right: stats without the grind fatigue"
  )!;
  const moonlitReview = reviews.find(
    (r) => r.title === "Slow burn romance worth the wait"
  )!;

  await db.comment.create({
    data: {
      reviewId: heavenlyReview.id,
      userId: questLog.id,
      body: "Completely agree on the sect politics. Chapter 312 had me yelling at my screen.",
    },
  });

  const comment2 = await db.comment.create({
    data: {
      reviewId: heavenlyReview.id,
      userId: cosmoReads.id,
      body: "Would you say it's better than Reverend Insanity? Looking for something similarly strategic.",
    },
  });

  await db.comment.create({
    data: {
      reviewId: heavenlyReview.id,
      userId: starReader.id,
      parentCommentId: comment2.id,
      body: "Different vibe: less ruthless MC but equally smart plotting. Give it 50 chapters before deciding.",
    },
  });

  await db.comment.create({
    data: {
      reviewId: dungeonReview.id,
      userId: starReader.id,
      body: "The dungeon master AI arc is peak litRPG horror. Did not see that twist coming.",
    },
  });

  await db.comment.create({
    data: {
      reviewId: moonlitReview.id,
      userId: romanceFan.id,
      body: "Chapter 187 finally!!! Worth every chapter of waiting.",
    },
  });

  await db.comment.create({
    data: {
      reviewId: moonlitReview.id,
      userId: questLog.id,
      body: "I've been on the fence about this one. Does the pacing pick up after chapter 100?",
    },
  });

  const comment6 = await db.comment.create({
    data: {
      reviewId: reviews[3].id,
      userId: starReader.id,
      body: "The orbital mechanics detail is insane. NebulaDrift did their homework.",
    },
  });

  await db.comment.create({
    data: {
      reviewId: reviews[3].id,
      userId: cosmoReads.id,
      parentCommentId: comment6.id,
      body: "Agreed! The fuel economy subplot in arc three is surprisingly gripping.",
    },
  });

  console.log("  ✓ 8 comments (including 2 replies)");

  // ─── Likes ───────────────────────────────────────────────────────────────
  const likePairs = [
    [questLog.id, heavenlyReview.id],
    [cosmoReads.id, heavenlyReview.id],
    [romanceFan.id, heavenlyReview.id],
    [starReader.id, dungeonReview.id],
    [cosmoReads.id, dungeonReview.id],
    [starReader.id, moonlitReview.id],
    [questLog.id, moonlitReview.id],
    [romanceFan.id, reviews[3].id],
    [questLog.id, reviews[4].id],
    [cosmoReads.id, reviews[6].id],
    [starReader.id, reviews[13].id],
    [romanceFan.id, reviews[12].id],
  ] as const;

  await db.like.createMany({
    data: likePairs.map(([userId, reviewId]) => ({ userId, reviewId })),
  });

  console.log(`  ✓ ${likePairs.length} likes`);

  // ─── Follows ─────────────────────────────────────────────────────────────
  await db.follow.createMany({
    data: [
      { followerId: questLog.id, followingId: starReader.id },
      { followerId: cosmoReads.id, followingId: starReader.id },
      { followerId: romanceFan.id, followingId: starReader.id },
      { followerId: starReader.id, followingId: questLog.id },
      { followerId: romanceFan.id, followingId: questLog.id },
      { followerId: starReader.id, followingId: cosmoReads.id },
      { followerId: questLog.id, followingId: cosmoReads.id },
      { followerId: starReader.id, followingId: romanceFan.id },
    ],
  });

  console.log("  ✓ 8 follows");

  // ─── Folders & folder reviews ────────────────────────────────────────────
  const readLater = await db.folder.create({
    data: {
      userId: starReader.id,
      name: "Read Later",
      description: "Reviews of novels I want to start soon.",
      isPublic: false,
    },
  });

  const bestRomance = await db.folder.create({
    data: {
      userId: romanceFan.id,
      name: "Best Romance",
      description: "My favourite romance web novel reviews.",
      isPublic: true,
    },
  });

  const topFantasy = await db.folder.create({
    data: {
      userId: questLog.id,
      name: "Top Fantasy",
      description: "Fantasy reviews worth revisiting.",
      isPublic: false,
    },
  });

  const publicPicks = await db.folder.create({
    data: {
      userId: cosmoReads.id,
      name: "Sci-Fi Picks",
      description: "Curated sci-fi recommendations from the community.",
      isPublic: true,
    },
  });

  await db.folderReview.createMany({
    data: [
      { folderId: readLater.id, reviewId: dungeonReview.id },
      { folderId: readLater.id, reviewId: reviews[3].id },
      { folderId: readLater.id, reviewId: reviews[6].id },
      { folderId: bestRomance.id, reviewId: moonlitReview.id },
      { folderId: bestRomance.id, reviewId: reviews[9].id },
      { folderId: bestRomance.id, reviewId: reviews[10].id },
      { folderId: topFantasy.id, reviewId: reviews[5].id },
      { folderId: topFantasy.id, reviewId: heavenlyReview.id },
      { folderId: topFantasy.id, reviewId: reviews[7].id },
      { folderId: publicPicks.id, reviewId: reviews[3].id },
      { folderId: publicPicks.id, reviewId: reviews[11].id },
    ],
  });

  console.log("  ✓ 4 folders, 11 folder reviews");

  // ─── Sync denormalized counts on reviews ───────────────────────────────────
  for (const review of reviews) {
    const [likeCount, commentCount, saveCount] = await Promise.all([
      db.like.count({ where: { reviewId: review.id } }),
      db.comment.count({ where: { reviewId: review.id } }),
      db.folderReview.count({ where: { reviewId: review.id } }),
    ]);

    await db.review.update({
      where: { id: review.id },
      data: { likeCount, commentCount, saveCount },
    });
  }

  // ─── Notifications ─────────────────────────────────────────────────────────
  await db.notification.createMany({
    data: [
      {
        userId: starReader.id,
        type: NotificationType.COMMENT_ON_REVIEW,
        message: "QuestLog commented on your review of Heavenly Dao Chronicles",
        link: `/reviews/${heavenlyReview.id}`,
        isRead: false,
      },
      {
        userId: starReader.id,
        type: NotificationType.COMMENT_REPLY,
        message: "You replied to a comment on your Heavenly Dao Chronicles review",
        link: `/reviews/${heavenlyReview.id}#comments`,
        isRead: true,
      },
      {
        userId: questLog.id,
        type: NotificationType.REVIEW_LIKE,
        message: "StarReader liked your review of Dungeon Core Online",
        link: `/reviews/${dungeonReview.id}`,
        isRead: false,
      },
      {
        userId: starReader.id,
        type: NotificationType.NEW_FOLLOWER,
        message: "QuestLog started following you",
        link: "/users/questlog",
        isRead: false,
      },
      {
        userId: romanceFan.id,
        type: NotificationType.REVIEW_SAVED,
        message: "Your review was saved to Best Romance by another user",
        link: `/reviews/${moonlitReview.id}`,
        isRead: true,
      },
      {
        userId: cosmoReads.id,
        type: NotificationType.COMMENT_ON_REVIEW,
        message: "StarReader commented on your Void Station Alpha review",
        link: `/reviews/${reviews[3].id}`,
        isRead: false,
      },
      {
        userId: questLog.id,
        type: NotificationType.NEW_FOLLOWER,
        message: "RomanceFan42 started following you",
        link: "/users/romancefan42",
        isRead: true,
      },
      {
        userId: romanceFan.id,
        type: NotificationType.REVIEW_LIKE,
        message: "CosmoReads liked your Moonlit Academy review",
        link: `/reviews/${moonlitReview.id}`,
        isRead: false,
      },
    ],
  });

  console.log("  ✓ 8 notifications");
  console.log("");
  console.log("✅ Seed complete!");
  console.log(`   Demo password for all users: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
