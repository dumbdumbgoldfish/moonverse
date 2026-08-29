import Link from "next/link";
import { BookOpenCheck } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Content Guidelines | MoonVerse",
};

const sections = [
  { id: "reviews-and-discussions", title: "Reviews and discussions" },
  { id: "spoilers", title: "Spoilers" },
  { id: "sensitive-topics", title: "Sensitive topics" },
  { id: "copyright-and-piracy", title: "Copyright and piracy" },
  { id: "ai-and-moonie", title: "AI and Moonie" },
  { id: "harassment", title: "Harassment and harmful behaviour" },
  { id: "promotion-and-spam", title: "Promotion and spam" },
  { id: "enforcement", title: "Enforcement" },
  { id: "appeals-and-reporting", title: "Appeals and reporting" },
];

export default function ContentGuidelinesPage() {
  return (
    <PolicyPageLayout
      eyebrow="Community"
      title="Content Guidelines"
      description="What belongs on MoonVerse and what we may remove."
      icon={BookOpenCheck}
      theme="community"
      readingMinutes={5}
      sections={sections}
      showMoonieHelp
      relatedLinks={[
        { href: "/community-standards", label: "Community Standards" },
        { href: "/code-of-conduct", label: "Code of Conduct" },
        { href: "/reporting-abuse", label: "Reporting Abuse" },
      ]}
    >
      <PolicySection id="reviews-and-discussions" number="01" title="Reviews and discussions">
        <p>
          Content should relate to web novels, reading experiences or the MoonVerse
          community. Off-topic spam and repetitive promotion are not allowed.
        </p>
        <PolicyCallout type="practice" title="Allowed">
          <ul>
            <li>A personal opinion about a novel</li>
            <li>Genre discussions and reading recommendations</li>
            <li>A link to an official publisher page</li>
          </ul>
        </PolicyCallout>
        <PolicyCallout type="important" title="Not allowed">
          <ul>
            <li>Repetitive promotional posts</li>
            <li>Unrelated spam or misleading links</li>
          </ul>
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="spoilers" number="02" title="Spoilers">
        <p>
          Mark major plot points in reviews and comments. Readers should choose when
          they see spoilers.
        </p>
        <PolicyCallout type="practice" title="Good practice">
          A spoiler marked clearly so others can decide before reading further.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="sensitive-topics" number="03" title="Sensitive topics">
        <p>
          You may discuss mature themes when they appear in fiction. Do not glorify
          real-world violence, hate or illegal activity.
        </p>
      </PolicySection>

      <PolicySection id="copyright-and-piracy" number="04" title="Copyright and piracy">
        <p>
          Do not upload full novel chapters or pirated material. Link to official
          sources when you recommend a title.
        </p>
        <PolicyCallout type="safety" title="Not allowed">
          <ul>
            <li>Uploading full novel chapters</li>
            <li>Posting pirated download links</li>
          </ul>
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="ai-and-moonie" number="05" title="AI-generated content and Moonie">
        <p>
          Moonie suggestions are starting points. Your own reviews and taste should
          lead your reading choices.
        </p>
        <PolicyCallout type="moonie" title="Moonie note">
          Moonie helps you discover stories. It does not replace your voice in
          reviews or community conversations.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="harassment" number="06" title="Harassment and harmful behaviour">
        <p>
          Targeted harassment, threats and personal attacks are not allowed. Debate
          stories and ideas without attacking people.
        </p>
        <PolicyCallout type="safety" title="Report harmful behaviour">
          If someone makes you feel unsafe, use{" "}
          <Link href="/reporting-abuse">Reporting Abuse</Link> or our{" "}
          <Link href="/contact">Contact page</Link>.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="promotion-and-spam" number="07" title="Promotion and spam">
        <p>
          Occasional sharing of your own reviews or reading lists is welcome.
          Repeated promotional posts and unrelated advertising are not.
        </p>
      </PolicySection>

      <PolicySection id="enforcement" number="08" title="Enforcement">
        <p>
          Moderators may warn, remove content or suspend accounts that violate these
          guidelines. Serious or repeated violations can lead to permanent removal.
        </p>
      </PolicySection>

      <PolicySection id="appeals-and-reporting" number="09" title="Appeals and reporting">
        <p>
          Report content that breaks these guidelines through available report tools
          or the <Link href="/reporting-abuse">Reporting Abuse</Link> page. If you
          believe a decision was made in error, contact us through the{" "}
          <Link href="/help">Help Centre</Link>.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
