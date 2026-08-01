"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  pendingLabel?: string;
  pending?: boolean;
  confirmDisabled?: boolean;
  danger?: boolean;
  size?: "default" | "large";
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "확인",
  cancelLabel = "취소",
  pendingLabel = "처리 중...",
  pending = false,
  confirmDisabled = false,
  danger = false,
  size = "default",
  children,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onClose={() => {
        if (open && !pending) onClose();
      }}
      className={`m-auto rounded-[1.75rem] border border-black/10 bg-white p-0 text-[var(--foreground)] shadow-[0_28px_90px_rgba(0,0,0,0.3)] backdrop:bg-black/45 backdrop:backdrop-blur-sm ${
        size === "large"
          ? "w-[min(52rem,calc(100%-2rem))]"
          : "w-[min(32rem,calc(100%-2rem))]"
      }`}
    >
      <div className="p-6 sm:p-7">
        <h2
          id={titleId}
          className="text-xl font-semibold text-[var(--page-deep)]"
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mt-3 text-sm leading-6 text-[var(--page-muted)]"
        >
          {description}
        </p>

        {children ? <div className="mt-5">{children}</div> : null}

        <div className="mt-7 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="rounded-full border border-black/10 bg-white px-5 py-2.5 text-sm font-semibold text-[var(--page-deep)] transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending || confirmDisabled}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              danger
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-[var(--page-deep)] hover:opacity-90"
            }`}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
