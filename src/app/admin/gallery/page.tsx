import type { Metadata } from "next";
import Link from "next/link";
import { GalleryAdmin } from "@/components/gallery/gallery-admin";
import { fetchAdminGalleryEntries, type GalleryEntry } from "@/lib/galleries";
import { hasSupabaseEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "교회 갤러리 관리 | 갈보리채플 강남교회",
};

export default async function AdminGalleryPage() {
  let entries: GalleryEntry[] = [];
  let gallerySetupError = false;

  try {
    entries = await fetchAdminGalleryEntries();
  } catch {
    gallerySetupError = true;
  }

  return (
    <main className="min-h-screen bg-[var(--background)] px-5 py-10 text-[var(--foreground)] sm:px-8 lg:px-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.32em] text-[var(--page-accent-strong)]">Gallery Admin</p>
            <h1 className="mt-3 text-3xl font-bold text-[var(--page-deep)] sm:text-4xl">교회 갤러리 관리</h1>
            <p className="mt-3 text-sm leading-7 text-[var(--page-muted)]">공동체 기록과 사진을 게시하고 공개 범위를 관리합니다.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/gallery" className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[var(--page-deep)]">갤러리 보기</Link>
            <Link href="/admin/jubo" className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[var(--page-deep)]">주보 관리</Link>
          </div>
        </div>

        {!hasSupabaseEnv() ? (
          <div className="my-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">Supabase 환경변수와 `supabase/schema.sql` 설정이 필요합니다.</div>
        ) : null}

        {gallerySetupError ? (
          <div className="my-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
            갤러리 테이블을 불러오지 못했습니다. Supabase SQL Editor에서
            <code className="mx-1 rounded bg-amber-100 px-1.5 py-0.5">supabase/schema.sql</code>
            을 적용한 뒤 다시 열어 주세요.
          </div>
        ) : null}

        <div className="mt-8">
          <GalleryAdmin entries={entries} />
        </div>
      </div>
    </main>
  );
}
