"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import type { Role, Session } from "@/lib/session";
import type {
  ContactInquiry,
  PendingInvite,
  PendingMedia,
  PendingTribute,
  TenantMember,
} from "@/lib/admin-data";

type MemorialSettings = {
  displayName: string;
  templateId: string;
  heroImageUrl: string;
  footerText: string;
  colors: Record<
    | "background"
    | "foreground"
    | "paper"
    | "sage"
    | "accent"
    | "line"
    | "rose"
    | "peach",
    string
  >;
};

type Props = {
  session: Session;
  initialTributes: PendingTribute[];
  initialMedia: PendingMedia[];
  initialContacts: ContactInquiry[];
  initialSettings: MemorialSettings;
  initialMembers: TenantMember[];
  initialInvites: PendingInvite[];
};

const colorLabels: Array<[keyof MemorialSettings["colors"], string]> = [
  ["background", "Background"],
  ["foreground", "Text"],
  ["paper", "Paper"],
  ["sage", "Sage"],
  ["accent", "Accent"],
  ["line", "Lines"],
  ["rose", "Rose"],
  ["peach", "Peach"],
];

const ASSIGNABLE_ROLES: Role[] = ["admin", "editor", "moderator", "viewer"];

export default function AdminDashboard({
  session,
  initialTributes,
  initialMedia,
  initialContacts,
  initialSettings,
  initialMembers,
  initialInvites,
}: Props) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [savingSettings, setSavingSettings] = useState(false);
  const [importing, setImporting] = useState<"tributes" | "images" | null>(
    null,
  );
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("moderator");
  const [invitingBusy, setInvitingBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSettings(true);
    setError("");
    const response = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "settings", ...settings }),
    });
    setSavingSettings(false);
    if (!response.ok) {
      setError("Unable to save site settings.");
      return;
    }
    router.refresh();
  }

  async function moderate(
    type: "tribute" | "media",
    id: string,
    status: "approved" | "rejected",
  ) {
    const response = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id, status }),
    });
    if (!response.ok) {
      setError("Unable to update that submission.");
      return;
    }
    router.refresh();
  }

  async function importFile(type: "tributes" | "images", file: File | null) {
    if (!file) return;
    setImporting(type);
    setError("");
    setNotice("");
    const form = new FormData();
    form.set("type", type);
    form.set("file", file);
    const response = await fetch("/api/admin/import", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    setImporting(null);
    if (!response.ok) {
      setError(result.error || "Bulk import failed.");
      return;
    }
    setNotice(
      `${result.data.imported} ${type === "tributes" ? "tributes" : "images"} imported and waiting for review.`,
    );
    router.refresh();
  }

  async function importImages(files: FileList | null) {
    if (!files?.length) return;
    setImporting("images");
    setError("");
    setNotice("");
    const form = new FormData();
    form.set("type", "images");
    Array.from(files).forEach((file) => form.append("files", file));
    const response = await fetch("/api/admin/import", {
      method: "POST",
      body: form,
    });
    const result = await response.json();
    setImporting(null);
    if (!response.ok) {
      setError(result.error || "Bulk image upload failed.");
      return;
    }
    setNotice(
      `${result.data.imported} images imported and waiting for review.`,
    );
    router.refresh();
  }

  async function sendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInvitingBusy(true);
    setError("");
    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    setInvitingBusy(false);
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Unable to send that invite.");
      return;
    }
    setInviteEmail("");
    router.refresh();
  }

  async function revokeMember(userId: string) {
    const response = await fetch("/api/admin/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (!response.ok) {
      setError("Unable to revoke that member.");
      return;
    }
    router.refresh();
  }

  async function cancelInvite(email: string) {
    const response = await fetch("/api/admin/members", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!response.ok) {
      setError("Unable to cancel that invite.");
      return;
    }
    router.refresh();
  }

  const total = initialTributes.length + initialMedia.length;

  return (
    <div className="mt-12 space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8cec0] pb-6 text-sm text-[#536b60]">
        <span>
          Signed in as <strong>{session.displayName || session.email}</strong>{" "}
          ({session.role})
        </span>
        <button
          onClick={signOut}
          className="rounded-full border border-[#b5a998] px-4 py-2 text-xs font-semibold text-[#1f2d2b]"
        >
          Sign out
        </button>
      </div>
      {error && (
        <p className="border-l-2 border-[#b8786f] px-4 py-3 text-sm text-[#b8786f]">
          {error}
        </p>
      )}
      {notice && (
        <p className="border-l-2 border-[#c48a3a] px-4 py-3 text-sm text-[#536b60]">
          {notice}
        </p>
      )}
      {total === 0 && (
        <p className="border border-[#d8cec0] bg-[#fbf8f2] p-8 text-sm text-[#536b60]">
          Nothing is waiting for review.
        </p>
      )}
      <form
        onSubmit={saveSettings}
        className="border border-[#d8cec0] bg-[#fbf8f2] p-4 sm:p-6"
        id="site-settings"
      >
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#d8cec0] pb-4">
          <div>
            <p className="text-xs uppercase tracking-[.2em] text-[#536b60]">
              Site settings
            </p>
            <h2 className="display-font mt-2 text-4xl">Appearance</h2>
          </div>
          <button
            disabled={savingSettings}
            className="rounded-full bg-[#1f2d2b] px-5 py-3 text-xs font-semibold text-[#fbf8f2] disabled:opacity-60"
          >
            {savingSettings ? "Saving..." : "Save appearance"}
          </button>
        </div>
        <label className="mt-6 block text-sm font-semibold text-[#1f2d2b]">
          Website template
          <select
            value={settings.templateId}
            onChange={(event) =>
              setSettings({ ...settings, templateId: event.target.value })
            }
            className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 font-normal outline-none"
          >
            <option value="editorial-memory">Editorial Memory</option>
            <option value="quiet-gallery">Quiet Gallery</option>
            <option value="bright-celebration">Bright Celebration</option>
          </select>
        </label>
        <label className="mt-6 block text-sm font-semibold text-[#1f2d2b]">
          Site name
          <input
            required
            maxLength={100}
            value={settings.displayName}
            onChange={(event) =>
              setSettings({ ...settings, displayName: event.target.value })
            }
            className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 font-normal outline-none"
          />
        </label>
        <label className="mt-6 block text-sm font-semibold text-[#1f2d2b]">
          Hero image URL
          <input
            type="url"
            value={settings.heroImageUrl}
            onChange={(event) =>
              setSettings({ ...settings, heroImageUrl: event.target.value })
            }
            placeholder="Optional public image URL"
            className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 font-normal outline-none placeholder:text-[#8b9c8b]"
          />
        </label>
        <label className="mt-6 block text-sm font-semibold text-[#1f2d2b]">
          Footer copyright
          <input
            required
            maxLength={200}
            value={settings.footerText}
            onChange={(event) =>
              setSettings({ ...settings, footerText: event.target.value })
            }
            className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 font-normal outline-none"
          />
        </label>
        <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {colorLabels.map(([name, label]) => (
            <label
              key={name}
              className="flex min-w-0 items-center gap-2 text-xs text-[#536b60]"
            >
              <input
                type="color"
                value={settings.colors[name]}
                aria-label={`${label} color`}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    colors: { ...settings.colors, [name]: event.target.value },
                  })
                }
                className="h-9 w-9 shrink-0 cursor-pointer border-0 bg-transparent p-0"
              />
              <span className="truncate">{label}</span>
            </label>
          ))}
        </div>
      </form>

      <section className="border border-[#d8cec0] bg-[#fbf8f2] p-4 sm:p-6">
        <div className="border-b border-[#d8cec0] pb-4">
          <p className="text-xs uppercase tracking-[.2em] text-[#536b60]">
            Content import
          </p>
          <h2 className="display-font mt-2 text-4xl">Bring memories in bulk</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#536b60]">
            Imports stay pending until you approve them. Tribute CSVs need two
            columns: <strong>name</strong> and <strong>tribute</strong>. Keep
            one person and one message per row.
          </p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="border-t-2 border-[#c48a3a] pt-4">
            <h3 className="display-font text-3xl">Tributes CSV</h3>
            <p className="mt-2 text-sm leading-6 text-[#536b60]">
              UTF-8 CSV, up to 100 rows. Quoted commas and line breaks are
              supported.
            </p>
            <a
              download="tributes-template.csv"
              href={
                "data:text/csv;charset=utf-8,name,tribute%0A%22Auntie%20May%22,%22Her%20kindness%20made%20everyone%20feel%20at%20home.%22%0A"
              }
              className="mt-4 inline-block text-sm font-semibold text-[#536b60] underline underline-offset-4"
            >
              Download template
            </a>
            <label className="mt-5 flex cursor-pointer items-center justify-center rounded-full bg-[#1f2d2b] px-5 py-3 text-center text-sm font-semibold text-[#fbf8f2]">
              {importing === "tributes" ? "Importing..." : "Choose CSV"}
              <input
                type="file"
                accept=".csv,text/csv"
                className="sr-only"
                onChange={(event) =>
                  importFile("tributes", event.target.files?.[0] || null)
                }
              />
            </label>
          </div>
          <div className="border-t-2 border-[#c48a3a] pt-4">
            <h3 className="display-font text-3xl">Gallery images</h3>
            <p className="mt-2 text-sm leading-6 text-[#536b60]">
              Select up to 30 images, 10 MB each. They are stored in Vercel
              Blob and enter moderation as pending.
            </p>
            <label className="mt-5 flex cursor-pointer items-center justify-center rounded-full bg-[#1f2d2b] px-5 py-3 text-center text-sm font-semibold text-[#fbf8f2]">
              {importing === "images" ? "Uploading..." : "Choose images"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(event) => importImages(event.target.files)}
              />
            </label>
          </div>
        </div>
      </section>

      <ReviewSection title="Tributes" count={initialTributes.length}>
        {initialTributes.map((item) => (
          <ReviewCard
            key={item.id}
            name={item.name}
            date={item.createdAt}
            onApprove={() => moderate("tribute", item.id, "approved")}
            onReject={() => moderate("tribute", item.id, "rejected")}
          >
            <p className="display-font text-3xl leading-tight">
              “{item.message}”
            </p>
          </ReviewCard>
        ))}
      </ReviewSection>

      <ReviewSection title="Gallery submissions" count={initialMedia.length}>
        {initialMedia.map((item) => (
          <ReviewCard
            key={item.id}
            name={item.name}
            date={item.createdAt}
            onApprove={() => moderate("media", item.id, "approved")}
            onReject={() => moderate("media", item.id, "rejected")}
          >
            <a
              href={item.mediaUrl}
              target="_blank"
              rel="noreferrer"
              className="break-all text-sm text-[#536b60] underline underline-offset-4"
            >
              {item.mediaUrl}
            </a>
            {item.caption && (
              <p className="mt-4 text-sm leading-6">{item.caption}</p>
            )}
          </ReviewCard>
        ))}
      </ReviewSection>

      <section className="border border-[#d8cec0] bg-[#fbf8f2] p-4 sm:p-6">
        <div className="mb-5 flex items-baseline justify-between border-b border-[#d8cec0] pb-3">
          <h2 className="display-font text-4xl">Contact enquiries</h2>
          <span className="text-xs uppercase tracking-[.2em] text-[#536b60]">
            {initialContacts.length} total
          </span>
        </div>
        {initialContacts.length === 0 ? (
          <p className="text-sm text-[#536b60]">No enquiries yet.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {initialContacts.map((inquiry) => (
              <article
                key={inquiry.id}
                className="min-w-0 border border-[#d8cec0] bg-white p-4 sm:p-6"
              >
                <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 text-xs uppercase tracking-[.14em] text-[#536b60]">
                  <span className="max-w-full wrap-break-word">
                    {inquiry.name} · {inquiry.projectType}
                  </span>
                  <time
                    dateTime={inquiry.createdAt}
                    className="shrink-0"
                  >
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </time>
                </div>
                <a
                  href={`mailto:${inquiry.email}`}
                  className="mt-3 block text-sm text-[#536b60] underline underline-offset-4"
                >
                  {inquiry.email}
                </a>
                <p className="mt-4 text-sm leading-6">{inquiry.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      {session.role === "owner" && (
        <section className="border border-[#d8cec0] bg-[#fbf8f2] p-4 sm:p-6">
          <div className="border-b border-[#d8cec0] pb-4">
            <p className="text-xs uppercase tracking-[.2em] text-[#536b60]">
              Family access
            </p>
            <h2 className="display-font mt-2 text-4xl">Who can sign in</h2>
          </div>

          <form
            onSubmit={sendInvite}
            className="mt-6 flex flex-wrap items-end gap-3"
          >
            <label className="flex-1 text-sm font-semibold text-[#1f2d2b]">
              Email
              <input
                required
                type="email"
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="name@gmail.com"
                className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 font-normal outline-none placeholder:text-[#8b9c8b]"
              />
            </label>
            <label className="text-sm font-semibold text-[#1f2d2b]">
              Role
              <select
                value={inviteRole}
                onChange={(event) =>
                  setInviteRole(event.target.value as Role)
                }
                className="mt-2 border-b border-[#b5a998] bg-transparent px-0 py-3 font-normal outline-none"
              >
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </label>
            <button
              disabled={invitingBusy}
              className="rounded-full bg-[#1f2d2b] px-5 py-3 text-xs font-semibold text-[#fbf8f2] disabled:opacity-60"
            >
              {invitingBusy ? "Inviting..." : "Invite"}
            </button>
          </form>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {initialMembers.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between gap-3 border border-[#d8cec0] bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f2d2b]">
                    {member.displayName || member.email}
                  </p>
                  <p className="text-xs uppercase tracking-[.14em] text-[#536b60]">
                    {member.role}
                  </p>
                </div>
                {member.userId !== session.userId && (
                  <button
                    onClick={() => revokeMember(member.userId)}
                    className="shrink-0 rounded-full border border-[#b5a998] px-4 py-2 text-xs font-semibold text-[#1f2d2b]"
                  >
                    Revoke
                  </button>
                )}
              </div>
            ))}
            {initialInvites.map((invite) => (
              <div
                key={invite.email}
                className="flex items-center justify-between gap-3 border border-dashed border-[#d8cec0] bg-white p-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#1f2d2b]">
                    {invite.email}
                  </p>
                  <p className="text-xs uppercase tracking-[.14em] text-[#536b60]">
                    {invite.role} · invited, not yet signed in
                  </p>
                </div>
                <button
                  onClick={() => cancelInvite(invite.email)}
                  className="shrink-0 rounded-full border border-[#b5a998] px-4 py-2 text-xs font-semibold text-[#1f2d2b]"
                >
                  Cancel
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-baseline justify-between border-b border-[#d8cec0] pb-3">
        <h2 className="display-font text-4xl">{title}</h2>
        <span className="text-xs uppercase tracking-[.2em] text-[#536b60]">
          {count} pending
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function ReviewCard({
  name,
  date,
  onApprove,
  onReject,
  children,
}: {
  name: string;
  date: string;
  onApprove: () => void;
  onReject: () => void;
  children: React.ReactNode;
}) {
  return (
    <article className="min-w-0 border border-[#d8cec0] bg-[#fbf8f2] p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 text-xs uppercase tracking-[.14em] text-[#536b60]">
        <span className="max-w-full wrap-break-word">{name}</span>
        <time dateTime={date} className="shrink-0">
          {new Date(date).toLocaleDateString()}
        </time>
      </div>
      <div className="mt-6">{children}</div>
      <div className="mt-8 flex flex-wrap gap-2">
        <button
          onClick={onApprove}
          className="rounded-full bg-[#c48a3a] px-4 py-2 text-xs font-semibold text-[#1f2d2b]"
        >
          Approve
        </button>
        <button
          onClick={onReject}
          className="rounded-full border border-[#b5a998] px-4 py-2 text-xs font-semibold text-[#1f2d2b]"
        >
          Reject
        </button>
      </div>
    </article>
  );
}
