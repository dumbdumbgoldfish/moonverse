import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { PolicyHero } from "@/components/legal/PolicyHero";
import { PolicyMobileToc } from "@/components/legal/PolicyMobileToc";
import { PolicyPageActions } from "@/components/legal/PolicyPageActions";
import { PolicySidebar } from "@/components/legal/PolicySidebar";
import { PolicyTableOfContents } from "@/components/legal/PolicyTableOfContents";
import type { PolicyRelatedLink, PolicySectionMeta, PolicyTheme } from "@/components/legal/types";
import { POLICY_LAST_UPDATED } from "@/components/legal/types";
import { cn } from "@/lib/utils";

interface PolicyPageLayoutProps {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  theme?: PolicyTheme;
  lastUpdated?: string;
  readingMinutes?: number;
  sections: PolicySectionMeta[];
  relatedLinks?: PolicyRelatedLink[];
  backHref?: string;
  backLabel?: string;
  showMoonieHelp?: boolean;
  formal?: boolean;
  showPrint?: boolean;
  notice?: React.ReactNode;
  children: React.ReactNode;
}

export function PolicyPageLayout({
  eyebrow,
  title,
  description,
  icon,
  theme = "community",
  lastUpdated = POLICY_LAST_UPDATED,
  readingMinutes,
  sections,
  relatedLinks,
  backHref,
  backLabel,
  showMoonieHelp = false,
  formal = false,
  showPrint = false,
  notice,
  children,
}: PolicyPageLayoutProps) {
  const resolvedBackHref =
    backHref ??
    (theme === "legal" || theme === "safety" ? "/safety" : "/community-standards");
  const resolvedBackLabel =
    backLabel ??
    (theme === "legal" || theme === "safety"
      ? "Safety and Legal"
      : "Community");

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#faf8ff]">
      <a
        href="#policy-main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-violet-800 focus:shadow-lg"
      >
        Skip to policy content
      </a>

      <main id="policy-main" className="flex-1">
        <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <PolicyHero
            eyebrow={eyebrow}
            title={title}
            description={description}
            icon={icon}
            lastUpdated={lastUpdated}
            readingMinutes={readingMinutes}
            formal={formal}
          />

          {notice && <div className="mt-6">{notice}</div>}

          <div className="mt-8 lg:mt-10">
            <PolicyMobileToc sections={sections} />
          </div>

          <div
            className={cn(
              "mt-6 grid items-start gap-8 lg:mt-8 lg:gap-10",
              "lg:grid-cols-[minmax(200px,260px)_minmax(0,760px)_minmax(200px,260px)]"
            )}
          >
            <div className="hidden h-fit self-start lg:sticky lg:top-28 lg:block print:hidden">
              <PolicyTableOfContents
                sections={sections}
                backHref={resolvedBackHref}
                backLabel={resolvedBackLabel}
              />
            </div>

            <div className="min-w-0">
              <PolicyPageActions showPrint={showPrint || formal} />
              <div
                className={cn(
                  "space-y-6",
                  formal && "[&_p]:max-w-[42rem]"
                )}
              >
                {children}
              </div>

              <p className="mt-10 text-sm leading-relaxed text-slate-500">
                Questions? Visit our{" "}
                <Link
                  href="/help"
                  className="font-semibold text-violet-700 underline-offset-2 hover:underline"
                >
                  Help Centre
                </Link>
                ,{" "}
                <Link
                  href="/contact"
                  className="font-semibold text-violet-700 underline-offset-2 hover:underline"
                >
                  Contact page
                </Link>{" "}
                or return{" "}
                <Link
                  href="/"
                  className="font-semibold text-violet-700 underline-offset-2 hover:underline"
                >
                  home
                </Link>
                .
              </p>
            </div>

            <div className="hidden xl:block print:hidden">
              <PolicySidebar
                relatedLinks={relatedLinks}
                showMoonieHelp={showMoonieHelp}
              />
            </div>
          </div>

          <div className="mt-8 xl:hidden print:hidden">
            <PolicySidebar
              relatedLinks={relatedLinks}
              showMoonieHelp={showMoonieHelp}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
