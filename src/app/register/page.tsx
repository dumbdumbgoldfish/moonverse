import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Sign up — MoonVerse",
  description: "Create a MoonVerse account to write reviews and join the community.",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 sm:py-16">
      <RegisterForm />
    </div>
  );
}
