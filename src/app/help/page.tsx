import Link from "next/link";
import { HelpCircle } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Help Centre | MoonVerse",
};

const sections = [
  { id: "getting-started", title: "Getting started" },
  { id: "writing-reviews", title: "Writing reviews" },
  { id: "moonie-assistant", title: "Moonie assistant" },
  { id: "more-help", title: "More help" },
];

export default function HelpPage() {
  return (
    <PolicyPageLayout
      eyebrow="Help"
      title="Help Centre"
      description="Guides to get the most out of MoonVerse."
      icon={HelpCircle}
      theme="community"
      readingMinutes={3}
      showMoonieHelp
      backHref="/"
      backLabel="Back to home"
      sections={sections}
      relatedLinks={[
        { href: "/faq", label: "FAQ" },
        { href: "/contact", label: "Contact Us" },
        { href: "/reporting-abuse", label: "Reporting Abuse" },
      ]}
    >
      <PolicySection id="getting-started" number="01" title="Getting started">
        <p>
          Create a free account to write reviews, save stories to folders and chat
          with Moonie. Browse genres from the navigation bar or search for reviews
          and reader profiles.
        </p>
      </PolicySection>

      <PolicySection id="writing-reviews" number="02" title="Writing reviews">
        <p>
          Open Write in the navigation bar and choose Create a New Review. Pick a
          novel, add a star rating and share your honest take. Long thoughtful
          reviews help other readers most.
        </p>
      </PolicySection>

      <PolicySection id="moonie-assistant" number="03" title="Moonie assistant">
        <p>
          Signed-in users can ask Moonie for recommendations by mood, genre or
          similarity to books they already love.
        </p>
        <PolicyCallout type="moonie" title="Ask Moonie">
          Moonie is best when you share what you enjoy reading and what mood you are
          in.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="more-help" number="04" title="More help">
        <p>
          See our <Link href="/faq">FAQ</Link> for quick answers or{" "}
          <Link href="/contact">Contact Us</Link> if you need direct support.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
