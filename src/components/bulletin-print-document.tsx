import Image from "next/image";
import type { Bulletin } from "@/lib/bulletins";
import {
  buildBulletinPrintPages,
  getBulletinPrintMeta,
} from "@/lib/bulletin-print";

export function BulletinPrintDocument({
  bulletin,
  printMode = false,
}: {
  bulletin: Bulletin;
  printMode?: boolean;
}) {
  const pages = buildBulletinPrintPages(bulletin);
  const meta = getBulletinPrintMeta();

  return (
    <div className={`print-shell ${printMode ? "mx-auto" : ""}`}>
      {pages.map((page) => (
        <section
          key={page.pageNumber}
          className="print-page mx-auto mb-6 w-full max-w-[1180px] border border-black/8 bg-white p-0 shadow-[0_18px_50px_rgba(0,0,0,0.07)] sm:mb-8 sm:p-8 sm:shadow-[0_24px_70px_rgba(0,0,0,0.08)] print:mb-0 print:w-[297mm] print:max-w-none print:border print:border-black/10 print:p-0 print:shadow-none"
        >
          <div className="grid min-h-[180mm] grid-rows-[auto_1fr_auto] px-2 py-4 sm:px-6 sm:py-6 print:min-h-0 print:px-[10mm] print:py-[10mm]">
            <header className="border-b border-black/10 pb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
                <div className="space-y-3">
                  <p className="inline-flex w-fit border-l-4 border-[var(--page-highlight)] pl-3 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-[var(--page-accent-strong)]">
                    주보
                  </p>
                  <div className="w-[180px] max-w-full sm:w-[220px]">
                    <Image
                      src={meta.logoSrc}
                      alt="Church logo"
                      width={2400}
                      height={500}
                      priority={page.pageNumber === 1}
                      className="h-auto w-full"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-[var(--page-deep)]">
                      {meta.churchName}
                    </h1>
                    <p className="mt-1 text-sm text-[var(--page-muted)]">
                      {page.dateLabel}
                    </p>
                  </div>
                </div>

                <div className="w-full min-w-0 border border-black/10 bg-[var(--page-sky-soft)] px-3 py-3 text-left shadow-[inset_0_4px_0_0_var(--page-highlight)] sm:w-auto sm:max-w-[280px] sm:px-4 sm:text-right">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--page-accent-strong)]">
                    말씀 본문
                  </p>
                  <p className="mt-2 break-words text-base font-semibold leading-6 text-[var(--page-deep)] sm:text-lg">
                    {page.scriptureReference}
                  </p>
                </div>
              </div>
            </header>

            <div className="pt-4 sm:pt-6">
              {page.isFirstPage ? (
                <div className="print-first-page-grid grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
                  <aside className="space-y-4">
                    <SectionBox title="예배 순서" compact>
                      <ol className="space-y-2 text-sm leading-6 text-[var(--page-muted)]">
                        {meta.worshipOrder.map((item, index) => (
                          <li key={item} className="flex gap-2">
                            <span className="font-semibold text-[var(--page-accent-strong)]">
                              {index + 1}.
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ol>
                    </SectionBox>

                    <SectionBox title="문의 / 온라인 예배" compact>
                      <div className="space-y-2 text-sm leading-6 text-[var(--page-muted)]">
                        <p>{meta.email}</p>
                        <p className="break-all">{meta.youtubeUrl}</p>
                      </div>
                    </SectionBox>

                    <div className="border border-black/10">
                      <Image
                        src={meta.bulletinImageSrc}
                        alt="햇살이 비치는 교회 안의 펼쳐진 성경"
                        width={1484}
                        height={1060}
                        className="aspect-[7/5] w-full object-cover"
                      />
                    </div>
                  </aside>

                  <div className="space-y-5">
                    <section>
                      <div className="border-t-[8px] border-[var(--page-highlight)] bg-[var(--page-sky-soft)] px-3 py-4 sm:border-t-[10px] sm:px-5">
                        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--page-accent-strong)]">
                          말씀제목
                        </p>
                        <h2 className="mt-3 break-words text-xl font-semibold text-[var(--page-deep)] sm:text-2xl">
                          {page.title}
                        </h2>
                      </div>
                    </section>

                    {page.weeklyNotice ? (
                      <SectionBox title="한 주 안내">
                        <p className="whitespace-pre-line text-sm leading-7 text-[var(--page-muted)]">
                          {page.weeklyNotice}
                        </p>
                      </SectionBox>
                    ) : null}

                    <SectionBox title="컬럼">
                      <p className="whitespace-pre-line text-[15px] leading-8 text-[var(--page-muted)]">
                        {page.columnChunk}
                      </p>
                    </SectionBox>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="border-t-[8px] border-[var(--page-highlight)] bg-[var(--page-sky-soft)] px-3 py-4 sm:border-t-[10px] sm:px-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--page-accent-strong)]">
                      컬럼 계속
                    </p>
                    <h2 className="mt-3 break-words text-xl font-semibold text-[var(--page-deep)] sm:text-2xl">
                      {page.title}
                    </h2>
                  </div>

                  <SectionBox title={`컬럼 ${page.pageNumber}`}>
                    <p className="whitespace-pre-line text-[15px] leading-8 text-[var(--page-muted)]">
                      {page.columnChunk}
                    </p>
                  </SectionBox>
                </div>
              )}
            </div>

            <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-black/10 pt-4 text-xs text-[var(--page-muted)] sm:mt-8">
              <p>{meta.englishName}</p>
              <p className="border border-black/10 bg-[var(--page-highlight-soft)] px-2 py-1 font-semibold text-[var(--page-accent-strong)]">
                {page.pageNumber} / {page.totalPages}
              </p>
            </footer>
          </div>
        </section>
      ))}
    </div>
  );
}

function SectionBox({
  title,
  children,
  compact = false,
}: {
  title: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className="border border-black/10 bg-white">
      <div className="border-b border-black/10 bg-[var(--page-sky-soft)] px-4 py-3 shadow-[inset_4px_0_0_0_var(--page-highlight)]">
        <h3 className="text-sm font-semibold text-[var(--page-deep)]">{title}</h3>
      </div>
      <div
        className={
          compact ? "px-3 py-4 sm:px-4" : "px-3 py-4 sm:px-5 sm:py-5"
        }
      >
        {children}
      </div>
    </section>
  );
}
