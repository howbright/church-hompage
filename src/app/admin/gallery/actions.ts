"use server";

import { revalidatePath } from "next/cache";
import {
  adminPasswordConfigurationError,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import {
  deleteGalleryEntry,
  saveGalleryEntry,
  type GalleryPhotoInput,
  type GalleryVisibility,
} from "@/lib/galleries";
import { hasSupabaseEnv } from "@/lib/supabase";

export type GalleryAdminActionState = {
  status: "success" | "error";
  message: string;
  action: "create" | "update" | "delete";
};

function passwordError(formData: FormData) {
  const configError = adminPasswordConfigurationError();
  if (configError) return configError;
  const password = formData.get("adminPassword")?.toString() ?? "";
  return verifyAdminPassword(password)
    ? null
    : "관리자 비밀번호가 올바르지 않습니다.";
}

export async function saveGalleryEntryAction(
  formData: FormData,
): Promise<GalleryAdminActionState> {
  const entryId = formData.get("entryId")?.toString() ?? "";
  const action = entryId ? "update" : "create";

  if (!hasSupabaseEnv()) {
    return { status: "error", message: "Supabase 환경변수를 확인해주세요.", action };
  }

  const authError = passwordError(formData);
  if (authError) return { status: "error", message: authError, action };

  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const eventDate = formData.get("eventDate")?.toString().trim() ?? "";
  const dateLabel = formData.get("dateLabel")?.toString().trim() ?? "";
  const visibility = formData.get("visibility")?.toString() as GalleryVisibility;
  const containsMinors = formData.get("containsMinors") === "true";
  const consentConfirmed = formData.get("consentConfirmed") === "true";

  let photos: GalleryPhotoInput[] = [];
  try {
    photos = JSON.parse(formData.get("photos")?.toString() ?? "[]") as GalleryPhotoInput[];
  } catch {
    return { status: "error", message: "사진 정보를 읽지 못했습니다.", action };
  }

  if (!title || !eventDate || !["public", "members", "private"].includes(visibility)) {
    return { status: "error", message: "날짜, 제목, 공개 범위를 확인해주세요.", action };
  }
  if (!photos.length) {
    return { status: "error", message: "사진을 한 장 이상 추가해주세요.", action };
  }
  if (!consentConfirmed) {
    return { status: "error", message: "사진 게시 가능 여부를 확인해주세요.", action };
  }

  try {
    await saveGalleryEntry(entryId, {
      title,
      description,
      eventDate,
      dateLabel,
      visibility,
      containsMinors,
      consentConfirmed,
      photos,
    });
    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");
    return {
      status: "success",
      message: entryId ? "갤러리 기록이 수정되었습니다." : "갤러리 기록이 게시되었습니다.",
      action,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "갤러리 기록을 저장하지 못했습니다.",
      action,
    };
  }
}

export async function deleteGalleryEntryAction(
  formData: FormData,
): Promise<GalleryAdminActionState> {
  if (!hasSupabaseEnv()) {
    return { status: "error", message: "Supabase 환경변수를 확인해주세요.", action: "delete" };
  }
  const authError = passwordError(formData);
  if (authError) return { status: "error", message: authError, action: "delete" };

  const entryId = formData.get("entryId")?.toString() ?? "";
  if (!entryId) return { status: "error", message: "삭제할 기록을 찾지 못했습니다.", action: "delete" };

  try {
    await deleteGalleryEntry(entryId);
    revalidatePath("/gallery");
    revalidatePath("/admin/gallery");
    return { status: "success", message: "갤러리 기록과 사진을 삭제했습니다.", action: "delete" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "갤러리 기록을 삭제하지 못했습니다.",
      action: "delete",
    };
  }
}

