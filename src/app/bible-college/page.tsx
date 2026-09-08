import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BibleCollegeCalendar } from "@/components/bible-college-calendar";
import {
  defaultBibleCollegeContent,
  fetchBibleCollegeContent,
} from "@/lib/bible-college";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "성경대학교 | 갈보리채플 강남교회",
  description:
    "성경 전체를 장별·절별로 체계적으로 배우는 갈보리채플 강남교회 성경대학교입니다.",
};

export default async function BibleCollegePage() {
  let content = defaultBibleCollegeContent;
  let setupError = false;
  try {
    content = await fetchBibleCollegeContent();
  } catch {
    setupError = true;
  }

  return (
    <main className="min-h-screen bg-[#f5f7f6] text-[#1e302b]">
      <header className="border-b border-[#dce5e1] bg-white/95 px-5 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 sm:gap-4">
          <Link href="/" className="min-w-0 text-[0.65rem] font-bold tracking-[0.1em] text-[#33594d] sm:text-sm sm:tracking-[0.14em]">
            <span className="sm:hidden">CALVARY CHAPEL</span>
            <span className="hidden sm:inline">CALVARY CHAPEL GANGNAM</span>
          </Link>
          <nav className="flex shrink-0 items-center gap-1 text-xs font-semibold sm:gap-2 sm:text-sm">
            <Link href="/bulletins" className="whitespace-nowrap rounded-full px-2.5 py-2 text-[#62766f] hover:bg-[#f1f5f3] sm:px-3">주보</Link>
            <Link href="/" className="whitespace-nowrap rounded-full border border-[#ccd9d4] px-3 py-2 text-[#33594d] hover:bg-[#f1f5f3] sm:px-4">교회 홈</Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-[#dce5e1] bg-[linear-gradient(135deg,#edf3ef_0%,#f9faf8_55%,#e8efec_100%)] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)] lg:items-end">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.34em] text-[#5d7d72]">Calvary Bible College</p>
            <h1 className="mt-5 text-4xl font-bold tracking-[-0.04em] text-[#1d4035] sm:text-6xl">성경대학교</h1>
            <p className="mt-7 max-w-3xl whitespace-pre-line text-base leading-8 text-[#566c64] sm:text-lg sm:leading-9">{content.introduction}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/80 bg-white/75 p-6 shadow-[0_18px_45px_rgba(30,64,53,0.08)] backdrop-blur">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#6a847b]">문의 및 장소</p>
            <address className="mt-4 not-italic text-sm leading-7 text-[#405c53]">
              <p>{content.address}</p>
              <a className="font-semibold underline decoration-[#abc2ba] underline-offset-4" href={`mailto:${content.inquiry_email}`}>{content.inquiry_email}</a>
            </address>
          </div>
        </div>
      </section>

      {setupError ? (
        <div className="mx-auto mt-8 max-w-6xl px-5 sm:px-8">
          <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">성경대학교 데이터베이스 설정 전이라 기본 소개를 표시하고 있습니다.</p>
        </div>
      ) : null}

      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Teachers" title="강사 소개" description="말씀을 함께 연구하고 삶으로 나누는 강사진을 소개합니다." />
          {content.instructors.length ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {content.instructors.map((instructor) => (
                <article key={instructor.id} className="overflow-hidden rounded-[1.5rem] border border-[#dce5e1] bg-white shadow-[0_15px_40px_rgba(30,64,53,0.06)]">
                  {instructor.photo_url ? (
                    <Image src={instructor.photo_url} alt={instructor.photo_alt || `${instructor.name} 강사`} width={900} height={1100} unoptimized className="aspect-[4/5] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[4/5] items-center justify-center bg-[#e8efec] text-5xl font-bold text-[#8ca49b]">{instructor.name.slice(0, 1)}</div>
                  )}
                  <div className="p-6">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#779087]">{instructor.role || "강사"}</p>
                    <h3 className="mt-2 text-xl font-bold text-[#1d4035]">{instructor.name}</h3>
                    <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#647870]">{instructor.bio}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState>강사 소개를 준비하고 있습니다.</EmptyState>
          )}
        </div>
      </section>

      <section className="bg-[#eaf0ed] px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Campus Life" title="배우고 함께하는 생활" description="말씀을 배우며 함께 성장하는 성경대학교의 일상입니다." />
          <div className="mt-10 overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_20px_55px_rgba(30,64,53,0.09)]">
            {content.student_photo_url ? (
              <Image src={content.student_photo_url} alt={content.student_photo_alt} width={1600} height={900} unoptimized className="aspect-[16/8] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/8] items-center justify-center bg-[linear-gradient(135deg,#dce7e2,#f4f7f5)] text-sm font-semibold text-[#748b82]">학생 생활 사진을 준비하고 있습니다.</div>
            )}
            {content.student_photo_caption ? <p className="px-6 py-4 text-sm text-[#657a72]">{content.student_photo_caption}</p> : null}
          </div>
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading eyebrow="Curriculum" title="이번 학기 커리큘럼" description={content.semester_name || "학기 준비 중"} />
            {content.curriculum.length ? (
              <ol className="mt-8 space-y-3">
                {content.curriculum.map((course, index) => (
                  <li key={course.id} className="flex gap-4 rounded-2xl border border-[#dce5e1] bg-white p-5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#dfeae5] text-xs font-bold text-[#33594d]">{index + 1}</span>
                    <div><h3 className="font-bold text-[#1d4035]">{course.name}</h3>{course.description ? <p className="mt-2 text-sm leading-6 text-[#657a72]">{course.description}</p> : null}</div>
                  </li>
                ))}
              </ol>
            ) : <EmptyState>이번 학기 과목을 준비하고 있습니다.</EmptyState>}
          </div>

          <div>
            <SectionHeading eyebrow="Notice" title="공지사항" description="수업과 학사 운영에 관한 소식입니다." />
            {content.notices.length ? (
              <div className="mt-8 divide-y divide-[#e1e8e4] rounded-[1.5rem] border border-[#dce5e1] bg-white px-5 sm:px-6">
                {content.notices.map((notice) => (
                  <article key={notice.id} className="py-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-bold text-[#1d4035]">{notice.title}</h3>{notice.date ? <time className="text-xs text-[#80928b]">{notice.date}</time> : null}</div>
                    {notice.body ? <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#657a72]">{notice.body}</p> : null}
                  </article>
                ))}
              </div>
            ) : <EmptyState>등록된 공지사항이 없습니다.</EmptyState>}
          </div>
        </div>
      </section>

      <section className="border-t border-[#dce5e1] bg-white px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <SectionHeading eyebrow="Calendar" title="학사 일정" description="수업과 주요 일정을 달력에서 확인하세요." />
          <div className="mt-10"><BibleCollegeCalendar events={content.calendar_events} /></div>
        </div>
      </section>

      <footer className="bg-[#1d4035] px-5 py-10 text-white sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-bold">갈보리채플 강남교회 성경대학교</p><p className="mt-1 text-sm text-white/65">{content.address}</p></div>
          <a
            href={`mailto:${content.inquiry_email}`}
            className="w-fit rounded-full border border-white/70 px-5 py-2.5 text-sm font-bold shadow-[0_10px_28px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 hover:border-white"
            style={{ backgroundColor: "#ffffff", color: "#173b31" }}
          >
            성경대학 문의하기
          </a>
        </div>
      </footer>
    </main>
  );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-[#708a81]">{eyebrow}</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-[#1d4035] sm:text-4xl">{title}</h2><p className="mt-4 text-sm leading-7 text-[#687d75] sm:text-base">{description}</p></div>;
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="mt-8 rounded-[1.5rem] border border-dashed border-[#cddbd5] bg-white/60 p-8 text-center text-sm text-[#74877f]">{children}</div>;
}
