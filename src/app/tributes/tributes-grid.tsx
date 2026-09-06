"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useEditMode } from "@/components/edit-mode";
import type { ApprovedTribute } from "@/lib/memorial";

function PencilIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
      <path d="M14.69 2.86a1.5 1.5 0 0 1 2.12 0l.33.33a1.5 1.5 0 0 1 0 2.12L6.5 15.85l-3.2.71.71-3.2Z" />
    </svg>
  );
}

export default function TributesGrid({ tributes }: { tributes: ApprovedTribute[] }) {
  const router = useRouter();
  const { canEdit, editMode } = useEditMode();
  const reorderable = canEdit && editMode;

  const [tributesState, setTributesState] = useState(tributes);
  const [prevTributes, setPrevTributes] = useState(tributes);
  if (tributes !== prevTributes) {
    setPrevTributes(tributes);
    setTributesState(tributes);
  }

  const [active, setActive] = useState<ApprovedTribute | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftMessage, setDraftMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function open(tribute: ApprovedTribute) {
    setDraftName(tribute.name);
    setDraftMessage(tribute.message);
    setActive(tribute);
  }

  function close() {
    setActive(null);
  }

  async function save() {
    if (!active) return;
    setSaving(true);
    const response = await fetch("/api/admin/tribute", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: active.id, name: draftName, message: draftMessage }),
    });
    setSaving(false);
    if (!response.ok) return;
    setTributesState((current) =>
      current.map((tribute) =>
        tribute.id === active.id ? { ...tribute, name: draftName, message: draftMessage } : tribute,
      ),
    );
    setActive(null);
    router.refresh();
  }

  useEffect(() => {
    if (!active) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [active]);

  return (
    <>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tributesState.map((tribute) => (
          <button
            key={tribute.id}
            type="button"
            onClick={() => open(tribute)}
            className="group relative flex aspect-square flex-col justify-between overflow-hidden border border-[#d8cec0] bg-[#fbf8f2] p-8 text-left text-[#1f2d2b] transition-transform hover:-translate-y-1 hover:border-[#c48a3a]"
          >
            {reorderable && (
              <span className="absolute right-3 top-3 flex rounded-full bg-[#c48a3a] p-1.5 text-[#1f2d2b]">
                <PencilIcon />
              </span>
            )}
            <p className="display-font line-clamp-6 text-2xl leading-tight">
              “{tribute.message}”
            </p>
            <cite className="mt-4 block truncate text-xs not-italic uppercase tracking-[.2em] text-[#536b60]">
              {tribute.name}
            </cite>
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-[#1f2d2b]/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Tribute from ${active.name}`}
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-5 top-5 text-3xl text-[#fbf8f2] hover:text-[#c48a3a]"
          >
            ×
          </button>
          <div
            className="max-h-[80vh] w-[90vw] max-w-2xl overflow-y-auto border border-[#d8cec0] bg-[#fbf8f2] p-10 text-[#1f2d2b]"
            onClick={(event) => event.stopPropagation()}
          >
            {reorderable ? (
              <>
                <label className="block text-xs font-semibold uppercase tracking-[.2em] text-[#536b60]">
                  Name
                  <input
                    value={draftName}
                    onChange={(event) => setDraftName(event.target.value)}
                    maxLength={80}
                    className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-2 text-sm font-normal normal-case tracking-normal text-[#1f2d2b] outline-none"
                  />
                </label>
                <label className="mt-6 block text-xs font-semibold uppercase tracking-[.2em] text-[#536b60]">
                  Message
                  <textarea
                    value={draftMessage}
                    onChange={(event) => setDraftMessage(event.target.value)}
                    maxLength={2000}
                    rows={8}
                    className="mt-2 w-full resize-none border-b border-[#b5a998] bg-transparent px-0 py-2 text-base font-normal normal-case tracking-normal text-[#1f2d2b] outline-none"
                  />
                </label>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={close}
                    className="rounded-full border border-[#b5a998] px-4 py-2 text-xs font-semibold text-[#1f2d2b]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving || !draftName.trim() || !draftMessage.trim()}
                    className="rounded-full bg-[#1f2d2b] px-4 py-2 text-xs font-semibold text-[#fbf8f2] disabled:opacity-60"
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="display-font text-3xl leading-tight">
                  “{active.message}”
                </p>
                <cite className="mt-8 block text-xs not-italic uppercase tracking-[.2em] text-[#536b60]">
                  {active.name}
                </cite>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
