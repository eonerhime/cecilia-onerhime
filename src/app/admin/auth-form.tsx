"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup" | "forgot";

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    setNeedsVerification(false);

    if (mode === "login") {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => null);
      setBusy(false);
      if (!response.ok) {
        setError(result?.error || "Unable to sign in.");
        if (response.status === 403) setNeedsVerification(true);
        return;
      }
      router.refresh();
      return;
    }

    if (mode === "signup") {
      if (!acceptedTerms) {
        setBusy(false);
        setError(
          "You must accept the Privacy Policy and Terms of Use to create an account.",
        );
        return;
      }
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, acceptedTerms }),
      });
      const result = await response.json().catch(() => null);
      setBusy(false);
      if (!response.ok) {
        setError(result?.error || "Unable to create that account.");
        return;
      }
      setMessage(result?.data?.message || "Check your email for next steps.");
      return;
    }

    const response = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setError(result?.error || "Unable to send a reset link.");
      return;
    }
    setMessage(result?.data?.message || "Check your email for next steps.");
  }

  async function resendVerification() {
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/resend-verification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    setNeedsVerification(false);
    setMessage(result?.data?.message || "Check your email for next steps.");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setMessage("");
    setNeedsVerification(false);
  }

  return (
    <div>
      <a
        href="/api/auth/google"
        className="flex items-center justify-center gap-2 rounded-full bg-[#1f2d2b] px-6 py-3 text-sm font-semibold text-[#fbf8f2]"
      >
        Sign in with Google
      </a>

      <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[.2em] text-[#8b9c8b]">
        <span className="h-px flex-1 bg-[#d8cec0]" />
        or
        <span className="h-px flex-1 bg-[#d8cec0]" />
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          className="w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
        />
        {mode !== "forgot" && (
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            className="w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
          />
        )}
        {mode === "signup" && (
          <label className="flex items-start gap-3 text-sm text-[#536b60]">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(event) => setAcceptedTerms(event.target.checked)}
              className="mt-1"
            />
            <span>
              I agree to the{" "}
              <a
                href="/privacy"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                Privacy Policy
              </a>{" "}
              and{" "}
              <a
                href="/terms"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                Terms of Use
              </a>
              .
            </span>
          </label>
        )}
        <button
          disabled={busy || (mode === "signup" && !acceptedTerms)}
          className="w-full rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold text-[#1f2d2b] disabled:opacity-60"
        >
          {busy
            ? "Please wait..."
            : mode === "login"
              ? "Sign in"
              : mode === "signup"
                ? "Create account"
                : "Send reset link"}
        </button>
      </form>

      {error && (
        <p className="mt-4 border-l-2 border-[#b8786f] px-4 py-3 text-sm text-[#b8786f]">
          {error}
        </p>
      )}
      {needsVerification && (
        <button
          onClick={resendVerification}
          disabled={busy}
          className="mt-2 text-sm font-semibold text-[#536b60] underline underline-offset-4"
        >
          Resend verification email
        </button>
      )}
      {message && (
        <p className="mt-4 border-l-2 border-[#c48a3a] px-4 py-3 text-sm text-[#536b60]">
          {message}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-sm text-[#536b60]">
        {mode !== "login" && (
          <button
            onClick={() => switchMode("login")}
            className="underline underline-offset-4"
          >
            Sign in
          </button>
        )}
        {mode !== "signup" && (
          <button
            onClick={() => switchMode("signup")}
            className="underline underline-offset-4"
          >
            Create account
          </button>
        )}
        {mode !== "forgot" && (
          <button
            onClick={() => switchMode("forgot")}
            className="underline underline-offset-4"
          >
            Forgot password?
          </button>
        )}
      </div>
    </div>
  );
}
