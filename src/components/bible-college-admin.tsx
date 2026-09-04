"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveBibleCollegeAction,
  type BibleCollegeAdminState,
} from "@/app/admin/bible-college/actions";
import { ResultToast } from "@/components/ui/result-toast";
import { getSupabasePublicClient } from "@/lib/supabase";
import type {
  BibleCollegeCalendarEvent,
  BibleCollegeContent,
  BibleCollegeCourse,
  BibleCollegeInstructor,
  BibleCollegeNotice,
} from "@/lib/bible-college-types";

const inputClass =
  "mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-sm font-normal outline-none transition focus:border-[#527a6c]";
const buttonClass =
  "rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-bold text-[#2f5146] transition hover:border-[#75998d] hover:bg-[#f4f8f6]";

async function optimizeImage(file: File) {
  if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
    throw new Error("JPG, PNG, WebP 사진만 올릴 수 있습니다.");
  }
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 1800 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("사진을 처리하지 못했습니다.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => result ? resolve(result) : reject(new Error("사진 최적화에 실패했습니다.")),
      "image/webp",
      0.84,
    );
  });
  if (blob.size > 3 * 1024 * 1024) {
    throw new Error("최적화된 사진이 3MB를 초과합니다. 더 작은 사진을 선택해주세요.");
  }
  return { blob, preview: URL.createObjectURL(blob) };
}

