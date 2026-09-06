"use client";

import { useEffect, useState, type DragEvent } from "react";
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

  const [dragId, setDragId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

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

  async function deleteTribute(id: string) {
    if (!window.confirm("Delete this tribute? This can't be undone.")) return;
    setTributesState((current) => current.filter((tribute) => tribute.id !== id));
    setActive((current) => (current?.id === id ? null : current));
    await fetch("/api/admin/tribute", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  }

  async function persistOrder(next: ApprovedTribute[]) {
    setSavingOrder(true);
    try {
      await fetch("/api/admin/tribute-order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((tribute) => tribute.id) }),
      });
    } finally {
      setSavingOrder(false);
    }
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const fromIndex = tributesState.findIndex((tribute) => tribute.id === dragId);
    const toIndex = tributesState.findIndex((tribute) => tribute.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDragId(null);
      return;
    }
    const reordered = [...tributesState];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setTributesState(reordered);
    persistOrder(reordered);
    setDragId(null);
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
      {reorderable && tributesState.length > 1 && (
        <p className="mt-8 text-xs uppercase tracking-[.14em] text-[#536b60]">
          Drag tributes to reorder{savingOrder ? " · Saving…" : ""}
        </p>
      )}
      <div
        className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
          reorderable && tributesState.length > 1 ? "mt-4" : "mt-12"
        }`}
      >
        {tributesState.map((tribute) => (
          <div key={tribute.id} className="relative">
            <button
              type="button"
              draggable={reorderable}
              onDragStart={() => setDragId(tribute.id)}
              onDragOver={(event: DragEvent<HTMLButtonElement>) => {
                if (reorderable) event.preventDefault();
              }}
              onDrop={(event: DragEvent<HTMLButtonElement>) => {
                event.preventDefault();
                handleDrop(tribute.id);
              }}
              onDragEnd={() => setDragId(null)}
              onClick={() => {
                if (dragId) return;
                open(tribute);
              }}
              className={`group relative z-0 flex aspect-square w-full flex-col justify-between overflow-hidden border border-[#d8cec0] bg-[#fbf8f2] p-8 text-left text-[#1f2d2b] transition-all duration-300 hover:z-10 hover:scale-105 hover:shadow-xl ${
                reorderable ? "cursor-grab active:cursor-grabbing" : ""
              } ${dragId === tribute.id ? "opacity-40" : ""}`}
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
            {reorderable && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  deleteTribute(tribute.id);
                }}
                aria-label="Delete tribute"
                className="absolute bottom-3 right-3 z-10 rounded-full bg-[#fbf8f2] p-1.5 text-[#b8786f] shadow hover:bg-[#b8786f] hover:text-[#fbf8f2]"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path d="M8 2a1 1 0 0 0-1 1v1H4a1 1 0 1 0 0 2h.1l.9 10.1A2 2 0 0 0 6.99 18h6.02a2 2 0 0 0 1.99-1.9L15.9 6h.1a1 1 0 1 0 0-2h-3V3a1 1 0 0 0-1-1H8Zm0 2h4V3H8v1ZM7 8a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8Zm4 0a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0V8Z" />
                </svg>
              </button>
            )}
          </div>
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
