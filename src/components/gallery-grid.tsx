"use client";

import Image from "next/image";
import { useCallback, useEffect, useState, type DragEvent } from "react";
import { upload } from "@vercel/blob/client";
import { useEditMode } from "@/components/edit-mode";
import { getEmbed } from "@/lib/media-embed";

const AUTOPLAY_MS = 3000;
// Hidden for now — duplicates browsing every album individually. Flip back
// on if there's ever a need for an unfiltered "everything" view again.
const SHOW_ALL_PHOTOS_COVER = false;

type MediaItem = {
  id: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
  albumId: string | null;
  thumbnailUrl?: string | null;
};

type Album = {
  id: string;
  name: string;
  coverUrl: string | null;
};

function CoverTile({
  label,
  coverUrl,
  fallback,
  onClick,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dimmed,
}: {
  label: string;
  coverUrl: string | null | undefined;
  fallback: MediaItem | undefined;
  onClick: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (event: DragEvent<HTMLButtonElement>) => void;
  onDrop?: (event: DragEvent<HTMLButtonElement>) => void;
  onDragEnd?: () => void;
  dimmed?: boolean;
}) {
  const imageUrl = coverUrl || (fallback?.mediaType === "image" ? fallback.mediaUrl : null);
  return (
    <button
      type="button"
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={`group relative aspect-square overflow-hidden bg-[#536b60] text-left transition-shadow duration-300 hover:shadow-xl ${
        draggable ? "cursor-grab active:cursor-grabbing" : ""
      } ${dimmed ? "opacity-40" : ""}`}
    >
      {imageUrl && (
        <Image
          src={imageUrl}
          alt={label}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 flex items-end bg-gradient-to-t from-[#1f2d2b]/85 via-transparent to-transparent p-5">
        <span className="display-font text-3xl text-[#fbf8f2]">{label}</span>
      </div>
    </button>
  );
}

export default function GalleryGrid({
  media,
  albums,
  displayName,
  shareSlot,
}: {
  media: MediaItem[];
  albums: Album[];
  displayName: string;
  shareSlot?: React.ReactNode;
}) {
  const { canEdit, editMode } = useEditMode();
  const reorderable = canEdit && editMode;

  const [orderedMedia, setOrderedMedia] = useState(media);
  const [prevMedia, setPrevMedia] = useState(media);
  if (media !== prevMedia) {
    setPrevMedia(media);
    setOrderedMedia(media);
  }

  const [albumList, setAlbumList] = useState(albums);
  const [prevAlbums, setPrevAlbums] = useState(albums);
  if (albums !== prevAlbums) {
    setPrevAlbums(albums);
    setAlbumList(albums);
  }

  const hasVideos = orderedMedia.some((item) => item.mediaType === "video");
  const [mediaTab, setMediaTab] = useState<"photos" | "videos">("photos");

  const [view, setView] = useState<"covers" | "all" | string>(
    albumList.length > 0 ? "covers" : "all",
  );

  const photoMedia = orderedMedia.filter((item) => item.mediaType === "image");
  const videoMedia = orderedMedia.filter((item) => item.mediaType === "video");

  const visiblePhotos =
    view === "covers"
      ? []
      : view === "all"
        ? photoMedia
        : photoMedia.filter((item) => item.albumId === view);

  const [dragId, setDragId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [dragAlbumId, setDragAlbumId] = useState<string | null>(null);
  const [savingAlbumOrder, setSavingAlbumOrder] = useState(false);

  const images = visiblePhotos;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<MediaItem | null>(null);

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

  function handleDrop(list: MediaItem[], targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      return;
    }
    const fromIndex = list.findIndex((item) => item.id === dragId);
    const toIndex = list.findIndex((item) => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDragId(null);
      return;
    }
    const reordered = [...list];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    // `list` is a same-order subset of `current` — walk `current` and drop
    // the reordered items back into the exact slots the subset occupied.
    const listIds = new Set(list.map((item) => item.id));
    setOrderedMedia((current) => {
      let cursor = 0;
      return current.map((item) => (listIds.has(item.id) ? reordered[cursor++] : item));
    });
    persistOrder(reordered);
    setDragId(null);
  }

  async function persistAlbumOrder(next: Album[]) {
    setSavingAlbumOrder(true);
    try {
      await fetch("/api/admin/album-order", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((album) => album.id) }),
      });
    } finally {
      setSavingAlbumOrder(false);
    }
  }

  function handleAlbumDrop(targetId: string) {
    if (!dragAlbumId || dragAlbumId === targetId) {
      setDragAlbumId(null);
      return;
    }
    const fromIndex = albumList.findIndex((album) => album.id === dragAlbumId);
    const toIndex = albumList.findIndex((album) => album.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDragAlbumId(null);
      return;
    }
    const reordered = [...albumList];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    setAlbumList(reordered);
    persistAlbumOrder(reordered);
    setDragAlbumId(null);
  }

  async function assignAlbum(mediaId: string, albumId: string) {
    setOrderedMedia((current) =>
      current.map((item) =>
        item.id === mediaId ? { ...item, albumId: albumId || null } : item,
      ),
    );
    await fetch("/api/admin/media-album", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId, albumId: albumId || undefined }),
    });
  }

  async function deleteMedia(mediaId: string) {
    if (!window.confirm("Delete this item? This can't be undone.")) return;
    setOrderedMedia((current) => current.filter((item) => item.id !== mediaId));
    if (activeIndex !== null) close();
    setActiveVideo((current) => (current?.id === mediaId ? null : current));
    await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId }),
    });
  }

  async function uploadThumbnail(mediaId: string, file: File | null) {
    if (!file) return;
    let url: string;
    try {
      const blob = await upload(`memorial/${crypto.randomUUID()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload-image",
      });
      url = blob.url;
    } catch {
      return;
    }
    setOrderedMedia((current) =>
      current.map((item) => (item.id === mediaId ? { ...item, thumbnailUrl: url } : item)),
    );
    await fetch("/api/admin/media-thumbnail", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId, thumbnailUrl: url }),
    });
  }

  async function setAsCover(albumId: string, coverUrl: string) {
    setAlbumList((current) =>
      current.map((album) => (album.id === albumId ? { ...album, coverUrl } : album)),
    );
    await fetch("/api/admin/albums", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: albumId, coverUrl }),
    });
  }

  const active = activeIndex !== null ? images[activeIndex] : null;
  const activeEmbed = activeVideo ? getEmbed(activeVideo.mediaUrl) : null;
  const currentAlbumName =
    view !== "covers" && view !== "all"
      ? albumList.find((album) => album.id === view)?.name
      : null;

  function renderTile(item: MediaItem, list: MediaItem[], showCoverAction: boolean) {
    return (
      <div key={item.id} className="relative">
        {item.mediaType === "image" ? (
          <button
            type="button"
            draggable={reorderable}
            onDragStart={() => setDragId(item.id)}
            onDragOver={(event) => {
              if (reorderable) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop(list, item.id);
            }}
            onDragEnd={() => setDragId(null)}
            onClick={() => {
              if (dragId) return;
              setActiveIndex(images.findIndex((image) => image.id === item.id));
            }}
            className={`group relative aspect-square w-full overflow-hidden bg-[#536b60] text-left transition-shadow duration-300 hover:shadow-xl ${
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
          <button
            type="button"
            draggable={reorderable}
            onDragStart={() => setDragId(item.id)}
            onDragOver={(event) => {
              if (reorderable) event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              handleDrop(list, item.id);
            }}
            onDragEnd={() => setDragId(null)}
            onClick={() => {
              if (dragId) return;
              setActiveVideo(item);
            }}
            className={`group relative aspect-square w-full overflow-hidden bg-[#536b60] text-left transition-shadow duration-300 hover:shadow-xl ${
              item.thumbnailUrl ? "" : "flex flex-col items-center justify-center gap-2 p-6 text-center text-[#fbf8f2] hover:bg-[#1f2d2b]"
            } ${reorderable ? "cursor-grab active:cursor-grabbing" : ""} ${dragId === item.id ? "opacity-40" : ""}`}
          >
            {item.thumbnailUrl ? (
              <>
                <Image
                  src={item.thumbnailUrl}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#1f2d2b]/45 p-6 text-center text-[#fbf8f2] transition-colors group-hover:bg-[#1f2d2b]/60">
                  <span className="display-font text-3xl">▶ Video memory</span>
                  {item.caption && (
                    <span className="text-xs text-[#d9e0d9]">{item.caption}</span>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="display-font text-3xl">▶ Video memory</span>
                {item.caption && (
                  <span className="text-xs text-[#d9e0d9]">{item.caption}</span>
                )}
              </>
            )}
          </button>
        )}
        {reorderable && albumList.length > 0 && (
          <select
            value={item.albumId ?? ""}
            onChange={(event) => assignAlbum(item.id, event.target.value)}
            onClick={(event) => event.stopPropagation()}
            className="absolute left-2 top-2 z-10 rounded border-0 bg-[#fbf8f2] px-2 py-1 text-xs text-[#1f2d2b] shadow"
          >
            <option value="">No album</option>
            {albumList.map((album) => (
              <option key={album.id} value={album.id}>
                {album.name}
              </option>
            ))}
          </select>
        )}
        {reorderable && showCoverAction && item.mediaType === "image" && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setAsCover(view, item.mediaUrl);
            }}
            className="absolute right-2 top-2 z-10 rounded bg-[#fbf8f2] px-2 py-1 text-xs text-[#1f2d2b] shadow"
          >
            Set as cover
          </button>
        )}
        {reorderable && item.mediaType === "video" && (
          <label
            onClick={(event) => event.stopPropagation()}
            className="absolute right-2 top-2 z-10 cursor-pointer rounded bg-[#fbf8f2] px-2 py-1 text-xs text-[#1f2d2b] shadow"
          >
            {item.thumbnailUrl ? "Replace thumbnail" : "Add thumbnail"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => uploadThumbnail(item.id, event.target.files?.[0] || null)}
            />
          </label>
        )}
        {reorderable && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              deleteMedia(item.id);
            }}
            aria-label="Delete"
            className="absolute bottom-2 right-2 z-10 rounded-full bg-[#fbf8f2] p-1.5 text-[#b8786f] shadow hover:bg-[#b8786f] hover:text-[#fbf8f2]"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path d="M8 2a1 1 0 0 0-1 1v1H4a1 1 0 1 0 0 2h.1l.9 10.1A2 2 0 0 0 6.99 18h6.02a2 2 0 0 0 1.99-1.9L15.9 6h.1a1 1 0 1 0 0-2h-3V3a1 1 0 0 0-1-1H8Zm0 2h4V3H8v1ZM7 8a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8Zm4 0a1 1 0 1 1 2 0v6a1 1 0 1 1-2 0V8Z" />
            </svg>
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      {(shareSlot || hasVideos) && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          {hasVideos && (
            <div className="inline-flex h-10 items-center rounded-full border border-[#b5a998] p-1">
              <button
                type="button"
                onClick={() => setMediaTab("photos")}
                className={`flex h-full items-center rounded-full px-5 text-xs font-semibold uppercase tracking-widest ${
                  mediaTab === "photos" ? "bg-[#1f2d2b] text-[#fbf8f2]" : "text-[#1f2d2b]"
                }`}
              >
                Photos
              </button>
              <button
                type="button"
                onClick={() => setMediaTab("videos")}
                className={`flex h-full items-center rounded-full px-5 text-xs font-semibold uppercase tracking-widest ${
                  mediaTab === "videos" ? "bg-[#1f2d2b] text-[#fbf8f2]" : "text-[#1f2d2b]"
                }`}
              >
                Videos
              </button>
            </div>
          )}
          {shareSlot}
        </div>
      )}

      {mediaTab === "photos" && view === "covers" && (
        <>
          {reorderable && albumList.length > 1 && (
            <p className="mt-8 text-xs uppercase tracking-[.14em] text-[#536b60]">
              Drag albums to reorder{savingAlbumOrder ? " · Saving…" : ""}
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHOW_ALL_PHOTOS_COVER && (
              <CoverTile
                label="All photos"
                coverUrl={null}
                fallback={photoMedia[0]}
                onClick={() => setView("all")}
              />
            )}
            {albumList.map((album) => (
              <CoverTile
                key={album.id}
                label={album.name}
                coverUrl={album.coverUrl}
                fallback={photoMedia.find((item) => item.albumId === album.id)}
                onClick={() => setView(album.id)}
                draggable={reorderable}
                onDragStart={() => setDragAlbumId(album.id)}
                onDragOver={(event) => {
                  if (reorderable) event.preventDefault();
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  handleAlbumDrop(album.id);
                }}
                onDragEnd={() => setDragAlbumId(null)}
                dimmed={dragAlbumId === album.id}
              />
            ))}
          </div>
        </>
      )}

      {mediaTab === "photos" && view !== "covers" && (
        <>
          {(albumList.length > 0 || reorderable) && (
            <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
              {albumList.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setView("covers")}
                  className="text-sm text-[#536b60] hover:text-[#c48a3a]"
                >
                  ← All albums
                </button>
              ) : (
                <span />
              )}
              {reorderable && (
                <p className="text-xs uppercase tracking-[.14em] text-[#536b60]">
                  Drag photos to reorder{savingOrder ? " · Saving…" : ""}
                </p>
              )}
            </div>
          )}
          {currentAlbumName && (
            <h2 className="display-font mt-3 text-4xl">{currentAlbumName}</h2>
          )}
          {visiblePhotos.length === 0 && (
            <p className="mt-4 border border-[#d8cec0] bg-[#fbf8f2] p-8 text-sm leading-6 text-[#536b60]">
              Nothing has been added to this album yet.
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePhotos.map((item) =>
              renderTile(item, visiblePhotos, view !== "all" && view !== "covers"),
            )}
          </div>
        </>
      )}

      {mediaTab === "videos" && (
        <>
          {reorderable && (
            <p className="mt-8 text-xs uppercase tracking-[.14em] text-[#536b60]">
              Drag videos to reorder{savingOrder ? " · Saving…" : ""}
            </p>
          )}
          {videoMedia.length === 0 && (
            <p className="mt-4 border border-[#d8cec0] bg-[#fbf8f2] p-8 text-sm leading-6 text-[#536b60]">
              No videos have been shared yet.
            </p>
          )}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {videoMedia.map((item) => renderTile(item, videoMedia, false))}
          </div>
        </>
      )}

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

          <div
            className="aspect-video w-[90vw] max-w-4xl"
            onClick={(event) => event.stopPropagation()}
          >
            {activeEmbed.kind === "file" ? (
              <video
                src={activeEmbed.src}
                controls
                autoPlay
                className="h-full w-full bg-black"
              />
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
