"use client";

import { FormEvent, useState } from "react";
import { upload } from "@vercel/blob/client";

type Album = {
  id: string;
  name: string;
};

type Mode = "photo" | "video";

export default function ShareMediaForm({ albums }: { albums: Album[] }) {
  const [mode, setMode] = useState<Mode | null>(null);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function submitPhoto(currentForm: HTMLFormElement, form: FormData) {
    const file = form.get("file");
    if (!(file instanceof File)) {
      setErrorMessage("Please choose a photo.");
      setState("error");
      return;
    }

    let mediaUrl: string;
    try {
      // Uploaded directly to Blob (bypassing our own API route as a request
      // body) since Vercel serverless functions cap the body at ~4.5MB,
      // well under what a modern phone photo can be.
      const blob = await upload(`memorial/${crypto.randomUUID()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/media-share/upload",
      });
      mediaUrl = blob.url;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
      setState("error");
      return;
    }

    const response = await fetch("/api/media-share", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        caption: form.get("caption"),
        albumId: form.get("albumId"),
        mediaUrl,
      }),
    });
    if (response.ok) {
      setState("sent");
      currentForm.reset();
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

  async function submitVideo(currentForm: HTMLFormElement, form: FormData) {
    // Link only, never a raw file upload — a phone video can run into the
    // hundreds of megabytes uncompressed, and this project has no video
    // transcoding pipeline (and won't — see MRU ADR-015). Share the video
    // wherever it's already hosted (YouTube, Vimeo, etc.) and paste the link.
    const response = await fetch("/api/media-share/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        videoUrl: form.get("videoUrl"),
        caption: form.get("caption"),
        albumId: form.get("albumId"),
      }),
    });
    if (response.ok) {
      setState("sent");
      currentForm.reset();
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("sending");
    const currentForm = event.currentTarget;
    const form = new FormData(currentForm);
    if (mode === "video") {
      await submitVideo(currentForm, form);
    } else {
      await submitPhoto(currentForm, form);
    }
  }

  if (!mode) {
    return (
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMode("photo")}
          className="flex h-10 items-center rounded-full bg-[#c48a3a] px-6 text-sm font-semibold text-[#1f2d2b] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
        >
          Share a photo
        </button>
        <button
          type="button"
          onClick={() => setMode("video")}
          className="flex h-10 items-center rounded-full border border-[#b5a998] px-6 text-sm font-semibold text-[#1f2d2b] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#1f2d2b] hover:shadow-lg"
        >
          Share a video
        </button>
      </div>
    );
  }

  if (state === "sent")
    return (
      <p className="mt-8 max-w-md border-l-2 border-[#c48a3a] px-4 py-3 text-sm leading-6 text-[#536b60]">
        Thank you. Your {mode} has been sent to the family for review.
      </p>
    );

  return (
    <form
      onSubmit={submit}
      className="mt-8 max-w-md space-y-3 border border-[#d8cec0] bg-[#fbf8f2] p-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="display-font text-3xl">
          {mode === "video" ? "Share a video" : "Share a photo"}
        </h2>
        <button
          type="button"
          onClick={() => setMode(null)}
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
      {mode === "video" ? (
        <input
          required
          type="url"
          name="videoUrl"
          maxLength={1000}
          className="w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
          placeholder="Video link (YouTube, Vimeo, etc.)"
        />
      ) : (
        <label className="flex cursor-pointer items-center justify-center rounded-full border border-[#b5a998] px-3 py-3 text-center text-sm font-semibold text-[#1f2d2b]">
          Choose a photo
          <input required type="file" name="file" accept="image/*" className="sr-only" />
        </label>
      )}
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
        className="w-full rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold text-[#1f2d2b] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {state === "sending" ? "Sending..." : mode === "video" ? "Send video" : "Send photo"}
      </button>
      {state === "error" && (
        <p className="text-sm text-[#b8786f]">{errorMessage}</p>
      )}
    </form>
  );
}
