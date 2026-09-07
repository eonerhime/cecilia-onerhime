import Image from "next/image";
import TributeForm from "./tribute-form";
import TributesGrid from "./tributes-grid";
import { getApprovedTributesList, getHeroImages, getMemorialSettings } from "@/lib/memorial";
import SiteNav from "@/components/site-nav";
import Reveal from "@/components/reveal";

export default async function Tributes() {
  const [tributes, settings, heroImages] = await Promise.all([
    getApprovedTributesList(),
    getMemorialSettings(),
    getHeroImages(),
  ]);
  const backgroundPhoto = heroImages[0] ?? null;

  return (
    <main className="paper-grain min-h-screen">
      <SiteNav displayName={settings.displayName} heroImageUrl={settings.heroImageUrl} current="tributes" />
      <section className="relative mx-auto max-w-5xl px-6 py-20 lg:px-10">
        <div className="orb-field">
          <div className="orb h-72 w-72 bg-[#c48a3a] -left-14 top-0" />
          <div className="orb orb-delay h-56 w-56 bg-[#c48a3a] -right-8 bottom-10" />
        </div>
        {backgroundPhoto && (
          // Fills the empty space beside the header on wide screens only —
          // there's no equivalent empty space once the layout stacks to a
          // single column on mobile, so it'd just visually compete with the
          // "Leave a tribute" card there instead of sitting quietly behind it.
          <div
            className="pointer-events-none absolute -right-6 top-0 z-0 hidden h-80 w-80 opacity-25 sm:block lg:h-96 lg:w-96"
            style={{
              maskImage: "radial-gradient(circle, black 35%, transparent 70%)",
              WebkitMaskImage: "radial-gradient(circle, black 35%, transparent 70%)",
            }}
          >
            <Image
              src={backgroundPhoto.imageUrl}
              alt=""
              fill
              sizes="384px"
              className="object-cover"
            />
          </div>
        )}
        <div className="relative z-10">
          <Reveal as="p" className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
            Words of love
          </Reveal>
          <Reveal as="h1" delayMs={80} className="display-font mt-6 text-7xl leading-[.85]">
            Tributes
          </Reveal>
          <Reveal delayMs={160} className="mt-12 max-w-xl border border-[#d8cec0] bg-[#fbf8f2] p-8">
            <h2 className="display-font text-4xl">Leave a tribute</h2>
            <p className="mt-3 text-sm leading-6 text-[#536b60]">
              Your words will be sent to the family for review before they are
              shared here.
            </p>
            <TributeForm />
          </Reveal>
          {tributes.length ? (
            <TributesGrid tributes={tributes} />
          ) : (
            <div className="mt-12 border border-[#d8cec0] bg-[#fbf8f2] p-8 text-sm leading-6 text-[#536b60]">
              No tributes have been shared yet. Be the first to leave one.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
