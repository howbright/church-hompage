"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  lockGalleryAction,
  unlockGalleryAction,
  type GalleryAccessState,
} from "@/app/gallery/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ResultToast } from "@/components/ui/result-toast";

const initialState: GalleryAccessState = { status: "idle", message: "" };

export function GalleryAccess({ memberAccess }: { memberAccess: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [password, setPassword] = useState("");
  const [toast, setToast] = useState<GalleryAccessState>(initialState);

  async function unlock() {
    setPending(true);
    const formData = new FormData();
    formData.set("password", password);
    const result = await unlockGalleryAction(initialState, formData);
    setPending(false);
    setToast(result);
    if (result.status === "success") {
      setOpen(false);
      setPassword("");
      router.refresh();
    }
  }

  if (memberAccess) {
    return (
      <form
        action={async () => {
          await lockGalleryAction();
          router.refresh();
        }}
      >
        <button
          type="submit"
          className="rounded-full border border-[#9ccfed] bg-white px-4 py-2 text-sm font-bold text-[#075f9b] transition hover:bg-[#edf8ff]"
        >
          구성원 인증 해제
        </button>
      </form>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-full bg-[#08275b] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_28px_rgba(8,39,91,0.22)] transition hover:-translate-y-0.5"
      >
        교회 구성원 인증하기
      </button>
      <ConfirmDialog
        open={open}
        title="교회 구성원 인증"
        description="교회 구성원에게 안내된 갤러리 공용 비밀번호를 입력해주세요. 이 브라우저에서는 30일 동안 유지됩니다."
        confirmLabel="구성원 사진 보기"
        pendingLabel="확인 중..."
        pending={pending}
        onClose={() => !pending && setOpen(false)}
        onConfirm={() => void unlock()}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void unlock();
          }}
        >
          <label className="block text-sm font-bold text-[var(--page-deep)]">
            갤러리 공용 비밀번호
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-xl border border-black/15 bg-white px-4 py-3 text-base outline-none transition focus:border-[#3f9fe8] focus:ring-4 focus:ring-[#3f9fe8]/15"
            />
          </label>
        </form>
      </ConfirmDialog>
      {toast.status !== "idle" ? (
        <ResultToast
          status={toast.status}
          message={toast.message}
          onClose={() => setToast(initialState)}
        />
      ) : null}
    </>
  );
}
