import Link from "next/link";

export default function Gallery() {
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
            Photos and films from a life surrounded by love. Family uploads will
            appear here after approval.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="photo-placeholder aspect-square" />
          <div className="photo-placeholder aspect-square" />
          <div className="flex aspect-square flex-col justify-between bg-[#d9b5a8] p-6">
            <span className="text-xs uppercase tracking-[.2em]">
              Coming soon
            </span>
            <h2 className="display-font text-4xl">
              Video
              <br />
              memories
            </h2>
          </div>
        </div>
        <div className="mt-10 border-t border-[#d8cec0] pt-8">
          <h2 className="display-font text-4xl">Share a memory</h2>
          <p className="mt-2 text-sm text-[#536b60]">
            The upload form will accept burial photos and send them to the
            family for review.
          </p>
          <button className="mt-5 rounded-full bg-[#1f2d2b] px-6 py-3 text-sm font-semibold text-[#fbf8f2]">
            Upload a photo
          </button>
        </div>
      </section>
    </main>
  );
}
