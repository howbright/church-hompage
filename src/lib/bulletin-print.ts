import { churchConfig } from "@/lib/church-config";
import type { Bulletin } from "@/lib/bulletins";
import { formatBulletinDate } from "@/lib/bulletins";
import {
  getRichTextBlocks,
  plainTextToRichDocument,
  richTextDocumentFromBlocks,
  richTextToPlainText,
  sanitizeRichText,
  splitRichTextBlock,
  type RichTextDocument,
  type RichTextNode,
} from "@/lib/rich-text";

export type BulletinPrintPage = {
  pageNumber: number;
  totalPages: number;
  title: string;
  scriptureReference: string;
  dateLabel: string;
  weeklyNotice: string | null;
  columnChunk: string;
  columnRichChunk: RichTextDocument;
  isFirstPage: boolean;
};

export function buildBulletinPrintPages(bulletin: Bulletin): BulletinPrintPage[] {
  const richDocument =
    sanitizeRichText(bulletin.column_content_rich) ??
    plainTextToRichDocument(bulletin.column_content);
  const richBlocks = getRichTextBlocks(richDocument);
  const firstPageLimit = bulletin.weekly_notice ? 1800 : 2200;
  const nextPageLimit = 2800;
  const pageBlockChunks: RichTextNode[][] = [];
  let currentBlocks: RichTextNode[] = [];
  let currentLength = 0;

  const pendingBlocks = [...richBlocks];
  while (pendingBlocks.length) {
    const block = pendingBlocks.shift();
    if (!block) continue;
    const blockLength = richTextToPlainText(richTextDocumentFromBlocks([block])).length;
    const limit = pageBlockChunks.length === 0 ? firstPageLimit : nextPageLimit;
    if (currentBlocks.length && currentLength + blockLength > limit) {
      pageBlockChunks.push(currentBlocks);
      currentBlocks = [];
      currentLength = 0;
      pendingBlocks.unshift(block);
      continue;
    }

    if (blockLength > limit) {
      const splitBlocks = splitRichTextBlock(block, limit);
      if (splitBlocks.length > 1) {
        pendingBlocks.unshift(...splitBlocks);
        continue;
      }
    }

    currentBlocks.push(block);
    currentLength += blockLength;
  }

  if (currentBlocks.length || !pageBlockChunks.length) {
    pageBlockChunks.push(currentBlocks);
  }

  const totalPages = pageBlockChunks.length;
  const dateLabel = formatBulletinDate(bulletin.service_date);

  return Array.from({ length: totalPages }, (_, index) => ({
    pageNumber: index + 1,
    totalPages,
    title: bulletin.message_title,
    scriptureReference: bulletin.scripture_reference,
    dateLabel,
    weeklyNotice: index === 0 ? bulletin.weekly_notice : null,
    columnChunk: richTextToPlainText(
      richTextDocumentFromBlocks(pageBlockChunks[index] ?? []),
    ),
    columnRichChunk: richTextDocumentFromBlocks(pageBlockChunks[index] ?? []),
    isFirstPage: index === 0,
  }));
}

export function getBulletinPrintMeta() {
  return {
    churchName: churchConfig.koreanName,
    englishName: churchConfig.englishName,
    seniorPastor: churchConfig.seniorPastor,
    email: churchConfig.contactEmail,
    worshipOrder: churchConfig.worshipOrder,
    worshipLocations: churchConfig.worshipLocations,
    logoSrc: churchConfig.logoSrc,
    bulletinImageSrc: churchConfig.bulletinImageSrc,
  };
}
