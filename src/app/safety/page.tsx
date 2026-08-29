import Link from "next/link";
import { Shield } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Safety Centre | MoonVerse",
};

const sections = [
  { id: "account-security", title: "Account security" },
  { id: "online-behaviour", title: "Online behaviour" },
  { id: "young-readers", title: "Young readers" },
];

export default function SafetyPage() {
  return (
    <PolicyPageLayout
      eyebrow="Safety and Legal"
      title="Safety Centre"
      description="Tools and guidance for staying safe on MoonVerse."
      icon={Shield}
      theme="safety"
      readingMinutes={3}
      sections={sections}
      relatedLinks={[
        { href: "/reporting-abuse", label: "Reporting Abuse" },
        { href: "/trust-and-safety", label: "Trust and Safety" },
        { href: "/privacy", label: "Privacy Policy" },
      ]}
    >
      <PolicySection id="account-security" number="01" title="Account security">
        <p>
          Use a strong unique password and do not share your login. Sign out on
          shared devices. Contact us if you suspect unauthorized access.
        </p>
        <PolicyCallout type="important" title="Protect your account">
          Never share your password in comments, reviews or direct messages.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="online-behaviour" number="02" title="Online behaviour">
        <p>
          Be cautious about sharing personal information in public reviews or
          comments. Block or report users who make you uncomfortable.
        </p>
        <PolicyCallout type="info" title="Need to report something?">
          Visit <Link href="/reporting-abuse">Reporting Abuse</Link> for next steps.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="young-readers" number="03" title="Young readers">
        <p>
          MoonVerse requires users to be at least 13. Parents and guardians should
          supervise younger teens and discuss safe online habits.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
