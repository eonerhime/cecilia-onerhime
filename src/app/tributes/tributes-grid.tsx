"use client";

import { useEffect, useState } from "react";
import type { ApprovedTribute } from "@/lib/memorial";

export default function TributesGrid({ tributes }: { tributes: ApprovedTribute[] }) {
  const [active, setActive] = useState<ApprovedTribute | null>(null);

  useEffect(() => {
    if (!active) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
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
        {tributes.map((tribute) => (
          <button
            key={tribute.id}
            type="button"
            onClick={() => setActive(tribute)}
            className="group flex aspect-square flex-col justify-between overflow-hidden bg-[#536b60] p-8 text-left text-[#fbf8f2] transition-transform hover:-translate-y-1"
          >
            <p className="display-font line-clamp-6 text-2xl leading-tight">
              “{tribute.message}”
            </p>
            <cite className="mt-4 block truncate text-xs not-italic uppercase tracking-[.2em] text-[#e4bb72]">
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
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute right-5 top-5 text-3xl text-[#fbf8f2] hover:text-[#c48a3a]"
          >
            ×
          </button>
          <div
            className="max-h-[80vh] w-[90vw] max-w-2xl overflow-y-auto bg-[#536b60] p-10 text-[#fbf8f2]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="display-font text-3xl leading-tight">
              “{active.message}”
            </p>
            <cite className="mt-8 block text-xs not-italic uppercase tracking-[.2em] text-[#e4bb72]">
              {active.name}
            </cite>
          </div>
        </div>
      )}
    </>
  );
}
