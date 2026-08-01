import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BulletinView } from "@/components/bulletin-view";
import {
  fetchBulletinBySlug,
  fetchPublishedBulletins,
  formatBulletinDate,
} from "@/lib/bulletins";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const bulletin = await fetchBulletinBySlug(slug);

  if (!bulletin) {
    return {
      title: "주보를 찾을 수 없습니다 | 갈보리채플 강남교회",
    };
  }

  const dateLabel = formatBulletinDate(bulletin.service_date);
  const title = `${dateLabel} 온라인 주보 | 갈보리채플 강남교회`;
  const description = `${bulletin.scripture_reference} · ${bulletin.message_title} — 갈보리채플 강남교회 온라인 주보`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `/bulletins/${slug}`,
      siteName: "갈보리채플 강남교회",
      locale: "ko_KR",
      type: "article",
      images: [
        {
          url: "/bulletin-og-v3.png",
          width: 1200,
          height: 630,
          alt: "갈보리채플 강남교회 온라인 주보",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/bulletin-og-v3.png"],
    },
  };
}

export default async function BulletinDetailPage({ params }: Props) {
  const { slug } = await params;
  const bulletin = await fetchBulletinBySlug(slug);

  if (!bulletin) {
    notFound();
  }

  const archive = await fetchPublishedBulletins();

  return <BulletinView bulletin={bulletin} archive={archive} currentSlug={slug} />;
}
