import Link from "next/link";

const events = [
  [
    "Service of Songs",
    "Date and venue to be added",
    "An evening of music and remembrance.",
  ],
  [
    "Burial Rites",
    "Date and venue to be added",
    "The final farewell and committal service.",
  ],
  [
    "Thanksgiving Service",
    "Date and venue to be added",
    "A gathering to give thanks for Cecilia's life.",
  ],
];

export default function Programme() {
  return (
    <main className="paper-grain min-h-screen px-6 py-10 lg:px-10">
      <Link href="/" className="text-sm text-[#536b60]">
        ← Back home
      </Link>
      <section className="mx-auto max-w-5xl py-20">
        <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
          The farewell
        </p>
        <h1 className="display-font mt-6 text-7xl leading-[.85]">
          Programme
          <br />
          <span className="text-[#536b60]">of events</span>
        </h1>
        <div className="mt-12 divide-y divide-[#d8cec0] border-y border-[#d8cec0]">
          {events.map(([title, detail, copy], index) => (
            <article
              className="grid gap-4 py-7 md:grid-cols-[80px_1fr_1fr]"
              key={title}
            >
              <span className="text-sm text-[#c48a3a]">0{index + 1}</span>
              <h2 className="display-font text-4xl">{title}</h2>
              <div>
                <p className="text-sm font-semibold">{detail}</p>
                <p className="mt-2 text-sm leading-6 text-[#536b60]">{copy}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 bg-[#d9b5a8] p-6">
          <div>
            <h2 className="display-font text-3xl">Full programme</h2>
            <p className="mt-1 text-sm text-[#536b60]">
              The official PDF will be available here.
            </p>
          </div>
          <a
            href="/programme/programme-of-events.pdf"
            className="rounded-full bg-[#1f2d2b] px-5 py-3 text-sm font-semibold text-[#fbf8f2]"
          >
            View PDF ↗
          </a>
        </div>
      </section>
    </main>
  );
}
