import type { Metadata } from "next";
import Link from "next/link";
import { BulletinView } from "@/components/bulletin-view";
import { fetchLatestBulletin, fetchPublishedBulletins } from "@/lib/bulletins";
import { hasSupabaseEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "온라인 주보 | Calvary Chapel, Church of Seoul",
};

export default async function BulletinsPage() {
  const latestBulletin = await fetchLatestBulletin();
  const archive = await fetchPublishedBulletins();

  if (!hasSupabaseEnv()) {
    return <SetupState />;
  }

  if (!latestBulletin) {
    return <EmptyState />;
  }

  return <BulletinView bulletin={latestBulletin} archive={archive} currentSlug={latestBulletin.slug} />;
}

function SetupState() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-3xl border border-black/8 bg-white p-8 text-[var(--foreground)] shadow-[0_24px_60px_rgba(28,55,40,0.1)]">
        <h1 className="text-3xl font-semibold text-[var(--page-deep)]">
          온라인 주보 준비 중
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--page-muted)] md:text-base">
          Supabase 연결 정보를 입력하면 이 페이지에 최신 주보가 자동으로 표시됩니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/jubo"
            className="bg-[var(--page-deep)] px-5 py-3 text-sm font-semibold text-white"
          >
            관리자 입력 페이지
          </Link>
          <Link
            href="/"
            className="border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[var(--page-deep)]"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}

function EmptyState() {
  return (
    <main className="min-h-screen bg-white px-6 py-10 lg:px-10">
      <div className="mx-auto max-w-3xl border border-black/8 bg-white p-8 text-[var(--foreground)] shadow-[0_24px_60px_rgba(28,55,40,0.1)]">
        <h1 className="text-3xl font-semibold text-[var(--page-deep)]">
          아직 게시된 주보가 없습니다
        </h1>
        <p className="mt-4 text-sm leading-7 text-[var(--page-muted)] md:text-base">
          관리자 페이지에서 이번 주 주보를 입력하고 게시하면 여기에 최신 주보가 나타납니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/admin/jubo"
            className="bg-[var(--page-deep)] px-5 py-3 text-sm font-semibold text-white"
          >
            주보 입력하러 가기
          </Link>
          <Link
            href="/"
            className="border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-[var(--page-deep)]"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
