import type { Rng } from "./rng";

export type ReviewStyle =
  | "beginner"
  | "casual"
  | "analytical"
  | "emotional"
  | "humorous"
  | "veteran";

export type ReviewLengthBand = "short" | "medium" | "long";
export type ReadingDifficulty = "easy" | "moderate" | "demanding";
export type QualityScore = "weak" | "uneven" | "solid" | "strong";

export interface ReviewContext {
  title: string;
  author: string;
  genres: string[];
  rating: number;
  featured: boolean;
  style: ReviewStyle;
  lengthBand: ReviewLengthBand;
  spoiler: boolean;
  difficulty: ReadingDifficulty;
  tagLabels: string[];
  translated: boolean;
}

export interface ComposedReview {
  title: string;
  body: string;
  style: ReviewStyle;
  lengthBand: ReviewLengthBand;
  spoiler: boolean;
  difficulty: ReadingDifficulty;
  positives: string[];
  negatives: string[];
  recommendedFor: string;
  favouriteCharacter: string;
  favouriteArc: string;
  pacingOpinion: string;
  writingQuality: QualityScore;
  translationQuality: QualityScore | null;
  tagSlugs: string[];
}

const LENGTH_BOUNDS: Record<ReviewLengthBand, { min: number; max: number }> = {
  short: { min: 800, max: 950 },
  medium: { min: 900, max: 1050 },
  long: { min: 950, max: 1100 },
};

const ASIDES = [
  "I read late with tea cooling beside the keyboard.",
  "My notes app has more rants than compliments, which means I cared.",
  "I argued with a friend about one chapter and neither of us changed our mind.",
  "On a second pass of early chapters, setups I missed the first time clicked.",
  "I almost DNFed once, then a character choice pulled me back in.",
  "I measured progress in chapters-per-commute and still finished early.",
  "Voice notes to myself after cliffhangers became a weird ritual.",
  "I kept a private scorecard of promises and payoffs.",
] as const;

const EXPANSION_POOL = [
  "The setting has pressure from institutions and scarcity.",
  "Travel and time feel weighted instead of teleported away.",
  "Culture shows up in etiquette and what people refuse to say publicly.",
  "Chapter endings often ask a question instead of shouting a cliffhanger.",
  "Side characters occasionally steal scenes without derailing the lead.",
  "I tracked promises the plot made early and most of them eventually paid rent.",
  "Serialization stretch marks appear, then the author usually course-corrects.",
  "I cared when someone made a bad call. That is rarer than it should be.",
  "Rank and reputation pressure show up even when nobody is fighting.",
  "Information is rationed; characters learn late for reasons that make sense.",
  "The prose prefers concrete nouns over ornamental fog.",
  "Combat readability stayed high even when the cast list grew.",
  "Romance chemistry, when present, behaves like a subplot with costs.",
  "Comedy beats land harder because the story earns the release.",
  "I noticed motif callbacks that rewarded careful readers without punishing skimmers.",
  "World rules stay mostly coherent; exceptions are treated as events.",
  "The story remembers injuries, debts and awkward silences.",
  "Secondary locations feel lived-in rather than painted backdrop.",
  "Villain planning has internal logic even when I dislike the outcomes.",
  "Pacing breathes after major turns instead of instantly resetting comfort.",
  "Translation texture, if any, rarely blocks meaning on a tired weeknight.",
  "I would defend the ambition even when I dock stars for repetition.",
  "Found-family warmth works because trust is negotiated, not declared.",
  "Power gains change social options, not just damage numbers.",
  "The middle third tests patience and then pays a portion of that bill.",
  "{aside}",
] as const;

const POSITIVE_POOL = [
  "Cause and effect stay visible; victories cost something.",
  "Character voice holds across arcs without flattening side cast.",
  "World rules arrive through use rather than lecture.",
  "Emotional beats are earned instead of announced.",
  "Conflict scenes have geography and readable stakes.",
  "Humor comes from personality rather than forced gags.",
  "Long-game setups actually pay rent later.",
  "Dialogue feels like people talking past each other in believable ways.",
  "Quiet chapters change relationships instead of padding word count.",
  "The {genre} premise is familiar but the execution keeps tightening.",
] as const;

const NEGATIVE_POOL = [
  "Training and status-check beats repeat more than they need to.",
  "A late stretch leans on coincidence over character agency.",
  "A few side plots vanish without aftermath.",
  "Power scaling jumps a rung without enough foreshadowing.",
  "Emotional conflict sometimes resets after one conversation.",
  "One major arc ends softer than the build promised.",
  "Middle chapters loiter before the deadline snaps back.",
  "Prose occasionally stiffens in transition chapters.",
  "Romance timing feels convenient rather than inevitable.",
  "The cast balloons until focus thins.",
] as const;

