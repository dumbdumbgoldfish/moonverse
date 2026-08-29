import {
  AuthDeviceShowcase,
  type AuthShowcaseVariant,
} from "@/components/auth/AuthDeviceShowcase";
import { MoonieMascot } from "@/components/brand/MoonieMascot";
import { LITERARY_PAGE_BG } from "@/lib/literary-salon";
import type { AuthShowcaseNovel } from "@/services/discovery.service";
import { cn } from "@/lib/utils";

interface AuthMarketingShellProps {
  children: React.ReactNode;
  className?: string;
  variant?: AuthShowcaseVariant;
  showcaseNovels?: AuthShowcaseNovel[];
}

const MOBILE_COPY: Record<
  AuthShowcaseVariant,
  { eyebrow: string; heading: string; moonie: "happy" | "waving" }
> = {
  login: {
    eyebrow: "Welcome back",
    heading: "Your stacks are where you left them.",
    moonie: "happy",
  },
  register: {
    eyebrow: "Open a desk",
    heading: "Start a catalogue that knows your taste.",
    moonie: "waving",
  },
};

export function AuthMarketingShell({
  children,
  className,
  variant = "login",
  showcaseNovels = [],
}: AuthMarketingShellProps) {
  const mobile = MOBILE_COPY[variant];

  return (
    <div className={cn("relative flex flex-1 flex-col overflow-x-hidden", LITERARY_PAGE_BG, className)}>
      <div className="relative z-10 mx-auto grid w-full max-w-[1180px] flex-1 items-center gap-8 px-5 py-8 sm:px-6 sm:py-10 lg:grid-cols-2 lg:gap-12 lg:px-8 lg:py-12">
        <div className="lg:hidden">
          <div className="flex items-center gap-3 rounded-[22px] border border-[#6E46C7]/12 bg-[#FFFBFF] p-4 shadow-[0_16px_40px_-28px_rgba(76,53,196,0.4)]">
            <MoonieMascot
              size={56}
              variant={mobile.moonie}
              display="clean"
              lightweight
              priority
              className="shrink-0"
            />
            <div className="min-w-0 text-left">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6E46C7]">
                {mobile.eyebrow}
              </p>
              <p className="mt-0.5 font-serif text-lg font-bold leading-snug text-night-blue">
                {mobile.heading}
              </p>
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <AuthDeviceShowcase variant={variant} novels={showcaseNovels} />
        </div>

        <div className="mx-auto w-full max-w-[480px] lg:justify-self-end">{children}</div>
      </div>
    </div>
  );
}
