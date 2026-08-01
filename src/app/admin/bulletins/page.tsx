import type { Metadata } from "next";
import Link from "next/link";
import { AdminBulletinManager } from "@/components/admin-bulletin-form";
import { deleteBulletinAction, saveBulletinAction } from "./actions";
import { fetchRecentAdminBulletins } from "@/lib/bulletins";
import { hasSupabaseEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "주보 관리 | Calvary Chapel Gangnam",
};

export default async function AdminBulletinsPage() {
  const recentBulletins = await fetchRecentAdminBulletins();

  return (
    <main className="min-h-screen bg-[var(--background)] px-6 py-10 text-[var(--foreground)] lg:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--page-accent-strong)]">
              Bulletin Admin
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[var(--page-deep)] md:text-4xl">
              온라인 주보 관리
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--page-muted)] md:text-base">
              주보를 새로 작성하고, 기존 주보를 수정하거나 삭제할 수 있습니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/bulletins"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--page-deep)] transition hover:border-[var(--page-accent-strong)] hover:bg-[var(--page-accent-soft)]"
            >
              최신 주보 보기
            </Link>
            <Link
              href="/"
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--page-deep)] transition hover:border-[var(--page-accent-strong)] hover:bg-[var(--page-accent-soft)]"
            >
              랜딩 페이지
            </Link>
          </div>
        </div>

        {!hasSupabaseEnv() ? (
          <div className="rounded-[2rem] border border-black/10 bg-[rgba(0,0,0,0.03)] p-6 text-sm leading-7 text-[var(--page-muted)]">
            <p className="font-semibold text-[var(--page-deep)]">
              아직 Supabase 환경변수가 비어 있습니다.
            </p>
            <p className="mt-2">
              먼저 [`.env.local`](/Users/nahyunlee/Development/church-homepage/.env.local)에
              `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
              `SUPABASE_SERVICE_ROLE_KEY`, `BULLETIN_ADMIN_PASSWORD`를 입력해주세요.
            </p>
            <p className="mt-2">
              테이블 생성은 [`supabase/schema.sql`](/Users/nahyunlee/Development/church-homepage/supabase/schema.sql)을
              Supabase SQL Editor에서 실행하면 됩니다.
            </p>
          </div>
        ) : null}

        <AdminBulletinManager
          bulletins={recentBulletins}
          saveAction={saveBulletinAction}
          removeAction={deleteBulletinAction}
        />
      </div>
    </main>
  );
}
