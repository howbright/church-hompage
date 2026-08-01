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
      title: "주보를 찾을 수 없습니다 | Calvary Chapel, Church of Seoul",
    };
  }

  return {
    title: `${formatBulletinDate(bulletin.service_date)} 주보 | Calvary Chapel, Church of Seoul`,
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
