export interface MockReview {
  id: string;
  title: string;
  excerpt: string;
  rating: number;
  likeCount: number;
  novelTitle: string;
  novelAuthor: string;
  coverUrl: string;
  reviewerName: string;
  reviewerAvatar: string;
  genres: string[];
  createdAt: string;
}

export interface MockReviewDetail extends MockReview {
  body: string;
  tags: string[];
  externalLink?: string;
  commentCount: number;
}

export interface MockComment {
  id: string;
  reviewId: string;
  authorName: string;
  authorAvatar: string;
  body: string;
  createdAt: string;
}

export interface MockFolder {
  id: string;
  name: string;
  description: string;
  reviewCount: number;
}

export interface MockTag {
  id: string;
  name: string;
  slug: string;
}

export interface MockGenre {
  id: string;
  name: string;
  slug: string;
  reviewCount: number;
}

export const mockAllReviews: MockReview[] = [
  {
    id: "1",
    title: "A cultivation journey that actually delivers",
    excerpt:
      "After 400 chapters, I can confidently say this is one of the best xianxia novels I've read this year. The power scaling feels earned...",
    rating: 5,
    likeCount: 128,
    novelTitle: "Heavenly Dao Chronicles",
    novelAuthor: "CloudWalker",
    coverUrl: "https://picsum.photos/seed/heavenly/200/280",
    reviewerName: "StarReader",
    reviewerAvatar: "SR",
    genres: ["Xianxia"],
    createdAt: "2026-06-18T14:30:00Z",
  },
  {
    id: "2",
    title: "LitRPG done right — stats without the grind fatigue",
    excerpt:
      "The system mechanics are clever without being overwhelming. Each level-up feels meaningful and the dungeon crawls keep you hooked...",
    rating: 4,
    likeCount: 94,
    novelTitle: "Dungeon Core Online",
    novelAuthor: "PixelSage",
    coverUrl: "https://picsum.photos/seed/dungeon/200/280",
    reviewerName: "QuestLog",
    reviewerAvatar: "QL",
    genres: ["LitRPG"],
    createdAt: "2026-06-17T09:15:00Z",
  },
  {
    id: "3",
    title: "Slow burn romance worth the wait",
    excerpt:
      "200 chapters of tension finally pay off. The character development between the leads is subtle, realistic, and deeply satisfying...",
    rating: 5,
    likeCount: 87,
    novelTitle: "Moonlit Academy",
    novelAuthor: "LunaWrites",
    coverUrl: "https://picsum.photos/seed/moonlit/200/280",
    reviewerName: "RomanceFan42",
    reviewerAvatar: "RF",
    genres: ["Romance", "Fantasy"],
    createdAt: "2026-06-16T20:45:00Z",
  },
  {
    id: "4",
    title: "Underrated sci-fi gem on Royal Road",
    excerpt:
      "Hard sci-fi meets character drama. The world-building is meticulous and the political intrigue keeps every arc fresh...",
    rating: 4,
    likeCount: 76,
    novelTitle: "Void Station Alpha",
    novelAuthor: "NebulaDrift",
    coverUrl: "https://picsum.photos/seed/void/200/280",
    reviewerName: "CosmoReads",
    reviewerAvatar: "CR",
    genres: ["Sci-Fi"],
    createdAt: "2026-06-15T11:00:00Z",
  },
  {
    id: "5",
    title: "OP MC but with actual consequences",
    excerpt:
      "Yes the protagonist is overpowered, but the story never lets them off easy. Every victory comes with a cost that matters...",
    rating: 4,
    likeCount: 65,
    novelTitle: "Sovereign of Ash",
    novelAuthor: "EmberKnight",
    coverUrl: "https://picsum.photos/seed/sovereign/200/280",
    reviewerName: "AshWalker",
    reviewerAvatar: "AW",
    genres: ["Xianxia", "Action"],
    createdAt: "2026-06-14T16:20:00Z",
  },
  {
    id: "6",
    title: "Perfect gateway novel for new readers",
    excerpt:
      "If you're new to web novels, start here. Accessible prose, likeable cast, and hooks from chapter one...",
    rating: 5,
    likeCount: 58,
    novelTitle: "The Last Summoner",
    novelAuthor: "ArcanePen",
    coverUrl: "https://picsum.photos/seed/summoner/200/280",
    reviewerName: "NewbieNovel",
    reviewerAvatar: "NN",
    genres: ["Fantasy"],
    createdAt: "2026-06-13T08:30:00Z",
  },
  {
    id: "7",
    title: "Horror that genuinely unsettled me",
    excerpt:
      "Rare for a web novel to create real dread. The atmosphere builds slowly and the monster reveals are earned...",
    rating: 5,
    likeCount: 52,
    novelTitle: "The Hollow Archive",
    novelAuthor: "NightQuill",
    coverUrl: "https://picsum.photos/seed/hollow/200/280",
    reviewerName: "SpineChill",
    reviewerAvatar: "SC",
    genres: ["Horror"],
    createdAt: "2026-06-12T22:10:00Z",
  },
  {
    id: "8",
    title: "Comedy gold with surprising depth",
    excerpt:
      "I came for the jokes and stayed for the character arcs. Balances humour and heart better than most published novels...",
    rating: 4,
    likeCount: 41,
    novelTitle: "Adventurer's Union Local 404",
    novelAuthor: "FunnyBone",
    coverUrl: "https://picsum.photos/seed/union/200/280",
    reviewerName: "LaughTrack",
    reviewerAvatar: "LT",
    genres: ["Comedy", "Fantasy"],
    createdAt: "2026-06-11T13:55:00Z",
  },
];

