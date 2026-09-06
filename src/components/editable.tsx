"use client";

import { useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useEditMode } from "@/components/edit-mode";

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
      <path d="M14.69 2.86a1.5 1.5 0 0 1 2.12 0l.33.33a1.5 1.5 0 0 1 0 2.12L6.5 15.85l-3.2.71.71-3.2Z" />
    </svg>
  );
}

function EditWrapper({
  children,
  value,
  multiline,
  onSave,
  as = "div",
  wrapperClassName,
  editorId,
}: {
  children: ReactNode;
  value: string;
  multiline?: boolean;
  onSave: (value: string) => Promise<void>;
  as?: "div" | "span";
  wrapperClassName?: string;
  editorId: string;
}) {
  const { canEdit, editMode, activeEditorId, setActiveEditorId } = useEditMode();
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const editing = activeEditorId === editorId;

  if (!canEdit || !editMode) return <>{children}</>;

  async function save() {
    setSaving(true);
    await onSave(draft);
    setSaving(false);
    setActiveEditorId(null);
  }

  const Wrapper = as;
  // `w-fit` keeps the wrapper's own box hugging its content (so the pencil
  // sits next to the actual text) while staying block-level so it doesn't
  // start flowing inline with siblings the way `inline-block` did.
  const classes =
    wrapperClassName ?? (as === "span" ? "group/editable relative" : "group/editable relative w-fit");

  return (
    <Wrapper className={classes}>
      {children}
      <button
        type="button"
        onClick={(event) => {
          // Editable regions can sit inside a card/link (e.g. the Gallery
          // and Tributes cards) — without this, the click bubbles up and
          // triggers the link's navigation instead of opening the popover.
          event.preventDefault();
          event.stopPropagation();
          setDraft(value);
          setActiveEditorId(editorId);
        }}
        aria-label="Edit"
        className="absolute -right-6 -top-1 z-20 flex rounded-full bg-[#c48a3a] p-1 text-[#1f2d2b]"
      >
        <PencilIcon />
      </button>
      {editing && (
        <div
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          // Reset typography explicitly: this can render inside a heading
          // (e.g. the display-font h1) and would otherwise inherit its huge
          // font-size-relative letter-spacing, which turns into a wildly
          // oversized *absolute* offset at this popover's much smaller text.
          className="absolute left-0 top-full z-40 mt-2 w-72 max-w-[90vw] rounded border border-[#d8cec0] bg-[#fbf8f2] p-3 text-left font-sans text-base font-normal not-italic tracking-normal normal-case shadow-lg"
        >
          {multiline ? (
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={4}
              className="w-full resize-none border border-[#d8cec0] bg-white p-2 text-sm text-[#1f2d2b] outline-none"
            />
          ) : (
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="w-full border border-[#d8cec0] bg-white p-2 text-sm text-[#1f2d2b] outline-none"
            />
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setActiveEditorId(null);
              }}
              className="rounded-full border border-[#b5a998] px-3 py-1.5 text-xs font-semibold text-[#1f2d2b]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                save();
              }}
              disabled={saving}
              className="rounded-full bg-[#1f2d2b] px-3 py-1.5 text-xs font-semibold text-[#fbf8f2] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </Wrapper>
  );
}

export function Editable({
  blockKey,
  value,
  multiline,
  as,
  wrapperClassName,
  children,
}: {
  blockKey: string;
  value: string;
  multiline?: boolean;
  as?: "div" | "span";
  wrapperClassName?: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <EditWrapper
      value={value}
      multiline={multiline}
      as={as}
      wrapperClassName={wrapperClassName}
      editorId={`block:${blockKey}`}
      onSave={async (next) => {
        await fetch("/api/admin/content", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blockKey, value: next }),
        });
        router.refresh();
      }}
    >
      {children}
    </EditWrapper>
  );
}

export type EditableSettings = {
  displayName: string;
  templateId: string;
  heroImageUrl: string;
  footerText: string;
  musicUrl: string;
  musicAutoplay: string;
  musicLoop: boolean;
  musicVolume: number;
  colors: Record<string, string>;
};

