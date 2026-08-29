import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Privacy Policy | MoonVerse",
};

const sections = [
  { id: "what-we-collect", title: "What we collect" },
  { id: "how-we-use-it", title: "How we use it" },
  { id: "cookies-and-sessions", title: "Cookies and sessions" },
  { id: "your-choices", title: "Your choices" },
  { id: "security", title: "Security" },
];

export default function PrivacyPage() {
  return (
    <PolicyPageLayout
      eyebrow="Safety and Legal"
      title="Privacy Policy"
      description="How MoonVerse collects, uses and protects your information."
      icon={LockKeyhole}
      theme="legal"
      formal
      showPrint
      readingMinutes={5}
      sections={sections}
      relatedLinks={[
        { href: "/cookies", label: "Cookie Policy" },
        { href: "/terms", label: "Terms of Service" },
        { href: "/contact", label: "Contact" },
      ]}
    >
      <PolicySection id="what-we-collect" number="01" title="What we collect">
        <p>
          When you register we store your email, username, display name and password
          as a one-way password hash. We also keep reviews, comments and activity
          needed to run the community.
        </p>
      </PolicySection>

      <PolicySection id="how-we-use-it" number="02" title="How we use it">
        <p>
          We use your data to operate your account, show your profile and reviews,
          send notifications you opt into and improve recommendations through Moonie.
        </p>
      </PolicySection>

      <PolicySection id="cookies-and-sessions" number="03" title="Cookies and sessions">
        <p>
          MoonVerse uses session cookies so you stay signed in. The guest Moonie
          demo uses a temporary identifier to enforce its turn allowance. We do
          not sell your personal data to advertisers.
        </p>
        <PolicyCallout type="info" title="Related">
          See our <Link href="/cookies">Cookie Policy</Link> for more detail.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="moonie-data" number="04" title="Moonie recommendation data">
        <p>
          Moonie stores conversation messages, editable taste preferences and
          recommendation feedback so it can maintain conversation context and
          avoid suggestions you have rejected. OpenAI may be used only to improve
          explanations for titles already selected from the MoonVerse catalogue.
        </p>
      </PolicySection>

      <PolicySection id="your-choices" number="05" title="Your choices">
        <p>
          You can update your profile and reset Moonie taste data in settings. To
          delete your account contact support through the{" "}
          <Link href="/about">About page</Link>.
        </p>
      </PolicySection>

      <PolicySection id="security" number="06" title="Security">
        <p>
          We apply industry standard measures to protect stored data. No online
          service can guarantee perfect security but we work to reduce risk.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
