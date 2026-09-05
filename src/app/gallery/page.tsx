import Image from "next/image";
import Link from "next/link";
import { getApprovedMediaList, getMemorialSettings } from "@/lib/memorial";

export default async function Gallery() {
  const [settings, media] = await Promise.all([
    getMemorialSettings(),
    getApprovedMediaList(),
  ]);

  return (
    <main className="paper-grain min-h-screen px-6 py-10 lg:px-10">
      <Link href="/" className="text-sm text-[#536b60]">
        ← Back home
      </Link>
      <section className="mx-auto max-w-6xl py-20">
        <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
          The memories
        </p>
        <div className="mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <h1 className="display-font text-7xl leading-[.85]">Gallery</h1>
          <p className="max-w-sm text-sm leading-6 text-[#536b60]">
            Photos and films from a life surrounded by love.
          </p>
        </div>
        {media.length ? (
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {media.map((item) =>
              item.mediaType === "image" ? (
                <div
                  key={item.id}
                  className="group relative aspect-square overflow-hidden bg-[#536b60]"
                >
                  <Image
                    src={item.mediaUrl}
                    alt={item.caption || `A memory of ${settings.displayName}`}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  />
                  {item.caption && (
                    <p className="absolute inset-x-0 bottom-0 bg-[#1f2d2b]/80 px-4 py-3 text-xs text-[#fbf8f2]">
                      {item.caption}
                    </p>
                  )}
                </div>
              ) : (
                <a
                  key={item.id}
                  href={item.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex aspect-square flex-col items-center justify-center gap-2 bg-[#536b60] p-6 text-center text-[#fbf8f2] hover:bg-[#1f2d2b]"
                >
                  <span className="display-font text-3xl">
                    Video memory ↗
                  </span>
                  {item.caption && (
                    <span className="text-xs text-[#d9e0d9]">
                      {item.caption}
                    </span>
                  )}
                </a>
              ),
            )}
          </div>
        ) : (
          <p className="mt-12 border border-[#d8cec0] bg-[#fbf8f2] p-8 text-sm leading-6 text-[#536b60]">
            Nothing has been approved for the gallery yet. Family photos and
            films will appear here once the family has reviewed them.
          </p>
        )}
      </section>
    </main>
  );
}
