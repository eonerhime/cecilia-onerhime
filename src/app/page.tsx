import Image from "next/image";
import Link from "next/link";
import { getApprovedMemories, getHeroImages, getMemorialSettings } from "@/lib/memorial";
import { getContentBlocks, block } from "@/lib/content";
import { DEFAULT_TENANT_ID } from "@/lib/tenant";
import { Editable, EditableSetting, HeroVisualEditor } from "@/components/editable";
import AdminNavLink from "@/components/admin-nav-link";
import HomeMemoriesGrid from "@/components/home-memories-grid";
import HomeTributesGrid from "@/components/home-tributes-grid";
import HeroCarousel from "@/components/hero-carousel";

const localImages = [
  "/images/WhatsApp Image 2026-09-02 at 19.09.54 (1).jpeg",
  "/images/WhatsApp Image 2026-09-02 at 19.09.53.jpeg",
  "/images/WhatsApp Image 2026-09-02 at 19.09.52.jpeg",
];

const DEFAULT_EVENTS = [
  {
    number: "01",
    title: "Service of Songs",
    description: "A night of music, memories, and shared stories.",
  },
  {
    number: "02",
    title: "Burial Rites",
    description: "A final farewell surrounded by family and friends.",
  },
  {
    number: "03",
    title: "Thanksgiving",
    description: "A joyful gathering to give thanks for her life.",
  },
];

