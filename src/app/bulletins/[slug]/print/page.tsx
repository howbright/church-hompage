import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BulletinPrintActions } from "@/components/bulletin-print-actions";
import { BulletinPrintDocument } from "@/components/bulletin-print-document";
import { fetchBulletinBySlug, formatBulletinDate } from "@/lib/bulletins";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bulletin = await fetchBulletinBySlug(slug);

  if (!bulletin) {
    return {
      title: "주보 인쇄 | Calvary Chapel, Church of Seoul",
    };
  }

  return {
    title: `${formatBulletinDate(bulletin.service_date)} 주보 인쇄 | Calvary Chapel, Church of Seoul`,
  };
}

export default async function BulletinPrintPage({ params }: Props) {
  const { slug } = await params;
  const bulletin = await fetchBulletinBySlug(slug);

  if (!bulletin) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#f3f3f1] px-4 py-6 print:bg-white print:p-0">
      <div className="print-hide mx-auto mb-6 flex w-full max-w-[900px] items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--page-accent-strong)]">
            Print View
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--page-deep)]">
            주보 인쇄 / PDF 저장
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/bulletins/${slug}`}
            className="border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--page-deep)] transition hover:border-[var(--page-accent-strong)]"
          >
            일반 보기
          </Link>
          <BulletinPrintActions />
        </div>
      </div>

      <BulletinPrintDocument bulletin={bulletin} printMode />
    </main>
  );
}
