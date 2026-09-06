import { getMemorialSettings } from "@/lib/memorial";
import { getContentBlocks, block } from "@/lib/content";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";
import { Editable, EditablePdfLink } from "@/components/editable";
import SiteNav from "@/components/site-nav";

const DEFAULT_EVENTS = [
  {
    number: "0",
    title: "Service of Songs",
    detail: "Date and venue to be added",
    copy: "An evening of music and remembrance.",
  },
  {
    number: "1",
    title: "Burial Rites",
    detail: "Date and venue to be added",
    copy: "The final farewell and committal service.",
  },
  {
    number: "2",
    title: "Thanksgiving Service",
    detail: "Date and venue to be added",
    copy: "A gathering to give thanks for Cecilia's life.",
  },
];

export default async function Programme() {
  const [settings, blocks] = await Promise.all([
    getMemorialSettings(),
    getContentBlocks(DEFAULT_TENANT_ID),
  ]);

  const heading = block(blocks, "programme.heading", "Programme\nof events");
  const fullProgrammeHeading = block(
    blocks,
    "programme.full.heading",
    "Full programme",
  );
  const fullProgrammeCopy = block(
    blocks,
    "programme.full.copy",
    "Each event's programme, once uploaded, appears here.",
  );

  const events = DEFAULT_EVENTS.map((event) => ({
    ...event,
    title: block(blocks, `programme.event.${event.number}.title`, event.title),
    detail: block(blocks, `programme.event.${event.number}.detail`, event.detail),
    copy: block(blocks, `programme.event.${event.number}.copy`, event.copy),
    pdfUrl: block(blocks, `programme.event.${event.number}.pdfUrl`, ""),
  }));
  const eventsWithPdf = events.filter((event) => event.pdfUrl);

  return (
    <main className="paper-grain min-h-screen">
      <SiteNav displayName={settings.displayName} current="programme" />
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-10">
        <Editable
          blockKey="programme.eyebrow"
          value={block(blocks, "programme.eyebrow", "The farewell")}
        >
          <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
            {block(blocks, "programme.eyebrow", "The farewell")}
          </p>
        </Editable>
        <Editable blockKey="programme.heading" value={heading} multiline>
          <h1 className="display-font mt-6 text-7xl leading-[.85]">
            {heading.split("\n").map((line, index) => (
              <span key={index} className={index === 1 ? "text-[#536b60]" : undefined}>
                {index > 0 && <br />}
                {line}
              </span>
            ))}
          </h1>
        </Editable>
        <div className="mt-12 divide-y divide-[#d8cec0] border-y border-[#d8cec0]">
          {events.map((event, index) => (
            <article
              className="grid gap-4 py-7 md:grid-cols-[80px_1fr_1fr]"
              key={event.number}
            >
              <span className="text-sm text-[#c48a3a]">0{index + 1}</span>
              <Editable
                blockKey={`programme.event.${event.number}.title`}
                value={event.title}
              >
                <h2 className="display-font text-4xl">{event.title}</h2>
              </Editable>
              <div>
                <Editable
                  blockKey={`programme.event.${event.number}.detail`}
                  value={event.detail}
                >
                  <p className="text-sm font-semibold">{event.detail}</p>
                </Editable>
                <Editable
                  blockKey={`programme.event.${event.number}.copy`}
                  value={event.copy}
                >
                  <p className="mt-2 text-sm leading-6 text-[#536b60]">
                    {event.copy}
                  </p>
                </Editable>
                <div className="mt-3">
                  <EditablePdfLink
                    blockKey={`programme.event.${event.number}.pdfUrl`}
                    value={event.pdfUrl}
                    label="View programme"
                    linkClassName="inline-flex items-center gap-1 text-xs font-semibold text-[#c48a3a] underline underline-offset-2"
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 bg-[#d9b5a8] p-6">
          <div>
            <Editable blockKey="programme.full.heading" value={fullProgrammeHeading}>
              <h2 className="display-font text-3xl">{fullProgrammeHeading}</h2>
            </Editable>
            <Editable blockKey="programme.full.copy" value={fullProgrammeCopy}>
              <p className="mt-1 text-sm text-[#536b60]">{fullProgrammeCopy}</p>
            </Editable>
          </div>
          <div className="flex flex-wrap gap-3">
            {eventsWithPdf.length ? (
              eventsWithPdf.map((event) => (
                <a
                  key={event.number}
                  href={event.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[#1f2d2b] px-5 py-3 text-sm font-semibold text-[#fbf8f2]"
                >
                  {event.title} ↗
                </a>
              ))
            ) : (
              <p className="text-sm text-[#536b60]">
                Nothing has been uploaded yet.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
