"use client";

import { FormEvent, useState } from "react";

export default function TributeForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/tributes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        message: form.get("message"),
      }),
    });
    setState(response.ok ? "sent" : "error");
    if (response.ok) event.currentTarget.reset();
  }

  if (state === "sent")
    return (
      <p className="mt-7 border-l-2 border-[#c48a3a] px-4 py-3 text-sm leading-6 text-[#536b60]">
        Thank you. Your tribute has been sent to the family for review.
      </p>
    );

  return (
    <form onSubmit={submit} className="mt-7 space-y-3">
      <input
        required
        name="name"
        maxLength={80}
        className="w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
        placeholder="Your name"
      />
      <textarea
        required
        name="message"
        maxLength={2000}
        className="h-28 w-full resize-none border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
        placeholder="Your memory or message"
      />
      <button
        disabled={state === "sending"}
        className="rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {state === "sending" ? "Sending..." : "Send tribute"}
      </button>
      {state === "error" && (
        <p className="text-sm text-[#b8786f]">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
