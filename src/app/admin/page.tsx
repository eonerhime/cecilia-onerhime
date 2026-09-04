import Link from "next/link";
import AdminDashboard from "./admin-dashboard";

export default function AdminPage() {
  return (
    <main className="paper-grain min-h-screen px-6 py-10 lg:px-10">
      <Link href="/" className="text-sm text-[#536b60] hover:text-[#c48a3a]">
        ← Back home
      </Link>
      <section className="mx-auto max-w-6xl py-16">
        <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
          Family workspace
        </p>
        <div className="mt-6 flex flex-col justify-between gap-5 border-b border-[#d8cec0] pb-8 md:flex-row md:items-end">
          <h1 className="display-font text-7xl leading-[.85]">Review</h1>
          <p className="max-w-sm text-sm leading-6 text-[#536b60]">
            Hold each submission with care before it becomes part of
            Cecilia&apos;s story.
          </p>
        </div>
        <AdminDashboard />
      </section>
    </main>
  );
}
