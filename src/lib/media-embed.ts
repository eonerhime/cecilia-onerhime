// Best-effort video thumbnail for known hosts, used whenever a video link
// is added (admin or guest submission) — no thumbnail-generation service,
// just each host's own free lookup. Anything else is left thumbnail-less
// (still playable, just no preview image) rather than attempting real
// video processing, which is out of scope for a serverless deployment.
export async function detectVideoThumbnail(mediaUrl: string): Promise<string | null> {
  try {
    const parsed = new URL(mediaUrl);
    const host = parsed.hostname.replace(/^www\.|^m\./, "");

    if (host === "youtube.com" || host === "youtu.be") {
      const id =
        host === "youtu.be"
          ? parsed.pathname.slice(1)
          : parsed.searchParams.get("v") ||
            parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
      if (id) return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const response = await fetch(
        `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(mediaUrl)}`,
      );
      if (response.ok) {
        const data = await response.json();
        if (typeof data.thumbnail_url === "string") return data.thumbnail_url;
      }
    }
  } catch {
    // Not a recognized host, or the oEmbed lookup failed — fall through and
    // leave it thumbnail-less; an admin can still upload one manually.
  }
  return null;
}

export type Embed =
  | { kind: "youtube" | "vimeo"; src: string }
  | { kind: "file"; src: string };

export function getEmbed(url: string): Embed {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\.|^m\./, "");

    if (host === "youtube.com") {
      const id =
        parsed.searchParams.get("v") ||
        parsed.pathname.match(/\/(?:embed|shorts)\/([^/?]+)/)?.[1];
      if (id) return { kind: "youtube", src: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "youtu.be") {
      const id = parsed.pathname.slice(1);
      if (id) return { kind: "youtube", src: `https://www.youtube.com/embed/${id}` };
    }
    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      if (id) return { kind: "vimeo", src: `https://player.vimeo.com/video/${id}` };
    }
    if (host === "player.vimeo.com") {
      return { kind: "vimeo", src: url };
    }
  } catch {
    // Not a parseable URL — fall through and try it as a direct file.
  }
  return { kind: "file", src: url };
}
