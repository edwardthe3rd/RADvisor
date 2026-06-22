"use client";

import { FormEvent, useState } from "react";

const DEV_API_BASE = "http://127.0.0.1:8000";

function waitlistGatewayUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_WAITLIST_NOTIFY_URL?.trim();
  return fromEnv ? fromEnv.replace(/\/$/, "") : "";
}

type MessageKind = "success" | "error" | null;

export default function WaitlistForm() {
  const [message, setMessage] = useState("");
  const [messageKind, setMessageKind] = useState<MessageKind>(null);
  const [submitting, setSubmitting] = useState(false);

  function setStatus(text: string, kind: MessageKind) {
    setMessage(text);
    setMessageKind(kind);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("", null);

    const form = e.currentTarget;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement | null;
    const email = emailInput?.value.trim() ?? "";

    if (!email) {
      setStatus("Please enter your email address.", "error");
      emailInput?.focus();
      return;
    }

    setSubmitting(true);

    const gatewayUrl = waitlistGatewayUrl();
    const url = gatewayUrl || `${DEV_API_BASE}/api/v1/waitlist/`;
    const payload = JSON.stringify({ email });

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: payload,
      });

      const text = await res.text();
      let data: Record<string, unknown> | null = null;
      if (text) {
        try {
          data = JSON.parse(text) as Record<string, unknown>;
        } catch {
          data = null;
        }
      }

      if (res.ok) {
        let msg = "Thanks — we will notify you when RADvisor is live.";
        if (!gatewayUrl && data && typeof data.detail === "string") {
          msg = data.detail;
        }
        setStatus(msg, "success");
        if (emailInput) {
          emailInput.value = "";
        }
        return;
      }

      let errMsg = "Something went wrong. Please try again.";
      if (gatewayUrl && data && typeof data.error === "string") {
        errMsg = data.error;
      } else if (data?.full_name && Array.isArray(data.full_name) && data.full_name[0]) {
        errMsg = String(data.full_name[0]);
      } else if (data?.email && Array.isArray(data.email) && data.email[0]) {
        errMsg = String(data.email[0]);
      } else if (data && typeof data.detail === "string") {
        errMsg = data.detail;
      }
      setStatus(errMsg, "error");
    } catch (err) {
      let baseHint =
        "Is the waitlist API reachable? In local dev, set NEXT_PUBLIC_WAITLIST_NOTIFY_URL to your API Gateway endpoint. ";
      if (
        typeof window !== "undefined" &&
        window.location.protocol === "https:" &&
        /^http:\/\//i.test(url)
      ) {
        baseHint =
          "This page is HTTPS but the API URL is HTTP — the browser blocks that (mixed content). Use an HTTPS API URL or set NEXT_PUBLIC_WAITLIST_NOTIFY_URL. ";
      }
      const corsHint =
        "If the API is up, the browser may be blocking the request (CORS): add this page's origin to CORS_ALLOWED_ORIGINS on the server when DEBUG is false. ";
      const errMessage = err instanceof Error ? err.message : "";
      setStatus(
        (gatewayUrl
          ? "Could not reach the signup URL. Check NEXT_PUBLIC_WAITLIST_NOTIFY_URL, HTTPS, and API Gateway CORS. "
          : `Could not reach the server. ${baseHint}${corsHint}`) +
          `Tried: ${url}` +
          (errMessage ? ` (${errMessage})` : ""),
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const messageClass =
    messageKind === "success"
      ? "waitlist-message is-success"
      : messageKind === "error"
        ? "waitlist-message is-error"
        : "waitlist-message";

  return (
    <>
      <form className="waitlist-form" noValidate onSubmit={handleSubmit}>
        <div className="waitlist-form-inner">
          <div className="waitlist-form-row">
            <label className="sr-only" htmlFor="waitlist-email">
              Email address
            </label>
            <input
              id="waitlist-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
            <button type="submit" className="btn-primary" disabled={submitting}>
              Notify me
            </button>
          </div>
        </div>
      </form>
      <p className={messageClass} role="status" aria-live="polite">
        {message}
      </p>
    </>
  );
}
