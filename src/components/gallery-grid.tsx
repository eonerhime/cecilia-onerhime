"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { useEditMode } from "@/components/edit-mode";

const AUTOPLAY_MS = 3000;

type MediaItem = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
};

export default function GalleryGrid({
  media,
  displayName,
}: {
  media: MediaItem[];
  displayName: string;
}) {
  const { canEdit, editMode } = useEditMode();
  const reorderable = canEdit && editMode;

  const [orderedMedia, setOrderedMedia] = useState(media);
  const [prevMedia, setPrevMedia] = useState(media);
  if (media !== prevMedia) {
    setPrevMedia(media);
    setOrderedMedia(media);
  }

  const [dragId, setDragId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);

  const images = orderedMedia.filter((item) => item.mediaType === "image");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const showNext = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? current : (current + 1) % images.length,
    );
  }, [images.length]);
  const showPrev = useCallback(() => {
    setActiveIndex((current) =>
      current === null
        ? current
        : (current - 1 + images.length) % images.length,
    );
  }, [images.length]);

  useEffect(() => {
    if (activeIndex === null || images.length < 2) return;
    const timer = setTimeout(showNext, AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [activeIndex, images.length, showNext]);

  useEffect(() => {
    if (activeIndex === null) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight") showNext();
      if (event.key === "ArrowLeft") showPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, close, showNext, showPrev]);

  useEffect(() => {
    if (activeIndex === null) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex]);

  async function persistOrder(next: MediaItem[]) {
    setSavingOrder(true);
    try {
      await fetch("/api/admin/media-order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((item) => item.id) }),
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
    setOrderedMedia((current) => {
      const next = [...current];
      const fromIndex = next.findIndex((item) => item.id === dragId);
      const toIndex = next.findIndex((item) => item.id === targetId);
      if (fromIndex === -1 || toIndex === -1) return current;
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      persistOrder(next);
      return next;
    });
    setDragId(null);
  }

  const active = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      {reorderable && (
        <p className="mt-8 text-xs uppercase tracking-[.14em] text-[#536b60]">
          Drag photos to reorder{savingOrder ? " · Saving…" : ""}
        </p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {orderedMedia.map((item) =>
          item.mediaType === "image" ? (
            <button
              key={item.id}
              type="button"
              draggable={reorderable}
              onDragStart={() => setDragId(item.id)}
              onDragOver={(event) => {
                if (reorderable) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(item.id);
              }}
              onDragEnd={() => setDragId(null)}
              onClick={() => {
                if (dragId) return;
                setActiveIndex(images.findIndex((image) => image.id === item.id));
              }}
              className={`group relative aspect-square overflow-hidden bg-[#536b60] text-left ${
                reorderable ? "cursor-grab active:cursor-grabbing" : ""
              } ${dragId === item.id ? "opacity-40" : ""}`}
            >
              <Image
                src={item.mediaUrl}
                alt={item.caption || `A memory of ${displayName}`}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
              {item.caption && (
                <p className="absolute inset-x-0 bottom-0 bg-[#1f2d2b]/80 px-4 py-3 text-xs text-[#fbf8f2]">
                  {item.caption}
                </p>
              )}
            </button>
          ) : (
            <a
              key={item.id}
              href={reorderable ? undefined : item.mediaUrl}
              target={reorderable ? undefined : "_blank"}
              rel={reorderable ? undefined : "noreferrer"}
              draggable={reorderable}
              onDragStart={() => setDragId(item.id)}
              onDragOver={(event) => {
                if (reorderable) event.preventDefault();
              }}
              onDrop={(event) => {
                event.preventDefault();
                handleDrop(item.id);
              }}
              onDragEnd={() => setDragId(null)}
              onClick={(event) => {
                if (reorderable) event.preventDefault();
              }}
              className={`flex aspect-square flex-col items-center justify-center gap-2 bg-[#536b60] p-6 text-center text-[#fbf8f2] hover:bg-[#1f2d2b] ${
                reorderable ? "cursor-grab active:cursor-grabbing" : ""
              } ${dragId === item.id ? "opacity-40" : ""}`}
            >
              <span className="display-font text-3xl">Video memory ↗</span>
              {item.caption && (
                <span className="text-xs text-[#d9e0d9]">{item.caption}</span>
              )}
            </a>
          ),
        )}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-[#1f2d2b]/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={active.caption || `A memory of ${displayName}`}
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

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showPrev();
              }}
              aria-label="Previous"
              className="absolute left-2 z-10 text-4xl text-[#fbf8f2] hover:text-[#c48a3a] sm:left-8"
            >
              ‹
            </button>
          )}

          <div
            className="relative h-[75vh] w-[90vw] max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={active.mediaUrl}
              alt={active.caption || `A memory of ${displayName}`}
              fill
              sizes="90vw"
              className="object-contain"
              priority
            />
          </div>

          {images.length > 1 && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                showNext();
              }}
              aria-label="Next"
              className="absolute right-2 z-10 text-4xl text-[#fbf8f2] hover:text-[#c48a3a] sm:right-8"
            >
              ›
            </button>
          )}

          {active.caption && (
            <p
              className="absolute bottom-6 left-1/2 max-w-lg -translate-x-1/2 px-4 text-center text-sm text-[#fbf8f2]"
              onClick={(event) => event.stopPropagation()}
            >
              {active.caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}
