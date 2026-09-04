"use server";

import { revalidatePath } from "next/cache";
import {
  adminPasswordConfigurationError,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { saveBibleCollegeContent } from "@/lib/bible-college";
import {
  parseBibleCollegeCourses,
  parseBibleCollegeEvents,
  parseBibleCollegeInstructors,
  parseBibleCollegeNotices,
} from "@/lib/bible-college-types";
import { hasSupabaseEnv } from "@/lib/supabase";

export type BibleCollegeAdminState = {
  status: "success" | "error";
  message: string;
};

function parseJson(value: FormDataEntryValue | null) {
  try {
    return JSON.parse(value?.toString() ?? "[]") as unknown;
  } catch {
    return [];
  }
}

export async function saveBibleCollegeAction(
  formData: FormData,
): Promise<BibleCollegeAdminState> {
  if (!hasSupabaseEnv()) {
    return { status: "error", message: "Supabase 환경변수를 확인해주세요." };
  }
  const configError = adminPasswordConfigurationError();
  if (configError) return { status: "error", message: configError };
  const adminPassword = formData.get("adminPassword")?.toString() ?? "";
  if (!verifyAdminPassword(adminPassword)) {
    return { status: "error", message: "관리자 비밀번호가 올바르지 않습니다." };
  }

  const introduction = formData.get("introduction")?.toString().trim().slice(0, 10_000) ?? "";
  const semesterName = formData.get("semesterName")?.toString().trim().slice(0, 100) ?? "";
  const inquiryEmail = formData.get("inquiryEmail")?.toString().trim().slice(0, 320) ?? "";
  const address = formData.get("address")?.toString().trim().slice(0, 500) ?? "";
  if (!introduction || !semesterName || !inquiryEmail || !address) {
    return { status: "error", message: "소개, 학기명, 문의 이메일, 주소를 모두 입력해주세요." };
  }
  if (!/^\S+@\S+\.\S+$/.test(inquiryEmail)) {
    return { status: "error", message: "문의 이메일 형식을 확인해주세요." };
  }

  const curriculum = parseBibleCollegeCourses(parseJson(formData.get("curriculum")));
  const instructors = parseBibleCollegeInstructors(parseJson(formData.get("instructors")));
  const notices = parseBibleCollegeNotices(parseJson(formData.get("notices")));
  const calendarEvents = parseBibleCollegeEvents(parseJson(formData.get("calendarEvents")));

  try {
    await saveBibleCollegeContent({
      introduction,
      semester_name: semesterName,
      curriculum,
      instructors,
      student_photo_path: formData.get("studentPhotoPath")?.toString().trim() || null,
      student_photo_alt: formData.get("studentPhotoAlt")?.toString().trim().slice(0, 300) || "성경대학교 학생들의 배움과 교제",
      student_photo_caption: formData.get("studentPhotoCaption")?.toString().trim().slice(0, 1000) || "",
      notices,
      calendar_events: calendarEvents,
      inquiry_email: inquiryEmail,
      address,
    });
    revalidatePath("/bible-college");
    revalidatePath("/admin/bible-college");
    return { status: "success", message: "성경대학교 페이지를 저장했습니다." };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "성경대학교 페이지를 저장하지 못했습니다.",
    };
  }
}
