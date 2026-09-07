"use client";

import { FormEvent, useState } from "react";
import { upload } from "@vercel/blob/client";

const ACCEPT =
  "application/pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*";

function formatWait(seconds: number) {
  const minutes = Math.max(1, Math.ceil(seconds / 60));
  return minutes === 1 ? "a minute" : `${minutes} minutes`;
}

export default function TributeForm() {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  function dismissStatus() {
    setState((current) => (current === "sending" ? current : "idle"));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);
    const message = typeof form.get("message") === "string" ? (form.get("message") as string).trim() : "";

    if (!message && !attachmentFile) {
      setErrorMessage("Please write a message or attach a letter.");
      setState("error");
      return;
    }

    setState("sending");

    let attachmentUrl = "";
    if (attachmentFile) {
      // @vercel/blob's upload() collapses any failure from the token
      // endpoint below into one generic, unhelpful error, so the rate
      // limit is checked here first, where we can show something useful.
      const check = await fetch("/api/tributes/upload-check", { method: "POST" })
        .then((res) => res.json())
        .catch(() => ({ ok: true }));
      if (!check.ok) {
        setErrorMessage(
          `You've tried uploading a few times recently. Please wait ${formatWait(
            check.retryAfterSeconds ?? 900,
          )} and try again.`,
        );
        setState("error");
        return;
      }

      try {
        // Uploaded directly to Blob (bypassing our own API route as a
        // request body) since Vercel serverless functions cap the body at
        // ~4.5MB, well under what a scanned letter can be.
        const blob = await upload(
          `memorial/tributes/${crypto.randomUUID()}-${attachmentFile.name}`,
          attachmentFile,
          {
            access: "public",
            handleUploadUrl: "/api/tributes/upload",
          },
        );
        attachmentUrl = blob.url;
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
        attachmentUrl,
      }),
    });
    if (response.ok) {
      setState("sent");
      currentForm.reset();
      setAttachmentFile(null);
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

  return (
    <form onSubmit={submit} className="mt-7 space-y-3">
      <input
        required
        name="name"
        maxLength={80}
        onChange={dismissStatus}
        className="w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
        placeholder="Your name"
      />
      <textarea
        name="message"
        maxLength={2000}
        onChange={dismissStatus}
        className="h-28 w-full resize-none border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
        placeholder="Your memory or message"
      />
      <label className="flex cursor-pointer items-center justify-center rounded-full border border-[#b5a998] px-3 py-3 text-center text-sm font-semibold text-[#1f2d2b]">
        {attachmentFile ? attachmentFile.name : "Or attach a letter (PDF, Word, or photo)"}
        <input
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(event) => {
            dismissStatus();
            setAttachmentFile(event.target.files?.[0] || null);
          }}
        />
      </label>
      <button
        disabled={state === "sending"}
        className="rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {state === "sending" ? "Sending..." : "Send tribute"}
      </button>
      {state === "sent" && (
        <p className="border-l-2 border-[#c48a3a] px-4 py-3 text-sm leading-6 text-[#536b60]">
          Thank you. Your tribute has been sent to the family for review.
        </p>
      )}
      {state === "error" && (
        <p className="text-sm text-[#b8786f]">{errorMessage}</p>
      )}
    </form>
  );
}
