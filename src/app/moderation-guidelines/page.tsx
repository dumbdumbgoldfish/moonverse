import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Moderation Guidelines | MoonVerse",
};

const sections = [
  { id: "our-approach", title: "Our approach" },
  { id: "what-we-review", title: "What we review" },
  { id: "actions-we-may-take", title: "Actions we may take" },
  { id: "appeals", title: "Appeals" },
  { id: "transparency", title: "Transparency" },
];

export default function ModerationGuidelinesPage() {
  return (
    <PolicyPageLayout
      eyebrow="Community"
      title="Moderation Guidelines"
      description="How MoonVerse reviews reports, enforces policies and keeps the community safe."
      icon={ShieldCheck}
      theme="community"
      readingMinutes={4}
      sections={sections}
      relatedLinks={[
        { href: "/code-of-conduct", label: "Code of Conduct" },
        { href: "/content-guidelines", label: "Content Guidelines" },
        { href: "/reporting-abuse", label: "Reporting Abuse" },
      ]}
    >
      <PolicySection id="our-approach" number="01" title="Our approach">
        <p>
          Moderation on MoonVerse is guided by our Community Standards, Code of
          Conduct and Content Guidelines. We aim to act quickly, fairly and
          transparently.
        </p>
      </PolicySection>

      <PolicySection id="what-we-review" number="02" title="What we review">
        <p>
          Reports may cover harassment, spam, plagiarism, impersonation, hate speech,
          sexual content involving minors, threats and other violations of our
          policies.
        </p>
        <PolicyCallout type="important" title="Priority reports">
          Safety risks and content involving minors are reviewed with the highest
          urgency.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="actions-we-may-take" number="03" title="Actions we may take">
        <p>
          Depending on severity, moderators may remove content, issue warnings,
          restrict features or suspend accounts. Repeated or serious violations can
          lead to permanent removal.
        </p>
      </PolicySection>

      <PolicySection id="appeals" number="04" title="Appeals">
        <p>
          If you believe a moderation decision was made in error, contact us through
          the <Link href="/help">Help Centre</Link> with your username and a link to
          the affected content.
        </p>
      </PolicySection>

      <PolicySection id="transparency" number="05" title="Transparency">
        <p>
          We do not discuss individual moderation cases publicly. We may update these
          guidelines as our community grows and new risks emerge.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