const CHAR_POOL = [
  "the lead's stubborn mentor",
  "the rival who keeps being right for the wrong reasons",
  "the quiet strategist in the supporting cast",
  "the chaotic friend who steals scenes",
  "the antagonist with a readable ledger of motives",
  "the deuteragonist who carries the emotional spine",
] as const;

const ARC_POOL = [
  "the mid-series trust fracture",
  "the tournament-or-exam pressure cooker",
  "the found-family assembly stretch",
  "the revenge-to-reckoning turn",
  "the quiet recovery chapters after a loss",
  "the first real political confrontation",
] as const;

const PACING_POOL = [
  "Pacing is front-loaded with purpose, then breathes, then sprints when deadlines appear.",
  "Serialization stretch marks show in the middle, but course corrections usually arrive.",
  "I wanted fewer montage loops and more decisive scene turns.",
  "Chapter endings ask questions more often than they scream cliffhangers, which helped binge nights.",
  "Uneven: brilliant weekends of chapters mixed with maintenance arcs.",
] as const;

const AUDIENCE_POOL = [
  "Readers who like {genre} with continuity and can tolerate uneven middles.",
  "Fans of {genre2} who want interpersonal stakes beside spectacle.",
  "People hunting accumulation over constant novelty.",
  "Anyone patient with trust-building and allergic to empty cliffhangers.",
  "Readers who enjoy {tag} energy without needing perfection.",
  "Veterans who have seen the tropes and still want texture.",
] as const;

const STYLE_HOOKS: Record<ReviewStyle, readonly string[]> = {
  beginner: [
    "I am still new to long {genre} serials, so take this as an enthusiastic first-pass on {title}.",
    "{title} was one of the first web novels I finished cover to cover and I have thoughts.",
  ],
  casual: [
    "I blasted through {title} on weeknights and somehow still have feelings about the middle stretch.",
    "{title} was commute brain-candy that occasionally got smarter than candy.",
  ],
  analytical: [
    "Structurally, {title} is doing more than a standard {genre} climb and that shows in the architecture.",
    "I kept score of cause and effect while reading {title}. The ledger mostly balances.",
  ],
  emotional: [
    "I did not expect {title} to rearrange my evening mood the way it did.",
    "There are chapters in {title} I had to put down because I needed a minute.",
  ],
  humorous: [
    "I opened {title} for vibes and stayed for the chaos management seminar.",
    "If {genre} had a group chat, {title} would be typing in all caps then apologizing.",
  ],
  veteran: [
    "I have read enough {genre} serials to spot the scaffolding. {title} still earned attention.",
    "As a veteran of this lane, I am picky about repetition. {title} mostly survives that filter.",
  ],
};

const STYLE_CLOSINGS: Record<ReviewStyle, readonly string[]> = {
  beginner: [
    "I would recommend {title} to other newcomers with the caveat that middles wobble.",
  ],
  casual: [
    "Would I reread? Probably the early arcs. Would I recommend? Yeah, with snacks.",
  ],
  analytical: [
    "On craft alone this sits at {rating} for me: clear peaks, accountable valleys.",
  ],
  emotional: [
    "I am still soft about two character beats and slightly mad about one. That is a successful read.",
  ],
  humorous: [
    "Final verdict: chaotic good. Bring tea and lowered expectations for filler.",
  ],
  veteran: [
    "Not reinventing the lane, not sleepwalking either. A useful {rating} on my private scale.",
  ],
};

