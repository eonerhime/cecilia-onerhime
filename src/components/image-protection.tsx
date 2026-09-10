"use client";

import { useEffect } from "react";

export default function ImageProtection() {
  useEffect(() => {
    const isImage = (target: EventTarget | null): target is HTMLElement =>
      target instanceof HTMLElement && target.tagName === "IMG";

    const hasDraggableAncestor = (target: HTMLElement) =>
      target.closest('[draggable="true"]') !== null;

    const onContextMenu = (event: MouseEvent) => {
      if (isImage(event.target)) event.preventDefault();
    };

    const onDragStart = (event: DragEvent) => {
      if (isImage(event.target) && !hasDraggableAncestor(event.target)) {
        event.preventDefault();
      }
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("dragstart", onDragStart);
    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);

  return null;
}
