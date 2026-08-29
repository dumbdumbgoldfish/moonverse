import Link from "next/link";
import { Flag } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Reporting Abuse | MoonVerse",
};

const sections = [
  { id: "when-to-report", title: "When to report" },
  { id: "what-to-include", title: "What information to provide" },
  { id: "how-to-report", title: "How to report" },
  { id: "what-happens-next", title: "What happens next" },
];

export default function ReportingAbusePage() {
  return (
    <PolicyPageLayout
      eyebrow="Safety and Legal"
      title="Reporting Abuse"
      description="How to report harmful or policy-breaking content on MoonVerse."
      icon={Flag}
      theme="safety"
      readingMinutes={4}
      sections={sections}
      relatedLinks={[
        { href: "/code-of-conduct", label: "Code of Conduct" },
        { href: "/community-standards", label: "Community Standards" },
        { href: "/contact", label: "Contact" },
      ]}
      notice={
        <PolicyCallout type="safety" title="Urgent safety notice">
          If you or someone else is in immediate danger, contact local emergency
          services first. MoonVerse moderation cannot replace emergency response.
        </PolicyCallout>
      }
    >
      <PolicySection id="when-to-report" number="01" title="When to report">
        <p>
          Report harassment, spam, hate speech, impersonation or content that breaks
          our Code of Conduct. Reports help moderators act quickly.
        </p>
        <ul>
          <li>Harassment or threats</li>
          <li>Hate speech or targeted abuse</li>
          <li>Spam and misleading promotion</li>
          <li>Impersonation or plagiarism</li>
        </ul>
      </PolicySection>

      <PolicySection id="what-to-include" number="02" title="What information to provide">
        <p>Clear reports are easier to review. Include:</p>
        <ul>
          <li>Links to the review, comment or profile</li>
          <li>A short description of what happened</li>
          <li>Any relevant usernames or timestamps</li>
        </ul>
      </PolicySection>

      <PolicySection id="how-to-report" number="03" title="How to report">
        <p>
          Use report options on reviews and comments where available. For urgent
          safety concerns contact us through the{" "}
          <Link href="/contact">Contact page</Link> with links to the content and a
          short description.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/contact"
            className="mv-nav-signup inline-flex h-11 min-h-[44px] items-center justify-center rounded-full border-0 px-5 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8C36A] focus-visible:ring-offset-2"
          >
            Contact support
          </Link>
          <span
            className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-xl border border-violet-200 bg-white px-5 text-sm font-semibold text-slate-500"
            title="In-app reporting is expanding across more surfaces"
          >
            In-app report tools where available
          </span>
        </div>
      </PolicySection>

      <PolicySection id="what-happens-next" number="04" title="What happens next">
        <p>
          Our team reviews reports against Community Standards. We may remove
          content, warn users or suspend accounts depending on severity.
        </p>
        <PolicyCallout type="info" title="After you report">
          We may not share every enforcement detail publicly but every report helps
          keep MoonVerse safer.
        </PolicyCallout>
      </PolicySection>
    </PolicyPageLayout>
  );
}
