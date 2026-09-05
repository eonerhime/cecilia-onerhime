"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const response = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const result = await response.json().catch(() => null);
    setBusy(false);
    if (!response.ok) {
      setError(result?.error || "Unable to reset your password.");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div>
        <p className="text-sm leading-6 text-[#536b60]">
          Your password has been updated. You can now sign in with it.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1f2d2b] px-6 py-3 text-sm font-semibold text-[#fbf8f2]"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        required
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="New password"
        className="w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
      />
      <button
        disabled={busy}
        className="w-full rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold text-[#1f2d2b] disabled:opacity-60"
      >
        {busy ? "Please wait..." : "Set new password"}
      </button>
      {error && (
        <p className="border-l-2 border-[#b8786f] px-4 py-3 text-sm text-[#b8786f]">
          {error}
        </p>
      )}
    </form>
  );
}
