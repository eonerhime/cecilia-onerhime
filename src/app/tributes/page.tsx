import TributeForm from "./tribute-form";
import TributesGrid from "./tributes-grid";
import { getApprovedTributesList, getMemorialSettings } from "@/lib/memorial";
import SiteNav from "@/components/site-nav";
import Reveal from "@/components/reveal";

export default async function Tributes() {
  const [tributes, settings] = await Promise.all([
    getApprovedTributesList(),
    getMemorialSettings(),
  ]);

  return (
    <main className="paper-grain min-h-screen">
      <SiteNav displayName={settings.displayName} heroImageUrl={settings.heroImageUrl} current="tributes" />
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-10">
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
      </section>
    </main>
  );
}