export const mockTrendingReviews = mockAllReviews.slice(0, 6);

const reviewDetails: Record<string, Omit<MockReviewDetail, keyof MockReview>> = {
  "1": {
    body: `After 400 chapters, I can confidently say this is one of the best xianxia novels I've read this year. The power scaling feels earned rather than arbitrary, and the protagonist's growth mirrors the world's expanding scope.

The sect politics are a highlight — every alliance feels fragile and every betrayal hits hard. CloudWalker avoids the common pitfall of making the MC invincible too early; instead, each breakthrough comes with genuine sacrifice.

Minor pacing issues in the middle arc (chapters 180–220), but the payoff in the current arc more than compensates. Highly recommended for cultivation fans who want substance over spectacle.`,
    tags: ["cultivation", "sect-politics", "earned-power"],
    externalLink: "https://www.royalroad.com",
    commentCount: 14,
  },
  "2": {
    body: `The system mechanics are clever without being overwhelming. Each level-up feels meaningful and the dungeon crawls keep you hooked without becoming repetitive.

PixelSage strikes a balance between stat-heavy litRPG and narrative-driven storytelling. The party dynamics are well written, and the dungeon master AI antagonist is genuinely unsettling.

If you enjoy Solo Leveling or The Wandering Inn's RPG elements, this is a must-read. Some crafting chapters drag slightly, but skip-at-your-peril if you care about endgame setup.`,
    tags: ["system-apocalypse", "dungeon-crawl", "party-dynamics"],
    externalLink: "https://www.royalroad.com",
    commentCount: 9,
  },
  "3": {
    body: `200 chapters of tension finally pay off. The character development between the leads is subtle, realistic, and deeply satisfying.

Moonlit Academy excels at the "will they, won't they" dynamic without frustrating stagnation. The magic school setting is familiar but elevated by LunaWrites' attention to emotional nuance.

Romance readers should note: this is slow burn done right, not slow burn as filler. Side characters get their moments too. A few translation-style awkward phrases in early chapters, but the story quickly finds its voice.`,
    tags: ["slow-burn", "magic-academy", "character-driven"],
    commentCount: 11,
  },
  "4": {
    body: `Hard sci-fi meets character drama. The world-building is meticulous and the political intrigue keeps every arc fresh.

Void Station Alpha treats its setting with respect — orbital mechanics, resource economics, and faction politics all feel researched. NebulaDrift never info-dumps; instead, details emerge through conflict.

The middle section is dense, but patient readers will be rewarded. One of the most underrated gems on Royal Road right now.`,
    tags: ["hard-sci-fi", "political-intrigue", "underrated"],
    externalLink: "https://www.royalroad.com",
    commentCount: 7,
  },
  "5": {
    body: `Yes the protagonist is overpowered, but the story never lets them off easy. Every victory comes with a cost that matters.

Sovereign of Ash subverts the OP MC trope by making power a burden. The ash motif runs through every arc — destruction, renewal, and the weight of legacy. EmberKnight's prose is crisp and the fight scenes are vivid without being bloated.

Action fans will love it; readers who dislike overpowered protagonists should give it three chapters before judging.`,
    tags: ["OP-MC", "consequences", "action"],
    commentCount: 6,
  },
  "6": {
    body: `If you're new to web novels, start here. Accessible prose, likeable cast, and hooks from chapter one.

The Last Summoner avoids genre jargon overload and introduces its magic system gradually. ArcanePen writes with warmth and humour that makes the cast feel like friends.

Not the most innovative plot, but executed with charm and consistency. Perfect gateway before diving into heavier xianxia or litRPG series.`,
    tags: ["beginner-friendly", "summoner", "comfort-read"],
    commentCount: 5,
  },
  "7": {
    body: `Rare for a web novel to create real dread. The atmosphere builds slowly and the monster reveals are earned.

The Hollow Archive uses found-document structure effectively — logs, transcripts, and recovered files that piece together something deeply wrong. NightQuill understands that what you don't see is scarier than what you do.

Not for the faint-hearted. Best read late at night with the lights on.`,
    tags: ["cosmic-horror", "found-footage", "atmospheric"],
    commentCount: 8,
  },
  "8": {
    body: `I came for the jokes and stayed for the character arcs. Balances humour and heart better than most published novels.

Adventurer's Union Local 404 satirises guild bureaucracy and quest board absurdity while quietly building real stakes. FunnyBone's comedic timing is excellent — punchlines land without undercutting emotional moments.

Chapter length varies wildly, which can disrupt binge sessions, but the quality stays high throughout.`,
    tags: ["satire", "guild-life", "heartfelt"],
    commentCount: 4,
  },
};

