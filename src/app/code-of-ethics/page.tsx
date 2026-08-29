import { Scale } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Code of Ethics | MoonVerse",
};

const sections = [
  { id: "reader-first", title: "Reader first" },
  { id: "transparency", title: "Transparency" },
  { id: "fair-moderation", title: "Fair moderation" },
  { id: "privacy-by-design", title: "Privacy by design" },
  { id: "responsible-ai", title: "Responsible AI" },
];

export default function CodeOfEthicsPage() {
  return (
    <PolicyPageLayout
      eyebrow="Community"
      title="Code of Ethics"
      description="Principles that guide how MoonVerse is built and moderated."
      icon={Scale}
      theme="community"
      readingMinutes={4}
      sections={sections}
      showMoonieHelp
      relatedLinks={[
        { href: "/trust-and-safety", label: "Trust and Safety" },
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/content-guidelines", label: "Content Guidelines" },
      ]}
    >
      <PolicySection id="reader-first" number="01" title="Reader first">
        <p>
          Decisions should help readers discover stories they love. Features exist
          to serve the community not to manipulate engagement.
        </p>
      </PolicySection>

      <PolicySection id="transparency" number="02" title="Transparency">
        <p>
          We explain how recommendations and Moonie suggestions work in plain
          language. We do not hide sponsored or automated content as organic
          reviews.
        </p>
      </PolicySection>

      <PolicySection id="fair-moderation" number="03" title="Fair moderation">
        <p>
          Rules apply consistently. Moderators act on behaviour and content not on
          personal disputes between members.
        </p>
      </PolicySection>

      <PolicySection id="privacy-by-design" number="04" title="Privacy by design">
        <p>
          We collect only what we need to run the platform. We do not trade personal
          data for short term gain.
        </p>
      </PolicySection>

      <PolicySection id="responsible-ai" number="05" title="Responsible AI">
        <p>
          Moonie assists discovery. It does not replace human judgment in reviews or
          community decisions. We test AI features for bias and safety before wide
          release.
        </p>
        <PolicyCallout type="moonie" title="Moonie note">
          Moonie is a guide for discovery. Your reviews and choices remain your own.
        </PolicyCallout>
      </PolicySection>
    </PolicyPageLayout>
  );
}
