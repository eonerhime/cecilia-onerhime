import TributeForm from "./tribute-form";
import { getApprovedTributesList, getMemorialSettings } from "@/lib/memorial";
import SiteNav from "@/components/site-nav";

export default async function Tributes() {
  const [tributes, settings] = await Promise.all([
    getApprovedTributesList(),
    getMemorialSettings(),
  ]);

  return (
    <main className="paper-grain min-h-screen">
      <SiteNav displayName={settings.displayName} current="tributes" />
      <section className="mx-auto max-w-5xl px-6 py-20 lg:px-10">
        <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
          Words of love
        </p>
        <h1 className="display-font mt-6 text-7xl leading-[.85]">Tributes</h1>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <div className="border border-[#d8cec0] bg-[#fbf8f2] p-8">
            <h2 className="display-font text-4xl">Leave a tribute</h2>
            <p className="mt-3 text-sm leading-6 text-[#536b60]">
              Your words will be sent to the family for review before they are
              shared here.
            </p>
            <TributeForm />
          </div>
          {tributes.length ? (
            <div className="space-y-5">
              {tributes.map((tribute) => (
                <blockquote
                  key={tribute.id}
                  className="bg-[#536b60] p-8 text-[#fbf8f2]"
                >
                  <p className="display-font text-3xl leading-tight">
                    “{tribute.message}”
                  </p>
                  <cite className="mt-8 block text-xs not-italic uppercase tracking-[.2em] text-[#e4bb72]">
                    {tribute.name}
                  </cite>
                </blockquote>
              ))}
            </div>
          ) : (
            <div className="flex items-center border border-[#d8cec0] bg-[#fbf8f2] p-8 text-sm leading-6 text-[#536b60]">
              No tributes have been shared yet. Be the first to leave one.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
