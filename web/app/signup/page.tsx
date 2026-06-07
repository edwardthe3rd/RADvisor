import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SignupForm from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Sign up",
  robots: { index: false },
};

export default function SignupPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 py-12">
        <SignupForm />
      </main>
    </>
  );
}
