"use client";

import { FormEvent, useState } from "react";

export default function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        projectType: form.get("projectType"),
        message: form.get("message"),
      }),
    });
    setState(response.ok ? "sent" : "error");
    if (response.ok) event.currentTarget.reset();
  }

  if (state === "sent") {
    return (
      <p className="border-l-2 border-[#c48a3a] px-4 py-3 text-sm leading-6 text-[#536b60]">
        Thank you. Your enquiry has been received. We&apos;ll be in touch soon.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-[.14em] text-[#536b60]">
          Your name
          <input
            required
            name="name"
            maxLength={100}
            className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-[#8b9c8b]"
            placeholder="Your name"
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[.14em] text-[#536b60]">
          Email address
          <input
            required
            type="email"
            name="email"
            className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-[#8b9c8b]"
            placeholder="you@example.com"
          />
        </label>
      </div>
      <label className="block text-xs font-semibold uppercase tracking-[.14em] text-[#536b60]">
        What would you like to make?
        <select
          required
          name="projectType"
          defaultValue=""
          className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm font-normal normal-case tracking-normal outline-none"
        >
          <option value="" disabled>
            Select a project type
          </option>
          <option value="memorial">A memorial website</option>
          <option value="birthday">A birthday website</option>
          <option value="celebration">A celebration website</option>
          <option value="other">Something else</option>
        </select>
      </label>
      <label className="block text-xs font-semibold uppercase tracking-[.14em] text-[#536b60]">
        Tell us about it
        <textarea
          required
          name="message"
          maxLength={3000}
          className="mt-2 h-32 w-full resize-none border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm font-normal normal-case tracking-normal outline-none placeholder:text-[#8b9c8b]"
          placeholder="Who is it for, and what would you like the website to hold?"
        />
      </label>
      <button
        disabled={state === "sending"}
        className="rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold text-[#1f2d2b] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {state === "sending" ? "Sending..." : "Start a conversation"}
      </button>
      {state === "error" && (
        <p className="text-sm text-[#b8786f]">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
