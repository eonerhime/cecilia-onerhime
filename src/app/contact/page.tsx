import Link from "next/link";
import ContactForm from "./contact-form";
import Reveal from "@/components/reveal";

export default function ContactPage() {
  return (
    <main className="paper-grain min-h-screen px-6 py-10 lg:px-10">
      <Link href="/" className="link-underline text-sm text-[#536b60] hover:text-[#c48a3a]">
        ← Back home
      </Link>
      <section className="mx-auto max-w-6xl py-16 sm:py-20">
        <Reveal as="p" className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
          Websites with meaning
        </Reveal>
        <div className="mt-6 grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-start">
          <Reveal as="div" delayMs={80}>
            <h1 className="display-font text-6xl leading-[.86] sm:text-8xl">
              Make a place
              <br />
              <span className="text-[#536b60]">to remember.</span>
            </h1>
            <p className="mt-8 max-w-md text-base leading-7 text-[#536b60]">
              We build thoughtful, personal websites for the people and
              occasions that matter most.
            </p>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <div className="border-t-2 border-[#c48a3a] pt-4 transition-transform duration-300 hover:translate-x-1">
                <h2 className="display-font text-3xl">Memorial websites</h2>
                <p className="mt-2 text-sm leading-6 text-[#536b60]">
                  A living place for stories, photographs, tributes, programmes,
                  and family memories.
                </p>
              </div>
              <div className="border-t-2 border-[#536b60] pt-4 transition-transform duration-300 hover:translate-x-1">
                <h2 className="display-font text-3xl">
                  Birthdays & celebrations
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#536b60]">
                  A beautiful digital invitation, memory book, event guide, or
                  keepsake for the day.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delayMs={160} className="border border-[#d8cec0] bg-[#fbf8f2] p-6 sm:p-10">
            <h2 className="display-font text-4xl">
              Tell us what you&apos;re imagining
            </h2>
            <p className="mt-3 mb-8 text-sm leading-6 text-[#536b60]">
              Share a little about the person, event, or story. We&apos;ll reply
              with a thoughtful way forward.
            </p>
            <ContactForm />
          </Reveal>
        </div>
      </section>
      <footer className="mx-auto max-w-6xl border-t border-[#d8cec0] py-8 text-xs text-[#536b60]">
        <p>Custom memorial and celebration websites, made with care.</p>
      </footer>
    </main>
  );
}
