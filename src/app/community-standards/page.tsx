import { ShieldCheck } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Community Standards | MoonVerse",
};

const sections = [
  { id: "welcome-new-readers", title: "Welcome new readers" },
  { id: "honest-reviews", title: "Honest reviews" },
  { id: "thoughtful-engagement", title: "Thoughtful engagement" },
  { id: "respect-boundaries", title: "Respect boundaries" },
];

export default function CommunityStandardsPage() {
  return (
    <PolicyPageLayout
      eyebrow="Community"
      title="Community Standards"
      description="What good participation looks like on MoonVerse."
      icon={ShieldCheck}
      theme="community"
      readingMinutes={3}
      sections={sections}
      relatedLinks={[
        { href: "/content-guidelines", label: "Content Guidelines" },
        { href: "/code-of-conduct", label: "Code of Conduct" },
        { href: "/code-of-ethics", label: "Code of Ethics" },
      ]}
    >
      <PolicySection id="welcome-new-readers" number="01" title="Welcome new readers">
        <p>
          MoonVerse grows when people feel included. Answer questions kindly and
          point newcomers toward stories they might enjoy.
        </p>
      </PolicySection>

      <PolicySection id="honest-reviews" number="02" title="Honest reviews">
        <p>
          Share your real opinion. Disclose spoilers clearly. Rate stories fairly
          based on your experience.
        </p>
        <PolicyCallout type="practice" title="Good practice">
          Write the review you would want to find before starting a new series.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="thoughtful-engagement" number="03" title="Thoughtful engagement">
        <p>
          Like and comment when a review helps you. Meaningful feedback matters more
          than empty reactions.
        </p>
      </PolicySection>

      <PolicySection id="respect-boundaries" number="04" title="Respect boundaries">
        <p>
          Do not pressure others to read or write specific genres. Everyone chooses
          their own path through the MoonVerse.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
