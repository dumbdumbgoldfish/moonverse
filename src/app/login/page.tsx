import { LoginForm } from "@/components/auth/LoginForm";
import { AuthMarketingShell } from "@/components/auth/AuthMarketingShell";
import { getAuthShowcaseNovels } from "@/services/discovery.service";

export const metadata = {
  title: "Log in · MoonVerse",
  description: "Log in to your MoonVerse account.",
};

export default async function LoginPage() {
  const showcaseNovels = await getAuthShowcaseNovels(3);

  return (
    <AuthMarketingShell showcaseNovels={showcaseNovels}>
      <LoginForm />
    </AuthMarketingShell>
  );
}
