import { loginAction } from "../actions";

export const metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <h1 className="mb-4 text-2xl font-extrabold text-ink-primary">
        RADvisor admin
      </h1>
      {searchParams.error && (
        <p className="mb-3 rounded-lg bg-brand-primaryLight px-3 py-2 text-sm text-feedback-danger">
          Wrong secret (or ADMIN_SECRET is not configured on the server).
        </p>
      )}
      <form action={loginAction} className="flex flex-col gap-3">
        <input
          type="password"
          name="secret"
          required
          autoFocus
          placeholder="Admin secret"
          className="rounded-lg border border-surface-border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-primary px-4 py-2.5 font-bold text-white hover:bg-brand-primaryDark"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
