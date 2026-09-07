"use client";

import { FormEvent, useState } from "react";
import { upload } from "@vercel/blob/client";

export default function TributeForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);
    const message = typeof form.get("message") === "string" ? (form.get("message") as string).trim() : "";

    if (!message && !pdfFile) {
      setErrorMessage("Please write a message or attach a letter.");
      setState("error");
      return;
    }

    setState("sending");

    let pdfUrl = "";
    if (pdfFile) {
      try {
        // Uploaded directly to Blob (bypassing our own API route as a
        // request body) since Vercel serverless functions cap the body at
        // ~4.5MB, well under what a scanned letter can be.
        const blob = await upload(`memorial/tributes/${crypto.randomUUID()}-${pdfFile.name}`, pdfFile, {
          access: "public",
          handleUploadUrl: "/api/tributes/upload",
        });
        pdfUrl = blob.url;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to upload that file.");
        setState("error");
        return;
      }
    }

    const response = await fetch("/api/tributes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        message,
        pdfUrl,
      }),
    });
    if (response.ok) {
      setState("sent");
      currentForm.reset();
      setPdfFile(null);
    } else {
      const body = await response.json().catch(() => null);
      setErrorMessage(
        typeof body?.error === "string"
          ? body.error
          : "Something went wrong. Please try again.",
      );
      setState("error");
    }
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
        name="message"
        maxLength={2000}
        className="h-28 w-full resize-none border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
        placeholder="Your memory or message"
      />
      <label className="flex cursor-pointer items-center justify-center rounded-full border border-[#b5a998] px-3 py-3 text-center text-sm font-semibold text-[#1f2d2b]">
        {pdfFile ? pdfFile.name : "Or attach a letter (PDF)"}
        <input
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
        />
      </label>
      <button
        disabled={state === "sending"}
        className="rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold disabled:opacity-60"
      >
        {state === "sending" ? "Sending..." : "Send tribute"}
      </button>
      {state === "error" && (
        <p className="text-sm text-[#b8786f]">{errorMessage}</p>
      )}
    </form>
  );
}
