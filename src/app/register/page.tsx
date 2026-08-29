import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthMarketingShell } from "@/components/auth/AuthMarketingShell";
import { getAuthShowcaseNovels } from "@/services/discovery.service";

export const metadata = {
  title: "Sign up · MoonVerse",
  description: "Create a MoonVerse account to write reviews and join the community.",
};

export default async function RegisterPage() {
  const showcaseNovels = await getAuthShowcaseNovels(3);

  return (
    <AuthMarketingShell variant="register" showcaseNovels={showcaseNovels}>
      <RegisterForm />
    </AuthMarketingShell>
  );
}
