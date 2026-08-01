"use client";

export function BulletinPrintActions() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--page-deep)] transition hover:border-[var(--page-accent-strong)]"
    >
      인쇄 / PDF 저장
    </button>
  );
}
