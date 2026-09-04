import Link from "next/link";

export default function Profile() {
  return (
    <main className="paper-grain min-h-screen px-6 py-10 lg:px-10">
      <Link href="/" className="text-sm text-[#536b60]">
        ← Back home
      </Link>
      <section className="mx-auto max-w-4xl py-20">
        <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
          Her story
        </p>
        <h1 className="display-font mt-6 text-7xl leading-[.9]">
          Cecilia
          <br />
          <span className="text-[#536b60]">Onerhime</span>
        </h1>
        <div className="mt-12 grid gap-10 border-t border-[#d8cec0] pt-8 md:grid-cols-[.7fr_1.3fr]">
          <p className="display-font text-3xl leading-tight">
            A mother, a guide, a source of light.
          </p>
          <div className="space-y-5 text-sm leading-7 text-[#536b60]">
            <p>
              This is where the story of Cecilia will live: the places she
              called home, the people she loved, and the small everyday ways she
              made life brighter.
            </p>
            <p>
              Add her biography, favourite sayings, milestones, and a portrait
              to <strong>public/images/</strong> when they are ready.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
