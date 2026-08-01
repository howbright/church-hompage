"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  BulletinActionState,
  deleteBulletinAction,
  saveBulletinAction,
} from "@/app/admin/jubo/actions";
import type { Bulletin } from "@/lib/bulletins";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ResultToast } from "@/components/ui/result-toast";

const initialState: BulletinActionState = {
  status: "idle",
  message: "",
};

type EditableBulletin = Pick<
  Bulletin,
  | "id"
  | "slug"
  | "service_date"
  | "scripture_reference"
  | "message_title"
  | "column_content"
  | "weekly_notice"
>;

function SubmitButton({
  label,
  pending,
}: {
  label: string;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      className="inline-flex h-12 items-center justify-center rounded-full bg-[var(--page-deep)] px-6 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "저장 중..." : label}
    </button>
  );
}

export function AdminBulletinManager({
  bulletins,
  saveAction,
  removeAction,
}: {
  bulletins: EditableBulletin[];
  saveAction: typeof saveBulletinAction;
  removeAction: typeof deleteBulletinAction;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedBulletin, setSelectedBulletin] = useState<EditableBulletin | null>(
    null,
  );
  const [saveState, setSaveState] = useState<BulletinActionState>(initialState);
  const [deleteState, setDeleteState] = useState<BulletinActionState>(initialState);
  const [deleteTarget, setDeleteTarget] = useState<EditableBulletin | null>(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [isSavePending, startSaveTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const activeMessage = deleteState.status !== "idle" ? deleteState : saveState;

  const formTitle = selectedBulletin ? "주보 수정" : "새 주보 작성";
  const submitLabel = selectedBulletin ? "주보 수정하기" : "주보 게시하기";

  async function handleSave(formData: FormData) {
    startSaveTransition(async () => {
      setDeleteState(initialState);
      const result = await saveAction(saveState, formData);
      setSaveState(result);

      if (result.status === "success") {
        setSelectedBulletin(null);
        router.refresh();
      }
    });
  }

  function handleEdit(bulletin: EditableBulletin) {
    setSaveState(initialState);
    setDeleteState(initialState);
    setSelectedBulletin(bulletin);
    requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function openDeleteDialog(bulletin: EditableBulletin) {
    setDeleteState(initialState);
    setDeleteTarget(bulletin);
    setDeletePassword("");
  }

  function closeDeleteDialog() {
    if (isDeletePending) return;
    setDeleteTarget(null);
    setDeletePassword("");
  }

  function handleDelete() {
    if (!deleteTarget || !deletePassword.trim()) return;

    const formData = new FormData();
    formData.set("bulletinId", deleteTarget.id);
    formData.set("slug", deleteTarget.slug);
    formData.set("adminPassword", deletePassword.trim());
    setPendingDeleteId(deleteTarget.id);

    startDeleteTransition(async () => {
      setSaveState(initialState);
      const result = await removeAction(deleteState, formData);
      setDeleteState(result);
      setPendingDeleteId(null);

      if (result.status === "success") {
        setSelectedBulletin((current) =>
          current && current.id === deleteTarget.id ? null : current,
        );
        setDeleteTarget(null);
        setDeletePassword("");
        router.refresh();
      }
    });
  }

  function closeToast() {
    setSaveState(initialState);
    setDeleteState(initialState);
  }

  return (
    <div className="space-y-8">
      <form
        ref={formRef}
        action={handleSave}
        className="scroll-mt-6 space-y-6 rounded-[2rem] border border-black/8 bg-[var(--surface-strong)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)] backdrop-blur"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-[var(--page-deep)]">
            {formTitle}
          </h2>
          {selectedBulletin ? (
            <button
              type="button"
              onClick={() => setSelectedBulletin(null)}
              className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--page-deep)] transition hover:border-[var(--page-accent-strong)]"
            >
              새 주보 작성으로 돌아가기
            </button>
          ) : null}
        </div>

        <input type="hidden" name="bulletinId" value={selectedBulletin?.id ?? ""} />
        <input
          type="hidden"
          name="previousSlug"
          value={selectedBulletin?.slug ?? ""}
        />

        <div className="grid gap-5 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--page-deep)]">
              주일 날짜
            </span>
            <input
              type="date"
              name="serviceDate"
              required
              defaultValue={selectedBulletin?.service_date ?? ""}
              key={`serviceDate-${selectedBulletin?.id ?? "new"}`}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--page-accent-strong)]"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-[var(--page-deep)]">
              말씀 본문
            </span>
            <input
              type="text"
              name="scriptureReference"
              required
              placeholder="예: Romans 8:1-11"
              defaultValue={selectedBulletin?.scripture_reference ?? ""}
              key={`scripture-${selectedBulletin?.id ?? "new"}`}
              className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--page-accent-strong)]"
            />
          </label>
        </div>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--page-deep)]">
            말씀제목
          </span>
          <input
            type="text"
            name="messageTitle"
            required
            placeholder="예: 성령 안에서 누리는 자유"
            defaultValue={selectedBulletin?.message_title ?? ""}
            key={`title-${selectedBulletin?.id ?? "new"}`}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--page-accent-strong)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--page-deep)]">
            컬럼
          </span>
          <textarea
            name="columnContent"
            required
            rows={10}
            placeholder="길게 들어가는 컬럼 내용을 적어주세요."
            defaultValue={selectedBulletin?.column_content ?? ""}
            key={`column-${selectedBulletin?.id ?? "new"}`}
            className="w-full rounded-[1.5rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--page-accent-strong)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--page-deep)]">
            한 주 안내 사항
          </span>
          <textarea
            name="weeklyNotice"
            rows={4}
            placeholder="선택 입력. 공지나 특별 안내가 있으면 적어주세요."
            defaultValue={selectedBulletin?.weekly_notice ?? ""}
            key={`notice-${selectedBulletin?.id ?? "new"}`}
            className="w-full rounded-[1.5rem] border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--page-accent-strong)]"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-semibold text-[var(--page-deep)]">
            관리자 비밀번호
          </span>
          <input
            type="password"
            name="adminPassword"
            required
            key={`password-${selectedBulletin?.id ?? "new"}`}
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[var(--page-accent-strong)]"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SubmitButton label={submitLabel} pending={isSavePending} />
        </div>
      </form>

      <section className="rounded-[2rem] border border-black/8 bg-[var(--surface-strong)] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.06)] backdrop-blur">
        <h2 className="text-2xl font-semibold text-[var(--page-deep)]">
          최근 게시 주보
        </h2>
        {bulletins.length === 0 ? (
          <p className="mt-4 text-sm leading-7 text-[var(--page-muted)]">
            아직 게시된 주보가 없습니다.
          </p>
        ) : (
          <ul className="mt-5 grid gap-3">
            {bulletins.map((bulletin) => (
              <li
                key={bulletin.id}
                className="rounded-[1.25rem] border border-black/10 bg-white p-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--page-deep)]">
                      {bulletin.service_date}
                    </p>
                    <p className="text-sm text-[var(--page-muted)]">
                      {bulletin.scripture_reference} | {bulletin.message_title}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(bulletin)}
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--page-deep)] transition hover:border-[var(--page-accent-strong)]"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => openDeleteDialog(bulletin)}
                      disabled={isDeletePending && pendingDeleteId === bulletin.id}
                      className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 disabled:opacity-60"
                    >
                      {isDeletePending && pendingDeleteId === bulletin.id
                        ? "삭제 중..."
                        : "삭제"}
                    </button>
                    <a
                      href={`/bulletins/${bulletin.slug}`}
                      className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-semibold text-[var(--page-deep)] transition hover:border-[var(--page-accent-strong)]"
                    >
                      공개 페이지 보기
                    </a>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="주보 삭제"
        description={
          deleteTarget
            ? `${deleteTarget.service_date} 주보를 삭제합니다. 삭제한 주보는 복구할 수 없습니다.`
            : "선택한 주보를 삭제합니다."
        }
        confirmLabel="주보 삭제"
        pendingLabel="삭제 중..."
        pending={isDeletePending}
        confirmDisabled={!deletePassword.trim()}
        danger
        onConfirm={handleDelete}
        onClose={closeDeleteDialog}
      >
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-[var(--page-deep)]">
            관리자 비밀번호
          </span>
          <input
            type="password"
            value={deletePassword}
            onChange={(event) => setDeletePassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && deletePassword.trim()) {
                event.preventDefault();
                handleDelete();
              }
            }}
            autoFocus
            autoComplete="current-password"
            placeholder="비밀번호를 입력해주세요"
            className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-rose-400"
          />
        </label>
      </ConfirmDialog>

      {activeMessage.status !== "idle" ? (
        <ResultToast
          status={activeMessage.status}
          message={activeMessage.message}
          linkHref={
            activeMessage.slug ? `/bulletins/${activeMessage.slug}` : undefined
          }
          linkLabel="주보 보기"
          onClose={closeToast}
        />
      ) : null}
    </div>
  );
}
