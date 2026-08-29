import Link from "next/link";
import { BookOpen, FolderOpen, MessageCircle, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FloatingMoonie } from "@/components/brand/FloatingMoonie";

export const metadata = {
  title: "About · MoonVerse",
  description:
    "Learn about MoonVerse, a community platform for web novel reviews and Moonie, your AI reading companion.",
};

const features = [
  {
    icon: BookOpen,
    title: "Community reviews",
    description:
      "Read and write honest reviews of web novels. Discover what fellow readers think before you commit to a long series.",
  },
  {
    icon: MessageCircle,
    title: "Engage & discuss",
    description:
      "Like reviews, leave comments and join conversations about the stories you love.",
  },
  {
    icon: FolderOpen,
    title: "Personal collections",
    description:
      "Save reviews into folders like Read Later or Best Romance: your curated reading list.",
  },
  {
    icon: Sparkles,
    title: "Moonie recommendations",
    description:
      "Tell Moonie what you enjoy and get personalised novel suggestions. Moonie recommends novels. It never writes reviews for you.",
  },
];

export default function AboutPage() {
  return (
    <div className="safe-bottom-pad mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-moon-purple-soft/70 via-white to-white p-6 shadow-sm sm:p-10">
        <div className="flex flex-col items-center gap-8 text-center md:flex-row md:items-center md:text-left">
          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">
              About MoonVerse
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Discover great stories through honest reviews
            </h1>
            <p className="mt-4 max-w-xl text-muted-foreground">
              MoonVerse is a web novel review community powered by reader opinions
              and Moonie, your AI reading companion. We help you find your next
              favourite read through honest reviews and intelligent recommendations.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row md:justify-start">
              <Button
                size="lg"
                className="mv-nav-signup rounded-full border-0 font-bold text-white"
                render={<Link href="/register" />}
              >
                Join MoonVerse
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="mv-nav-login rounded-full font-bold"
                render={<Link href="/discover" />}
              >
                Browse reviews
              </Button>
            </div>
          </div>
          <div className="shrink-0">
            <FloatingMoonie variant="happy" size={160} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mt-12" aria-labelledby="features-heading">
        <h2 id="features-heading" className="text-2xl font-bold tracking-tight">
          What you can do
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-card"
            >
              <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon size={20} aria-hidden="true" />
              </div>
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* Meet Moonie */}
      <section className="mt-12" aria-labelledby="moonie-heading">
        <div className="rounded-2xl border border-border/60 bg-white p-6 shadow-sm sm:p-8 dark:bg-card">
          <h2 id="moonie-heading" className="text-2xl font-bold tracking-tight">
            Meet Moonie
          </h2>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Moonie is your friendly AI reading companion: a floating assistant
            available on every page. Describe what you like to read: genres,
            tropes, mood. Moonie will suggest web novels that match your taste.
          </p>
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-moon-purple-soft/50 p-4">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground">
              <strong>Moonie only recommends.</strong> It will never generate, edit
              or imitate reviews on your behalf. Every review on MoonVerse is written
              by a real reader.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
