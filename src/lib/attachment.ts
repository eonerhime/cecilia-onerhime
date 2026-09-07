export type AttachmentKind = "pdf" | "image" | "doc" | "other";

export const TRIBUTE_ATTACHMENT_CONTENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic", "heif"]);
const DOC_EXTENSIONS = new Set(["doc", "docx"]);

export function getAttachmentKind(url: string): AttachmentKind {
  const path = url.split(/[?#]/)[0];
  const extension = path.split(".").pop()?.toLowerCase() ?? "";
  if (extension === "pdf") return "pdf";
  if (IMAGE_EXTENSIONS.has(extension)) return "image";
  if (DOC_EXTENSIONS.has(extension)) return "doc";
  return "other";
}
