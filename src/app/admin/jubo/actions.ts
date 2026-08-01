"use server";

import { revalidatePath } from "next/cache";
import { deleteBulletin, insertBulletin, updateBulletin } from "@/lib/bulletins";
import { hasSupabaseEnv } from "@/lib/supabase";

export type BulletinActionState = {
  status: "idle" | "success" | "error";
  message: string;
  slug?: string;
  action?: "create" | "update" | "delete";
};

function validateAdminPassword(formData: FormData) {
  const adminPassword = formData.get("adminPassword")?.toString().trim();

  if (!process.env.BULLETIN_ADMIN_PASSWORD) {
    return "BULLETIN_ADMIN_PASSWORD 환경변수가 비어 있습니다.";
  }

  if (adminPassword !== process.env.BULLETIN_ADMIN_PASSWORD) {
    return "관리자 비밀번호가 올바르지 않습니다.";
  }

  return null;
}

function revalidateBulletinPaths(slug?: string, previousSlug?: string) {
  revalidatePath("/bulletins");
  revalidatePath("/admin/jubo");

  if (slug) {
    revalidatePath(`/bulletins/${slug}`);
    revalidatePath(`/bulletins/${slug}/print`);
  }

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/bulletins/${previousSlug}`);
    revalidatePath(`/bulletins/${previousSlug}/print`);
  }
}

export async function saveBulletinAction(
  _prevState: BulletinActionState,
  formData: FormData,
): Promise<BulletinActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "먼저 .env.local에 Supabase 정보를 입력해주세요.",
      action: "create",
    };
  }

  const passwordError = validateAdminPassword(formData);
  if (passwordError) {
    return {
      status: "error",
      message: passwordError,
      action: "create",
    };
  }

  const bulletinId = formData.get("bulletinId")?.toString().trim() ?? "";
  const previousSlug = formData.get("previousSlug")?.toString().trim() ?? "";
  const serviceDate = formData.get("serviceDate")?.toString().trim() ?? "";
  const scriptureReference =
    formData.get("scriptureReference")?.toString().trim() ?? "";
  const messageTitle = formData.get("messageTitle")?.toString().trim() ?? "";
  const columnContent =
    formData.get("columnContent")?.toString().trim() ?? "";
  const weeklyNotice = formData.get("weeklyNotice")?.toString().trim() ?? "";

  if (!serviceDate || !scriptureReference || !messageTitle || !columnContent) {
    return {
      status: "error",
      message: "필수 항목을 모두 입력해주세요.",
      action: bulletinId ? "update" : "create",
    };
  }

  try {
    const input = {
      serviceDate,
      scriptureReference,
      messageTitle,
      columnContent,
      weeklyNotice,
    };

    const bulletin = bulletinId
      ? await updateBulletin(bulletinId, input)
      : await insertBulletin(input);

    revalidateBulletinPaths(bulletin.slug, previousSlug);

    return {
      status: "success",
      message: bulletinId ? "주보가 수정되었습니다." : "주보가 게시되었습니다.",
      slug: bulletin.slug,
      action: bulletinId ? "update" : "create",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "주보를 저장하는 중 오류가 발생했습니다.";

    return {
      status: "error",
      message,
      action: bulletinId ? "update" : "create",
    };
  }
}

export async function deleteBulletinAction(
  _prevState: BulletinActionState,
  formData: FormData,
): Promise<BulletinActionState> {
  if (!hasSupabaseEnv()) {
    return {
      status: "error",
      message: "먼저 .env.local에 Supabase 정보를 입력해주세요.",
      action: "delete",
    };
  }

  const passwordError = validateAdminPassword(formData);
  if (passwordError) {
    return {
      status: "error",
      message: passwordError,
      action: "delete",
    };
  }

  const bulletinId = formData.get("bulletinId")?.toString().trim() ?? "";
  const slug = formData.get("slug")?.toString().trim() ?? "";

  if (!bulletinId) {
    return {
      status: "error",
      message: "삭제할 주보 정보를 찾지 못했습니다.",
      action: "delete",
    };
  }

  try {
    await deleteBulletin(bulletinId);
    revalidateBulletinPaths(slug);

    return {
      status: "success",
      message: "주보가 삭제되었습니다.",
      action: "delete",
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "주보를 삭제하는 중 오류가 발생했습니다.";

    return {
      status: "error",
      message,
      action: "delete",
    };
  }
}
