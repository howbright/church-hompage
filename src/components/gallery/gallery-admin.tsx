"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteGalleryEntryAction,
  saveGalleryEntryAction,
  type GalleryAdminActionState,
} from "@/app/admin/gallery/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ResultToast } from "@/components/ui/result-toast";
import { getSupabasePublicClient } from "@/lib/supabase";
import type { GalleryEntry, GalleryPhotoInput, GalleryVisibility } from "@/lib/galleries";

type PhotoDraft = GalleryPhotoInput & {
  key: string;
  preview: string;
  blob?: Blob;
};

const visibilityLabels: Record<GalleryVisibility, string> = {
  public: "전체 공개",
  members: "교회 구성원",
  private: "비공개",
};

function entryPhotos(entry: GalleryEntry): PhotoDraft[] {
  return entry.gallery_photos.map((photo) => ({
    key: photo.id,
    storage_path: photo.storage_path,
    sort_order: photo.sort_order,
    alt_text: photo.alt_text,
    caption: photo.caption,
    width: photo.width,
    height: photo.height,
    mime_type: photo.mime_type,
    file_size: photo.file_size,
    preview: photo.signed_url ?? "",
  }));
}

async function optimizeImage(file: File): Promise<PhotoDraft> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("사진을 처리하지 못했습니다.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("사진 최적화에 실패했습니다."))),
      "image/webp",
      0.82,
    );
  });

  return {
    key: crypto.randomUUID(),
    storage_path: "",
    sort_order: 0,
    alt_text: null,
    caption: null,
    width,
    height,
    mime_type: "image/webp",
    file_size: blob.size,
    preview: URL.createObjectURL(blob),
    blob,
  };
}

