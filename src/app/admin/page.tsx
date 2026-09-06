import Link from "next/link";
import AdminDashboard from "./admin-dashboard";
import AuthForm from "./auth-form";
import { getSession } from "@/lib/session";
import { getAlbums, getMemorialSettings } from "@/lib/memorial";
import {
  getContactInquiries,
  getPendingInvites,
  getPendingMedia,
  getPendingTributes,
  getTenantMembers,
} from "@/lib/admin-data";

const ERROR_MESSAGES: Record<string, string> = {
  not_invited:
    "That account isn't on the family access list yet. Ask an existing admin to invite it.",
  unverified_email: "That Google account's email isn't verified.",
  invalid_request: "Sign-in failed. Please try again.",
  invalid_or_expired_token: "That link is invalid or has expired.",
  oauth_failed: "Sign-in failed. Please try again.",
  oauth_not_configured: "Google sign-in isn't configured yet.",
  verification_failed: "That link couldn't be verified. Please try again.",
  too_many_attempts: "Too many attempts. Please try again later.",
};

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [session, params] = await Promise.all([getSession(), searchParams]);
  const errorMessage = params.error
    ? (ERROR_MESSAGES[params.error] ?? "Sign-in failed. Please try again.")
    : null;

  const data = session
    ? await Promise.all([
        getPendingTributes(session.tenantId),
        getPendingMedia(session.tenantId),
        getContactInquiries(session.tenantId),
        getMemorialSettings(),
        getTenantMembers(session.tenantId),
        getPendingInvites(session.tenantId),
        getAlbums({ includeHidden: true }),
      ])
    : null;

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
        {session && data ? (
          <AdminDashboard
            session={session}
            initialTributes={data[0]}
            initialMedia={data[1]}
            initialContacts={data[2]}
            initialSettings={data[3]}
            initialMembers={data[4]}
            initialInvites={data[5]}
            initialAlbums={data[6]}
          />
        ) : (
          <div className="mt-12 max-w-md border border-[#d8cec0] bg-[#fbf8f2] p-8">
            <h2 className="display-font text-4xl">Sign in</h2>
            <p className="mt-3 text-sm leading-6 text-[#536b60]">
              This private workspace is for family members reviewing
              submissions before they are shared.
            </p>
            {errorMessage && (
              <p className="mt-4 border-l-2 border-[#b8786f] px-4 py-3 text-sm text-[#b8786f]">
                {errorMessage}
              </p>
            )}
            <div className="mt-6">
              <AuthForm />
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
