import { Shield } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Trust and Safety | MoonVerse",
};

const sections = [
  { id: "our-approach", title: "Our approach" },
  { id: "moderation", title: "Moderation" },
  { id: "transparency", title: "Transparency" },
];

export default function TrustAndSafetyPage() {
  return (
    <PolicyPageLayout
      eyebrow="Community"
      title="Trust and Safety"
      description="How MoonVerse builds a trustworthy reading community."
      icon={Shield}
      theme="community"
      readingMinutes={3}
      sections={sections}
      relatedLinks={[
        { href: "/safety", label: "Safety Centre" },
        { href: "/code-of-ethics", label: "Code of Ethics" },
        { href: "/moderation-guidelines", label: "Moderation Guidelines" },
      ]}
    >
      <PolicySection id="our-approach" number="01" title="Our approach">
        <p>
          Trust and safety combine clear policies, reporting tools and moderation
          focused on keeping MoonVerse welcoming for readers and reviewers.
        </p>
      </PolicySection>

      <PolicySection id="moderation" number="02" title="Moderation">
        <p>
          We review reported content against our Code of Conduct and Content
          Guidelines. Repeated or severe violations may lead to account suspension.
        </p>
        <PolicyCallout type="info" title="Working together">
          Community reports help us act faster. Clear policies help everyone know
          what to expect.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="transparency" number="03" title="Transparency">
        <p>
          Policy updates are published on this site. Serious enforcement actions
          follow the principles in our Code of Ethics.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
