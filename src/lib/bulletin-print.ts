import { churchConfig } from "@/lib/church-config";
import type { Bulletin } from "@/lib/bulletins";
import { formatBulletinDate } from "@/lib/bulletins";

export type BulletinPrintPage = {
  pageNumber: number;
  totalPages: number;
  title: string;
  scriptureReference: string;
  dateLabel: string;
  weeklyNotice: string | null;
  columnChunk: string;
  isFirstPage: boolean;
};

function splitParagraphs(content: string) {
  return content
    .split(/\n\s*\n/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function chunkParagraphs(paragraphs: string[], charLimit: number) {
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const candidate = current ? `${current}\n\n${paragraph}` : paragraph;

    if (current && candidate.length > charLimit) {
      chunks.push(current);
      current = paragraph;
      continue;
    }

    if (!current && paragraph.length > charLimit) {
      chunks.push(paragraph);
      current = "";
      continue;
    }

    current = candidate;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export function buildBulletinPrintPages(bulletin: Bulletin): BulletinPrintPage[] {
  const paragraphs = splitParagraphs(bulletin.column_content);
  const firstPageLimit = bulletin.weekly_notice ? 1800 : 2200;
  const nextPageLimit = 2800;

  const firstPass = chunkParagraphs(paragraphs, firstPageLimit);
  const pageChunks: string[] = [];

  if (firstPass.length <= 1) {
    pageChunks.push(firstPass[0] ?? "");
  } else {
    pageChunks.push(firstPass[0]);
    const remainder = splitParagraphs(firstPass.slice(1).join("\n\n"));
    pageChunks.push(...chunkParagraphs(remainder, nextPageLimit));
  }

  const totalPages = Math.max(pageChunks.length, 1);
  const dateLabel = formatBulletinDate(bulletin.service_date);

  return Array.from({ length: totalPages }, (_, index) => ({
    pageNumber: index + 1,
    totalPages,
    title: bulletin.message_title,
    scriptureReference: bulletin.scripture_reference,
    dateLabel,
    weeklyNotice: index === 0 ? bulletin.weekly_notice : null,
    columnChunk: pageChunks[index] ?? "",
    isFirstPage: index === 0,
  }));
}

export function getBulletinPrintMeta() {
  return {
    churchName: churchConfig.koreanName,
    englishName: churchConfig.englishName,
    email: churchConfig.contactEmail,
    worshipOrder: churchConfig.worshipOrder,
    logoSrc: churchConfig.logoSrc,
    bulletinImageSrc: churchConfig.bulletinImageSrc,
  };
}
