import Link from "next/link";
import {
  getApprovedMemories,
  getMemorialSettings,
  type ApprovedMedia,
} from "@/lib/memorial";

const localImages = [
  "/images/WhatsApp Image 2026-09-02 at 19.09.54 (1).jpeg",
  "/images/WhatsApp Image 2026-09-02 at 19.09.53.jpeg",
  "/images/WhatsApp Image 2026-09-02 at 19.09.52.jpeg",
];

export default async function Home() {
  const [settings, memories] = await Promise.all([
    getMemorialSettings(),
    getApprovedMemories(),
  ]);
  const events = [
    [
      "01",
      "Service of Songs",
      "A night of music, memories, and shared stories.",
    ],
    [
      "02",
      "Burial Rites",
      "A final farewell surrounded by family and friends.",
    ],
    ["03", "Thanksgiving", "A joyful gathering to give thanks for her life."],
  ];

  return (
    <main className="paper-grain min-h-screen">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
        <Link
          href="/"
          className="display-font text-2xl font-semibold tracking-tight"
        >
          {settings.displayName}
        </Link>
        <div className="hidden items-center gap-8 text-xs font-medium uppercase tracking-[.18em] text-[#536b60] md:flex">
          <a href="/profile" className="hover:text-[#c48a3a]">
            Her story
          </a>
          <a href="/gallery" className="hover:text-[#c48a3a]">
            Gallery
          </a>
          <a href="/tributes" className="hover:text-[#c48a3a]">
            Tributes
          </a>
          <a
            href="/programme"
            className="rounded-full bg-[#1f2d2b] px-5 py-3 text-[#fbf8f2] hover:bg-[#536b60]"
          >
            Programme
          </a>
        </div>
      </nav>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-10 lg:pb-32 lg:pt-16">
        <div>
          <p className="rule-mark mb-7 text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
            A life beautifully lived
          </p>
          <h1 className="display-font max-w-3xl text-6xl font-semibold leading-[.9] tracking-[-.03em] text-[#1f2d2b] sm:text-8xl">
            In loving memory of{" "}
            <em className="font-medium text-[#536b60]">Cecilia.</em>
          </h1>
          <p className="mt-8 max-w-lg text-base leading-7 text-[#536b60]">
            A place to remember her warmth, gather the stories she gave us, and
            celebrate the love that remains.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a
              href="/profile"
              className="rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold text-[#1f2d2b] transition-transform hover:-translate-y-1"
            >
              Remember her life <span aria-hidden="true">→</span>
            </a>
            <a
              href="/tributes"
              className="rounded-full border border-[#b5a998] px-6 py-3 text-sm font-semibold text-[#1f2d2b] hover:border-[#1f2d2b]"
            >
              Share a tribute
            </a>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:justify-self-end">
          <div
            className="photo-placeholder aspect-[4/5] rounded-[48%_48%_4%_4%] shadow-[18px_20px_0_#d8cec0]"
            aria-label="Portrait of Cecilia to be added in public/images"
          ></div>
          <div className="absolute -bottom-8 -left-5 max-w-[210px] border-l-2 border-[#c48a3a] bg-[#fbf8f2]/90 px-5 py-3 backdrop-blur-sm">
            <p className="display-font text-2xl leading-none">
              Forever held
              <br />
              in our hearts
            </p>
          </div>
        </div>
      </section>
      <section className="border-y border-[#d8cec0] bg-[#536b60] text-[#fbf8f2]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
          <div>
            <p className="text-xs uppercase tracking-[.24em] text-[#e4bb72]">
              The farewell
            </p>
            <h2 className="display-font mt-3 text-5xl leading-none">
              Three days.
              <br />
              One beautiful life.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {events.map(([number, title, copy]) => (
              <a
                href="/programme"
                key={number}
                className="group border-t border-[#91a397] pt-4"
              >
                <span className="text-xs text-[#e4bb72]">{number}</span>
                <h3 className="display-font mt-5 text-3xl group-hover:text-[#e4bb72]">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#d9e0d9]">{copy}</p>
              </a>
            ))}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
        <div>
          <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
            A gathering place
          </p>
          <h2 className="display-font mt-5 text-5xl leading-[.95]">
            Keep the memories
            <br />
            <span className="text-[#536b60]">close.</span>
          </h2>
          <p className="mt-5 max-w-md text-sm leading-7 text-[#536b60]">
            Browse the moments that made Cecilia who she was, or leave a few
            words for the family. Every submission is reviewed with care.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="/gallery"
            className="group photo-placeholder flex min-h-64 items-end rounded-sm p-6 text-[#fbf8f2]"
          >
            <div>
              <p className="text-xs uppercase tracking-[.2em] text-[#e4bb72]">
                See the moments
              </p>
              <h3 className="display-font mt-2 text-4xl">
                Gallery{" "}
                <span className="transition-transform group-hover:ml-2">↗</span>
              </h3>
            </div>
          </a>
          <a
            href="/tributes"
            className="flex min-h-64 flex-col justify-between rounded-sm bg-[#d9b5a8] p-6 text-[#1f2d2b] hover:bg-[#cda095]"
          >
            <p className="text-xs uppercase tracking-[.2em]">
              Leave a few words
            </p>
            <h3 className="display-font text-4xl">
              Tributes <span>↗</span>
            </h3>
          </a>
        </div>
      </section>
      <section className="border-y border-[#d8cec0] bg-[#fbf8f2]">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
                Shared memories
              </p>
              <h2 className="display-font mt-5 text-5xl leading-[.95]">
                The love
                <br />
                <span className="text-[#536b60]">we carry.</span>
              </h2>
            </div>
            <Link
              href="/gallery"
              className="text-sm font-semibold text-[#536b60] hover:text-[#c48a3a]"
            >
              Visit the gallery <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(memories.media.length
              ? memories.media
              : localImages.map((mediaUrl, index) => ({
                  id: `local-${index}`,
                  mediaUrl,
                  mediaType: "image" as const,
                  caption: null,
                }))
            ).map((item: ApprovedMedia) => (
              <div
                key={item.id}
                className="group relative aspect-[4/3] overflow-hidden bg-[#536b60]"
              >
                {item.mediaType === "image" ? (
                  <img
                    src={item.mediaUrl}
                    alt={item.caption || "A memory of Cecilia"}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center p-6 text-center text-[#fbf8f2]">
                    <span className="display-font text-3xl">
                      Video memory ↗
                    </span>
                  </div>
                )}
                {item.caption && (
                  <p className="absolute inset-x-0 bottom-0 bg-[#1f2d2b]/80 px-4 py-3 text-xs text-[#fbf8f2]">
                    {item.caption}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {(memories.tributes.length
              ? memories.tributes
              : [
                  {
                    id: "sample-1",
                    name: "A family memory",
                    message:
                      "Her kindness had a way of making everyone feel at home.",
                  },
                  {
                    id: "sample-2",
                    name: "With love",
                    message:
                      "We will keep her laughter close, in all the ordinary days ahead.",
                  },
                ]
            ).map((tribute) => (
              <blockquote
                key={tribute.id}
                className="border-t-2 border-[#c48a3a] pt-4"
              >
                <p className="display-font text-2xl leading-tight text-[#1f2d2b]">
                  “{tribute.message}”
                </p>
                <cite className="mt-4 block text-xs not-italic uppercase tracking-[.18em] text-[#536b60]">
                  {tribute.name}
                </cite>
              </blockquote>
            ))}
          </div>
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-[#d8cec0] px-6 py-8 text-xs text-[#536b60] sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <p>In memory of Cecilia Onerhime</p>
        <p>{settings.footerText}</p>
      </footer>
    </main>
  );
}
