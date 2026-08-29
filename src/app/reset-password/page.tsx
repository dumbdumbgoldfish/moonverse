import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { AuthMarketingShell } from "@/components/auth/AuthMarketingShell";
import { getAuthShowcaseNovels } from "@/services/discovery.service";

export const metadata = {
  title: "Reset password · MoonVerse",
  description: "Choose a new MoonVerse password.",
};

export default async function ResetPasswordPage() {
  const showcaseNovels = await getAuthShowcaseNovels(3);

  return (
    <AuthMarketingShell showcaseNovels={showcaseNovels}>
      <ResetPasswordForm />
    </AuthMarketingShell>
  );
}
