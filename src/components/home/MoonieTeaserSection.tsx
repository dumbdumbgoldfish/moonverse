"use client";

import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { mockMoonieRecommendation } from "@/lib/mock-data";

export function MoonieTeaserSection() {
  const handleOpenMoonie = () => {
    // Moonie floating widget will be implemented in Week 6
    window.dispatchEvent(new CustomEvent("moonie:open"));
  };

  return (
    <section
      className="border-t border-border/60 bg-gradient-to-b from-bg-elevated/30 to-background py-16 sm:py-20"
      aria-labelledby="moonie-heading"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="flex flex-col items-center lg:items-start">
            <MoonieMascot size={120} animated />
            <h2
              id="moonie-heading"
              className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl"
            >
              Meet Moonie
            </h2>
            <p className="mt-4 max-w-md text-center text-muted-foreground lg:text-left">
              Your friendly AI reading companion. Tell Moonie what you enjoy and
              get personalised web novel recommendations — never auto-generated
              reviews.
            </p>
            <Button className="mt-6" size="lg" onClick={handleOpenMoonie}>
              <Sparkles data-icon="inline-start" />
              Chat with Moonie
            </Button>
          </div>

          <Card className="bg-bg-elevated ring-border/50">
            <CardHeader>
              <div className="flex items-center gap-2 text-accent">
                <Sparkles size={16} aria-hidden="true" />
                <span className="text-xs font-medium uppercase tracking-wider">
                  Sample recommendation
                </span>
              </div>
              <CardTitle className="text-xl">
                {mockMoonieRecommendation.novelTitle}
              </CardTitle>
              <CardDescription>
                by {mockMoonieRecommendation.author}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {mockMoonieRecommendation.genres.map((genre) => (
                  <Badge key={genre} variant="secondary">
                    {genre}
                  </Badge>
                ))}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                &ldquo;{mockMoonieRecommendation.reason}&rdquo;
              </p>
              <p className="mt-4 text-xs text-muted-foreground/70">
                — Moonie, your reading companion
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
