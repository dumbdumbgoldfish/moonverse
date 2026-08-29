import Link from "next/link";
import { Mail } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Contact Us | MoonVerse",
};

const sections = [
  { id: "general-enquiries", title: "General enquiries" },
  { id: "abuse-and-copyright", title: "Abuse and copyright" },
  { id: "press-and-partnerships", title: "Press and partnerships" },
];

export default function ContactPage() {
  return (
    <PolicyPageLayout
      eyebrow="Help"
      title="Contact Us"
      description="Reach the MoonVerse team for support, feedback or policy questions."
      icon={Mail}
      theme="community"
      readingMinutes={2}
      backHref="/help"
      backLabel="Help Centre"
      sections={sections}
      relatedLinks={[
        { href: "/help", label: "Help Centre" },
        { href: "/reporting-abuse", label: "Reporting Abuse" },
        { href: "/dmca", label: "DMCA Policy" },
      ]}
    >
      <PolicySection id="general-enquiries" number="01" title="General enquiries">
        <p>
          For questions about your account, reviews or the platform email
          support@moonverse.app. We aim to respond within a few business days.
        </p>
        <PolicyCallout type="info" title="Email support">
          <a href="mailto:support@moonverse.app">support@moonverse.app</a>
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="abuse-and-copyright" number="02" title="Abuse and copyright">
        <p>
          For abuse reports see <Link href="/reporting-abuse">Reporting Abuse</Link>
          . For copyright issues see <Link href="/dmca">DMCA Policy</Link>.
        </p>
      </PolicySection>

      <PolicySection id="press-and-partnerships" number="03" title="Press and partnerships">
        <p>
          For media or partnership enquiries use the same support address with a
          clear subject line so we can route your message.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
