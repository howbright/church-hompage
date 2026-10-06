import type { MetadataRoute } from "next";
import { fetchPublishedBulletins } from "@/lib/bulletins";

const siteUrl = "https://www.calvarygangnam.com";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let bulletins: Awaited<ReturnType<typeof fetchPublishedBulletins>> = [];

  try {
    bulletins = await fetchPublishedBulletins();
  } catch {
    // Keep static public routes available during a temporary database failure.
  }

  const latestBulletinUpdate = bulletins[0]?.updated_at;

  return [
    {
      url: siteUrl,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteUrl}/bulletins`,
      ...(latestBulletinUpdate
        ? { lastModified: new Date(latestBulletinUpdate) }
        : {}),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/bible-college`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...bulletins.map((bulletin) => ({
      url: `${siteUrl}/bulletins/${encodeURIComponent(bulletin.slug)}`,
      lastModified: new Date(bulletin.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
