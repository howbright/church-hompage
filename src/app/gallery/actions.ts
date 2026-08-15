"use server";

import { revalidatePath } from "next/cache";
import {
  clearGalleryMemberSession,
  hasGalleryAuthEnv,
  setGalleryMemberSession,
  verifyGalleryPassword,
} from "@/lib/gallery-auth";

export type GalleryAccessState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function unlockGalleryAction(
  _previousState: GalleryAccessState,
  formData: FormData,
): Promise<GalleryAccessState> {
  if (!hasGalleryAuthEnv()) {
    return {
      status: "error",
      message: "갤러리 구성원 비밀번호가 아직 설정되지 않았습니다.",
    };
  }

  const password = formData.get("password")?.toString() ?? "";
  if (!verifyGalleryPassword(password)) {
    return { status: "error", message: "공용 비밀번호가 올바르지 않습니다." };
  }

  await setGalleryMemberSession();
  revalidatePath("/gallery");
  return { status: "success", message: "교회 구성원 사진이 열렸습니다." };
}

export async function lockGalleryAction() {
  await clearGalleryMemberSession();
  revalidatePath("/gallery");
}
