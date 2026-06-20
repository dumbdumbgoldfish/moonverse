import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Log in — MoonVerse",
  description: "Log in to your MoonVerse account.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <LoginForm />
    </div>
  );
}
