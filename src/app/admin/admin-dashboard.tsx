"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import type { Role, Session } from "@/lib/session";
import { ROLE_DESCRIPTIONS, hasRole } from "@/lib/roles";
import type { Album, MusicAutoplay } from "@/lib/memorial";
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
  musicUrl: string;
  musicAutoplay: MusicAutoplay;
  musicLoop: boolean;
  musicVolume: number;
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
  initialAlbums: Album[];
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

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function AdminDashboard({
  session,
  initialTributes,
  initialMedia,
  initialContacts,
  initialSettings,
  initialMembers,
  initialInvites,
  initialAlbums,
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
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoCaption, setVideoCaption] = useState("");
  const [videoThumbnailFile, setVideoThumbnailFile] = useState<File | null>(null);
  const [addingVideo, setAddingVideo] = useState(false);
  const [albums, setAlbums] = useState(initialAlbums);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [newAlbumName, setNewAlbumName] = useState("");
  const [albumBusy, setAlbumBusy] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!hasRole(session.role, "moderator")) return;
    // Picks up tributes/media submitted by visitors while this dashboard is
    // open, without the moderator needing to reload the page themselves.
    // router.refresh() re-fetches the server-rendered props (this component
    // keeps its own state, e.g. accountMenuOpen, untouched), so it's cheap
    // and doesn't disrupt anything the moderator is in the middle of doing.
    const interval = setInterval(() => router.refresh(), 30000);
    return () => clearInterval(interval);
  }, [router, session.role]);

  async function persistMediaField(field: "heroImageUrl" | "musicUrl", value: string) {
    const response = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "field", field, value }),
    });
    if (!response.ok) {
      setError("Uploaded, but saving it failed. Please try again.");
      return false;
    }
    setSettings((current) => ({ ...current, [field]: value }));
    return true;
  }

  async function uploadHeroImage(file: File | null) {
    if (!file) return;
    setUploadingHero(true);
    setError("");
    setNotice("");
    let url: string;
    try {
      const blob = await upload(`memorial/${crypto.randomUUID()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload-image",
      });
      url = blob.url;
    } catch (error) {
      setUploadingHero(false);
      setError(error instanceof Error ? error.message : "Upload failed.");
      return;
    }
    const saved = await persistMediaField("heroImageUrl", url);
    setUploadingHero(false);
    if (saved) {
      setNotice("Hero image uploaded and saved.");
      router.refresh();
    }
  }

  async function uploadMusic(file: File | null) {
    if (!file) return;
    setUploadingMusic(true);
    setError("");
    setNotice("");
    let url: string;
    try {
      const blob = await upload(`memorial/audio/${crypto.randomUUID()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload-audio",
      });
      url = blob.url;
    } catch (error) {
      setUploadingMusic(false);
      setError(error instanceof Error ? error.message : "Upload failed.");
      return;
    }
    const saved = await persistMediaField("musicUrl", url);
    setUploadingMusic(false);
    if (saved) {
      setNotice("Music track uploaded and saved.");
      router.refresh();
    }
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.refresh();
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSettings(true);
    setError("");
    setNotice("");
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
    setNotice("Site settings saved.");
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
    const parts = [`${result.data.imported} tributes imported and waiting for review.`];
    if (result.data.duplicates?.length) {
      parts.push(`Skipped ${result.data.duplicates.length} exact duplicate(s): ${result.data.duplicates.join(", ")}.`);
    }
    if (result.data.flagged?.length) {
      parts.push(
        `${result.data.flagged.length} imported row(s) share a name with an existing tribute — please review: ${result.data.flagged.join(", ")}.`,
      );
    }
    setNotice(parts.join(" "));
    router.refresh();
  }

  async function importImages(files: FileList | null) {
    if (!files?.length) return;
    setImporting("images");
    setError("");
    setNotice("");

    let mediaUrls: string[];
    try {
      mediaUrls = await Promise.all(
        Array.from(files).map(async (file) => {
          const blob = await upload(`memorial/${crypto.randomUUID()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/admin/upload-image",
          });
          return blob.url;
        }),
      );
    } catch (error) {
      setImporting(null);
      setError(error instanceof Error ? error.message : "Bulk image upload failed.");
      return;
    }

    const response = await fetch("/api/admin/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "images",
        albumId: selectedAlbumId || undefined,
        mediaUrls,
      }),
    });
    const result = await response.json();
    setImporting(null);
    if (!response.ok) {
      setError(result.error || "Bulk image upload failed.");
      return;
    }
    setNotice(
      `${result.data.imported} images added to the gallery.`,
    );
    router.refresh();
  }

  async function addVideo(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAddingVideo(true);
    setError("");
    setNotice("");

    let thumbnailUrl: string | undefined;
    if (videoThumbnailFile) {
      try {
        const blob = await upload(
          `memorial/${crypto.randomUUID()}-${videoThumbnailFile.name}`,
          videoThumbnailFile,
          { access: "public", handleUploadUrl: "/api/admin/upload-image" },
        );
        thumbnailUrl = blob.url;
      } catch (error) {
        setAddingVideo(false);
        setError(error instanceof Error ? error.message : "Thumbnail upload failed.");
        return;
      }
    }

    const response = await fetch("/api/admin/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mediaUrl: videoUrl,
        caption: videoCaption,
        albumId: selectedAlbumId || undefined,
        thumbnailUrl,
      }),
    });
    const result = await response.json().catch(() => null);
    setAddingVideo(false);
    if (!response.ok) {
      setError(result?.error || "Unable to add that video.");
      return;
    }
    setNotice(
      result?.data?.thumbnailUrl
        ? "Video added to the gallery with a thumbnail."
        : "Video added to the gallery.",
    );
    setVideoUrl("");
    setVideoCaption("");
    setVideoThumbnailFile(null);
    router.refresh();
  }

  async function createAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAlbumBusy(true);
    setError("");
    setNotice("");
    const form = new FormData(event.currentTarget);
    const name = typeof form.get("name") === "string" ? (form.get("name") as string) : "";
    const cover = form.get("cover");
    let coverUrl: string | undefined;
    if (cover instanceof File && cover.size > 0) {
      try {
        const blob = await upload(`memorial/albums/${crypto.randomUUID()}-${cover.name}`, cover, {
          access: "public",
          handleUploadUrl: "/api/admin/upload-image",
        });
        coverUrl = blob.url;
      } catch (error) {
        setAlbumBusy(false);
        setError(error instanceof Error ? error.message : "Cover upload failed.");
        return;
      }
    }
    const response = await fetch("/api/admin/albums", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, coverUrl }),
    });
    const result = await response.json().catch(() => null);
    setAlbumBusy(false);
    if (!response.ok) {
      setError(result?.error || "Unable to create that album.");
      return;
    }
    setAlbums((current) => [...current, { ...result.data, hidden: false }]);
    setNewAlbumName("");
    event.currentTarget.reset();
    setNotice("Album created.");
  }

  async function updateAlbumCover(albumId: string, file: File | null) {
    if (!file) return;
    setError("");
    setNotice("");
    let coverUrl: string;
    try {
      const blob = await upload(`memorial/albums/${crypto.randomUUID()}-${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload-image",
      });
      coverUrl = blob.url;
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update that album's cover.");
      return;
    }
    const response = await fetch("/api/admin/albums", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: albumId, coverUrl }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Unable to update that album's cover.");
      return;
    }
    setAlbums((current) =>
      current.map((album) => (album.id === albumId ? { ...album, coverUrl } : album)),
    );
    setNotice("Album cover updated.");
  }

  async function toggleAlbumHidden(albumId: string, hidden: boolean) {
    setAlbums((current) =>
      current.map((album) => (album.id === albumId ? { ...album, hidden } : album)),
    );
    const response = await fetch("/api/admin/albums", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: albumId, hidden }),
    });
    if (!response.ok) {
      setAlbums((current) =>
        current.map((album) => (album.id === albumId ? { ...album, hidden: !hidden } : album)),
      );
      setError("Unable to update that album's visibility.");
      return;
    }
    setNotice(hidden ? "Album hidden from the public gallery." : "Album visible in the public gallery.");
  }

  async function removeAlbum(id: string) {
    const response = await fetch("/api/admin/albums", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      setError("Unable to remove that album.");
      return;
    }
    setAlbums((current) => current.filter((album) => album.id !== id));
    router.refresh();
  }

  async function assignMediaAlbum(mediaId: string, albumId: string) {
    const response = await fetch("/api/admin/media-album", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mediaId, albumId: albumId || undefined }),
    });
    if (!response.ok) {
      setError("Unable to update that item's album.");
      return;
    }
    router.refresh();
  }

  async function sendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInvitingBusy(true);
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const result = await response.json().catch(() => null);
    setInvitingBusy(false);
    if (!response.ok) {
      setError(result?.error || "Unable to send that invite.");
      return;
    }
    setNotice(result?.warning || `Invite email sent to ${inviteEmail}.`);
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

  async function changeMemberRole(userId: string, role: Role) {
    setError("");
    setNotice("");
    const response = await fetch("/api/admin/members", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error || "Unable to change that member's role.");
      return;
    }
    setNotice("Role updated.");
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
  const canManageSettings = hasRole(session.role, "admin");
  const canUploadMedia = hasRole(session.role, "editor");
  const canModerate = hasRole(session.role, "moderator");

  return (
    <div className="mt-12 space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8cec0] pb-6 text-sm text-[#536b60]">
        <div className="flex flex-wrap items-center gap-3">
          <span>
            Signed in as <strong>{session.displayName || session.email}</strong>{" "}
            ({session.role})
          </span>
          {canModerate && total > 0 && (
            <a
              href={initialTributes.length > 0 ? "#review-tributes" : "#review-media"}
              className="flex items-center gap-1.5 rounded-full bg-[#b8786f] px-3 py-1 text-xs font-semibold text-[#fbf8f2]"
              aria-label={`${total} submission${total === 1 ? "" : "s"} awaiting review`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path d="M10 2a1 1 0 0 1 1 1v.35a5.5 5.5 0 0 1 4.5 5.4v2.4l1.32 2.64A1 1 0 0 1 16 15.5H4a1 1 0 0 1-.82-1.71L4.5 11.15v-2.4A5.5 5.5 0 0 1 9 3.35V3a1 1 0 0 1 1-1Zm0 15.5a2 2 0 0 0 1.94-1.5H8.06A2 2 0 0 0 10 17.5Z" />
              </svg>
              {total} pending
            </a>
          )}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((open) => !open)}
            aria-label="Account menu"
            aria-expanded={accountMenuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1f2d2b] text-xs font-semibold text-[#fbf8f2]"
          >
            {getInitials(session.displayName || session.email)}
          </button>
          {accountMenuOpen && (
            <>
              <button
                type="button"
                aria-label="Close account menu"
                onClick={() => setAccountMenuOpen(false)}
                className="fixed inset-0 z-20 cursor-default"
              />
              <div className="absolute right-0 top-12 z-30 w-56 rounded border border-[#d8cec0] bg-[#fbf8f2] py-1 shadow-lg">
                <p className="truncate border-b border-[#d8cec0] px-4 py-2 text-xs text-[#536b60]">
                  {session.displayName || session.email} · {session.role}
                </p>
                <a
                  href="#site-settings"
                  onClick={() => setAccountMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-[#1f2d2b] hover:bg-[#f0ece2]"
                >
                  Settings
                </a>
                <button
                  type="button"
                  onClick={signOut}
                  className="block w-full px-4 py-2 text-left text-sm text-[#1f2d2b] hover:bg-[#f0ece2]"
                >
                  Log out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
      {canModerate && total === 0 && (
        <p className="border border-[#d8cec0] bg-[#fbf8f2] p-8 text-sm text-[#536b60]">
          Nothing is waiting for review.
        </p>
      )}
      {canManageSettings && (
      <form
        onSubmit={saveSettings}
        className="border border-[#d8cec0] bg-[#fbf8f2] p-4 sm:p-6"
        id="site-settings"
      >
        <div className="border-b border-[#d8cec0] pb-4">
          <p className="text-xs uppercase tracking-[.2em] text-[#536b60]">
            Site settings
          </p>
          <h2 className="display-font mt-2 text-4xl">Appearance</h2>
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
        <div className="mt-6">
          <label className="block text-sm font-semibold text-[#1f2d2b]">
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
          <label className="mt-2 flex cursor-pointer items-center justify-center rounded-full border border-[#b5a998] px-3 py-2 text-center text-xs font-semibold text-[#1f2d2b]">
            {uploadingHero ? "Uploading..." : "Or upload a photo"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => uploadHeroImage(event.target.files?.[0] || null)}
            />
          </label>
        </div>
        <div className="mt-6 border-t border-[#d8cec0] pt-6">
          <p className="text-sm font-semibold text-[#1f2d2b]">
            Background music
          </p>
          <p className="mt-1 text-xs leading-5 text-[#536b60]">
            Browsers block sound from autoplaying until a visitor interacts
            with the page, so &ldquo;always&rdquo; means it starts the moment
            they click or scroll rather than the instant the page loads.
            Visitors always get a visible play/pause control either way.
          </p>
          <label className="mt-4 flex cursor-pointer items-center justify-center rounded-full border border-[#b5a998] px-3 py-2 text-center text-xs font-semibold text-[#1f2d2b]">
            {uploadingMusic ? "Uploading..." : "Upload a track"}
            <input
              type="file"
              accept="audio/*"
              className="sr-only"
              onChange={(event) => uploadMusic(event.target.files?.[0] || null)}
            />
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-semibold text-[#1f2d2b]">
              Plays on page load
              <select
                value={settings.musicAutoplay}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    musicAutoplay: event.target.value as MusicAutoplay,
                  })
                }
                className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 font-normal outline-none"
              >
                <option value="off">Off (visitor presses play)</option>
                <option value="once_per_session">Once per visit</option>
                <option value="always">Every page load</option>
              </select>
            </label>
            <label className="mt-1 flex items-center gap-2 self-end text-sm font-semibold text-[#1f2d2b]">
              <input
                type="checkbox"
                checked={settings.musicLoop}
                onChange={(event) =>
                  setSettings({ ...settings, musicLoop: event.target.checked })
                }
              />
              Repeat when it ends
            </label>
            <label className="block text-sm font-semibold text-[#1f2d2b]">
              Default volume ({settings.musicVolume}%)
              <input
                type="range"
                min={0}
                max={100}
                value={settings.musicVolume}
                onChange={(event) =>
                  setSettings({
                    ...settings,
                    musicVolume: Number(event.target.value),
                  })
                }
                className="mt-3 w-full accent-[#c48a3a]"
              />
            </label>
          </div>
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
      )}
      {!canManageSettings && canUploadMedia && (
        <section className="border border-[#d8cec0] bg-[#fbf8f2] p-4 sm:p-6">
          <div className="border-b border-[#d8cec0] pb-4">
            <p className="text-xs uppercase tracking-[.2em] text-[#536b60]">
              Site settings
            </p>
            <h2 className="display-font mt-2 text-4xl">Uploads</h2>
          </div>
          <div className="mt-6">
            <label className="flex cursor-pointer items-center justify-center rounded-full border border-[#b5a998] px-3 py-2 text-center text-xs font-semibold text-[#1f2d2b]">
              {uploadingHero ? "Uploading..." : "Upload a hero photo"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => uploadHeroImage(event.target.files?.[0] || null)}
              />
            </label>
          </div>
          <div className="mt-4">
            <label className="flex cursor-pointer items-center justify-center rounded-full border border-[#b5a998] px-3 py-2 text-center text-xs font-semibold text-[#1f2d2b]">
              {uploadingMusic ? "Uploading..." : "Upload a music track"}
              <input
                type="file"
                accept="audio/*"
                className="sr-only"
                onChange={(event) => uploadMusic(event.target.files?.[0] || null)}
              />
            </label>
          </div>
        </section>
      )}

      {canUploadMedia && (
      <section className="border border-[#d8cec0] bg-[#fbf8f2] p-4 sm:p-6">
        <div className="border-b border-[#d8cec0] pb-4">
          <p className="text-xs uppercase tracking-[.2em] text-[#536b60]">
            Content import
          </p>
          <h2 className="display-font mt-2 text-4xl">Bring memories in bulk</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#536b60]">
            Tribute CSVs stay pending until you approve them and need two
            columns: <strong>name</strong> and <strong>tribute</strong> (one
            person and one message per row). Gallery images and video links
            you add here go straight into the gallery.
          </p>
        </div>

        <div className="mt-6 border-t border-[#d8cec0] pt-6">
          <h3 className="display-font text-3xl">Albums</h3>
          <p className="mt-2 text-sm leading-6 text-[#536b60]">
            Group gallery photos and videos into albums — e.g. Family
            pictures, Service of Songs, Burial, Thanksgiving.
          </p>
          <form onSubmit={createAlbum} className="mt-4 flex flex-wrap items-center gap-3">
            <input
              required
              name="name"
              maxLength={100}
              value={newAlbumName}
              onChange={(event) => setNewAlbumName(event.target.value)}
              placeholder="New album name"
              className="flex-1 border-b border-[#b5a998] bg-transparent px-0 py-2 text-sm font-normal outline-none placeholder:text-[#8b9c8b]"
            />
            <label className="flex cursor-pointer items-center gap-1 rounded-full border border-[#b5a998] px-3 py-2 text-center text-xs font-semibold text-[#1f2d2b]">
              Cover (optional)
              <input type="file" name="cover" accept="image/*" className="sr-only" />
            </label>
            <button
              disabled={albumBusy}
              className="rounded-full bg-[#1f2d2b] px-5 py-2 text-xs font-semibold text-[#fbf8f2] disabled:opacity-60"
            >
              {albumBusy ? "Creating..." : "Create album"}
            </button>
          </form>
          {albums.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {albums.map((album) => (
                <span
                  key={album.id}
                  className={`flex items-center gap-2 rounded-full border border-[#b5a998] px-3 py-1.5 text-xs text-[#1f2d2b] ${
                    album.hidden ? "opacity-50" : ""
                  }`}
                >
                  {album.coverUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={album.coverUrl}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                  )}
                  {album.name}
                  {album.hidden && <span className="text-[#536b60]">(hidden)</span>}
                  <label className="cursor-pointer text-[#536b60] hover:text-[#1f2d2b]">
                    ⤴
                    <input
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={(event) =>
                        updateAlbumCover(album.id, event.target.files?.[0] || null)
                      }
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleAlbumHidden(album.id, !album.hidden)}
                    aria-label={
                      album.hidden
                        ? `Make ${album.name} visible in the public gallery`
                        : `Hide ${album.name} from the public gallery`
                    }
                    title={album.hidden ? "Hidden — click to make visible" : "Visible — click to hide"}
                    className="text-[#536b60] hover:text-[#1f2d2b]"
                  >
                    {album.hidden ? (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M2.28 2.22 1.22 3.28l2.4 2.4C1.9 6.72 1 8.06.6 9c.73 3.89 4 7 9 7 1.24 0 2.4-.19 3.44-.53l2.28 2.28 1.06-1.06L2.28 2.22ZM10 14a4 4 0 0 1-3.86-5.02l1.53 1.53a2 2 0 0 0 2.32 2.32l1.53 1.53A4 4 0 0 1 10 14Zm7.4-4c-.5-1.34-1.5-2.77-2.87-3.87l-1.09 1.09A6.8 6.8 0 0 1 15.6 9a6.9 6.9 0 0 1-1.94 2.4l1.05 1.05C16 11.4 17 10.1 17.4 9Z" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M10 3C5 3 1.73 6.11 1 10c.73 3.89 4 7 9 7s8.27-3.11 9-7c-.73-3.89-4-7-9-7Zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm0-2a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                      </svg>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeAlbum(album.id)}
                    aria-label={`Remove ${album.name}`}
                    className="text-[#b8786f] hover:text-[#8a5951]"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
          {albums.length > 0 && (
            <label className="mt-5 block text-sm font-semibold text-[#1f2d2b]">
              Add new imports below to
              <select
                value={selectedAlbumId}
                onChange={(event) => setSelectedAlbumId(event.target.value)}
                className="mt-2 w-full border-b border-[#b5a998] bg-transparent px-0 py-3 font-normal outline-none"
              >
                <option value="">No album</option>
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-3">
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
              Select up to 30 images, 10 MB each. They&apos;re stored in
              Vercel Blob and published to the gallery immediately.
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
          <div className="border-t-2 border-[#c48a3a] pt-4">
            <h3 className="display-font text-3xl">Video link</h3>
            <p className="mt-2 text-sm leading-6 text-[#536b60]">
              A YouTube, Vimeo, or direct video file link — it&apos;ll play
              in an embedded player, published to the gallery immediately.
              YouTube and Vimeo links get a thumbnail automatically; other
              links can have one uploaded below (or added later from the
              gallery).
            </p>
            <form onSubmit={addVideo} className="mt-5 space-y-2">
              <input
                required
                type="url"
                value={videoUrl}
                onChange={(event) => setVideoUrl(event.target.value)}
                placeholder="https://example.com/video.mp4"
                className="w-full border-b border-[#b5a998] bg-transparent px-0 py-2 text-sm font-normal outline-none placeholder:text-[#8b9c8b]"
              />
              <input
                type="text"
                value={videoCaption}
                onChange={(event) => setVideoCaption(event.target.value)}
                placeholder="Optional caption"
                maxLength={300}
                className="w-full border-b border-[#b5a998] bg-transparent px-0 py-2 text-sm font-normal outline-none placeholder:text-[#8b9c8b]"
              />
              <label className="flex cursor-pointer items-center justify-center rounded-full border border-[#b5a998] px-3 py-2 text-center text-xs font-semibold text-[#1f2d2b]">
                {videoThumbnailFile ? videoThumbnailFile.name : "Optional thumbnail image"}
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => setVideoThumbnailFile(event.target.files?.[0] || null)}
                />
              </label>
              <button
                disabled={addingVideo}
                className="w-full rounded-full bg-[#1f2d2b] px-5 py-3 text-center text-sm font-semibold text-[#fbf8f2] disabled:opacity-60"
              >
                {addingVideo ? "Adding..." : "Add video"}
              </button>
            </form>
          </div>
        </div>
      </section>
      )}

      {canModerate && (
      <ReviewSection id="review-tributes" title="Tributes" count={initialTributes.length}>
        {initialTributes.map((item) => (
          <ReviewCard
            key={item.id}
            name={item.name}
            date={item.createdAt}
            warning={
              item.possibleDuplicate
                ? "Another tribute already exists under this name — check before approving."
                : undefined
            }
            onApprove={() => moderate("tribute", item.id, "approved")}
            onReject={() => moderate("tribute", item.id, "rejected")}
          >
            {item.message && (
              <p className="display-font text-3xl leading-tight">
                “{item.message}”
              </p>
            )}
            {item.attachmentUrl && (
              <a
                href={item.attachmentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-sm text-[#536b60] underline underline-offset-4"
              >
                View the attached letter ↗
              </a>
            )}
          </ReviewCard>
        ))}
      </ReviewSection>
      )}

      {canModerate && (
      <ReviewSection id="review-media" title="Gallery submissions" count={initialMedia.length}>
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
            {albums.length > 0 && (
              <label className="mt-4 block text-xs font-semibold uppercase tracking-[.14em] text-[#536b60]">
                Album
                <select
                  value={item.albumId ?? ""}
                  onChange={(event) => assignMediaAlbum(item.id, event.target.value)}
                  className="mt-1 w-full border-b border-[#b5a998] bg-transparent px-0 py-2 text-sm font-normal normal-case tracking-normal text-[#1f2d2b] outline-none"
                >
                  <option value="">No album</option>
                  {albums.map((album) => (
                    <option key={album.id} value={album.id}>
                      {album.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </ReviewCard>
        ))}
      </ReviewSection>
      )}

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
                title={ROLE_DESCRIPTIONS[inviteRole]}
                className="mt-2 border-b border-[#b5a998] bg-transparent px-0 py-3 font-normal outline-none"
              >
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role} value={role} title={ROLE_DESCRIPTIONS[role]}>
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
          <p className="mt-2 text-xs leading-5 text-[#536b60]">
            {ROLE_DESCRIPTIONS[inviteRole]}
          </p>

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
                  {member.userId === session.userId ? (
                    <p className="text-xs uppercase tracking-[.14em] text-[#536b60]">
                      {member.role}
                    </p>
                  ) : (
                    <select
                      value={member.role}
                      onChange={(event) =>
                        changeMemberRole(member.userId, event.target.value as Role)
                      }
                      title={ROLE_DESCRIPTIONS[member.role as Role]}
                      className="mt-1 border-b border-[#b5a998] bg-transparent text-xs uppercase tracking-[.14em] text-[#536b60] outline-none"
                    >
                      {ASSIGNABLE_ROLES.map((role) => (
                        <option key={role} value={role} title={ROLE_DESCRIPTIONS[role]}>
                          {role}
                        </option>
                      ))}
                    </select>
                  )}
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
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
        {error && (
          <p className="max-w-xs rounded border-l-2 border-[#b8786f] bg-[#fbf8f2] px-4 py-3 text-sm text-[#b8786f] shadow-lg">
            {error}
          </p>
        )}
        {notice && (
          <p className="max-w-xs rounded border-l-2 border-[#c48a3a] bg-[#fbf8f2] px-4 py-3 text-sm text-[#536b60] shadow-lg">
            {notice}
          </p>
        )}
        {canManageSettings && (
          <button
            form="site-settings"
            type="submit"
            disabled={savingSettings}
            className="rounded-full bg-[#1f2d2b] px-5 py-3 text-xs font-semibold text-[#fbf8f2] shadow-lg disabled:opacity-60"
          >
            {savingSettings ? "Saving..." : "Save appearance"}
          </button>
        )}
      </div>
    </div>
  );
}

function ReviewSection({
  id,
  title,
  count,
  children,
}: {
  id?: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section id={id}>
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
  warning,
  onApprove,
  onReject,
  children,
}: {
  name: string;
  date: string;
  warning?: string;
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
      {warning && (
        <p className="mt-3 border-l-2 border-[#b8786f] bg-[#b8786f]/10 px-3 py-2 text-xs normal-case tracking-normal text-[#b8786f]">
          ⚠ {warning}
        </p>
      )}
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
