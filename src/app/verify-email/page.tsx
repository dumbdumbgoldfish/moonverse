import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { AuthMarketingShell } from "@/components/auth/AuthMarketingShell";
import { getAuthShowcaseNovels } from "@/services/discovery.service";

export const metadata = {
  title: "Verify email · MoonVerse",
  description: "Verify your MoonVerse email address.",
};

export default async function VerifyEmailPage() {
  const showcaseNovels = await getAuthShowcaseNovels(3);

  return (
    <AuthMarketingShell showcaseNovels={showcaseNovels}>
      <VerifyEmailForm />
    </AuthMarketingShell>
  );
}
