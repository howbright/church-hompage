import { randomUUID } from "node:crypto";
import { verifyAdminPassword } from "@/lib/admin-auth";
import { BIBLE_COLLEGE_BUCKET } from "@/lib/bible-college";
import { getSupabaseAdminClient, hasSupabaseEnv } from "@/lib/supabase";

type UploadRequest = {
  adminPassword?: unknown;
  files?: Array<{ type?: unknown; size?: unknown }>;
};

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return Response.json({ ok: false, message: "Supabase 환경변수를 확인해주세요." }, { status: 503 });
  }
  let body: UploadRequest;
  try {
    body = (await request.json()) as UploadRequest;
  } catch {
    return Response.json({ ok: false, message: "요청 형식을 확인해주세요." }, { status: 400 });
  }
  const password = typeof body.adminPassword === "string" ? body.adminPassword : "";
  if (!verifyAdminPassword(password)) {
    return Response.json({ ok: false, message: "관리자 비밀번호가 올바르지 않습니다." }, { status: 401 });
  }
  const files = Array.isArray(body.files) ? body.files : [];
  if (!files.length || files.length > 21) {
    return Response.json({ ok: false, message: "사진은 한 번에 1~21장까지 올릴 수 있습니다." }, { status: 400 });
  }
  for (const file of files) {
    if (typeof file.type !== "string" || !allowedTypes.has(file.type)) {
      return Response.json({ ok: false, message: "JPG, PNG, WebP 사진만 올릴 수 있습니다." }, { status: 400 });
    }
    if (typeof file.size !== "number" || file.size > 3 * 1024 * 1024) {
      return Response.json({ ok: false, message: "사진 한 장은 3MB 이하여야 합니다." }, { status: 400 });
    }
  }

  const batchId = randomUUID();
  const supabase = getSupabaseAdminClient();
  try {
    const uploads = await Promise.all(files.map(async (file) => {
      const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
      const path = `${batchId}/${randomUUID()}.${extension}`;
      const { data, error } = await supabase.storage.from(BIBLE_COLLEGE_BUCKET).createSignedUploadUrl(path);
      if (error) throw new Error(error.message);
      return { path, token: data.token };
    }));
    return Response.json({ ok: true, uploads });
  } catch {
    return Response.json({ ok: false, message: "사진 업로드를 준비하지 못했습니다." }, { status: 500 });
  }
}