function fill(template: string, ctx: ReviewContext, rng: Rng): string {
  const genre = ctx.genres[0] ?? "web fiction";
  const genre2 = ctx.genres[1] ?? genre;
  return template
    .replaceAll("{title}", ctx.title)
    .replaceAll("{author}", ctx.author)
    .replaceAll("{genre}", genre)
    .replaceAll("{genre2}", genre2)
    .replaceAll("{rating}", String(ctx.rating))
    .replaceAll("{difficulty}", ctx.difficulty)
    .replaceAll("{aside}", rng.pick(ASIDES))
    .replaceAll(
      "{tag}",
      rng.pick(ctx.tagLabels.length ? ctx.tagLabels : ["character-driven"])
    );
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function qualityFromRating(rating: number, rng: Rng): QualityScore {
  if (rating >= 5) return rng.chance(0.7) ? "strong" : "solid";
  if (rating === 4) return rng.chance(0.55) ? "solid" : "strong";
  if (rating === 3) return rng.chance(0.6) ? "uneven" : "solid";
  if (rating === 2) return rng.chance(0.55) ? "uneven" : "weak";
  return "weak";
}

function pickAlignedPositives(ctx: ReviewContext, rng: Rng): string[] {
  const count = ctx.rating >= 4 ? rng.int(2, 3) : ctx.rating === 3 ? 2 : 1;
  return rng.shuffle([...POSITIVE_POOL]).slice(0, count).map((t) => fill(t, ctx, rng));
}

function pickAlignedNegatives(ctx: ReviewContext, rng: Rng): string[] {
  const count =
    ctx.rating <= 2 ? rng.int(2, 3) : ctx.rating === 3 ? 2 : ctx.rating === 4 ? 1 : rng.chance(0.4) ? 1 : 0;
  if (count === 0) {
    return ["Minor friction only: a few chapters overstay their welcome."];
  }
  return rng.shuffle([...NEGATIVE_POOL]).slice(0, count).map((t) => fill(t, ctx, rng));
}

function expandToTarget(
  paragraphs: string[],
  ctx: ReviewContext,
  rng: Rng,
  minWords: number,
  maxWords: number
): string {
  const pool = rng.shuffle([
    ...POSITIVE_POOL,
    ...NEGATIVE_POOL,
    ...EXPANSION_POOL,
  ]);

  let body = paragraphs.join("\n\n");
  let i = 0;
  while (wordCount(body) < minWords) {
    const spice = rng.pick([
      `That mattered while I was reading ${ctx.title}.`,
      `It shaped how I scored the ${ctx.rating}-star call.`,
      `In a ${ctx.genres[0] ?? "web novel"} lane, that is not automatic.`,
      `I wrote it down because ${ctx.author} keeps returning to the idea.`,
      `By the later arcs of ${ctx.title}, the pattern was hard to ignore.`,
      `Compared with other ${ctx.genres[0] ?? "serial"} titles on my shelf, the difference showed here.`,
      `I would still recommend ${ctx.title} with the caveats above.`,
      `My reread notes on early chapters of ${ctx.title} confirmed the setup work.`,
      `Style note (${ctx.style}): this is how the story landed for me, not a universal law.`,
      `Tag lens (${rng.pick(ctx.tagLabels.length ? ctx.tagLabels : ["character-driven"])}): the match felt intentional rather than bolted on.`,
    ]);
    const base = fill(pool[i % pool.length], ctx, rng);
    body += `\n\n${base} ${spice}`;
    i += 1;
    if (i > 200) break;
  }

  const parts = body.split(/\n\n+/);
  while (wordCount(parts.join("\n\n")) > maxWords && parts.length > 8) {
    parts.splice(parts.length - 2, 1);
  }
  return parts.join("\n\n");
}

/** Production load tests use long-form reviews (~800–1100 words). */
export function pickLengthBand(rng: Rng, featured: boolean): ReviewLengthBand {
  if (featured) return "long";
  const roll = rng.next();
  if (roll < 0.25) return "short";
  if (roll < 0.65) return "medium";
  return "long";
}

export function pickReviewStyle(rng: Rng): ReviewStyle {
  return rng.pick([
    "beginner",
    "casual",
    "analytical",
    "emotional",
    "humorous",
    "veteran",
  ] as const);
}

export function pickDifficulty(rng: Rng, genres: string[]): ReadingDifficulty {
  if (genres.some((g) => ["psychological", "xianxia", "cultivation", "sci-fi"].includes(g))) {
    return rng.chance(0.55) ? "demanding" : "moderate";
  }
  if (genres.some((g) => ["comedy", "romance", "school-life"].includes(g))) {
    return rng.chance(0.55) ? "easy" : "moderate";
  }
  return rng.pick(["easy", "moderate", "demanding"] as const);
}

export function composeOriginalReview(
  ctx: ReviewContext,
  rng: Rng
): ComposedReview {
  const positives = pickAlignedPositives(ctx, rng);
  const negatives = pickAlignedNegatives(ctx, rng);
  const recommendedFor = fill(rng.pick(AUDIENCE_POOL), ctx, rng);
  const favouriteCharacter = rng.pick(CHAR_POOL);
  const favouriteArc = rng.pick(ARC_POOL);
  const pacingOpinion = fill(rng.pick(PACING_POOL), ctx, rng);
  const writingQuality = qualityFromRating(ctx.rating, rng);
  const translationQuality = ctx.translated
    ? qualityFromRating(Math.max(1, ctx.rating + (rng.chance(0.35) ? -1 : 0)), rng)
    : null;
  const { min, max } = LENGTH_BOUNDS[ctx.lengthBand];

  const sections: string[] = [
    fill(rng.pick(STYLE_HOOKS[ctx.style]), ctx, rng),
  ];

  if (ctx.spoiler) {
    sections.push(
      "Spoiler note: I keep plot turns vague below but I discuss arc shape and character outcomes in broad strokes. Skip if you want zero risk."
    );
  }

  sections.push(
    `Reading difficulty felt ${ctx.difficulty} to me.`,
    `What worked for me:\n- ${positives.join("\n- ")}`,
    `What dragged or disappointed:\n- ${negatives.join("\n- ")}`,
    `Favourite character energy: ${favouriteCharacter}.`,
    `Favourite arc: ${favouriteArc}.`,
    `Pacing: ${pacingOpinion}`,
    `Writing quality: ${writingQuality}.`,
    translationQuality
      ? `Translation quality: ${translationQuality}. Meaning stayed clear even when idiom stiffened.`
      : "This read as an English-original cadence to me.",
    `Recommended for: ${recommendedFor}`
  );

  if (ctx.lengthBand !== "short") {
    sections.push(
      fill(
        "Character continuity is the quiet engine. People remember debts and embarrassments.",
        ctx,
        rng
      )
    );
  }

  if (ctx.lengthBand === "long" || ctx.featured) {
    sections.push(
      fill(
        "Looking at structure, escalation behaves like a social problem as much as a combat problem. Rank and reputation show up even in quiet rooms.",
        ctx,
        rng
      )
    );
  }

  sections.push(fill(rng.pick(STYLE_CLOSINGS[ctx.style]), ctx, rng));

  const body = expandToTarget(sections, ctx, rng, min, max);

  const titles = [
    `Why I landed on ${ctx.rating} stars for ${ctx.title}`,
    `${ctx.title}: patient, imperfect and worth finishing`,
    `A ${ctx.style} reader's notes on ${ctx.title}`,
    `${ctx.genres[0] ?? "Web novel"} with teeth: ${ctx.title}`,
    `Honest take: ${ctx.title} by ${ctx.author}`,
    `What worked (and what dragged) in ${ctx.title}`,
    `${ctx.title}: ${favouriteArc}`,
  ];

  // Avoid em dash per project copy rules: replace any accidental ones
  const title = rng.pick(titles).replace(/\u2014/g, ":").replace(/: /g, ": ");

  return {
    title,
    body,
    style: ctx.style,
    lengthBand: ctx.lengthBand,
    spoiler: ctx.spoiler,
    difficulty: ctx.difficulty,
    positives,
    negatives,
    recommendedFor,
    favouriteCharacter,
    favouriteArc,
    pacingOpinion,
    writingQuality,
    translationQuality,
    tagSlugs: [],
  };
}

export function composeOriginalComment(rng: Rng, novelTitle: string): string {
  return fill(
    rng.pick([
      "Agreed on the middle-arc drag. I pushed through and the payoff helped.",
      "I rated this higher than you did. The cast chemistry carried me.",
      "Curious what you thought of the late antagonist. I wanted more motive.",
      "If you liked {title}, try something with a similar trust-building pace.",
      "Hard disagree on the romance subplot. It felt earned to me.",
      "The worldbuilding note is spot on. Institutions mattered here.",
      "Thanks for the spoiler-aware writeup. Helped me decide to continue.",
      "I DNFed earlier for the same repetition issue you flagged.",
      "Your pacing section matches my chapter notes almost exactly.",
      "Would love a follow-up if you reread the early volumes.",
    ]),
    {
      title: novelTitle,
      author: "the author",
      genres: ["story"],
      rating: 4,
      featured: false,
      style: "casual",
      lengthBand: "short",
      spoiler: false,
      difficulty: "moderate",
      tagLabels: ["character-driven"],
      translated: false,
    },
    rng
  );
}

/** Original MoonVerse editorial blurb: not publisher marketing copy. */
export function composeEditorialSynopsis(
  title: string,
  author: string,
  genres: string[],
  tags: string[],
  rng: Rng
): string {
  const tag = tags[0] ?? "character-driven";
  return fill(
    rng.pick([
      "A {genre} serial by {author} tracked on MoonVerse. Community notes often highlight {tag} energy, uneven middles and character continuity worth finishing.",
      "{title} sits in the {genre} lane with recurring talk of {tag} hooks. Readers argue about pacing and payoff more than premise novelty.",
      "MoonVerse shelf notes for {title}: {genre} framing, {tag} appeal and enough interpersonal friction to keep review threads lively.",
    ]),
    {
      title,
      author,
      genres,
      rating: 4,
      featured: false,
      style: "casual",
      lengthBand: "short",
      spoiler: false,
      difficulty: "moderate",
      tagLabels: [tag],
      translated: false,
    },
    rng
  );
}
