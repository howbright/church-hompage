import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "church_gallery_member";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function getPassword() {
  return process.env.GALLERY_MEMBER_PASSWORD?.trim() ?? "";
}

function getSecret() {
  return process.env.GALLERY_SESSION_SECRET?.trim() ?? "";
}

export function hasGalleryAuthEnv() {
  return Boolean(getPassword() && getSecret());
}

function passwordVersion() {
  return createHash("sha256").update(getPassword()).digest("hex").slice(0, 16);
}

function sign(value: string) {
  return createHmac("sha256", getSecret()).update(value).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyGalleryPassword(candidate: string) {
  const expected = getPassword();
  return Boolean(expected) && safeEqual(candidate.trim(), expected);
}

function createSessionToken() {
  const payload = Buffer.from(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
      version: passwordVersion(),
    }),
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function verifySessionToken(token: string | undefined) {
  if (!token || !hasGalleryAuthEnv()) return false;

  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(signature, sign(payload))) return false;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      exp?: number;
      version?: string;
    };

    return (
      typeof data.exp === "number" &&
      data.exp > Math.floor(Date.now() / 1000) &&
      data.version === passwordVersion()
    );
  } catch {
    return false;
  }
}

export async function hasGalleryMemberSession() {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(COOKIE_NAME)?.value);
}

export async function setGalleryMemberSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
    priority: "high",
  });
}

export async function clearGalleryMemberSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

