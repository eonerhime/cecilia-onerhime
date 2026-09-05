"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AcceptTermsForm({ token }: { token: string }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/accept-terms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, accepted: checked }),
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setError(result?.error || "Unable to continue.");
      return;
    }
    router.push("/admin");
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <p className="text-sm leading-6 text-[#536b60]">
        Before you can access the family workspace, please review and accept
        the site&apos;s{" "}
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
      </p>
      <label className="flex items-start gap-3 text-sm text-[#1f2d2b]">
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
          className="mt-1"
        />
        I have read and agree to the Privacy Policy and Terms of Use.
      </label>
      <button
        disabled={busy || !checked}
        className="w-full rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold text-[#1f2d2b] disabled:opacity-60"
      >
        {busy ? "Please wait..." : "Continue"}
      </button>
      {error && (
        <p className="border-l-2 border-[#b8786f] px-4 py-3 text-sm text-[#b8786f]">
          {error}
        </p>
      )}
    </form>
  );
}
