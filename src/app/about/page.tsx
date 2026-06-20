import Link from "next/link";
import { BookOpen, FolderOpen, MessageCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { PageHeader } from "@/components/layout/PageHeader";
import { mockMoonieRecommendation } from "@/lib/mock-data";

export const metadata = {
  title: "About — MoonVerse",
  description:
    "Learn about MoonVerse, a community platform for web novel reviews, and Moonie, your AI reading companion.",
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
      "Like reviews, leave comments, and join conversations about the stories you love.",
  },
  {
    icon: FolderOpen,
    title: "Personal collections",
    description:
      "Save reviews into folders like Read Later or Best Romance — your curated reading list.",
  },
  {
    icon: Sparkles,
    title: "Moonie recommendations",
    description:
      "Tell Moonie what you enjoy and get personalised novel suggestions. Moonie recommends — never writes reviews for you.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="About MoonVerse"
        description="MoonVerse is an AI-powered web novel review community built as an MSc project at a UK university. We help readers discover great stories through honest community reviews and intelligent recommendations."
      />

      <section className="mb-16" aria-labelledby="features-heading">
        <h2 id="features-heading" className="sr-only">
          Platform features
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-bg-elevated ring-border/50">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon size={20} aria-hidden="true" />
                </div>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section
        className="rounded-2xl border border-border/60 bg-bg-elevated p-8 sm:p-10"
        aria-labelledby="moonie-heading"
      >
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
          <MoonieMascot size={100} animated className="shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <h2 id="moonie-heading" className="text-2xl font-bold tracking-tight">
              Meet Moonie
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Moonie is your friendly AI reading companion — a floating assistant
              available on every page. Describe what you like to read — genres,
              tropes, mood — and Moonie will suggest web novels that match your
              taste.
            </p>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              <strong className="text-foreground">Important:</strong> Moonie only
              provides recommendations. It will never generate, edit, or imitate
              reviews on your behalf. All reviews on MoonVerse are written by real
              readers.
            </p>
          </div>
        </div>

        <Card className="mt-8 bg-background ring-border/40">
          <CardHeader>
            <CardDescription className="flex items-center gap-2 text-accent">
              <Sparkles size={14} aria-hidden="true" />
              Example recommendation
            </CardDescription>
            <CardTitle>{mockMoonieRecommendation.novelTitle}</CardTitle>
            <CardDescription>by {mockMoonieRecommendation.author}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">
              &ldquo;{mockMoonieRecommendation.reason}&rdquo;
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="mt-12 text-center">
        <p className="text-muted-foreground">Ready to explore?</p>
        <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
          <Button size="lg" render={<Link href="/reviews" />}>
            Browse reviews
          </Button>
          <Button size="lg" variant="outline" render={<Link href="/register" />}>
            Join MoonVerse
          </Button>
        </div>
      </div>
    </div>
  );
}
