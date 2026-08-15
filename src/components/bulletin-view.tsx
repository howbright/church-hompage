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
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <nav
            aria-label="교회 콘텐츠"
            className="flex w-fit max-w-full flex-wrap items-center gap-0.5 rounded-full border border-[#d9e2e8] bg-[#f1f5f7] p-0.5"
          >
            <Link
              href="/gallery"
              className="rounded-full bg-white px-2.5 py-1.5 text-xs font-semibold text-[#405867] shadow-sm transition hover:text-[#075f9b]"
            >
              <span className="mr-1 text-[#7795a6]" aria-hidden="true">
                ●
              </span>
              교회 갤러리
            </Link>
            <span
              aria-hidden="true"
              className="hidden h-3 w-px bg-[#ccd8df] sm:block"
            />
            <a
              href="https://blog.naver.com/PostList.naver?blogId=sungsungsun"
              target="_blank"
              rel="noopener noreferrer"
              className="group rounded-full px-2.5 py-1.5 text-xs font-semibold text-[#526875] transition hover:bg-white hover:text-[#314a59]"
            >
              <span className="mr-1 text-[#8aa0ad]" aria-hidden="true">
                ✦
              </span>
              권혜성의 만화 &amp; 시집
              <span
                className="ml-1 inline-block text-[0.65rem] text-[#91a3ad] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                ↗
              </span>
            </a>
          </nav>

          <div className="flex flex-wrap gap-2 xl:justify-end">
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
