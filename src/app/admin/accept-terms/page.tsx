import Link from "next/link";
import AcceptTermsForm from "./accept-terms-form";

export default async function AcceptTermsPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="paper-grain min-h-screen px-6 py-10 lg:px-10">
      <Link href="/" className="text-sm text-[#536b60] hover:text-[#c48a3a]">
        ← Back home
      </Link>
      <section className="mx-auto max-w-md py-16">
        <h1 className="display-font text-5xl leading-[.9]">
          One more step
        </h1>
        <div className="mt-8 border border-[#d8cec0] bg-[#fbf8f2] p-8">
          {token ? (
            <AcceptTermsForm token={token} />
          ) : (
            <p className="text-sm text-[#b8786f]">
              This link is missing its token. Please sign in again.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
