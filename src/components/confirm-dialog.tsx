"use client";

export default function ConfirmDialog({
  open,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div
      onClick={onCancel}
      className="fixed inset-0 z-70 flex items-center justify-center bg-[#1f2d2b]/40 p-4"
    >
      <div
        onClick={(event) => event.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded border border-[#d8cec0] bg-[#fbf8f2] p-5 text-center shadow-lg"
      >
        <p className="text-sm text-[#1f2d2b]">{message}</p>
        <div className="mt-4 flex justify-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-[#b5a998] px-4 py-1.5 text-xs font-semibold text-[#1f2d2b]"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-full bg-[#b8786f] px-4 py-1.5 text-xs font-semibold text-[#fbf8f2] disabled:opacity-60"
          >
            {busy ? "Deleting..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
