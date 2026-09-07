"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { getEmbed } from "@/lib/media-embed";
import type { ApprovedMedia } from "@/lib/memorial";

export default function HomeMemoriesGrid({
  media,
  displayName,
}: {
  media: ApprovedMedia[];
  displayName: string;
}) {
  const images = media.filter((item) => item.mediaType === "image");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<ApprovedMedia | null>(null);

  const close = useCallback(() => setActiveIndex(null), []);
  const showNext = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? current : (current + 1) % images.length,
    );
  }, [images.length]);
  const showPrev = useCallback(() => {
    setActiveIndex((current) =>
      current === null ? current : (current - 1 + images.length) % images.length,
    );
  }, [images.length]);

  useEffect(() => {
    if (activeIndex === null && !activeVideo) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
        setActiveVideo(null);
      }
      if (activeIndex !== null) {
        if (event.key === "ArrowRight") showNext();
        if (event.key === "ArrowLeft") showPrev();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, activeVideo, close, showNext, showPrev]);

  useEffect(() => {
    if (activeIndex === null && !activeVideo) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [activeIndex, activeVideo]);

  const active = activeIndex !== null ? images[activeIndex] : null;
  const activeEmbed = activeVideo ? getEmbed(activeVideo.mediaUrl) : null;

  return (
    <>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {media.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() =>
              item.mediaType === "image"
                ? setActiveIndex(images.findIndex((image) => image.id === item.id))
                : setActiveVideo(item)
            }
            className="group relative aspect-[4/3] overflow-hidden bg-[#536b60] text-left"
          >
            {item.mediaType === "image" ? (
              <Image
                src={item.mediaUrl}
                alt={item.caption || `A memory of ${displayName}`}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
              />
            ) : item.thumbnailUrl ? (
              <>
                <Image
                  src={item.thumbnailUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-[#1f2d2b]/45 p-6 text-center text-[#fbf8f2] transition-colors group-hover:bg-[#1f2d2b]/60">
                  <span className="display-font text-3xl">▶ Video memory</span>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-[#fbf8f2]">
                <span className="display-font text-3xl">▶ Video memory</span>
              </div>
            )}
            {item.caption && (
              <p className="absolute inset-x-0 bottom-0 bg-[#1f2d2b]/80 px-4 py-3 text-xs text-[#fbf8f2]">
                {item.caption}
              </p>
            )}
          </button>
        ))}
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

          <div className="relative h-[75vh] w-[90vw] max-w-5xl" onClick={(event) => event.stopPropagation()}>
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

      {activeVideo && activeEmbed && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-[#1f2d2b]/95 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={activeVideo.caption || `A video memory of ${displayName}`}
          onClick={() => setActiveVideo(null)}
        >
          <button
            type="button"
            onClick={() => setActiveVideo(null)}
            aria-label="Close"
            className="absolute right-5 top-5 text-3xl text-[#fbf8f2] hover:text-[#c48a3a]"
          >
            ×
          </button>

          <div className="aspect-video w-[90vw] max-w-4xl" onClick={(event) => event.stopPropagation()}>
            {activeEmbed.kind === "file" ? (
              <video src={activeEmbed.src} controls autoPlay className="h-full w-full bg-black" />
            ) : (
              <iframe
                src={activeEmbed.src}
                title={activeVideo.caption || "Video memory"}
                allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                allowFullScreen
                className="h-full w-full border-0 bg-black"
              />
            )}
          </div>

          {activeVideo.caption && (
            <p
              className="absolute bottom-6 left-1/2 max-w-lg -translate-x-1/2 px-4 text-center text-sm text-[#fbf8f2]"
              onClick={(event) => event.stopPropagation()}
            >
              {activeVideo.caption}
            </p>
          )}
        </div>
      )}
    </>
  );
}
