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

export default function AdminDashboard() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [tributes, setTributes] = useState<Tribute[]>([]);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadSubmissions(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
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
    setAuthenticated(true);
    setLoading(false);
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
      {total === 0 && (
        <p className="border border-[#d8cec0] bg-[#fbf8f2] p-8 text-sm text-[#536b60]">
          Nothing is waiting for review.
        </p>
      )}
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
        <span className="max-w-full break-words">{name}</span>
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