export function BibleCollegeAdmin({ initialContent }: { initialContent: BibleCollegeContent }) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [photoDrafts, setPhotoDrafts] = useState<Record<string, Blob>>({});
  const [studentPhotoDraft, setStudentPhotoDraft] = useState<Blob | null>(null);
  const [adminPassword, setAdminPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [toast, setToast] = useState<BibleCollegeAdminState | null>(null);

  function updateInstructor(id: string, patch: Partial<BibleCollegeInstructor>) {
    setContent((current) => ({
      ...current,
      instructors: current.instructors.map((item) => item.id === id ? { ...item, ...patch } : item),
    }));
  }

  async function selectInstructorPhoto(id: string, file?: File) {
    if (!file) return;
    try {
      const optimized = await optimizeImage(file);
      setPhotoDrafts((current) => ({ ...current, [id]: optimized.blob }));
      updateInstructor(id, { photo_url: optimized.preview });
    } catch (error) {
      setToast({ status: "error", message: error instanceof Error ? error.message : "사진을 처리하지 못했습니다." });
    }
  }

  async function selectStudentPhoto(file?: File) {
    if (!file) return;
    try {
      const optimized = await optimizeImage(file);
      setStudentPhotoDraft(optimized.blob);
      setContent((current) => ({ ...current, student_photo_url: optimized.preview }));
    } catch (error) {
      setToast({ status: "error", message: error instanceof Error ? error.message : "사진을 처리하지 못했습니다." });
    }
  }

  async function uploadDrafts(current: BibleCollegeContent) {
    const drafts = [
      ...Object.entries(photoDrafts).map(([id, blob]) => ({ key: `instructor:${id}`, blob })),
      ...(studentPhotoDraft ? [{ key: "student", blob: studentPhotoDraft }] : []),
    ];
    if (!drafts.length) return current;

    setProgress("사진 업로드 준비 중...");
    const response = await fetch("/api/admin/bible-college/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword,
        files: drafts.map(({ blob }) => ({ type: blob.type, size: blob.size })),
      }),
    });
    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      uploads?: Array<{ path: string; token: string }>;
    };
    if (!response.ok || !result.ok || !result.uploads) {
      throw new Error(result.message || "사진 업로드를 준비하지 못했습니다.");
    }

    const uploadedPaths = new Map<string, string>();
    const supabase = getSupabasePublicClient();
    for (let index = 0; index < drafts.length; index += 1) {
      setProgress(`사진 업로드 중 ${index + 1} / ${drafts.length}`);
      const draft = drafts[index];
      const upload = result.uploads[index];
      const { error } = await supabase.storage
        .from("bible-college-media")
        .uploadToSignedUrl(upload.path, upload.token, draft.blob, {
          contentType: draft.blob.type,
          cacheControl: "31536000",
        });
      if (error) throw new Error(error.message);
      uploadedPaths.set(draft.key, upload.path);
    }

    return {
      ...current,
      instructors: current.instructors.map((instructor) => ({
        ...instructor,
        photo_path: uploadedPaths.get(`instructor:${instructor.id}`) ?? instructor.photo_path,
      })),
      student_photo_path: uploadedPaths.get("student") ?? current.student_photo_path,
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setToast(null);
    try {
      const uploadedContent = await uploadDrafts(content);
      const formData = new FormData();
      formData.set("adminPassword", adminPassword);
      formData.set("introduction", uploadedContent.introduction);
      formData.set("semesterName", uploadedContent.semester_name);
      formData.set("inquiryEmail", uploadedContent.inquiry_email);
      formData.set("address", uploadedContent.address);
      formData.set("curriculum", JSON.stringify(uploadedContent.curriculum));
      formData.set("instructors", JSON.stringify(uploadedContent.instructors));
      formData.set("studentPhotoPath", uploadedContent.student_photo_path ?? "");
      formData.set("studentPhotoAlt", uploadedContent.student_photo_alt);
      formData.set("studentPhotoCaption", uploadedContent.student_photo_caption);
      formData.set("notices", JSON.stringify(uploadedContent.notices));
      formData.set("calendarEvents", JSON.stringify(uploadedContent.calendar_events));
      const result = await saveBibleCollegeAction(formData);
      setToast(result);
      if (result.status === "success") {
        setContent(uploadedContent);
        setPhotoDrafts({});
        setStudentPhotoDraft(null);
        router.refresh();
      }
    } catch (error) {
      setToast({ status: "error", message: error instanceof Error ? error.message : "저장하지 못했습니다." });
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        <AdminSection title="성경대학 소개" description="성경대학의 교육 철학과 방향을 소개합니다.">
          <label className="text-sm font-bold text-[#203f35]">소개 내용
            <textarea required rows={7} value={content.introduction} onChange={(event) => setContent({ ...content, introduction: event.target.value })} className={`${inputClass} leading-7`} />
          </label>
        </AdminSection>

        <AdminSection title="강사 소개" description="강사 사진과 직책, 소개를 관리합니다." action={<button type="button" className={buttonClass} onClick={() => setContent((current) => ({ ...current, instructors: [...current.instructors, { id: crypto.randomUUID(), name: "", role: "강사", bio: "", photo_path: null, photo_alt: "" }] }))}>강사 추가</button>}>
          {content.instructors.length ? <div className="grid gap-5 lg:grid-cols-2">{content.instructors.map((instructor, index) => (
            <div key={instructor.id} className="rounded-2xl border border-[#dbe5e0] bg-[#f8faf9] p-4">
              <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                <div>
                  <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-[#e3ebe7]">
                    {instructor.photo_url ? <Image src={instructor.photo_url} alt="강사 사진 미리보기" fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-[#788d84]">사진 없음</div>}
                  </div>
                  <label className="mt-2 block cursor-pointer rounded-full border border-[#ccd9d3] bg-white px-3 py-2 text-center text-xs font-bold text-[#35594d]">사진 선택<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void selectInstructorPhoto(instructor.id, event.target.files?.[0])} /></label>
                </div>
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-[#476158]">이름<input required value={instructor.name} onChange={(event) => updateInstructor(instructor.id, { name: event.target.value })} className={inputClass} /></label>
                  <label className="block text-xs font-bold text-[#476158]">직책<input value={instructor.role} onChange={(event) => updateInstructor(instructor.id, { role: event.target.value })} className={inputClass} /></label>
                  <label className="block text-xs font-bold text-[#476158]">사진 설명<input value={instructor.photo_alt} onChange={(event) => updateInstructor(instructor.id, { photo_alt: event.target.value })} placeholder="예: 성경을 강의하는 홍길동 강사" className={inputClass} /></label>
                </div>
              </div>
              <label className="mt-4 block text-xs font-bold text-[#476158]">소개<textarea rows={4} value={instructor.bio} onChange={(event) => updateInstructor(instructor.id, { bio: event.target.value })} className={`${inputClass} leading-6`} /></label>
              <div className="mt-3 flex justify-end"><button type="button" className="text-xs font-bold text-rose-600" onClick={() => { setContent((current) => ({ ...current, instructors: current.instructors.filter((item) => item.id !== instructor.id) })); setPhotoDrafts((current) => { const next = { ...current }; delete next[instructor.id]; return next; }); }}>강사 {index + 1} 삭제</button></div>
            </div>
          ))}</div> : <AdminEmpty>등록된 강사가 없습니다.</AdminEmpty>}
        </AdminSection>

        <AdminSection title="학생 생활 홍보 사진" description="공개 페이지에 크게 표시할 대표 사진 한 장입니다.">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
            <div className="relative aspect-[16/8] overflow-hidden rounded-2xl bg-[#e3ebe7]">
              {content.student_photo_url ? <Image src={content.student_photo_url} alt="학생 생활 사진 미리보기" fill unoptimized className="object-cover" /> : <div className="flex h-full items-center justify-center text-sm text-[#788d84]">사진을 선택해주세요.</div>}
            </div>
            <div className="space-y-4">
              <label className="block cursor-pointer rounded-xl border border-dashed border-[#9fb5ac] bg-[#f3f7f5] px-4 py-5 text-center text-sm font-bold text-[#35594d]">홍보 사진 선택<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => void selectStudentPhoto(event.target.files?.[0])} /></label>
              <label className="block text-sm font-bold text-[#476158]">대체 문구<input value={content.student_photo_alt} onChange={(event) => setContent({ ...content, student_photo_alt: event.target.value })} className={inputClass} /></label>
              <label className="block text-sm font-bold text-[#476158]">사진 설명<input value={content.student_photo_caption} onChange={(event) => setContent({ ...content, student_photo_caption: event.target.value })} className={inputClass} /></label>
              {content.student_photo_url ? <button type="button" className="text-sm font-bold text-rose-600" onClick={() => { setStudentPhotoDraft(null); setContent((current) => ({ ...current, student_photo_path: null, student_photo_url: undefined })); }}>사진 제거</button> : null}
            </div>
          </div>
        </AdminSection>

        <AdminSection title="이번 학기 커리큘럼" description="학기명과 과목을 순서대로 관리합니다." action={<button type="button" className={buttonClass} onClick={() => setContent((current) => ({ ...current, curriculum: [...current.curriculum, { id: crypto.randomUUID(), name: "", description: "" }] }))}>과목 추가</button>}>
          <label className="block text-sm font-bold text-[#203f35]">학기명<input required value={content.semester_name} onChange={(event) => setContent({ ...content, semester_name: event.target.value })} placeholder="예: 2026년 9월학기" className={inputClass} /></label>
          <div className="mt-5 space-y-3">{content.curriculum.map((course, index) => <CourseEditor key={course.id} course={course} index={index} onChange={(patch) => setContent((current) => ({ ...current, curriculum: current.curriculum.map((item) => item.id === course.id ? { ...item, ...patch } : item) }))} onDelete={() => setContent((current) => ({ ...current, curriculum: current.curriculum.filter((item) => item.id !== course.id) }))} />)}{!content.curriculum.length ? <AdminEmpty>등록된 과목이 없습니다.</AdminEmpty> : null}</div>
        </AdminSection>

        <AdminSection title="공지사항" description="학생들에게 전달할 공지를 관리합니다." action={<button type="button" className={buttonClass} onClick={() => setContent((current) => ({ ...current, notices: [{ id: crypto.randomUUID(), title: "", body: "", date: new Date().toISOString().slice(0, 10) }, ...current.notices] }))}>공지 추가</button>}>
          <div className="space-y-4">{content.notices.map((notice) => <NoticeEditor key={notice.id} notice={notice} onChange={(patch) => setContent((current) => ({ ...current, notices: current.notices.map((item) => item.id === notice.id ? { ...item, ...patch } : item) }))} onDelete={() => setContent((current) => ({ ...current, notices: current.notices.filter((item) => item.id !== notice.id) }))} />)}{!content.notices.length ? <AdminEmpty>등록된 공지가 없습니다.</AdminEmpty> : null}</div>
        </AdminSection>

        <AdminSection title="학사 캘린더" description="수업, 휴강, 행사 등 일정을 등록합니다." action={<button type="button" className={buttonClass} onClick={() => setContent((current) => ({ ...current, calendar_events: [...current.calendar_events, { id: crypto.randomUUID(), title: "", start_date: "", end_date: "", description: "" }] }))}>일정 추가</button>}>
          <div className="space-y-4">{content.calendar_events.map((calendarEvent) => <EventEditor key={calendarEvent.id} event={calendarEvent} onChange={(patch) => setContent((current) => ({ ...current, calendar_events: current.calendar_events.map((item) => item.id === calendarEvent.id ? { ...item, ...patch } : item) }))} onDelete={() => setContent((current) => ({ ...current, calendar_events: current.calendar_events.filter((item) => item.id !== calendarEvent.id) }))} />)}{!content.calendar_events.length ? <AdminEmpty>등록된 일정이 없습니다.</AdminEmpty> : null}</div>
        </AdminSection>

        <AdminSection title="문의 및 주소" description="성경대학 문의처와 수업 장소를 관리합니다.">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-bold text-[#203f35]">문의 이메일<input required type="email" value={content.inquiry_email} onChange={(event) => setContent({ ...content, inquiry_email: event.target.value })} className={inputClass} /></label>
            <label className="text-sm font-bold text-[#203f35]">주소<input required value={content.address} onChange={(event) => setContent({ ...content, address: event.target.value })} className={inputClass} /></label>
          </div>
        </AdminSection>

        <div className="sticky bottom-4 z-20 rounded-2xl border border-[#cbdad4] bg-white/95 p-4 shadow-[0_16px_45px_rgba(25,60,49,0.18)] backdrop-blur sm:flex sm:items-end sm:justify-between sm:gap-5">
          <label className="block flex-1 text-sm font-bold text-[#203f35]">관리자 비밀번호<input required type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} className={inputClass} /></label>
          <button disabled={busy} type="submit" className="mt-4 h-12 w-full rounded-full bg-[#1d4035] px-7 text-sm font-bold text-white transition hover:bg-[#2b594a] disabled:opacity-50 sm:mt-0 sm:w-auto">{busy ? progress || "저장 중..." : "성경대학 페이지 저장"}</button>
        </div>
      </form>
      {toast ? <ResultToast status={toast.status} message={toast.message} onClose={() => setToast(null)} linkHref={toast.status === "success" ? "/bible-college" : undefined} linkLabel="공개 페이지 보기" /> : null}
    </>
  );
}

function AdminSection({ title, description, action, children }: { title: string; description: string; action?: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-[1.75rem] border border-[#d7e2dd] bg-white p-5 shadow-[0_12px_36px_rgba(29,64,53,0.05)] sm:p-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-bold text-[#1d4035]">{title}</h2><p className="mt-2 text-sm leading-6 text-[#6b7f77]">{description}</p></div>{action}</div><div className="mt-6">{children}</div></section>;
}

function AdminEmpty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-dashed border-[#cbd8d3] bg-[#fafcfb] p-5 text-center text-sm text-[#7a8c85]">{children}</div>;
}

function CourseEditor({ course, index, onChange, onDelete }: { course: BibleCollegeCourse; index: number; onChange: (patch: Partial<BibleCollegeCourse>) => void; onDelete: () => void }) {
  return <div className="grid gap-3 rounded-xl border border-[#dde6e2] bg-[#f9fbfa] p-4 sm:grid-cols-[2rem_1fr_1.4fr_auto] sm:items-end"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e1ebe6] text-xs font-bold text-[#35594d]">{index + 1}</span><label className="text-xs font-bold text-[#476158]">과목명<input required value={course.name} onChange={(event) => onChange({ name: event.target.value })} className={inputClass} /></label><label className="text-xs font-bold text-[#476158]">설명<input value={course.description} onChange={(event) => onChange({ description: event.target.value })} className={inputClass} /></label><button type="button" onClick={onDelete} className="h-11 text-xs font-bold text-rose-600">삭제</button></div>;
}

function NoticeEditor({ notice, onChange, onDelete }: { notice: BibleCollegeNotice; onChange: (patch: Partial<BibleCollegeNotice>) => void; onDelete: () => void }) {
  return <div className="rounded-xl border border-[#dde6e2] bg-[#f9fbfa] p-4"><div className="grid gap-3 sm:grid-cols-[1fr_150px_auto] sm:items-end"><label className="text-xs font-bold text-[#476158]">제목<input required value={notice.title} onChange={(event) => onChange({ title: event.target.value })} className={inputClass} /></label><label className="text-xs font-bold text-[#476158]">날짜<input type="date" value={notice.date} onChange={(event) => onChange({ date: event.target.value })} className={inputClass} /></label><button type="button" onClick={onDelete} className="h-11 text-xs font-bold text-rose-600">삭제</button></div><label className="mt-3 block text-xs font-bold text-[#476158]">내용<textarea rows={3} value={notice.body} onChange={(event) => onChange({ body: event.target.value })} className={`${inputClass} leading-6`} /></label></div>;
}

function EventEditor({ event, onChange, onDelete }: { event: BibleCollegeCalendarEvent; onChange: (patch: Partial<BibleCollegeCalendarEvent>) => void; onDelete: () => void }) {
  return <div className="rounded-xl border border-[#dde6e2] bg-[#f9fbfa] p-4"><div className="grid gap-3 sm:grid-cols-[1fr_145px_145px_auto] sm:items-end"><label className="text-xs font-bold text-[#476158]">일정명<input required value={event.title} onChange={(changeEvent) => onChange({ title: changeEvent.target.value })} className={inputClass} /></label><label className="text-xs font-bold text-[#476158]">시작일<input required type="date" value={event.start_date} onChange={(changeEvent) => onChange({ start_date: changeEvent.target.value, end_date: event.end_date || changeEvent.target.value })} className={inputClass} /></label><label className="text-xs font-bold text-[#476158]">종료일<input type="date" min={event.start_date} value={event.end_date} onChange={(changeEvent) => onChange({ end_date: changeEvent.target.value })} className={inputClass} /></label><button type="button" onClick={onDelete} className="h-11 text-xs font-bold text-rose-600">삭제</button></div><label className="mt-3 block text-xs font-bold text-[#476158]">설명<input value={event.description} onChange={(changeEvent) => onChange({ description: changeEvent.target.value })} className={inputClass} /></label></div>;
}
