import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "관리자 메뉴 | 갈보리채플 강남교회",
};

const adminMenus = [
  {
    href: "/admin/jubo",
    eyebrow: "Bulletin",
    title: "온라인 주보 관리",
    description: "주보를 새로 작성하고 기존 주보를 수정하거나 삭제합니다.",
    accent: "bg-[#3f9fe8]",
    number: "01",
  },
  {
    href: "/admin/gallery",
    eyebrow: "Gallery",
    title: "교회 갤러리 관리",
    description: "공동체 사진을 등록하고 게시 여부와 공개 범위를 관리합니다.",
    accent: "bg-[#126fbd]",
    number: "02",
  },
  {
    href: "/admin/bible-college",
    eyebrow: "Bible College",
    title: "성경대학교 관리",
    description: "소개, 강사진, 커리큘럼, 공지사항과 학사 일정을 관리합니다.",
    accent: "bg-[#527a6c]",
    number: "03",
  },
] as const;

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8ff_0%,#f7f9fb_46%,#ffffff_100%)] px-5 py-10 text-[var(--foreground)] sm:px-8 sm:py-16">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex flex-col gap-6 border-b border-[#cbe5f6] pb-9 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#1678b8]">
              Church Admin
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#08275b] sm:text-5xl">
              관리자 메뉴
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5d7285] sm:text-base">
              관리할 항목을 선택해 주세요.
            </p>
          </div>

          <Link
            href="/"
            className="w-fit rounded-full border border-[#9ccfed] bg-white px-5 py-2.5 text-sm font-bold text-[#075f9b] shadow-sm transition hover:-translate-y-0.5 hover:border-[#3f9fe8]"
          >
            랜딩페이지로
          </Link>
        </header>

        <section
          aria-label="관리자 기능"
          className="mt-9 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {adminMenus.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="group relative min-h-64 overflow-hidden rounded-[1.75rem] border border-[#cbe5f6] bg-white p-7 shadow-[0_18px_50px_rgba(8,39,91,0.08)] transition hover:-translate-y-1 hover:border-[#7fc5ef] hover:shadow-[0_24px_60px_rgba(8,39,91,0.14)] sm:p-8"
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 ${menu.accent}`} />
              <div className="flex items-start justify-between gap-4">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#1678b8]">
                  {menu.eyebrow}
                </p>
                <span className="text-3xl font-bold text-[#dceef9]">
                  {menu.number}
                </span>
              </div>
              <h2 className="mt-8 text-2xl font-bold text-[#08275b]">
                {menu.title}
              </h2>
              <p className="mt-4 text-sm leading-7 text-[#5d7285]">
                {menu.description}
              </p>
              <p className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#075f9b]">
                관리 페이지 열기
                <span
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1"
                >
                  →
                </span>
              </p>
            </Link>
          ))}
        </section>

        <nav
          aria-label="공개 페이지 바로가기"
          className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-black/5 bg-white/80 p-4 shadow-sm"
        >
          <span className="mr-1 text-xs font-bold uppercase tracking-[0.22em] text-[#7b8d9d]">
            바로가기
          </span>
          <Link
            href="/bulletins"
            className="rounded-full bg-[#edf8ff] px-4 py-2 text-sm font-bold text-[#075f9b] transition hover:bg-[#dff2ff]"
          >
            공개 주보
          </Link>
          <Link
            href="/gallery"
            className="rounded-full bg-[#edf8ff] px-4 py-2 text-sm font-bold text-[#075f9b] transition hover:bg-[#dff2ff]"
          >
            공개 갤러리
          </Link>
          <Link
            href="/bible-college"
            className="rounded-full bg-[#edf5f1] px-4 py-2 text-sm font-bold text-[#33594d] transition hover:bg-[#dfece6]"
          >
            성경대학교
          </Link>
        </nav>
      </div>
    </main>
  );
}
