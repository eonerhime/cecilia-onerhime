import Link from "next/link";

export const metadata = {
  title: "Terms of Use | Cecilia Onerhime",
};

export default function TermsOfUse() {
  return (
    <main className="paper-grain min-h-screen px-6 py-10 lg:px-10">
      <Link href="/" className="text-sm text-[#536b60] hover:text-[#c48a3a]">
        ← Back home
      </Link>
      <article className="mx-auto max-w-3xl py-16">
        <p className="rule-mark text-xs font-bold uppercase tracking-[.25em] text-[#b8786f]">
          Legal
        </p>
        <h1 className="display-font mt-5 text-6xl leading-[.95]">
          Terms of Use
        </h1>
        <p className="mt-4 text-sm text-[#8b9c8b]">Last updated: September 4, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-[#536b60]">
          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              1. Acceptance of these terms
            </h2>
            <p className="mt-3">
              By visiting this site, submitting a tribute, photo, video, or
              message, or signing in to the family workspace, you agree to
              these Terms of Use and to our{" "}
              <Link href="/privacy" className="underline underline-offset-4">
                Privacy Policy
              </Link>
              . If you do not agree, please do not use this site.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              2. About this site
            </h2>
            <p className="mt-3">
              This site is a private memorial maintained by the Onerhime
              family to remember Cecilia Onerhime, share information about
              her memorial services, and gather tributes and memories from
              family and friends. It is not a commercial product.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              3. Tributes, photos, and videos you submit
            </h2>
            <p className="mt-3">
              You may only submit content that you have the right to share.
              By submitting a tribute, photo, video, or caption, you grant
              the Onerhime family a non-exclusive, worldwide, royalty-free
              licence to display, reproduce, and use that content on this
              site for the purpose of Cecilia&apos;s memorial. Every
              submission is reviewed by a family member before it is shown
              publicly, and the family may decline or later remove any
              submission, at its sole discretion, for any reason, including
              content that does not fit the purpose or tone of this memorial.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              4. Content that is not allowed
            </h2>
            <p className="mt-3">
              Do not submit content that is defamatory, hateful, obscene,
              harassing, false or misleading, infringes someone else&apos;s
              rights, or is otherwise unlawful. We reserve the right to
              reject or remove any such content without notice.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              5. Family workspace accounts
            </h2>
            <p className="mt-3">
              Access to the family workspace (for reviewing submissions and
              managing the site) is limited to family members who have been
              invited. You are responsible for keeping your sign-in
              credentials secure and for all activity under your account. An
              existing administrator may revoke your access at any time.
              Please do not share your workspace access with anyone outside
              the invited family group.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              6. Ownership
            </h2>
            <p className="mt-3">
              Apart from the tributes, photos, and videos you submit under
              the licence described above, the design, layout, and content
              of this site belong to the Onerhime family.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              7. No warranty
            </h2>
            <p className="mt-3">
              This site is provided &ldquo;as is&rdquo;, without warranties
              of any kind, express or implied. We do our best to keep it
              available and accurate, but we do not guarantee uninterrupted
              or error-free access.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              8. Limitation of liability
            </h2>
            <p className="mt-3">
              To the fullest extent permitted by law, the Onerhime family
              will not be liable for any indirect, incidental, or
              consequential damages arising from your use of this site.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              9. Changes and termination
            </h2>
            <p className="mt-3">
              We may update these terms, change, suspend, or discontinue any
              part of this site, or remove content or accounts, at any time
              and without notice.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              10. Governing law
            </h2>
            <p className="mt-3">
              These terms are governed by the laws of Nigeria, without
              regard to its conflict of laws principles.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              11. Contact us
            </h2>
            <p className="mt-3">
              Questions about these terms can be sent through the{" "}
              <Link href="/contact" className="underline underline-offset-4">
                contact page
              </Link>
              .
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
