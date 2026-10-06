import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { GalleryAccess } from "@/components/gallery/gallery-access";
import { GalleryFeed } from "@/components/gallery/gallery-feed";
import { fetchGalleryEntries, type GalleryEntry } from "@/lib/galleries";
import { hasGalleryMemberSession } from "@/lib/gallery-auth";
import { hasSupabaseEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "우리 공동체 이야기 | 갈보리채플 강남교회",
  description:
    "예배하고 배우며 함께 걸어온 갈보리채플 강남교회 공동체의 순간들을 기록합니다.",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
  openGraph: {
    title: "우리 공동체 이야기 | 갈보리채플 강남교회",
    description: "예배하고 배우며 함께 걸어온 공동체의 순간들",
    url: "/gallery",
    siteName: "갈보리채플 강남교회",
    locale: "ko_KR",
    type: "website",
    images: ["/bulletin-og-v3.png"],
  },
};

export default async function GalleryPage() {
  const memberAccess = await hasGalleryMemberSession();
  let entries: GalleryEntry[] = [];
  let gallerySetupError = false;

  try {
    entries = await fetchGalleryEntries(memberAccess);
  } catch {
    gallerySetupError = true;
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8ff_0%,#ffffff_28%,#f4f8fc_100%)] text-[var(--page-ink)]">
      <header className="border-b border-[#cbe5f6] bg-white/90 px-5 py-5 backdrop-blur sm:px-8">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="w-[180px] max-w-[55vw] sm:w-[220px]">
            <Image
              src="/logo.svg"
              alt="갈보리채플 강남교회"
              width={2400}
              height={500}
              className="h-auto w-full"
              priority
            />
          </Link>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-[#9ccfed] bg-[#edf8ff] px-4 py-2 text-sm font-bold text-[#075f9b] transition hover:bg-white"
          >
            홈으로
          </Link>
        </div>
      </header>

      <section className="px-5 py-14 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-7 border-b border-[#cbe5f6] pb-12 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-[#1678b8]">
                Community Gallery
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-[#08275b] sm:text-5xl">
                우리 공동체 이야기
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-[#56697a] sm:text-lg">
                예배하고 배우며 함께 걸어온 소중한 순간들을 기록합니다.
              </p>
            </div>
            {memberAccess ? <GalleryAccess memberAccess /> : null}
          </div>

          {!hasSupabaseEnv() ? (
            <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
              갤러리 데이터베이스 설정을 준비하고 있습니다.
            </div>
          ) : null}

          {gallerySetupError ? (
            <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-900">
              갤러리 데이터베이스를 연결하는 중입니다. 관리자에게 Supabase의
              <code className="mx-1 rounded bg-amber-100 px-1.5 py-0.5">supabase/schema.sql</code>
              적용 여부를 확인해 주세요.
            </div>
          ) : null}

          {!memberAccess ? (
            <aside className="my-10 rounded-[1.5rem] border border-[#b9dff5] bg-[#eaf7ff] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
              <div>
                <p className="font-bold text-[#08275b]">
                  교회 구성원만 볼 수 있는 이야기가 있습니다.
                </p>
                <p className="mt-2 text-sm leading-6 text-[#5d7285]">
                  교회에서 안내받은 공용 비밀번호로 인증하면 교제와 모임 사진을 볼 수 있습니다.
                </p>
              </div>
              <div className="mt-5 shrink-0 sm:mt-0">
                <GalleryAccess memberAccess={false} />
              </div>
            </aside>
          ) : (
            <div className="my-8 inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              교회 구성원 사진까지 보고 있습니다
            </div>
          )}

          <GalleryFeed entries={entries} />
        </div>
      </section>
    </main>
  );
}
