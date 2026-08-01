"use client";

type ResultToastProps = {
  status: "success" | "error";
  message: string;
  linkHref?: string;
  linkLabel?: string;
  onClose: () => void;
};

export function ResultToast({
  status,
  message,
  linkHref,
  linkLabel = "확인하기",
  onClose,
}: ResultToastProps) {
  const success = status === "success";

  return (
    <div
      role={success ? "status" : "alert"}
      aria-live={success ? "polite" : "assertive"}
      className={`fixed right-4 top-4 z-50 flex w-[min(26rem,calc(100%-2rem))] items-start gap-3 rounded-2xl border bg-white p-4 shadow-[0_18px_50px_rgba(0,0,0,0.18)] sm:right-6 sm:top-6 ${
        success ? "border-emerald-200" : "border-rose-200"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
          success ? "bg-emerald-600" : "bg-rose-600"
        }`}
      >
        {success ? "✓" : "!"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--page-deep)]">
          {success ? "완료" : "처리하지 못했습니다"}
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--page-muted)]">
          {message}
        </p>
        {linkHref ? (
          <a
            href={linkHref}
            className="mt-2 inline-block text-sm font-semibold text-[var(--page-highlight)] underline underline-offset-4"
          >
            {linkLabel}
          </a>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="알림 닫기"
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-lg leading-none text-[var(--page-muted)] transition hover:bg-black/5 hover:text-[var(--page-deep)]"
      >
        ×
      </button>
    </div>
  );
}
