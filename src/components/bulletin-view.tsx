import Link from "next/link";
import { BulletinPrintDocument } from "@/components/bulletin-print-document";
import type { Bulletin } from "@/lib/bulletins";
import { formatBulletinDate } from "@/lib/bulletins";

export function BulletinView({
  bulletin,
  archive,
  currentSlug,
}: {
  bulletin: Bulletin;
  archive: Bulletin[];
  currentSlug: string;
}) {
  const currentIndex = archive.findIndex((item) => item.slug === currentSlug);
  const newer = currentIndex > 0 ? archive[currentIndex - 1] : null;
  const older =
    currentIndex >= 0 && currentIndex < archive.length - 1
      ? archive[currentIndex + 1]
      : null;

  return (
    <div className="mx-auto grid w-full max-w-[1280px] gap-6 bg-white px-2 py-4 sm:gap-8 sm:px-6 sm:py-8 lg:grid-cols-[minmax(0,1fr)_280px] lg:px-10 lg:py-10">
      <div className="space-y-5">
        <div className="flex justify-end">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/bulletins/${currentSlug}/print`}
              className="border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--page-deep)] shadow-[inset_0_-2px_0_0_var(--page-highlight)] transition hover:border-[var(--page-accent-strong)]"
            >
              인쇄 / PDF 보기
            </Link>
            {newer ? (
              <Link
                href={`/bulletins/${newer.slug}`}
                className="border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--page-deep)] transition hover:border-[var(--page-accent-strong)]"
              >
                더 최근 주보
              </Link>
            ) : null}
            {older ? (
              <Link
                href={`/bulletins/${older.slug}`}
                className="border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--page-deep)] transition hover:border-[var(--page-accent-strong)]"
              >
                지난 주보
              </Link>
            ) : null}
          </div>
        </div>

        <BulletinPrintDocument bulletin={bulletin} />
      </div>

      <aside className="w-full lg:max-w-sm">
        <div className="border border-black/8 bg-white p-4 shadow-[0_18px_45px_rgba(0,0,0,0.06)] sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="border-l-4 border-[var(--page-highlight)] pl-3 text-xl font-semibold text-[var(--page-deep)]">
              지난 주보
            </h2>
            <Link
              href="/"
              className="text-sm font-semibold text-[var(--page-accent-strong)] underline underline-offset-4"
            >
              홈으로
            </Link>
          </div>
          <ul className="mt-5 space-y-3">
            {archive.map((item) => {
              const active = item.slug === currentSlug;

              return (
                <li key={item.slug}>
                  <Link
                    href={`/bulletins/${item.slug}`}
                    className={`block border px-4 py-3 transition ${
                      active
                        ? "border-black/20 bg-[var(--page-sky-soft)]"
                        : "border-black/10 bg-white/70 hover:border-[var(--page-accent-strong)] hover:bg-[var(--page-sky-surface)]"
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--page-deep)]">
                      {formatBulletinDate(item.service_date)}
                    </p>
                    <p className="mt-1 text-sm text-[var(--page-muted)]">
                      {item.scripture_reference}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
