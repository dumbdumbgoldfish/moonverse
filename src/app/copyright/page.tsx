import Link from "next/link";
import { Copyright } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Copyright Policy | MoonVerse",
};

const sections = [
  { id: "respect-for-creators", title: "Respect for creators" },
  { id: "user-content", title: "User content" },
  { id: "reporting-infringement", title: "Reporting infringement" },
];

export default function CopyrightPage() {
  return (
    <PolicyPageLayout
      eyebrow="Safety and Legal"
      title="Copyright Policy"
      description="How MoonVerse respects copyright and creative ownership."
      icon={Copyright}
      theme="legal"
      formal
      showPrint
      readingMinutes={3}
      sections={sections}
      relatedLinks={[
        { href: "/dmca", label: "DMCA Policy" },
        { href: "/intellectual-property", label: "Intellectual Property" },
        { href: "/content-guidelines", label: "Content Guidelines" },
      ]}
    >
      <PolicySection id="respect-for-creators" number="01" title="Respect for creators">
        <p>
          MoonVerse is a review community. We do not host full novel text. Reviews
          should discuss works fairly and link to official sources when possible.
        </p>
      </PolicySection>

      <PolicySection id="user-content" number="02" title="User content">
        <p>
          You retain rights to reviews you write. Do not copy large portions of
          copyrighted work into reviews or comments.
        </p>
        <PolicyCallout type="important" title="Important">
          Quoting short excerpts for discussion is different from pasting large
          sections of a novel.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="reporting-infringement" number="03" title="Reporting infringement">
        <p>
          If you believe content on MoonVerse infringes your copyright, see our{" "}
          <Link href="/dmca">DMCA Policy</Link> for how to submit a notice.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
