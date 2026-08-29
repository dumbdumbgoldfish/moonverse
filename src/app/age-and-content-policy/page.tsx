import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Age and Content Policy | MoonVerse",
};

const sections = [
  { id: "minimum-age", title: "Minimum age" },
  { id: "mature-content", title: "Mature content" },
  { id: "content-we-do-not-allow", title: "Content we do not allow" },
  { id: "warnings-and-tags", title: "Warnings and tags" },
  { id: "reporting", title: "Reporting" },
];

export default function AgeAndContentPolicyPage() {
  return (
    <PolicyPageLayout
      eyebrow="Safety and Legal"
      title="Age and Content Policy"
      description="How MoonVerse handles age requirements, mature themes and content warnings."
      icon={BookOpenCheck}
      theme="safety"
      readingMinutes={4}
      sections={sections}
      relatedLinks={[
        { href: "/content-guidelines", label: "Content Guidelines" },
        { href: "/reporting-abuse", label: "Reporting Abuse" },
        { href: "/safety", label: "Safety Centre" },
      ]}
    >
      <PolicySection id="minimum-age" number="01" title="Minimum age">
        <p>
          MoonVerse is intended for readers aged 13 and older. Users under 18 should
          review this policy with a parent or guardian before creating an account.
        </p>
      </PolicySection>

      <PolicySection id="mature-content" number="02" title="Mature content">
        <p>
          Web novels may include violence, romance, horror or other mature themes.
          Reviews should describe content honestly without glorifying harm or
          illegal activity.
        </p>
      </PolicySection>

      <PolicySection id="content-we-do-not-allow" number="03" title="Content we do not allow">
        <p>
          Sexual content involving minors, non-consensual sexual content, credible
          threats, doxxing and content that promotes self-harm or terrorism are
          prohibited.
        </p>
        <PolicyCallout type="safety" title="Zero tolerance">
          Content involving the exploitation of minors is never allowed and will be
          acted on urgently.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="warnings-and-tags" number="04" title="Warnings and tags">
        <p>
          Reviewers are encouraged to use tags and clear language so readers can
          make informed choices. MoonVerse may remove content that lacks appropriate
          context for extreme material.
        </p>
      </PolicySection>

      <PolicySection id="reporting" number="05" title="Reporting">
        <p>
          If you encounter content that violates this policy, use the report tools
          or visit our <Link href="/reporting-abuse">Reporting Abuse</Link> page. We
          prioritise reports involving safety risks.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
