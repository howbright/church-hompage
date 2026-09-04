import "server-only";

import type { Json } from "./database.types";
import { churchConfig } from "./church-config";
import { getSupabaseAdminClient, hasSupabaseEnv } from "./supabase";
import {
  parseBibleCollegeCourses,
  parseBibleCollegeEvents,
  parseBibleCollegeInstructors,
  parseBibleCollegeNotices,
  type BibleCollegeContent,
} from "./bible-college-types";

export const BIBLE_COLLEGE_BUCKET = "bible-college-media";

export const defaultBibleCollegeContent: BibleCollegeContent = {
  introduction:
    "갈보리채플 성경대학교는 척 스미스 목사의 말씀 중심 목회 철학을 따라 성경 전체를 장별·절별로 체계적으로 배우고 가르칩니다. 창세기부터 요한계시록까지 본문의 흐름과 의미를 살피며, 하나님의 말씀을 삶 속에서 이해하고 실천하도록 돕습니다.",
  semester_name: "2026년 9월학기",
  curriculum: [],
  instructors: [],
  student_photo_path: null,
  student_photo_alt: "성경대학교 학생들의 배움과 교제",
  student_photo_caption: "",
  notices: [],
  calendar_events: [],
  inquiry_email: churchConfig.contactEmail,
  address: churchConfig.address,
};

function asJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

async function signedUrl(path: string | null) {
  if (!path) return undefined;
  const { data, error } = await getSupabaseAdminClient().storage
    .from(BIBLE_COLLEGE_BUCKET)
    .createSignedUrl(path, 60 * 60);
  return error ? undefined : data.signedUrl;
}

export async function fetchBibleCollegeContent(): Promise<BibleCollegeContent> {
  if (!hasSupabaseEnv()) return defaultBibleCollegeContent;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("bible_college_content")
    .select("*")
    .eq("id", "main")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return defaultBibleCollegeContent;

  const instructors = parseBibleCollegeInstructors(data.instructors);
  const instructorsWithUrls = await Promise.all(
    instructors.map(async (instructor) => ({
      ...instructor,
      photo_url: await signedUrl(instructor.photo_path),
    })),
  );

  return {
    introduction: data.introduction,
    semester_name: data.semester_name,
    curriculum: parseBibleCollegeCourses(data.curriculum),
    instructors: instructorsWithUrls,
    student_photo_path: data.student_photo_path,
    student_photo_alt: data.student_photo_alt ?? "성경대학교 학생들의 배움과 교제",
    student_photo_caption: data.student_photo_caption ?? "",
    student_photo_url: await signedUrl(data.student_photo_path),
    notices: parseBibleCollegeNotices(data.notices).sort((a, b) => b.date.localeCompare(a.date)),
    calendar_events: parseBibleCollegeEvents(data.calendar_events).sort((a, b) => a.start_date.localeCompare(b.start_date)),
    inquiry_email: data.inquiry_email,
    address: data.address,
  };
}

function mediaPaths(content: BibleCollegeContent) {
  return new Set([
    ...content.instructors.flatMap((instructor) =>
      instructor.photo_path ? [instructor.photo_path] : [],
    ),
    ...(content.student_photo_path ? [content.student_photo_path] : []),
  ]);
}

export async function saveBibleCollegeContent(content: BibleCollegeContent) {
  const supabase = getSupabaseAdminClient();
  let previous = defaultBibleCollegeContent;
  try {
    previous = await fetchBibleCollegeContent();
  } catch {
    // The first save may happen immediately after the schema is created.
  }

  const { error } = await supabase.from("bible_college_content").upsert({
    id: "main",
    introduction: content.introduction,
    semester_name: content.semester_name,
    curriculum: asJson(content.curriculum),
    instructors: asJson(
      content.instructors.map((instructor) => {
        const serialized = { ...instructor };
        delete serialized.photo_url;
        return serialized;
      }),
    ),
    student_photo_path: content.student_photo_path,
    student_photo_alt: content.student_photo_alt || null,
    student_photo_caption: content.student_photo_caption || null,
    notices: asJson(content.notices),
    calendar_events: asJson(content.calendar_events),
    inquiry_email: content.inquiry_email,
    address: content.address,
  });
  if (error) throw new Error(error.message);

  const previousPaths = mediaPaths(previous);
  const nextPaths = mediaPaths(content);
  const removedPaths = [...previousPaths].filter((path) => !nextPaths.has(path));
  if (removedPaths.length) {
    await supabase.storage.from(BIBLE_COLLEGE_BUCKET).remove(removedPaths);
  }
}
