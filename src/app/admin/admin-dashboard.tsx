"use client";

import { FormEvent, useState } from "react";

type Tribute = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
};
type Media = {
  id: string;
  name: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string | null;
  createdAt: string;
};
type MemorialSettings = {
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

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [settings, setSettings] = useState<MemorialSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState<"tributes" | "images" | null>(
    null,
  );
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadSubmissions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/admin", {
      headers: { "x-admin-password": password },
    });
    if (!response.ok) {
      setLoading(false);
      setError(
        response.status === 401
          ? "That password was not accepted."
          : response.status === 429
            ? "Too many attempts. Please try again later."
            : "Unable to load submissions.",
      );
      return;
    }
    const data = await response.json();
    setTributes(data.data.tributes);
    setMedia(data.data.media);
    setSettings(data.data.settings);
    setAuthenticated(true);
    setLoading(false);
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setSavingSettings(true);
    setError("");
    const response = await fetch("/api/admin", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ type: "settings", ...settings }),
    });
    setSavingSettings(false);
    if (!response.ok) {
      setError("Unable to save site settings.");
      return;
    }
    setError("");
  }

  async function moderate(
    type: "tribute" | "media",
    id: string,
    status: "approved" | "rejected",
  ) {
    const response = await fetch("/api/admin", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ type, id, status }),
    });
    if (!response.ok) {
      setError("Unable to update that submission.");
      return;
    }
    if (type === "tribute")
      setTributes((items) => items.filter((item) => item.id !== id));
    else setMedia((items) => items.filter((item) => item.id !== id));
  }

  async function importFile(type: "tributes" | "images", file: File | null) {
    if (!file) return;
    setImporting(type);
    setError("");
    setNotice("");
    const form = new FormData();
    form.set("type", type);
    if (type === "tributes") form.set("file", file);
    else form.append("files", file);
    const response = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "x-admin-password": password },
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
      headers: { "x-admin-password": password },
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
  }

  if (!authenticated)
    return (
      <form
        onSubmit={loadSubmissions}
        className="mt-12 max-w-md border border-[#d8cec0] bg-[#fbf8f2] p-8"
      >
        <h2 className="display-font text-4xl">Enter the family password</h2>
        <p className="mt-3 text-sm leading-6 text-[#536b60]">
          This private page is for reviewing words and memories before they are
          shared.
        </p>
        <input
          required
          autoFocus
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          className="mt-7 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 text-sm outline-none placeholder:text-[#8b9c8b]"
        />
        <button
          disabled={loading}
          className="mt-6 rounded-full bg-[#1f2d2b] px-6 py-3 text-sm font-semibold text-[#fbf8f2] disabled:opacity-60"
        >
          {loading ? "Checking..." : "Open review"}
        </button>
        {error && <p className="mt-4 text-sm text-[#b8786f]">{error}</p>}
      </form>
    );

  const total = tributes.length + media.length;
  return (
    <div className="mt-12 space-y-12">
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
      {settings && (
        <form
          onSubmit={saveSettings}
          className="border border-[#d8cec0] bg-[#fbf8f2] p-4 sm:p-6"
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
                      colors: {
                        ...settings.colors,
                        [name]: event.target.value,
                      },
                    })
                  }
                  className="h-9 w-9 shrink-0 cursor-pointer border-0 bg-transparent p-0"
                />
                <span className="truncate">{label}</span>
              </label>
            ))}
          </div>
        </form>
      )}
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
              Select up to 30 images, 10 MB each. They are stored in Vercel Blob
              and enter moderation as pending.
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
      <ReviewSection title="Tributes" count={tributes.length}>
        {tributes.map((item) => (
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
      <ReviewSection title="Gallery submissions" count={media.length}>
        {media.map((item) => (
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
