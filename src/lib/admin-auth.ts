import "server-only";

import { timingSafeEqual } from "node:crypto";

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyAdminPassword(candidate: string) {
  const expected = process.env.BULLETIN_ADMIN_PASSWORD?.trim() ?? "";
  return Boolean(expected) && safeEqual(candidate.trim(), expected);
}

export function adminPasswordConfigurationError() {
  return process.env.BULLETIN_ADMIN_PASSWORD
    ? null
    : "BULLETIN_ADMIN_PASSWORD 환경변수가 비어 있습니다.";
}

