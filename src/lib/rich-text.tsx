import type { ReactNode } from "react";

// Deliberately minimal: only **bold** markers, parsed at render time. A real
// rich-text editor (with its own sanitization story) isn't worth it for a
// family memorial bio field — this is markdown-lite, nothing more.
export function renderFormattedText(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((part, index) => {
    const match = part.match(/^\*\*([^*]+)\*\*$/);
    return match ? <strong key={index}>{match[1]}</strong> : part;
  });
}
