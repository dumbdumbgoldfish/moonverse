import Link from "next/link";
import { HelpCircle } from "lucide-react";
import {
  PolicyPageLayout,
  PolicySection,
} from "@/components/legal";

export const metadata = {
  title: "FAQ | MoonVerse",
};

const FAQ_ITEMS = [
  {
    id: "is-moonverse-free",
    q: "Is MoonVerse free?",
    a: "Yes. Browsing reviews and creating an account is free. MoonVerse is supported by the community.",
  },
  {
    id: "does-moonverse-host-novels",
    q: "Does MoonVerse host novels?",
    a: "No. MoonVerse hosts reader reviews and links to official sources. We are a discovery and discussion platform.",
  },
  {
    id: "who-is-moonie",
    q: "Who is Moonie?",
    a: "Moonie is MoonVerse's AI reading assistant. Signed-in users can ask for recommendations grounded in community reviews.",
  },
  {
    id: "genres-and-tags",
    q: "How do genres and tags work?",
    a: "Browse genres from the navigation bar to filter reviews on the Search page. Refine further with up to five tags at once.",
  },
  {
    id: "delete-account",
    q: "Can I delete my account?",
    a: "Contact support through the Contact page and we will help you remove your account and associated data.",
  },
];

export default function FaqPage() {
  return (
    <PolicyPageLayout
      eyebrow="Help"
      title="Frequently Asked Questions"
      description="Quick answers about MoonVerse."
      icon={HelpCircle}
      theme="community"
      readingMinutes={3}
      backHref="/help"
      backLabel="Help Centre"
      sections={FAQ_ITEMS.map((item) => ({ id: item.id, title: item.q }))}
      relatedLinks={[
        { href: "/help", label: "Help Centre" },
        { href: "/contact", label: "Contact Us" },
        { href: "/about", label: "About MoonVerse" },
      ]}
    >
      {FAQ_ITEMS.map((item, index) => (
        <PolicySection
          key={item.id}
          id={item.id}
          number={String(index + 1).padStart(2, "0")}
          title={item.q}
        >
          <p>{item.a}</p>
        </PolicySection>
      ))}

      <p className="text-[1.0625rem] leading-relaxed text-slate-700">
        Still stuck? Visit the <Link href="/help">Help Centre</Link> or{" "}
        <Link href="/contact">Contact Us</Link>.
      </p>
    </PolicyPageLayout>
  );
}
