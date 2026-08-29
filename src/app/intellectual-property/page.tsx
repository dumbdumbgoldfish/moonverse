import Link from "next/link";
import { Copyright } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Intellectual Property | MoonVerse",
};

const sections = [
  { id: "moonverse-brand", title: "MoonVerse brand" },
  { id: "novel-rights", title: "Novel rights" },
  { id: "your-reviews", title: "Your reviews" },
];

export default function IntellectualPropertyPage() {
  return (
    <PolicyPageLayout
      eyebrow="Safety and Legal"
      title="Intellectual Property"
      description="Ownership and use of intellectual property on MoonVerse."
      icon={Copyright}
      theme="legal"
      formal
      showPrint
      readingMinutes={3}
      sections={sections}
      relatedLinks={[
        { href: "/copyright", label: "Copyright Policy" },
        { href: "/terms", label: "Terms of Service" },
        { href: "/dmca", label: "DMCA Policy" },
      ]}
    >
      <PolicySection id="moonverse-brand" number="01" title="MoonVerse brand">
        <p>
          The MoonVerse name, Moonie character and site design are protected. Do not
          use our branding in a way that suggests official endorsement without
          permission.
        </p>
      </PolicySection>

      <PolicySection id="novel-rights" number="02" title="Novel rights">
        <p>
          Novels discussed on MoonVerse belong to their authors and publishers.
          MoonVerse does not claim ownership of third-party works.
        </p>
      </PolicySection>

      <PolicySection id="your-reviews" number="03" title="Your reviews">
        <p>
          You grant MoonVerse a license to display reviews you post so other readers
          can discover them. You may delete your content subject to our{" "}
          <Link href="/terms">Terms of Service</Link>.
        </p>
        <PolicyCallout type="info" title="Your voice">
          Your reviews remain your writing. The license exists so other readers can
          find them on the platform.
        </PolicyCallout>
      </PolicySection>
    </PolicyPageLayout>
  );
}
