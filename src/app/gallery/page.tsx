import Link from "next/link";
import { getApprovedMediaList, getMemorialSettings } from "@/lib/memorial";
import GalleryGrid from "@/components/gallery-grid";

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
          <GalleryGrid media={media} displayName={settings.displayName} />
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
