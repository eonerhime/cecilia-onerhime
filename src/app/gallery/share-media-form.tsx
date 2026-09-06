"use client";

import { FormEvent, useState } from "react";

type Album = {
  id: string;
  name: string;
};

export default function ShareMediaForm({ albums }: { albums: Album[] }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/media-share", {
      method: "POST",
      body: form,
    });
    if (response.ok) {
      setState("sent");
      event.currentTarget.reset();
    } else {
      setState("error");
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 items-center rounded-full bg-[#c48a3a] px-6 text-sm font-semibold text-[#1f2d2b] transition-transform hover:-translate-y-0.5"
      >
        Share a photo
      </button>
    );
  }

  if (state === "sent")
    return (
      <p className="mt-8 max-w-md border-l-2 border-[#c48a3a] px-4 py-3 text-sm leading-6 text-[#536b60]">
        Thank you. Your photo has been sent to the family for review.
      </p>
    );

  return (
    <form
      onSubmit={submit}
      className="mt-8 max-w-md space-y-3 border border-[#d8cec0] bg-[#fbf8f2] p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="display-font text-3xl">Share a photo</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close"
          className="text-xl text-[#536b60] hover:text-[#1f2d2b]"
        >
          ×
        </button>
      </div>
      <input
        required
        name="name"
        maxLength={80}
        className="w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
        placeholder="Your name"
      />
      <label className="flex cursor-pointer items-center justify-center rounded-full border border-[#b5a998] px-3 py-3 text-center text-sm font-semibold text-[#1f2d2b]">
        Choose a photo
        <input required type="file" name="file" accept="image/*" className="sr-only" />
      </label>
      <input
        name="caption"
        maxLength={300}
        className="w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
        placeholder="Optional caption"
      />
      {albums.length > 0 && (
        <label className="block text-xs font-semibold uppercase tracking-[.14em] text-[#536b60]">
          Which occasion is this from?
          <select
            name="albumId"
            defaultValue=""
            className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm font-normal normal-case tracking-normal text-[#1f2d2b] outline-none"
          >
            <option value="">Not sure / general</option>
            {albums.map((album) => (
              <option key={album.id} value={album.id}>
                {album.name}
              </option>
            ))}
          </select>
        </label>
      )}
      <button
        disabled={state === "sending"}
        className="w-full rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold text-[#1f2d2b] disabled:opacity-60"
      >
        {state === "sending" ? "Sending..." : "Send photo"}
      </button>
      {state === "error" && (
        <p className="text-sm text-[#b8786f]">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
}
