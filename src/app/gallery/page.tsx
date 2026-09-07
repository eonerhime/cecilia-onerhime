import { getAlbums, getApprovedMediaList, getMemorialSettings } from "@/lib/memorial";
import GalleryGrid from "@/components/gallery-grid";
import ShareMediaForm from "./share-media-form";
import SiteNav from "@/components/site-nav";
import Reveal from "@/components/reveal";

export default async function Gallery() {
  const [settings, media, albums] = await Promise.all([
    getMemorialSettings(),
    getApprovedMediaList(),
    getAlbums(),
  ]);

  return (
    <main className="paper-grain min-h-screen">
      <SiteNav displayName={settings.displayName} heroImageUrl={settings.heroImageUrl} current="gallery" />
      <section className="mx-auto max-w-6xl px-6 py-20 lg:px-10">
        <Reveal as="p" className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
          The memories
        </Reveal>
        <Reveal as="div" delayMs={80} className="mt-6 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <h1 className="display-font text-7xl leading-[.85]">Gallery</h1>
          <p className="max-w-sm text-sm leading-6 text-[#536b60]">
            Photos and films from a life surrounded by love.
          </p>
        </Reveal>
        {media.length ? (
          <GalleryGrid
            media={media}
            albums={albums}
            displayName={settings.displayName}
            shareSlot={<ShareMediaForm albums={albums} />}
          />
        ) : (
          <ShareMediaForm albums={albums} />
        )}
        {!media.length && (
          <p className="mt-12 border border-[#d8cec0] bg-[#fbf8f2] p-8 text-sm leading-6 text-[#536b60]">
            Nothing has been approved for the gallery yet. Family photos and
            films will appear here once the family has reviewed them.
          </p>
        )}
      </section>
    </main>
  );
}
