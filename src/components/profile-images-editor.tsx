"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { useEditMode } from "@/components/edit-mode";
import { MAX_SUPPORTING_IMAGES, type ProfileImage } from "@/lib/memorial";

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
      <path d="M14.69 2.86a1.5 1.5 0 0 1 2.12 0l.33.33a1.5 1.5 0 0 1 0 2.12L6.5 15.85l-3.2.71.71-3.2Z" />
    </svg>
  );
}

async function addProfileImage(file: File, role: "banner" | "supporting") {
  const blob = await upload(`memorial/profile/${crypto.randomUUID()}-${file.name}`, file, {
    access: "public",
    handleUploadUrl: "/api/admin/upload-image",
  });
  const response = await fetch("/api/admin/profile-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl: blob.url, role }),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || "Upload failed.");
  }
}

async function removeProfileImage(id: string) {
  await fetch("/api/admin/profile-images", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

/**
 * The banner photo at the top of /profile. Sits inside the same `relative`
 * box the public <Image> renders in (or, when empty, renders that box
 * itself) so its pencil/upload controls only ever show in edit mode.
 */
export function ProfileBannerEditor({ image }: { image: ProfileImage | null }) {
  const router = useRouter();
  const { canEdit, editMode } = useEditMode();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const editing = canEdit && editMode;

  if (!image && !editing) return null;

  async function handleAdd(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await addProfileImage(file, "banner");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!image) return;
    if (!window.confirm("Remove this cover photo?")) return;
    setBusy(true);
    await removeProfileImage(image.id);
    setBusy(false);
    router.refresh();
  }

  if (!image) {
    // editing is guaranteed true here (the guard above returns null otherwise)
    return (
      <label
        className="order-first flex w-full cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded border border-dashed border-[#b5a998] p-6 text-center text-xs font-semibold text-[#536b60] md:order-0"
        style={{ aspectRatio: "4 / 5" }}
      >
        <span>{busy ? "Uploading..." : "+ Add cover photo"}</span>
        {error && <span className="text-[#b8786f]">{error}</span>}
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => handleAdd(event.target.files?.[0] || null)}
        />
      </label>
    );
  }

  return (
    <div
      className="relative order-first w-full overflow-hidden rounded md:order-0"
      style={{ aspectRatio: "4 / 5" }}
    >
      <Image
        src={image.imageUrl}
        alt=""
        fill
        sizes="(min-width: 768px) 40vw, 100vw"
        className="object-cover object-top"
        priority
      />
      {editing && (
        <div className="absolute right-2 top-2 z-20 flex gap-1.5">
          <label
            className="flex cursor-pointer rounded-full bg-[#c48a3a] p-1.5 text-[#1f2d2b] shadow"
            aria-label="Replace cover photo"
            title="Replace cover photo"
          >
            <PencilIcon />
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => handleAdd(event.target.files?.[0] || null)}
            />
          </label>
          <button
            type="button"
            onClick={handleRemove}
            disabled={busy}
            aria-label="Remove cover photo"
            title="Remove cover photo"
            className="rounded-full bg-[#fbf8f2] p-1.5 text-[#b8786f] shadow disabled:opacity-60"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
              <path d="M8 2a1 1 0 0 0-1 1v1H4a1 1 0 1 0 0 2h.1l.9 10.1A2 2 0 0 0 6.99 18h6.02a2 2 0 0 0 1.99-1.9L15.9 6h.1a1 1 0 1 0 0-2h-3V3a1 1 0 0 0-1-1H8Zm0 2h4V3H8v1ZM7 8a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8Zm4 0a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0V8Z" />
            </svg>
          </button>
        </div>
      )}
      {error && (
        <p className="absolute right-2 top-12 z-20 w-48 rounded border border-[#d8cec0] bg-[#fbf8f2] p-2 text-xs text-[#b8786f] shadow">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The supporting photos beside the bio text. Renders the real photos
 * (view-mode-safe) and, only in edit mode, a delete corner on each plus a
 * trailing "add" tile while under the cap.
 */
export function ProfileSupportingImagesEditor({
  images,
}: {
  images: ProfileImage[];
}) {
  const router = useRouter();
  const { canEdit, editMode } = useEditMode();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await addProfileImage(file, "supporting");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(id: string) {
    if (!window.confirm("Remove this photo?")) return;
    setBusy(true);
    await removeProfileImage(id);
    setBusy(false);
    router.refresh();
  }

  const editing = canEdit && editMode;
  if (images.length === 0 && !editing) return null;

  return (
    <div className="mt-6 flex flex-col gap-4">
      {images.map((image) => (
        <div
          key={image.id}
          className="relative w-full overflow-hidden rounded"
          style={{ aspectRatio: "4 / 3" }}
        >
          <Image
            src={image.imageUrl}
            alt=""
            fill
            sizes="(min-width: 768px) 340px, 100vw"
            className="object-cover object-top"
          />
          {editing && (
            <button
              type="button"
              onClick={() => handleRemove(image.id)}
              disabled={busy}
              aria-label="Remove photo"
              title="Remove photo"
              className="absolute right-2 top-2 z-20 rounded-full bg-[#fbf8f2] p-1.5 text-[#b8786f] shadow disabled:opacity-60"
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path d="M8 2a1 1 0 0 0-1 1v1H4a1 1 0 1 0 0 2h.1l.9 10.1A2 2 0 0 0 6.99 18h6.02a2 2 0 0 0 1.99-1.9L15.9 6h.1a1 1 0 1 0 0-2h-3V3a1 1 0 0 0-1-1H8Zm0 2h4V3H8v1ZM7 8a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8Zm4 0a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0V8Z" />
              </svg>
            </button>
          )}
        </div>
      ))}
      {editing && images.length < MAX_SUPPORTING_IMAGES && (
        <label
          className="flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded border border-dashed border-[#b5a998] p-4 text-center text-xs font-semibold text-[#536b60]"
          style={{ aspectRatio: "4 / 3" }}
        >
          <span>{busy ? "Uploading..." : "+ Add photo"}</span>
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => handleAdd(event.target.files?.[0] || null)}
          />
        </label>
      )}
      {error && <p className="text-xs text-[#b8786f]">{error}</p>}
    </div>
  );
}
