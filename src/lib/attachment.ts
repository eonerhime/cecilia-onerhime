export type AttachmentKind = "pdf" | "image" | "doc" | "other";

export const TRIBUTE_ATTACHMENT_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/*",
];

const IMAGE_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "heic",
  "heif",
  "bmp",
  "tif",
  "tiff",
  "avif",
]);
const DOC_EXTENSIONS = new Set(["doc", "docx"]);

export function getAttachmentKind(url: string): AttachmentKind {
  const path = url.split(/[?#]/)[0];
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "pdf") return "pdf";
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (DOC_EXTENSIONS.has(extension)) return "doc";
  return "other";
}

// Previews a Word doc in-browser via Microsoft's public viewer, rather than
// converting it (no server-side conversion, no third-party API, no new
// infrastructure — see MRU ADR-011). Requires the source file to be
// publicly reachable over HTTPS, which every Blob-uploaded attachment is.
export function getOfficeEmbedUrl(url: string) {
  return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
}
