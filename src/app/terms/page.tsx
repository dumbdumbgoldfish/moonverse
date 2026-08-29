import { FileText } from "lucide-react";
import {
  PolicyCallout,
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "Terms of Service | MoonVerse",
};

const sections = [
  { id: "using-moonverse", title: "Using MoonVerse" },
  { id: "your-account", title: "Your account" },
  { id: "your-content", title: "Your content" },
  { id: "acceptable-use", title: "Acceptable use" },
  { id: "changes", title: "Changes" },
];

export default function TermsPage() {
  return (
    <PolicyPageLayout
      eyebrow="Safety and Legal"
      title="Terms of Service"
      description="The agreement between you and MoonVerse when you use our platform."
      icon={FileText}
      theme="legal"
      formal
      showPrint
      readingMinutes={5}
      sections={sections}
      relatedLinks={[
        { href: "/privacy", label: "Privacy Policy" },
        { href: "/content-guidelines", label: "Content Guidelines" },
        { href: "/code-of-conduct", label: "Code of Conduct" },
      ]}
    >
      <PolicySection id="using-moonverse" number="01" title="Using MoonVerse">
        <p>
          MoonVerse is a community for discovering web novels and sharing honest
          reviews. By creating an account or browsing as a guest you agree to follow
          these terms and our community policies.
        </p>
      </PolicySection>

      <PolicySection id="your-account" number="02" title="Your account">
        <p>
          You are responsible for keeping your login details safe. Choose a strong
          password and do not share your account with anyone else. You must provide
          accurate information when you register.
        </p>
      </PolicySection>

      <PolicySection id="your-content" number="03" title="Your content">
        <p>
          You keep ownership of reviews and comments you post. By posting on
          MoonVerse you grant us a license to display and distribute that content on
          the platform so other readers can discover it.
        </p>
      </PolicySection>

      <PolicySection id="acceptable-use" number="04" title="Acceptable use">
        <p>
          Do not post illegal content, spam, harassment or material that infringes
          someone else&apos;s rights. We may remove content or suspend accounts that
          break our Code of Conduct or Content Guidelines.
        </p>
        <PolicyCallout type="important" title="Important">
          Using MoonVerse means following both these terms and our community
          policies.
        </PolicyCallout>
      </PolicySection>

      <PolicySection id="changes" number="05" title="Changes">
        <p>
          We may update these terms as MoonVerse grows. Continued use after changes
          means you accept the updated terms.
        </p>
      </PolicySection>
    </PolicyPageLayout>
  );
}
