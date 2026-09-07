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
