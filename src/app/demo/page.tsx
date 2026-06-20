import Link from "next/link";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Demo Guide — MoonVerse",
  description: "Step-by-step guide for demonstrating MoonVerse.",
};

const demoSteps = [
  {
    title: "Log in",
    description:
      "Use a seed account (e.g. starreader@example.com / Password123!) or register a new account.",
    href: "/login",
    action: "Log in",
  },
  {
    title: "Browse reviews",
    description:
      "Open Reviews, search by title or author, filter by genre, and sort by latest, trending, or rating.",
    href: "/reviews",
    action: "Browse reviews",
  },
  {
    title: "Create a review",
    description:
      "Write a Review lets you pick an existing novel or add a new one, rate it, and publish your thoughts.",
    href: "/reviews/new",
    action: "Write a review",
  },
  {
    title: "Like and comment",
    description:
      "On any review detail page, like the review, leave a comment, or reply to existing comments.",
    href: "/reviews",
    action: "Open a review",
  },
  {
    title: "Save to folder",
    description:
      "Use Save to Folder on a review to add it to one or more collections, or create a folder inline.",
    href: "/folders",
    action: "View folders",
  },
  {
    title: "Follow a user",
    description:
      "Visit another member's profile and click Follow. They receive a NEW_FOLLOWER notification.",
    href: "/users/questlog",
    action: "View profile",
  },
  {
    title: "Check notifications",
    description:
      "Open the bell icon or Notifications page to see likes, comments, saves, and follows.",
    href: "/notifications",
    action: "Notifications",
  },
  {
    title: "Ask Moonie",
    description:
      "Click the moon button (bottom-right). Log in, then try a quick prompt like “Slow-burn romance”.",
    href: "/",
    action: "Open homepage",
  },
];

export default function DemoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <PageHeader
        title="MSc Demo Guide"
        description="A suggested walkthrough for demonstrating MoonVerse features in order."
      />

      <div className="mb-8 rounded-xl border border-border/60 bg-bg-elevated p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">Seed accounts (password: Password123!)</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>starreader@example.com — StarReader</li>
          <li>questlog@example.com — QuestLog</li>
          <li>cosmoreads@example.com — CosmoReads</li>
          <li>romancefan@example.com — RomanceFan42</li>
        </ul>
      </div>

      <ol className="space-y-6">
        {demoSteps.map((step, index) => (
          <li
            key={step.title}
            className="rounded-xl border border-border/60 bg-bg-elevated p-5"
          >
            <div className="flex items-start gap-4">
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
                <Button
                  className="mt-4"
                  size="sm"
                  variant="outline"
                  render={<Link href={step.href} />}
                >
                  {step.action}
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