export function getMockReviewById(id: string): MockReviewDetail | undefined {
  const review = mockAllReviews.find((r) => r.id === id);
  const details = reviewDetails[id];
  if (!review || !details) return undefined;
  return { ...review, ...details };
}

export const mockComments: MockComment[] = [
  {
    id: "c1",
    reviewId: "1",
    authorName: "DaoSeeker",
    authorAvatar: "DS",
    body: "Completely agree on the sect politics. Chapter 312 had me yelling at my screen.",
    createdAt: "2026-06-18T16:00:00Z",
  },
  {
    id: "c2",
    reviewId: "1",
    authorName: "CultivationFan",
    authorAvatar: "CF",
    body: "Would you say it's better than Reverend Insanity? Looking for something similarly strategic.",
    createdAt: "2026-06-18T18:30:00Z",
  },
  {
    id: "c3",
    reviewId: "1",
    authorName: "StarReader",
    authorAvatar: "SR",
    body: "Different vibe — less ruthless MC but equally smart plotting. Give it 50 chapters before deciding.",
    createdAt: "2026-06-19T09:00:00Z",
  },
  {
    id: "c4",
    reviewId: "2",
    authorName: "StatBlock",
    authorAvatar: "SB",
    body: "The dungeon master AI arc is peak litRPG horror. Did not see that twist coming.",
    createdAt: "2026-06-17T14:20:00Z",
  },
  {
    id: "c5",
    reviewId: "3",
    authorName: "Shipper101",
    authorAvatar: "S1",
    body: "Chapter 187 finally!!! Worth every chapter of waiting.",
    createdAt: "2026-06-16T22:00:00Z",
  },
];

export function getMockCommentsByReviewId(reviewId: string): MockComment[] {
  return mockComments.filter((c) => c.reviewId === reviewId);
}

export const mockFolders: MockFolder[] = [
  {
    id: "f1",
    name: "Read Later",
    description: "Reviews of novels I want to start soon.",
    reviewCount: 12,
  },
  {
    id: "f2",
    name: "Best Romance",
    description: "My favourite romance web novel reviews.",
    reviewCount: 8,
  },
  {
    id: "f3",
    name: "Top Fantasy",
    description: "Fantasy reviews worth revisiting.",
    reviewCount: 15,
  },
];

export const mockTags: MockTag[] = [
  { id: "t1", name: "OP MC", slug: "op-mc" },
  { id: "t2", name: "slow-burn", slug: "slow-burn" },
  { id: "t3", name: "cultivation", slug: "cultivation" },
  { id: "t4", name: "dungeon-crawl", slug: "dungeon-crawl" },
  { id: "t5", name: "character-driven", slug: "character-driven" },
  { id: "t6", name: "beginner-friendly", slug: "beginner-friendly" },
  { id: "t7", name: "satire", slug: "satire" },
  { id: "t8", name: "cosmic-horror", slug: "cosmic-horror" },
];

export const mockGenres: MockGenre[] = [
  { id: "1", name: "Xianxia", slug: "xianxia", reviewCount: 342 },
  { id: "2", name: "LitRPG", slug: "litrpg", reviewCount: 218 },
  { id: "3", name: "Romance", slug: "romance", reviewCount: 195 },
  { id: "4", name: "Fantasy", slug: "fantasy", reviewCount: 287 },
  { id: "5", name: "Sci-Fi", slug: "sci-fi", reviewCount: 124 },
  { id: "6", name: "Action", slug: "action", reviewCount: 176 },
  { id: "7", name: "Horror", slug: "horror", reviewCount: 89 },
  { id: "8", name: "Comedy", slug: "comedy", reviewCount: 103 },
];

export const mockCommunityStats = {
  totalReviews: 1247,
  totalUsers: 389,
  totalNovels: 512,
  featuredReviewers: [
    { name: "StarReader", avatar: "SR", reviewCount: 47 },
    { name: "QuestLog", avatar: "QL", reviewCount: 38 },
    { name: "CosmoReads", avatar: "CR", reviewCount: 31 },
  ],
};

export const mockMoonieRecommendation = {
  novelTitle: "Cradle",
  author: "Will Wight",
  genres: ["Xianxia", "Fantasy"],
  reason:
    "Fast-paced cultivation with a clever protagonist and tight plotting — perfect if you enjoy earned power progression without filler arcs.",
};
