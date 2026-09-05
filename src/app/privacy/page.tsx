import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Cecilia Onerhime",
};

export default function PrivacyPolicy() {
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
          Privacy Policy
        </h1>
        <p className="mt-4 text-sm text-[#8b9c8b]">Last updated: September 4, 2026</p>

        <div className="mt-10 space-y-8 text-sm leading-7 text-[#536b60]">
          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">1. Overview</h2>
            <p className="mt-3">
              This site (&ldquo;cecilia-onerhime&rdquo;) is a private memorial
              website maintained by the Onerhime family to remember Cecilia
              Onerhime, gather tributes and memories from family and friends,
              and share information about her memorial services. This policy
              explains what information we collect through the site, how we
              use it, and the choices you have.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              2. Information we collect
            </h2>
            <p className="mt-3 font-semibold text-[#1f2d2b]">
              Content you choose to submit
            </p>
            <p className="mt-2">
              When you leave a tribute, share a photo or video, or send a
              message through the contact form, we collect the name you
              provide, the content of your message or caption, and, for
              contact enquiries, your email address. All submissions are held
              for family review before anything is shown publicly.
            </p>
            <p className="mt-4 font-semibold text-[#1f2d2b]">
              Family workspace accounts
            </p>
            <p className="mt-2">
              Family members who help manage this site sign in either with a
              Google account or with an email and password. If you sign in
              with Google, we receive your email address and the name
              associated with your Google account. If you create a password
              instead, we store only a securely hashed version of it &mdash;
              we never store or have access to your actual password.
            </p>
            <p className="mt-4 font-semibold text-[#1f2d2b]">
              Automatically collected information
            </p>
            <p className="mt-2">
              We log the IP address associated with submissions and sign-in
              attempts solely to detect and limit abuse (for example,
              repeated failed sign-in attempts or spam submissions). We do
              not use this information for advertising or tracking.
            </p>
            <p className="mt-4 font-semibold text-[#1f2d2b]">Cookies</p>
            <p className="mt-2">
              We use a small number of essential cookies: one that keeps a
              signed-in family member&apos;s session active, and one that is
              set only during the few seconds of a Google sign-in to prevent
              request forgery. Neither is used for advertising, and we do not
              use third-party tracking or analytics cookies.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              3. How we use this information
            </h2>
            <p className="mt-3">
              We use the information above to: display approved tributes and
              memories on the site; let family members review, approve, or
              decline submissions; respond to enquiries sent through the
              contact form; secure the family workspace against unauthorised
              access; and prevent spam or abusive submissions.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              4. Service providers we use
            </h2>
            <p className="mt-3">
              We rely on a small number of service providers to run this
              site, each of which processes data only as needed to provide
              its service to us: a database host for storing submissions and
              account information; a hosting provider for serving the site;
              a file storage provider for photos and videos; Google, for
              sign-in when you choose that option; and an email delivery
              provider, for account verification and password-reset emails.
              We do not sell or share your information with anyone else.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              5. How long we keep information
            </h2>
            <p className="mt-3">
              Approved tributes and memories are kept for as long as this
              memorial site remains active. Rejected or pending submissions,
              and abuse-prevention logs, are kept only as long as needed for
              moderation and security before being removed. Family workspace
              accounts are kept while that person continues to help manage
              the site; access can be revoked at any time by another family
              administrator.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              6. Your choices
            </h2>
            <p className="mt-3">
              If you would like a tribute, photo, or message you submitted to
              be removed, or would like to know what information we hold
              about you, please reach out through the{" "}
              <Link href="/contact" className="underline underline-offset-4">
                contact page
              </Link>
              . Family members with workspace access can request account
              deletion at any time.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              7. Children&apos;s privacy
            </h2>
            <p className="mt-3">
              This site is not directed at children, and we do not knowingly
              collect information from children.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              8. Security
            </h2>
            <p className="mt-3">
              We use industry-standard measures to protect the information
              you share with us, including encrypted connections, hashed
              passwords, and access limited to invited family members.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              9. Changes to this policy
            </h2>
            <p className="mt-3">
              We may update this policy from time to time. The &ldquo;last
              updated&rdquo; date at the top of this page reflects the most
              recent revision.
            </p>
          </section>

          <section>
            <h2 className="display-font text-2xl text-[#1f2d2b]">
              10. Contact us
            </h2>
            <p className="mt-3">
              Questions about this policy or your information can be sent
              through the{" "}
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