export function EditableSetting({
  field,
  settings,
  multiline,
  as,
  wrapperClassName,
  instanceId,
  children,
}: {
  field: "displayName" | "footerText" | "heroImageUrl";
  settings: EditableSettings;
  multiline?: boolean;
  as?: "div" | "span";
  wrapperClassName?: string;
  // The same field (e.g. displayName) can appear in more than one place on
  // a page (nav brand, hero heading). Without a distinct id per occurrence,
  // every instance would share one editor id and all open/close together.
  instanceId: string;
  children: ReactNode;
}) {
  const router = useRouter();
  return (
    <EditWrapper
      value={settings[field]}
      multiline={multiline}
      as={as}
      wrapperClassName={wrapperClassName}
      editorId={`setting:${field}:${instanceId}`}
      onSave={async (next) => {
        await fetch("/api/admin", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "settings", ...settings, [field]: next }),
        });
        router.refresh();
      }}
    >
      {children}
    </EditWrapper>
  );
}

/**
 * A "view PDF" link with an inline uploader/URL editor next to it. Used for
 * per-event programme documents, where each event needs its own file rather
 * than one shared setting field or plain text block.
 */
export function EditablePdfLink({
  blockKey,
  value,
  label,
  linkClassName,
}: {
  blockKey: string;
  value: string;
  label: string;
  linkClassName?: string;
}) {
  const router = useRouter();
  const { canEdit, editMode, activeEditorId, setActiveEditorId } = useEditMode();
  const editorId = `pdf:${blockKey}`;
  const editing = activeEditorId === editorId;
  const [url, setUrl] = useState(value);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function uploadFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/admin/upload-pdf", {
      method: "POST",
      body: form,
    });
    const result = await response.json().catch(() => null);
    setUploading(false);
    if (!response.ok) {
      setUploadError(result?.error || "Upload failed.");
      return;
    }
    setUrl(result.data.url);
  }

  async function save() {
    setSaving(true);
    await fetch("/api/admin/content", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blockKey, value: url }),
    });
    setSaving(false);
    setActiveEditorId(null);
    router.refresh();
  }

  if (!canEdit || !editMode) {
    if (!value) return null;
    return (
      <a href={value} target="_blank" rel="noreferrer" className={linkClassName}>
        {label} <span aria-hidden="true">↗</span>
      </a>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-2">
      {value ? (
        <a href={value} target="_blank" rel="noreferrer" className={linkClassName}>
          {label} <span aria-hidden="true">↗</span>
        </a>
      ) : (
        <button
          type="button"
          onClick={() => {
            setUrl(value);
            setActiveEditorId(editorId);
          }}
          className="text-xs font-semibold text-[#536b60] underline underline-offset-2"
        >
          Add programme PDF
        </button>
      )}
      <button
        type="button"
        onClick={() => {
          setUrl(value);
          setActiveEditorId(editorId);
        }}
        aria-label="Edit programme PDF"
        className="flex rounded-full bg-[#c48a3a] p-1 text-[#1f2d2b]"
      >
        <PencilIcon />
      </button>
      {editing && (
        <div
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          className="absolute left-0 top-full z-40 mt-2 w-72 max-w-[90vw] rounded border border-[#d8cec0] bg-[#fbf8f2] p-3 text-left font-sans text-base font-normal not-italic tracking-normal normal-case shadow-lg"
        >
          <label className="block text-xs font-semibold text-[#1f2d2b]">
            PDF URL
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Public PDF URL"
              className="mt-1 w-full border border-[#d8cec0] bg-white p-2 text-sm text-[#1f2d2b] outline-none"
            />
          </label>
          <label className="mt-2 flex cursor-pointer items-center justify-center rounded-full border border-[#b5a998] px-3 py-2 text-center text-xs font-semibold text-[#1f2d2b]">
            {uploading ? "Uploading..." : "Or upload a PDF"}
            <input
              type="file"
              accept="application/pdf"
              className="sr-only"
              onChange={(event) => uploadFile(event.target.files?.[0] || null)}
            />
          </label>
          {uploadError && (
            <p className="mt-1 text-xs text-[#b8786f]">{uploadError}</p>
          )}
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveEditorId(null)}
              className="rounded-full border border-[#b5a998] px-3 py-1.5 text-xs font-semibold text-[#1f2d2b]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-[#1f2d2b] px-3 py-1.5 text-xs font-semibold text-[#fbf8f2] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * A single pencil for the hero image + caption. Kept separate from
 * `Editable`/`EditableSetting` because both wrapped elements already carry
 * their own `absolute`/`relative` positioning — wrapping either in another
 * box (even conditionally) shifts that positioning. This instead anchors to
 * the section's existing `relative` parent, which the caller must provide.
 */
export function HeroVisualEditor({
  settings,
  caption,
}: {
  settings: EditableSettings;
  caption: string;
}) {
  const router = useRouter();
  const { canEdit, editMode, activeEditorId, setActiveEditorId } = useEditMode();
  const editorId = "hero-visual";
  const editing = activeEditorId === editorId;
  const [heroImageUrl, setHeroImageUrl] = useState(settings.heroImageUrl);
  const [captionDraft, setCaptionDraft] = useState(caption);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [uploaded, setUploaded] = useState(false);

  if (!canEdit || !editMode) return null;

  async function uploadFile(file: File | null) {
    if (!file) return;
    setUploading(true);
    setUploadError("");
    setUploaded(false);
    const form = new FormData();
    form.set("file", file);
    const response = await fetch("/api/admin/upload-image", {
      method: "POST",
      body: form,
    });
    const result = await response.json().catch(() => null);
    setUploading(false);
    if (!response.ok) {
      setUploadError(result?.error || "Upload failed.");
      return;
    }
    setHeroImageUrl(result.data.url);
    setUploaded(true);
  }

  async function save() {
    setSaving(true);
    await Promise.all([
      fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "field", field: "heroImageUrl", value: heroImageUrl }),
      }),
      fetch("/api/admin/content", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockKey: "home.hero.caption", value: captionDraft }),
      }),
    ]);
    setSaving(false);
    setActiveEditorId(null);
    router.refresh();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setHeroImageUrl(settings.heroImageUrl);
          setCaptionDraft(caption);
          setUploaded(false);
          setActiveEditorId(editorId);
        }}
        aria-label="Edit hero image and caption"
        className="absolute right-2 top-2 z-20 rounded-full bg-[#c48a3a] p-1.5 text-[#1f2d2b] shadow"
      >
        <PencilIcon />
      </button>
      {editing && (
        <div className="absolute right-0 top-12 z-40 w-72 max-w-[90vw] rounded border border-[#d8cec0] bg-[#fbf8f2] p-3 text-left font-sans text-base font-normal not-italic tracking-normal normal-case shadow-lg">
          <label className="block text-xs font-semibold text-[#1f2d2b]">
            Hero image URL
            <input
              value={heroImageUrl}
              onChange={(event) => setHeroImageUrl(event.target.value)}
              placeholder="Optional public image URL"
              className="mt-1 w-full border border-[#d8cec0] bg-white p-2 text-sm text-[#1f2d2b] outline-none"
            />
          </label>
          <label className="mt-2 flex cursor-pointer items-center justify-center rounded-full border border-[#b5a998] px-3 py-2 text-center text-xs font-semibold text-[#1f2d2b]">
            {uploading ? "Uploading..." : "Or upload a photo"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => uploadFile(event.target.files?.[0] || null)}
            />
          </label>
          {uploadError && (
            <p className="mt-1 text-xs text-[#b8786f]">{uploadError}</p>
          )}
          {uploaded && (
            <p className="mt-1 text-xs text-[#536b60]">
              Photo uploaded — click Save below to publish it.
            </p>
          )}
          <label className="mt-3 block text-xs font-semibold text-[#1f2d2b]">
            Caption
            <textarea
              value={captionDraft}
              onChange={(event) => setCaptionDraft(event.target.value)}
              rows={3}
              className="mt-1 w-full resize-none border border-[#d8cec0] bg-white p-2 text-sm text-[#1f2d2b] outline-none"
            />
          </label>
          <div className="mt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveEditorId(null)}
              className="rounded-full border border-[#b5a998] px-3 py-1.5 text-xs font-semibold text-[#1f2d2b]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-full bg-[#1f2d2b] px-3 py-1.5 text-xs font-semibold text-[#fbf8f2] disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
