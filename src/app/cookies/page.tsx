import { Cookie } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Cookie Policy | MoonVerse",
};

const sections = [
  { id: "what-are-cookies", title: "What are cookies" },
  { id: "how-we-use-cookies", title: "How we use cookies" },
  { id: "your-choices", title: "Your choices" },
];

export default function CookiesPage() {
  return (
    <PolicyPageLayout
      eyebrow="Safety and Legal"
      title="Cookie Policy"
      description="How MoonVerse uses cookies and similar technologies."
      icon={Cookie}
      theme="legal"
      formal
      showPrint
      readingMinutes={3}
      sections={sections}
      relatedLinks={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/terms", label: "Terms of Service" },
        { href: "/accessibility", label: "Accessibility" },
      ]}
    >
      <PolicySection id="what-are-cookies" number="01" title="What are cookies">
        <p>
          Cookies are small text files stored on your device when you visit
          MoonVerse. They help us keep you signed in, remember preferences and
          understand how the site is used.
        </p>
      </PolicySection>

      <PolicySection id="how-we-use-cookies" number="02" title="How we use cookies">
        <p>
          We use essential cookies for authentication and security. We may use
          analytics cookies to improve performance and understand which features
          readers use most.
        </p>
        <PolicyCallout type="info" title="Essential cookies">
          Essential cookies are required for sign-in and core security features.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="your-choices" number="03" title="Your choices">
        <p>
          You can control cookies through your browser settings. Disabling essential
          cookies may limit sign-in and core features.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