export default async function Home() {
  const [settings, memories, blocks, heroImages] = await Promise.all([
    getMemorialSettings(),
    getApprovedMemories(),
    getContentBlocks(DEFAULT_TENANT_ID),
    getHeroImages(),
  ]);

  const heroCaption = block(blocks, "home.hero.caption", "Forever held\nin our hearts");
  const farewellHeading = block(
    blocks,
    "home.farewell.heading",
    "Three days.\nOne beautiful life.",
  );
  const gatheringHeading = block(
    blocks,
    "home.gathering.heading",
    "Keep the memories\nclose.",
  );
  const sharedHeading = block(blocks, "home.shared.heading", "The love\nwe carry.");

  return (
    <main className="paper-grain min-h-screen">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-7 lg:px-10">
        <EditableSetting instanceId="nav" field="displayName" settings={settings}>
          <Link href="/" aria-label={settings.displayName}>
            {settings.heroImageUrl ? (
              <span className="relative block h-11 w-11 overflow-hidden rounded-full">
                <Image
                  src={settings.heroImageUrl}
                  alt={settings.displayName}
                  fill
                  sizes="44px"
                  className="object-cover object-top"
                  unoptimized
                />
              </span>
            ) : (
              <span className="display-font text-2xl font-semibold tracking-tight">
                {settings.displayName}
              </span>
            )}
          </Link>
        </EditableSetting>
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
          <AdminNavLink className="hover:text-[#c48a3a]" />
        </div>
      </nav>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 pb-20 pt-10 lg:grid-cols-[1.08fr_.92fr] lg:items-center lg:px-10 lg:pb-32 lg:pt-16">
        <div>
          <Editable
            blockKey="home.hero.eyebrow"
            value={block(blocks, "home.hero.eyebrow", "A life beautifully lived")}
          >
            <p className="rule-mark mb-7 text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
              {block(blocks, "home.hero.eyebrow", "A life beautifully lived")}
            </p>
          </Editable>
          <h1 className="display-font max-w-3xl text-6xl font-semibold leading-[.9] tracking-[-.03em] text-[#1f2d2b] sm:text-8xl">
            <Editable
              as="span"
              blockKey="home.hero.prefix"
              value={block(blocks, "home.hero.prefix", "In loving memory of")}
            >
              {block(blocks, "home.hero.prefix", "In loving memory of")}
            </Editable>{" "}
            <EditableSetting as="span" instanceId="hero" field="displayName" settings={settings}>
              <em className="font-medium text-[#536b60]">
                {settings.displayName.split(" ")[0]}.
              </em>
            </EditableSetting>
          </h1>
          <Editable
            blockKey="home.hero.intro"
            value={block(
              blocks,
              "home.hero.intro",
              "A place to remember her warmth, gather the stories she gave us, and celebrate the love that remains.",
            )}
            multiline
          >
            <p className="mt-8 max-w-lg text-base leading-7 text-[#536b60]">
              {block(
                blocks,
                "home.hero.intro",
                "A place to remember her warmth, gather the stories she gave us, and celebrate the love that remains.",
              )}
            </p>
          </Editable>
          <div className="mt-9 flex flex-wrap gap-3">
            <Editable
              blockKey="home.hero.cta1"
              value={block(blocks, "home.hero.cta1", "Remember her life")}
            >
              <a
                href="/profile"
                className="rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold text-[#1f2d2b] transition-transform hover:-translate-y-1"
              >
                {block(blocks, "home.hero.cta1", "Remember her life")}{" "}
                <span aria-hidden="true">→</span>
              </a>
            </Editable>
            <Editable
              blockKey="home.hero.cta2"
              value={block(blocks, "home.hero.cta2", "Share a tribute")}
            >
              <a
                href="/tributes"
                className="rounded-full border border-[#b5a998] px-6 py-3 text-sm font-semibold text-[#1f2d2b] hover:border-[#1f2d2b]"
              >
                {block(blocks, "home.hero.cta2", "Share a tribute")}
              </a>
            </Editable>
          </div>
        </div>
        <div className="relative mx-auto w-full max-w-md lg:justify-self-end">
          <div
            className={`${heroImages.length ? "relative overflow-hidden bg-[#536b60]" : "photo-placeholder"} aspect-[4/5] rounded-[48%_48%_4%_4%] shadow-[18px_20px_0_#d8cec0]`}
            aria-label={`Portrait of ${settings.displayName}`}
          >
            {heroImages.length > 0 && (
              <HeroCarousel images={heroImages} alt={settings.displayName} />
            )}
          </div>
          <div className="absolute -bottom-8 -left-5 max-w-[210px] border-l-2 border-[#c48a3a] bg-[#fbf8f2]/90 px-5 py-3 backdrop-blur-sm">
            <p className="display-font text-2xl leading-none">
              {heroCaption.split("\n").map((line, index) => (
                <span key={index}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
            </p>
          </div>
          <HeroVisualEditor caption={heroCaption} />
        </div>
      </section>
      <section className="border-y border-[#d8cec0] bg-[#536b60] text-[#fbf8f2]">
        <div className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-[.8fr_1.2fr] lg:px-10">
          <div>
            <Editable
              blockKey="home.farewell.eyebrow"
              value={block(blocks, "home.farewell.eyebrow", "The farewell")}
            >
              <p className="text-xs uppercase tracking-[.24em] text-[#e4bb72]">
                {block(blocks, "home.farewell.eyebrow", "The farewell")}
              </p>
            </Editable>
            <Editable blockKey="home.farewell.heading" value={farewellHeading} multiline>
              <h2 className="display-font mt-3 text-5xl leading-none">
                {farewellHeading.split("\n").map((line, index) => (
                  <span key={index}>
                    {index > 0 && <br />}
                    {line}
                  </span>
                ))}
              </h2>
            </Editable>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {DEFAULT_EVENTS.map((event) => {
              const title = block(
                blocks,
                `home.farewell.event.${event.number}.title`,
                event.title,
              );
              const description = block(
                blocks,
                `home.farewell.event.${event.number}.description`,
                event.description,
              );
              return (
                <div key={event.number} className="border-t border-[#91a397] pt-4">
                  <span className="text-xs text-[#e4bb72]">{event.number}</span>
                  <Editable
                    blockKey={`home.farewell.event.${event.number}.title`}
                    value={title}
                  >
                    <a href="/programme" className="group block">
                      <h3 className="display-font mt-5 text-3xl group-hover:text-[#e4bb72]">
                        {title}
                      </h3>
                    </a>
                  </Editable>
                  <Editable
                    blockKey={`home.farewell.event.${event.number}.description`}
                    value={description}
                    multiline
                  >
                    <p className="mt-2 text-sm leading-6 text-[#d9e0d9]">
                      {description}
                    </p>
                  </Editable>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[.9fr_1.1fr] lg:px-10">
        <div>
          <Editable
            blockKey="home.gathering.eyebrow"
            value={block(blocks, "home.gathering.eyebrow", "A gathering place")}
          >
            <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
              {block(blocks, "home.gathering.eyebrow", "A gathering place")}
            </p>
          </Editable>
          <Editable blockKey="home.gathering.heading" value={gatheringHeading} multiline>
            <h2 className="display-font mt-5 text-5xl leading-[.95]">
              {gatheringHeading.split("\n").map((line, index) => (
                <span key={index} className={index === 1 ? "text-[#536b60]" : undefined}>
                  {index > 0 && <br />}
                  {line}
                </span>
              ))}
            </h2>
          </Editable>
          <Editable
            blockKey="home.gathering.intro"
            value={block(
              blocks,
              "home.gathering.intro",
              "Browse the moments that made Cecilia who she was, or leave a few words for the family. Every submission is reviewed with care.",
            )}
            multiline
          >
            <p className="mt-5 max-w-md text-sm leading-7 text-[#536b60]">
              {block(
                blocks,
                "home.gathering.intro",
                "Browse the moments that made Cecilia who she was, or leave a few words for the family. Every submission is reviewed with care.",
              )}
            </p>
          </Editable>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <a
            href="/gallery"
            className="group photo-placeholder flex min-h-64 items-end rounded-sm p-6 text-[#fbf8f2]"
          >
            <div>
              <Editable
                blockKey="home.gathering.galleryLabel"
                value={block(blocks, "home.gathering.galleryLabel", "See the moments")}
              >
                <p className="text-xs uppercase tracking-[.2em] text-[#e4bb72]">
                  {block(blocks, "home.gathering.galleryLabel", "See the moments")}
                </p>
              </Editable>
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
            <Editable
              blockKey="home.gathering.tributesLabel"
              value={block(blocks, "home.gathering.tributesLabel", "Leave a few words")}
            >
              <p className="text-xs uppercase tracking-[.2em]">
                {block(blocks, "home.gathering.tributesLabel", "Leave a few words")}
              </p>
            </Editable>
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
              <Editable
                blockKey="home.shared.eyebrow"
                value={block(blocks, "home.shared.eyebrow", "Shared memories")}
              >
                <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
                  {block(blocks, "home.shared.eyebrow", "Shared memories")}
                </p>
              </Editable>
              <Editable blockKey="home.shared.heading" value={sharedHeading} multiline>
                <h2 className="display-font mt-5 text-5xl leading-[.95]">
                  {sharedHeading.split("\n").map((line, index) => (
                    <span key={index} className={index === 1 ? "text-[#536b60]" : undefined}>
                      {index > 0 && <br />}
                      {line}
                    </span>
                  ))}
                </h2>
              </Editable>
            </div>
            <Link
              href="/gallery"
              className="text-sm font-semibold text-[#536b60] hover:text-[#c48a3a]"
            >
              Visit the gallery <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <HomeMemoriesGrid
            media={
              memories.media.length
                ? memories.media
                : localImages.map((mediaUrl, index) => ({
                    id: `local-${index}`,
                    mediaUrl,
                    mediaType: "image" as const,
                    caption: null,
                    albumId: null,
                    thumbnailUrl: null,
                  }))
            }
            displayName={settings.displayName}
          />
          <HomeTributesGrid
            tributes={
              memories.tributes.length
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
            }
          />
        </div>
      </section>
      <footer className="mx-auto flex max-w-7xl flex-col gap-3 border-t border-[#d8cec0] px-6 py-8 text-xs text-[#536b60] sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <Editable
          blockKey="footer.prefix"
          value={block(blocks, "footer.prefix", "In memory of")}
        >
          <p>
            {block(blocks, "footer.prefix", "In memory of")} {settings.displayName}
          </p>
        </Editable>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Link href="/privacy" className="hover:text-[#c48a3a]">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-[#c48a3a]">
            Terms
          </Link>
          <Link href="/admin" className="hover:text-[#c48a3a]">
            Family sign-in
          </Link>
          <EditableSetting instanceId="footer" field="footerText" settings={settings}>
            <p>{settings.footerText}</p>
          </EditableSetting>
        </div>
      </footer>
    </main>
  );
}
