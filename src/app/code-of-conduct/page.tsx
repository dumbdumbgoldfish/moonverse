import Link from "next/link";
import { Handshake } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Code of Conduct | MoonVerse",
};

const sections = [
  { id: "be-respectful", title: "Be respectful" },
  { id: "no-harassment", title: "No harassment" },
  { id: "give-credit", title: "Give credit" },
  { id: "keep-it-constructive", title: "Keep it constructive" },
  { id: "enforcement", title: "Enforcement" },
];

export default function CodeOfConductPage() {
  return (
    <PolicyPageLayout
      eyebrow="Community"
      title="Code of Conduct"
      description="How we expect every member of MoonVerse to treat each other."
      icon={Handshake}
      theme="community"
      readingMinutes={4}
      sections={sections}
      relatedLinks={[
        { href: "/community-standards", label: "Community Standards" },
        { href: "/reporting-abuse", label: "Reporting Abuse" },
        { href: "/moderation-guidelines", label: "Moderation Guidelines" },
      ]}
    >
      <PolicySection id="be-respectful" number="01" title="Be respectful">
        <p>
          Debate stories and ideas without attacking people. Disagree with a review,
          not the reviewer.
        </p>
      </PolicySection>

      <PolicySection id="no-harassment" number="02" title="No harassment">
        <p>
          Threats, slurs, stalking and targeted abuse are not allowed. Report
          behaviour that makes you or others feel unsafe.
        </p>
        <PolicyCallout type="safety" title="Safety first">
          Use <Link href="/reporting-abuse">Reporting Abuse</Link> when something
          feels harmful or urgent.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="give-credit" number="03" title="Give credit">
        <p>
          Respect authors and fellow readers. Do not plagiarise reviews or
          impersonate other users.
        </p>
      </PolicySection>

      <PolicySection id="keep-it-constructive" number="04" title="Keep it constructive">
        <p>
          Critical reviews are welcome when they focus on the work. Personal
          attacks, dogpiling and brigading are not.
        </p>
      </PolicySection>

      <PolicySection id="enforcement" number="05" title="Enforcement">
        <p>
          Moderators may warn, remove content or suspend accounts that violate this
          code. Serious or repeated violations can lead to permanent removal.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
