import Link from "next/link";

export default function Tributes() {
  return (
    <main className="paper-grain min-h-screen px-6 py-10 lg:px-10">
      <Link href="/" className="text-sm text-[#536b60]">
        ← Back home
      </Link>
      <section className="mx-auto max-w-5xl py-20">
        <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
          Words of love
        </p>
        <h1 className="display-font mt-6 text-7xl leading-[.85]">Tributes</h1>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          <blockquote className="bg-[#536b60] p-8 text-[#fbf8f2]">
            <p className="display-font text-3xl leading-tight">
              “Her kindness had a way of making everyone feel at home.”
            </p>
            <cite className="mt-8 block text-xs not-italic uppercase tracking-[.2em] text-[#e4bb72]">
              A family memory
            </cite>
          </blockquote>
          <div className="border border-[#d8cec0] bg-[#fbf8f2] p-8">
            <h2 className="display-font text-4xl">Leave a tribute</h2>
            <p className="mt-3 text-sm leading-6 text-[#536b60]">
              Your words will be sent to the family for review before they are
              shared here.
            </p>
            <div className="mt-7 space-y-3">
              <input
                className="w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
                placeholder="Your name"
              />
              <textarea
                className="h-28 w-full resize-none border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
                placeholder="Your memory or message"
              />
              <button className="rounded-full bg-[#c48a3a] px-6 py-3 text-sm font-semibold">
                Send tribute
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
