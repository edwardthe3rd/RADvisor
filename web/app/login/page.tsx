import { Suspense } from "react";
import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import LoginForm from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-md px-4 py-12">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </main>
    </>
  );
}
