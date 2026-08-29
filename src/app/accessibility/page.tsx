import Link from "next/link";
import { Accessibility } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Accessibility | MoonVerse",
};

const sections = [
  { id: "our-commitment", title: "Our commitment" },
  { id: "keyboard-navigation", title: "Keyboard navigation" },
  { id: "screen-reader-support", title: "Screen reader support" },
  { id: "colour-and-contrast", title: "Colour and contrast" },
  { id: "motion-preferences", title: "Motion preferences" },
  { id: "forms-and-validation", title: "Forms and validation" },
  { id: "known-limitations", title: "Known limitations" },
  { id: "requesting-support", title: "Requesting support" },
];

export default function AccessibilityPage() {
  return (
    <PolicyPageLayout
      eyebrow="Safety and Legal"
      title="Accessibility"
      description="Our commitment to making MoonVerse usable for everyone."
      icon={Accessibility}
      theme="legal"
      readingMinutes={5}
      sections={sections}
      relatedLinks={[
        { href: "/help", label: "Help Centre" },
        { href: "/contact", label: "Contact" },
        { href: "/community-standards", label: "Community Standards" },
      ]}
      notice={
        <PolicyCallout type="practice" title="Accessibility statement">
          MoonVerse should be readable, navigable and welcoming for people with
          disabilities. We follow web accessibility best practices as we build and
          improve the site. This page explains what we do today and how to request
          support.
        </PolicyCallout>
      }
    >
      <PolicySection id="our-commitment" number="01" title="Our commitment">
        <p>
          MoonVerse should be readable, navigable and welcoming for people with
          disabilities. We follow web accessibility best practices as we build and
          improve the site.
        </p>
      </PolicySection>

      <PolicySection id="keyboard-navigation" number="02" title="Keyboard navigation">
        <p>
          Core flows are designed to work with keyboard navigation. Interactive
          controls expose clear focus states so you can see where you are on the
          page.
        </p>
      </PolicySection>

      <PolicySection id="screen-reader-support" number="03" title="Screen reader support">
        <p>
          We use semantic HTML and descriptive labels across core pages. Images
          include alt text where it helps understanding.
        </p>
      </PolicySection>

      <PolicySection id="colour-and-contrast" number="04" title="Colour and contrast">
        <p>
          We aim for sufficient colour contrast across core pages. Meaning is never
          conveyed by colour alone.
        </p>
      </PolicySection>

      <PolicySection id="motion-preferences" number="05" title="Motion preferences">
        <p>
          Decorative motion respects reduced-motion preferences where supported so
          animation does not get in the way of reading.
        </p>
      </PolicySection>

      <PolicySection id="forms-and-validation" number="06" title="Forms and validation">
        <p>
          Forms use clear labels and validation messages. Errors are written in
          plain language so you can correct them without guessing.
        </p>
      </PolicySection>

      <PolicySection id="known-limitations" number="07" title="Known limitations">
        <p>
          Accessibility is continuous. We review new features before release and fix
          issues when they are reported. Some older or experimental surfaces may
          still need improvement.
        </p>
      </PolicySection>

      <PolicySection id="requesting-support" number="08" title="Requesting support">
        <p>
          If you encounter a barrier on MoonVerse tell us through the{" "}
          <Link href="/about">About page</Link> or{" "}
          <Link href="/contact">Contact page</Link>. Include the page URL and what
          you were trying to do so we can help.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
