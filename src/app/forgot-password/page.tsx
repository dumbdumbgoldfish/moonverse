import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { AuthMarketingShell } from "@/components/auth/AuthMarketingShell";
import { getAuthShowcaseNovels } from "@/services/discovery.service";

export const metadata = {
  title: "Forgot password · MoonVerse",
  description: "Reset your MoonVerse password.",
};

export default async function ForgotPasswordPage() {
  const showcaseNovels = await getAuthShowcaseNovels(3);

  return (
    <AuthMarketingShell showcaseNovels={showcaseNovels}>
      <ForgotPasswordForm />
    </AuthMarketingShell>
  );
}
