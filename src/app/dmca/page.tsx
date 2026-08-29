import Link from "next/link";
import { FileWarning } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "DMCA Policy | MoonVerse",
};

const sections = [
  { id: "copyright-complaints", title: "Copyright complaints" },
  { id: "required-information", title: "Required information" },
  { id: "counter-notices", title: "Counter-notices" },
];

export default function DmcaPage() {
  return (
    <PolicyPageLayout
      eyebrow="Safety and Legal"
      title="DMCA Policy"
      description="How to submit copyright takedown requests on MoonVerse."
      icon={FileWarning}
      theme="legal"
      formal
      showPrint
      readingMinutes={3}
      sections={sections}
      relatedLinks={[
        { href: "/copyright", label: "Copyright Policy" },
        { href: "/intellectual-property", label: "Intellectual Property" },
        { href: "/contact", label: "Contact" },
      ]}
    >
      <PolicySection id="copyright-complaints" number="01" title="Copyright complaints">
        <p>
          MoonVerse responds to valid notices under applicable copyright law. If you
          believe material on the platform infringes your rights, contact us with
          enough detail for us to locate the content.
        </p>
      </PolicySection>

      <PolicySection id="required-information" number="02" title="Required information">
        <p>
          Include your contact details, a description of the copyrighted work, the
          URL of the material in question and a statement that you believe the use
          is not authorized.
        </p>
        <PolicyCallout type="important" title="Complete notices">
          Incomplete notices may delay review. Include enough detail for us to find
          the content quickly.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="counter-notices" number="03" title="Counter-notices">
        <p>
          If your content was removed in error you may submit a counter-notice
          following the process described in our{" "}
          <Link href="/contact">Contact page</Link>.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
