"use client";

import { useEffect, useState } from "react";

type Tribute = {
  id: string;
  name: string;
  message: string;
  pdfUrl?: string | null;
};

function LetterIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
      <path d="M4 3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4Zm.4 2h11.2L10 9.5 4.4 5ZM4 6.7l5.5 4.4a.8.8 0 0 0 1 0L16 6.7V15H4V6.7Z" />
    </svg>
  );
}

export default function HomeTributesGrid({ tributes }: { tributes: Tribute[] }) {
  const [active, setActive] = useState<Tribute | null>(null);

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
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {tributes.map((tribute) => (
          <button
            key={tribute.id}
            type="button"
            onClick={() => setActive(tribute)}
            className="flex aspect-square flex-col justify-between overflow-hidden border border-[#d8cec0] bg-[#fbf8f2] p-8 text-left text-[#1f2d2b] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            {tribute.message ? (
              <p className="display-font line-clamp-6 text-2xl leading-tight">
                “{tribute.message}”
              </p>
            ) : (
              <div className="flex flex-col items-start gap-2 text-[#536b60]">
                <LetterIcon className="h-8 w-8" />
                <p className="display-font text-2xl leading-tight text-[#1f2d2b]">
                  Read the letter
                </p>
              </div>
            )}
            <cite className="mt-4 block truncate text-xs not-italic uppercase tracking-[.18em] text-[#536b60]">
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
            className="max-h-[80vh] w-[90vw] max-w-2xl overflow-y-auto border border-[#d8cec0] bg-[#fbf8f2] p-10 text-[#1f2d2b]"
            onClick={(event) => event.stopPropagation()}
          >
            {active.message ? (
              <p className="display-font text-3xl leading-tight">“{active.message}”</p>
            ) : (
              <div className="flex flex-col items-center gap-4 py-6 text-center">
                <LetterIcon className="h-12 w-12 text-[#536b60]" />
                <a
                  href={active.pdfUrl ?? undefined}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[#1f2d2b] px-6 py-3 text-sm font-semibold text-[#fbf8f2]"
                >
                  Read the full letter (PDF) ↗
                </a>
              </div>
            )}
            <cite className="mt-8 block text-xs not-italic uppercase tracking-[.2em] text-[#536b60]">
              {active.name}
            </cite>
          </div>
        </div>
      )}
    </>
  );
}
