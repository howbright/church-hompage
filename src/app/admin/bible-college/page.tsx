import type { Metadata } from "next";
import Link from "next/link";
import { BibleCollegeAdmin } from "@/components/bible-college-admin";
import {
  defaultBibleCollegeContent,
  fetchBibleCollegeContent,
} from "@/lib/bible-college";
import { hasSupabaseEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "성경대학교 관리 | 갈보리채플 강남교회",
};

export default async function AdminBibleCollegePage() {
  let content = defaultBibleCollegeContent;
  let setupError = false;

  try {
    content = await fetchBibleCollegeContent();
  } catch {
    setupError = true;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#edf3ef_0%,#f8faf9_32%,#ffffff_100%)] px-5 py-10 text-[#1e302b] sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-[#cedbd5] pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#5d7d72]">
              Bible College Admin
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1d4035] sm:text-4xl">
              성경대학교 관리
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#687d75]">
              소개, 강사진, 학기 과정, 공지와 학사 일정을 한곳에서 관리합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/bible-college" className="rounded-full border border-[#bfd0c9] bg-white px-4 py-2 text-sm font-bold text-[#33594d]">
              공개 페이지 보기
            </Link>
            <Link href="/admin" className="rounded-full border border-[#bfd0c9] bg-white px-4 py-2 text-sm font-bold text-[#33594d]">
              관리자 메뉴
            </Link>
          </div>
        </header>

        {!hasSupabaseEnv() ? (
          <SetupNotice>Supabase 환경변수와 데이터베이스 설정이 필요합니다.</SetupNotice>
        ) : null}
        {setupError ? (
          <SetupNotice>
            성경대학교 데이터를 불러오지 못했습니다. Supabase SQL Editor에서
            <code className="mx-1 rounded bg-amber-100 px-1.5 py-0.5">supabase/schema.sql</code>
            을 적용한 뒤 다시 열어 주세요. 현재는 기본값으로 편집할 수 있습니다.
          </SetupNotice>
        ) : null}

        <div className="mt-8">
          <BibleCollegeAdmin initialContent={content} />
        </div>
      </div>
    </main>
  );
}

function SetupNotice({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900">
      {children}
    </p>
  );
}
