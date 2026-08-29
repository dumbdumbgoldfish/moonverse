import { MoonieMascot } from "@/components/brand/MoonieMascot";
import type { MoonieVariant } from "@/components/brand/MoonieMascot";

interface MoonieStory {
  variant: MoonieVariant;
  useCase: string;
  question: string;
  outcome: string;
}

const STORIES: MoonieStory[] = [
  {
    variant: "thinking",
    useCase: "Stuck on what to read next",
    question: "I finished my favourite series and nothing feels right",
    outcome: "A shortlist that matches the tone you just loved",
  },
  {
    variant: "recommending",
    useCase: "Chasing a specific mood",
    question: "Something cosy but still a little heartbreaking",
    outcome: "Bittersweet stories with soft, hopeful endings",
  },
  {
    variant: "happy",
    useCase: "Wants completed stories only",
    question: "A finished GL romance I can read in one weekend",
    outcome: "Complete arcs, no cliffhangers or hiatus risk",
  },
  {
    variant: "excited",
    useCase: "Hunting hidden gems",
    question: "An underrated cultivation novel with real world-building",
    outcome: "Overlooked climbs the community quietly adores",
  },
];

export function LandingMoonieAudience() {
  return (
    <section className="mv-zone-lavender px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <div className="flex justify-center">
            <MoonieMascot size={96} variant="waving" display="clean" className="mv-float-slow" />
          </div>
          <h2 className="mt-4 font-serif text-3xl font-black tracking-tight text-night-blue sm:text-4xl lg:text-5xl">
            Who Moonie is for
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Moonie helps when you want guidance without losing the human voice of the community.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {STORIES.map((story, i) => (
            <article
              key={story.useCase}
              className={`flex items-center gap-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5 mv-hover-lift sm:p-6 ${
                i % 2 === 1 ? "md:flex-row-reverse md:text-right" : ""
              }`}
            >
              <div className="shrink-0">
                <MoonieMascot size={90} variant={story.variant} display="clean" lightweight />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">{story.useCase}</p>
                <p
                  className={`mt-2 rounded-2xl rounded-bl-sm bg-moon-purple-soft/70 px-4 py-2.5 text-sm font-medium text-night-blue ${
                    i % 2 === 1 ? "md:rounded-bl-2xl md:rounded-br-sm" : ""
                  }`}
                >
                  “{story.question}”
                </p>
                <p
                  className={`mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#a9821f] ${
                    i % 2 === 1 ? "md:justify-end" : ""
                  }`}
                >
                  <span
                    className="inline-block h-px w-4 shrink-0 bg-[#C89B4A]"
                    aria-hidden
                  />
                  {story.outcome}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