export function GalleryAdmin({ entries }: { entries: GalleryEntry[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<GalleryEntry | null>(null);
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);
  const [adminPassword, setAdminPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GalleryEntry | null>(null);
  const [toast, setToast] = useState<GalleryAdminActionState | null>(null);
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  function resetForm() {
    setEditing(null);
    setPhotos([]);
    setProgress("");
    const form = document.getElementById("gallery-admin-form") as HTMLFormElement | null;
    form?.reset();
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    if (photos.length + files.length > 20) {
      setToast({ status: "error", message: "한 게시물에는 사진을 최대 20장까지 넣을 수 있습니다.", action: "create" });
      return;
    }
    setBusy(true);
    try {
      const next: PhotoDraft[] = [];
      for (let index = 0; index < files.length; index += 1) {
        setProgress(`사진 최적화 중 ${index + 1} / ${files.length}`);
        next.push(await optimizeImage(files[index]));
      }
      setPhotos((current) => [...current, ...next]);
    } catch (error) {
      setToast({ status: "error", message: error instanceof Error ? error.message : "사진을 처리하지 못했습니다.", action: "create" });
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  function movePhoto(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= photos.length) return;
    setPhotos((current) => {
      const copy = [...current];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
  }

  async function uploadNewPhotos(drafts: PhotoDraft[]) {
    const newPhotos = drafts.filter((photo) => photo.blob);
    if (!newPhotos.length) return drafts;

    setProgress("사진 업로드 준비 중...");
    const response = await fetch("/api/admin/gallery/uploads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        adminPassword,
        files: newPhotos.map((photo) => ({
          name: `${photo.key}.webp`,
          type: photo.mime_type,
          size: photo.file_size,
        })),
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

    const supabase = getSupabasePublicClient();
    const uploaded = new Map<string, string>();
    for (let index = 0; index < newPhotos.length; index += 1) {
      setProgress(`사진 업로드 중 ${index + 1} / ${newPhotos.length}`);
      const draft = newPhotos[index];
      const upload = result.uploads[index];
      const { error } = await supabase.storage
        .from("gallery-media")
        .uploadToSignedUrl(upload.path, upload.token, draft.blob!, {
          contentType: draft.mime_type,
          cacheControl: "31536000",
        });
      if (error) throw new Error(error.message);
      uploaded.set(draft.key, upload.path);
    }

    return drafts.map((photo) => ({
      ...photo,
      storage_path: uploaded.get(photo.key) ?? photo.storage_path,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!photos.length) {
      setToast({ status: "error", message: "사진을 한 장 이상 추가해주세요.", action: editing ? "update" : "create" });
      return;
    }
    setBusy(true);
    try {
      const uploaded = await uploadNewPhotos(photos);
      const formData = new FormData(form);
      formData.set("entryId", editing?.id ?? "");
      formData.set("adminPassword", adminPassword);
      formData.set(
        "photos",
        JSON.stringify(
          uploaded.map((photo, index) => ({
            storage_path: photo.storage_path,
            sort_order: index,
            alt_text: photo.alt_text,
            caption: photo.caption,
            width: photo.width,
            height: photo.height,
            mime_type: photo.mime_type,
            file_size: photo.file_size,
          })),
        ),
      );
      const result = await saveGalleryEntryAction(formData);
      setToast(result);
      if (result.status === "success") {
        resetForm();
        router.refresh();
      } else {
        setPhotos(uploaded);
      }
    } catch (error) {
      setToast({ status: "error", message: error instanceof Error ? error.message : "갤러리를 저장하지 못했습니다.", action: editing ? "update" : "create" });
    } finally {
      setBusy(false);
      setProgress("");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setBusy(true);
    const formData = new FormData();
    formData.set("entryId", deleteTarget.id);
    formData.set("adminPassword", adminPassword);
    const result = await deleteGalleryEntryAction(formData);
    setBusy(false);
    setDeleteTarget(null);
    setToast(result);
    if (result.status === "success") {
      if (editing?.id === deleteTarget.id) resetForm();
      router.refresh();
    }
  }

  return (
    <>
      <form id="gallery-admin-form" onSubmit={handleSubmit} className="rounded-[2rem] border border-black/10 bg-white p-5 shadow-[0_18px_55px_rgba(8,39,91,0.08)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold text-[var(--page-deep)]">
            {editing ? "갤러리 기록 수정" : "새 갤러리 기록"}
          </h2>
          {editing ? (
            <button type="button" onClick={resetForm} className="rounded-full border border-black/10 px-4 py-2 text-sm font-bold text-[var(--page-deep)]">
              새 기록 작성
            </button>
          ) : null}
        </div>

        <div className="mt-7 grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-bold text-[var(--page-deep)]">
            행사 날짜
            <input name="eventDate" type="date" required defaultValue={editing?.event_date ?? today} key={`date-${editing?.id ?? "new"}`} className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>
          <label className="text-sm font-bold text-[var(--page-deep)]">
            날짜 표시 문구 <span className="font-normal text-[var(--page-muted)]">(선택)</span>
            <input name="dateLabel" defaultValue={editing?.date_label ?? ""} key={`label-${editing?.id ?? "new"}`} placeholder="예: 2026년 여름" className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 font-normal" />
          </label>
        </div>
        <label className="mt-5 block text-sm font-bold text-[var(--page-deep)]">
          제목
          <input name="title" required defaultValue={editing?.title ?? ""} key={`title-${editing?.id ?? "new"}`} placeholder="예: 외국 손님과 함께한 주일" className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 font-normal" />
        </label>
        <label className="mt-5 block text-sm font-bold text-[var(--page-deep)]">
          짧은 설명 <span className="font-normal text-[var(--page-muted)]">(선택)</span>
          <textarea name="description" rows={3} defaultValue={editing?.description ?? ""} key={`description-${editing?.id ?? "new"}`} className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 font-normal leading-7" />
        </label>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold text-[var(--page-deep)]">공개 범위</legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {(["members", "public", "private"] as const).map((value) => (
              <label key={`${editing?.id ?? "new"}-${value}`} className="flex cursor-pointer items-center gap-3 rounded-xl border border-black/10 bg-[#f8fbfd] px-4 py-3 text-sm font-semibold">
                <input type="radio" name="visibility" value={value} defaultChecked={(editing?.visibility ?? "members") === value} />
                {visibilityLabels[value]}{value === "members" ? " — 권장" : ""}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 rounded-2xl border border-[#cbe5f6] bg-[#f2f9fd] p-4">
          <label className="flex items-start gap-3 text-sm leading-6">
            <input name="containsMinors" value="true" type="checkbox" defaultChecked={editing?.contains_minors ?? false} key={`minors-${editing?.id ?? "new"}`} className="mt-1" />
            어린이가 식별되는 사진이 포함되어 있습니다.
          </label>
          <label className="mt-3 flex items-start gap-3 text-sm font-bold leading-6 text-[#08275b]">
            <input name="consentConfirmed" value="true" type="checkbox" required defaultChecked={editing?.consent_confirmed ?? false} key={`consent-${editing?.id ?? "new"}`} className="mt-1" />
            홈페이지에 게시해도 되는 사진인지 확인했습니다.
          </label>
        </div>

        <div className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-[var(--page-deep)]">사진</h3>
              <p className="mt-1 text-xs text-[var(--page-muted)]">최대 20장 · 긴 변 2,000px WebP로 자동 최적화됩니다.</p>
            </div>
            <label className="cursor-pointer rounded-full bg-[#eaf7ff] px-4 py-2 text-sm font-bold text-[#075f9b]">
              사진 여러 장 선택
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={busy} onChange={(event) => void handleFiles(event.target.files)} />
            </label>
          </div>
          {photos.length ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo, index) => (
                <div key={photo.key} className="overflow-hidden rounded-2xl border border-black/10 bg-white">
                  <div className="relative aspect-[4/3] bg-[#e5edf2]">
                    {photo.preview ? <Image src={photo.preview} alt="업로드할 사진 미리보기" fill unoptimized className="object-cover" /> : null}
                    <span className="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-white">{index + 1}</span>
                  </div>
                  <div className="space-y-2 p-3">
                    <input value={photo.caption ?? ""} onChange={(event) => setPhotos((current) => current.map((item) => item.key === photo.key ? { ...item, caption: event.target.value || null } : item))} placeholder="사진 설명 (선택)" className="w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => movePhoto(index, -1)} disabled={index === 0} className="rounded-lg border px-2 py-1 text-xs disabled:opacity-30">← 앞으로</button>
                      <button type="button" onClick={() => movePhoto(index, 1)} disabled={index === photos.length - 1} className="rounded-lg border px-2 py-1 text-xs disabled:opacity-30">뒤로 →</button>
                      <button type="button" onClick={() => setPhotos((current) => current.filter((item) => item.key !== photo.key))} className="ml-auto rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">삭제</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed border-[#9ccfed] p-8 text-center text-sm text-[var(--page-muted)]">선택된 사진이 없습니다.</div>
          )}
        </div>

        <label className="mt-7 block text-sm font-bold text-[var(--page-deep)]">
          관리자 비밀번호
          <input type="password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required autoComplete="current-password" className="mt-2 w-full rounded-xl border border-black/15 px-4 py-3 font-normal sm:max-w-md" />
        </label>
        <button type="submit" disabled={busy} className="mt-7 w-full rounded-full bg-[var(--page-deep)] px-6 py-3.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
          {busy ? progress || "처리 중..." : editing ? "수정 내용 저장" : "갤러리 게시"}
        </button>
      </form>

      <section className="mt-10 rounded-[2rem] border border-black/10 bg-white p-5 sm:p-8">
        <h2 className="text-2xl font-bold text-[var(--page-deep)]">최근 갤러리 기록</h2>
        <div className="mt-5 space-y-3">
          {entries.length ? entries.map((entry) => (
            <article key={entry.id} className="flex flex-col gap-4 rounded-2xl border border-black/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold text-[#1678b8]">{entry.date_label || entry.event_date}</p>
                <h3 className="mt-1 font-bold text-[var(--page-deep)]">{entry.title}</h3>
                <p className="mt-1 text-xs text-[var(--page-muted)]">{visibilityLabels[entry.visibility]} · 사진 {entry.gallery_photos.length}장</p>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setEditing(entry); setPhotos(entryPhotos(entry)); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="rounded-full border border-[#9ccfed] px-4 py-2 text-sm font-bold text-[#075f9b]">수정</button>
                <button type="button" onClick={() => setDeleteTarget(entry)} className="rounded-full bg-rose-50 px-4 py-2 text-sm font-bold text-rose-700">삭제</button>
              </div>
            </article>
          )) : <p className="rounded-2xl bg-[#f6f9fb] p-6 text-sm text-[var(--page-muted)]">아직 등록된 갤러리 기록이 없습니다.</p>}
        </div>
      </section>

      <ConfirmDialog open={Boolean(deleteTarget)} title="갤러리 기록을 삭제할까요?" description={`‘${deleteTarget?.title ?? ""}’ 기록과 사진 ${deleteTarget?.gallery_photos.length ?? 0}장이 모두 삭제됩니다.`} confirmLabel="기록과 사진 삭제" pendingLabel="삭제 중..." pending={busy} danger onConfirm={() => void confirmDelete()} onClose={() => !busy && setDeleteTarget(null)} />
      {toast ? <ResultToast status={toast.status} message={toast.message} onClose={() => setToast(null)} /> : null}
    </>
  );
}

