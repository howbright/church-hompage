"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabasePublicClient } from "@/lib/supabase";

type ClaimStatus = "검토 중" | "보완 요청" | "정산 완료";

type Claim = {
  id: string;
  claimant: string;
  date: string;
  title: string;
  amount: string;
  status: ClaimStatus;
  detail: string;
  receipts: number;
  userId?: string;
};

const MAX_RECEIPT_BYTES = 10 * 1024 * 1024;
const COMPRESS_FROM_BYTES = 5 * 1024 * 1024;

async function prepareReceiptFile(file: File) {
  if (!file.type.startsWith("image/") || file.size <= COMPRESS_FROM_BYTES) {
    if (file.size > MAX_RECEIPT_BYTES) throw new Error("파일 크기가 10MB를 초과합니다.");
    return file;
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
  bitmap.close();
  if (!blob || blob.size > MAX_RECEIPT_BYTES) throw new Error("압축 후에도 파일 크기가 10MB를 초과합니다.");
  return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
}

function mapDatabaseClaims(rows: Array<{ id: string; claim_number: string; category: string; amount: number; used_at: string | null; created_at?: string; description: string; user_id?: string; claimant?: string; claimant_name?: string; status: "under_review" | "needs_revision" | "paid" }>, receiptCounts = new Map<string, number>()): Claim[] {
  const statusMap = { under_review: "검토 중", needs_revision: "보완 요청", paid: "정산 완료" } as const;
  return rows.map((row) => ({ id: row.claim_number, claimant: row.claimant_name ? `대리 · ${row.claimant_name}` : (row.claimant ?? "내 청구"), date: row.used_at ?? row.created_at?.slice(0, 10) ?? "", title: row.category, amount: `${Number(row.amount).toLocaleString("ko-KR")}원`, status: statusMap[row.status], detail: row.description, receipts: receiptCounts.get(row.id) ?? 0, userId: row.user_id }));
}

const initialClaims: Claim[] = [
  {
    id: "CL-2026-001",
    claimant: "김민수",
    date: "2026. 11. 16.",
    title: "주일학교 간식비",
    amount: "50,000원",
    status: "검토 중",
    detail: "주일학교 학생 간식 구입",
    receipts: 3,
  },
  {
    id: "CL-2026-002",
    claimant: "김민수",
    date: "2026. 11. 10.",
    title: "교통비",
    amount: "30,000원",
    status: "정산 완료",
    detail: "심방 방문 교통비",
    receipts: 1,
  },
  {
    id: "CL-2026-003",
    claimant: "이은지",
    date: "2026. 11. 12.",
    title: "교재 구입비",
    amount: "42,000원",
    status: "검토 중",
    detail: "성경공부 교재 구입",
    receipts: 2,
  },
  {
    id: "CL-2026-004",
    claimant: "박준혁",
    date: "2026. 11. 08.",
    title: "주차비",
    amount: "18,000원",
    status: "보완 요청",
    detail: "심방 방문 주차비",
    receipts: 1,
  },
  {
    id: "CL-2026-005",
    claimant: "최서연",
    date: "2026. 11. 03.",
    title: "행사 준비물",
    amount: "75,000원",
    status: "정산 완료",
    detail: "교회 행사 준비물 구입",
    receipts: 4,
  },
];

const statusStyle: Record<ClaimStatus, string> = {
  "검토 중": "bg-[#ffeb00] text-[#332d00]",
  "보완 요청": "bg-[#ff6b6b] text-[#5c0808]",
  "정산 완료": "bg-[#39e75f] text-[#063d18]",
};

export function ClaimsPrototype() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);
  const [claims, setClaims] = useState(initialClaims);
  const [editClaimId, setEditClaimId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [notice, setNotice] = useState("");
  const [receiptFiles, setReceiptFiles] = useState<File[]>([]);
  const editClaim = claims.find((claim) => claim.id === editClaimId);
  const [editExistingReceiptUrls, setEditExistingReceiptUrls] = useState<Array<{ id: string; name: string; path: string; url: string }>>([]);
  useEffect(() => {
    if (!editClaimId) return;
    async function loadEditReceipts() {
      const supabase = getSupabasePublicClient();
      const { data: claim } = await supabase.schema("church").from("claims").select("id").eq("claim_number", editClaimId).maybeSingle();
      if (!claim) return;
      const { data: receipts } = await supabase.schema("church").from("claim_receipts").select("id, original_file_name, storage_path").eq("claim_id", claim.id);
      const urls = await Promise.all((receipts ?? []).map(async (receipt) => {
        const { data } = await supabase.storage.from("claim-receipts").createSignedUrl(receipt.storage_path, 300);
        return data?.signedUrl ? { id: receipt.id, name: receipt.original_file_name, path: receipt.storage_path, url: data.signedUrl } : null;
      }));
      setEditExistingReceiptUrls(urls.filter((item): item is { id: string; name: string; path: string; url: string } => Boolean(item)));
    }
    void loadEditReceipts();
  }, [editClaimId]);
  const [editReceiptFiles, setEditReceiptFiles] = useState<File[]>([]);
  const [memberReceiptClaimId, setMemberReceiptClaimId] = useState<string | null>(null);
  const [memberReceiptUrls, setMemberReceiptUrls] = useState<Array<{ name: string; url: string }>>([]);
  const [receiptRotation, setReceiptRotation] = useState(0);
  const [zoomedReceipt, setZoomedReceipt] = useState<{ name: string; url: string } | null>(null);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountInfo, setAccountInfo] = useState({ fullName: "", accountHolderName: "", bankName: "", accountNumber: "" });

  useEffect(() => {
    document.querySelector('textarea[placeholder="사용 목적과 내용을 적어 주세요."]')?.removeAttribute("required");
  }, [showForm]);

  async function openMemberReceipts(claimNumber: string) {
    setMemberReceiptClaimId(claimNumber);
    setReceiptRotation(0);
    const supabase = getSupabasePublicClient();
    const { data: claim } = await supabase.schema("church").from("claims").select("id").eq("claim_number", claimNumber).maybeSingle();
    if (!claim) return;
    const { data: receipts } = await supabase.schema("church").from("claim_receipts").select("original_file_name, storage_path").eq("claim_id", claim.id);
    const signed = await Promise.all((receipts ?? []).map(async (receipt) => {
      const { data } = await supabase.storage.from("claim-receipts").createSignedUrl(receipt.storage_path, 300);
      return data?.signedUrl ? { name: receipt.original_file_name, url: data.signedUrl } : null;
    }));
    setMemberReceiptUrls(signed.filter((item): item is { name: string; url: string } => Boolean(item)));
  }

  useEffect(() => {
    async function guardClaimsPage() {
      const supabase = getSupabasePublicClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/claims/login"); return; }
      const { data: profile } = await supabase.schema("church").from("profiles").select("id").eq("id", user.id).maybeSingle();
      if (!profile) { await supabase.auth.signOut(); router.replace("/claims/login"); return; }
      const { data: rows, error: claimsError } = await supabase.schema("church").from("claims").select("id, claim_number, category, amount, used_at, created_at, description, user_id, status").order("created_at", { ascending: false });
      if (claimsError) {
        console.error("[claims] claims lookup failed", claimsError);
        setClaims([]);
      } else if (rows) {
        const { data: receipts } = await supabase.schema("church").from("claim_receipts").select("claim_id");
        const counts = new Map<string, number>();
        for (const receipt of receipts ?? []) counts.set(receipt.claim_id, (counts.get(receipt.claim_id) ?? 0) + 1);
        setClaims(mapDatabaseClaims(rows, counts));
      }
      setAuthChecking(false);
    }
    void guardClaimsPage();
  }, [router]);

  async function openAccountModal() {
    setAccountModalOpen(true);
    setAccountLoading(true);
    const supabase = getSupabasePublicClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice("로그인 후 계좌 정보를 확인할 수 있습니다."); setAccountLoading(false); return; }
    const [{ data: profile }, { data: account }] = await Promise.all([
      supabase.schema("church").from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.schema("church").from("payout_accounts").select("account_holder_name, bank_name, account_number").eq("user_id", user.id).eq("is_primary", true).maybeSingle(),
    ]);
    setAccountInfo({ fullName: profile?.full_name ?? "", accountHolderName: account?.account_holder_name ?? "", bankName: account?.bank_name ?? "", accountNumber: account?.account_number ?? "" });
    setAccountLoading(false);
  }

  async function saveAccountInfo() {
    const supabase = getSupabasePublicClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setAccountSaving(true);
    const { error: profileError } = await supabase.schema("church").from("profiles").update({ full_name: accountInfo.fullName }).eq("id", user.id);
    const { data: existing } = await supabase.schema("church").from("payout_accounts").select("id").eq("user_id", user.id).eq("is_primary", true).maybeSingle();
    const payload = { user_id: user.id, account_holder_name: accountInfo.accountHolderName, bank_name: accountInfo.bankName, account_number: accountInfo.accountNumber, is_primary: true };
    const accountResult = existing ? await supabase.schema("church").from("payout_accounts").update(payload).eq("id", existing.id) : await supabase.schema("church").from("payout_accounts").insert(payload);
    setAccountSaving(false);
    if (profileError || accountResult.error) { setNotice("계좌 정보를 저장하지 못했습니다."); return; }
    setAccountModalOpen(false);
    setNotice("내 계좌 정보가 저장되었습니다.");
  }

  async function submitClaim(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const supabase = getSupabasePublicClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setNotice("로그인이 필요합니다."); return; }
    const category = (form.querySelector('input:not([type="file"]):not([type="number"]):not([type="date"])') as HTMLInputElement)?.value.trim() ?? "";
    const amount = Number((form.querySelector('input[type="number"]') as HTMLInputElement)?.value ?? 0);
    const usedAt = (form.querySelector('input[type="date"]') as HTMLInputElement)?.value || null;
    const description = (form.querySelector("textarea") as HTMLTextAreaElement)?.value.trim() ?? "";
    if (!category || !usedAt || !Number.isFinite(amount) || amount <= 0) {
      setNotice("청구 항목·사용일·실제 청구 금액을 입력해 주세요.");
      return;
    }
    console.debug("[claims] submit payload", { category, amount, usedAt, descriptionLength: description.length });
    const claimNumber = `CL-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const { data: created, error } = await supabase.schema("church").from("claims").insert({ claim_number: claimNumber, user_id: user.id, category, amount, used_at: usedAt, description, status: "under_review" }).select("id, claim_number, category, amount, used_at, description, status").single();
    if (error || !created) { console.error("[claims] claim insert failed", error); setNotice("청구서를 저장하지 못했습니다."); return; }
    for (const file of receiptFiles) {
      let uploadFile: File;
      try { uploadFile = await prepareReceiptFile(file); } catch (compressionError) { setNotice(compressionError instanceof Error ? compressionError.message : "파일을 처리하지 못했습니다."); return; }
      const extension = uploadFile.name.includes(".") ? `.${uploadFile.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
      const storagePath = `${user.id}/${created.claim_number}/${crypto.randomUUID()}${extension}`;
      const { error: uploadError } = await supabase.storage.from("claim-receipts").upload(storagePath, uploadFile, { upsert: false });
      if (uploadError) { console.error("[claims] receipt upload failed", uploadError); setNotice("청구서는 저장했지만 증빙파일 업로드에 실패했습니다."); return; }
      const { error: receiptError } = await supabase.schema("church").from("claim_receipts").insert({ claim_id: created.id, storage_path: storagePath, original_file_name: file.name, mime_type: uploadFile.type || "application/octet-stream", file_size: uploadFile.size });
      if (receiptError) { console.error("[claims] receipt record insert failed", receiptError); setNotice("증빙파일 정보 저장에 실패했습니다."); return; }
    }
    setClaims((current) => [{ ...mapDatabaseClaims([created])[0], receipts: receiptFiles.length }, ...current]);
    setShowForm(false);
    setReceiptFiles([]);
    setNotice("청구서가 저장되었습니다.");
  }

  async function saveEditClaim() {
    if (!editClaim) return;
    const title = (document.getElementById("member-edit-title") as HTMLInputElement).value;
    const amount = Number((document.getElementById("member-edit-amount") as HTMLInputElement).value);
    const date = (document.getElementById("member-edit-date") as HTMLInputElement)?.value ?? "";
    const detail = (document.getElementById("member-edit-detail") as HTMLTextAreaElement).value;
    const supabase = getSupabasePublicClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: claim } = await supabase.schema("church").from("claims").select("id, claim_number").eq("claim_number", editClaim.id).maybeSingle();
    if (!claim) return;
    await supabase.schema("church").from("claims").update({ category: title, amount, used_at: date || null, description: detail }).eq("id", claim.id);
    let uploadedCount = 0;
    for (const file of editReceiptFiles) {
      const uploadFile = await prepareReceiptFile(file);
      const extension = uploadFile.name.includes(".") ? `.${uploadFile.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
      const storagePath = `${user.id}/${claim.claim_number}/${crypto.randomUUID()}${extension}`;
      const { error: uploadError } = await supabase.storage.from("claim-receipts").upload(storagePath, uploadFile);
      if (!uploadError) {
        const { error: receiptError } = await supabase.schema("church").from("claim_receipts").insert({ claim_id: claim.id, storage_path: storagePath, original_file_name: file.name, mime_type: uploadFile.type, file_size: uploadFile.size });
        if (!receiptError) uploadedCount += 1;
      }
    }
    setClaims((current) => current.map((item) => item.id === editClaim.id ? { ...item, date, title, amount: `${amount.toLocaleString("ko-KR")}원`, detail, receipts: item.receipts + uploadedCount } : item));
    setEditClaimId(null); setEditReceiptFiles([]); setNotice("청구 내용이 수정되었습니다.");
  }

  if (authChecking) return <main className="flex min-h-screen items-center justify-center bg-[#fbfcfb] text-sm text-[#566970]">로그인 상태를 확인하는 중...</main>;

  return (
    <>
    {memberReceiptUrls.length > 0 && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#092b3a]/45 p-5"><div className="w-full max-w-2xl rounded-lg border border-[#b9c7c3] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0b6b52]">My receipts</p><h2 className="mt-2 text-xl font-bold text-[#101f25]">증빙서류 확인</h2></div><button type="button" onClick={() => { setMemberReceiptUrls([]); setMemberReceiptClaimId(null); }} className="text-2xl text-[#566970]" aria-label="증빙서류 닫기">×</button></div><div className="mt-5 grid grid-cols-2 gap-3">{memberReceiptUrls.map((receipt) => <div key={receipt.url} className="overflow-hidden rounded-md border border-[#9ec9e0] bg-[#f5fbff] hover:bg-[#eaf7ff]"><button type="button" onClick={() => setZoomedReceipt(receipt)} className="block w-full"><img src={receipt.url} alt={receipt.name} className="aspect-[4/3] w-full object-cover" style={{ transform: `rotate(${receiptRotation}deg)` }} /></button><div className="flex items-center justify-between gap-2 px-2 py-2"><span className="truncate text-sm font-bold text-[#0b6b52]">{receipt.name}</span><button type="button" onClick={() => setReceiptRotation((rotation) => (rotation + 90) % 360)} className="shrink-0 rounded border border-[#9ec9e0] px-2 py-1 text-xs font-bold text-[#0b6b52]">↻ 90°</button></div></div>)}</div><p className="mt-4 text-xs text-[#566970]">이미지를 클릭하면 크게 확대됩니다.</p></div></div>}
    {zoomedReceipt && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4"><div className="relative flex max-h-full max-w-5xl flex-col items-center"><button type="button" onClick={() => setZoomedReceipt(null)} className="absolute right-0 top-0 z-10 rounded-full bg-white/90 px-3 py-1 text-2xl text-[#263f52]" aria-label="확대 이미지 닫기">×</button><img src={zoomedReceipt.url} alt={zoomedReceipt.name} className="max-h-[78vh] max-w-full object-contain transition-transform" style={{ transform: `rotate(${receiptRotation}deg)` }} /><div className="mt-4 flex items-center gap-3"><span className="max-w-[60vw] truncate text-sm text-white">{zoomedReceipt.name}</span><button type="button" onClick={() => setReceiptRotation((rotation) => (rotation + 90) % 360)} className="rounded-md bg-white px-3 py-2 text-sm font-bold text-[#0b6b52]">↻ 90° 회전</button></div></div></div>}
    <main className="min-h-screen bg-[#fbfcfb] px-5 py-8 text-[#252525] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-[#b9c7c3] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#1678b8]">Member service</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#101f25] sm:text-4xl">교인 청구 서비스</h1>
            <p className="mt-3 text-sm leading-7 text-[#40525b]">교회 사역과 관련된 비용을 제출하고 정산 상태를 확인합니다.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/" className="rounded-full border border-[#c9dce8] bg-white px-4 py-2 text-sm font-bold text-[#31546c]">홈으로</Link>
            <button type="button" onClick={() => setShowForm(true)} className="rounded-full bg-[#0b6b52] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#075740]">+ 청구하기</button>
          </div>
        </header>

        {notice && <p className="mt-5 rounded-md border border-[#bfe4cf] bg-[#effaf3] px-4 py-3 text-sm text-[#28734e]">{notice}</p>}

        <section className="mt-8 rounded-lg border border-[#b9c7c3] bg-white p-5 shadow-[0_16px_45px_rgba(8,39,91,0.06)] sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1678b8]">My claims</p><h2 className="mt-2 text-2xl font-bold text-[#101f25]">내 청구 목록</h2></div></div>
          <div className="mt-5 overflow-x-auto rounded-md border border-[#b9c7c3]">
            <table className="w-full min-w-[700px] border-collapse text-left text-sm">
              <thead className="bg-[#f3f7f9] text-xs font-bold text-[#40525b]">
                <tr>
                  <th className="border-b border-[#b9c7c3] px-4 py-3">제출일</th>
                  <th className="border-b border-[#b9c7c3] px-4 py-3">청구번호</th>
                  <th className="border-b border-[#b9c7c3] px-4 py-3">항목</th>
                  <th className="border-b border-[#b9c7c3] px-4 py-3">설명</th>
                  <th className="border-b border-[#b9c7c3] px-4 py-3 text-right">금액</th>
                  <th className="border-b border-[#b9c7c3] px-4 py-3">증빙</th>
                  <th className="border-b border-[#b9c7c3] px-4 py-3">상태</th><th className="border-b border-[#b9c7c3] px-4 py-3">관리</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim, index) => (
                  <tr key={claim.id} className={`transition hover:bg-[#f7fbfd] ${index < claims.length - 1 ? "border-b border-[#cbd6d2]" : ""}`}>
                    <td className="whitespace-nowrap px-4 py-3 text-[#40525b]">{claim.date}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[#566970]">{claim.id}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-[#263f52]">{claim.title}</td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-[#6c7f8e]" title={claim.detail}>{claim.detail}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-bold text-[#101f25]">{claim.amount}</td>
                    <td className="whitespace-nowrap px-4 py-3"><button type="button" onClick={() => void openMemberReceipts(claim.id)} className="inline-flex items-center gap-1.5 rounded-md border border-[#b9d2df] bg-white px-2 py-1 text-xs font-bold text-[#0b6b52] hover:bg-[#effaf3]" title="증빙서류 보기"><span aria-hidden="true">▣</span>{claim.receipts}장</button></td>
                    <td className="whitespace-nowrap px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle[claim.status]}`}>{claim.status}</span></td><td className="whitespace-nowrap px-4 py-3"><div className="flex items-center gap-1">{claim.status !== "정산 완료" ? <><button type="button" onClick={() => setEditClaimId(claim.id)} className="rounded-md border border-[#b9d2df] px-2 py-1 text-xs font-bold text-[#0b6b52]">수정</button><button type="button" onClick={() => { if (window.confirm("이 청구 항목을 삭제할까요?")) setClaims((current) => current.filter((item) => item.id !== claim.id)); }} className="rounded-md border border-[#f0b5b5] px-2 py-1 text-xs font-bold text-[#b34b4b]">삭제</button></> : <span className="text-xs text-[#566970]">잠금</span>}</div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-2"><div className="rounded-lg border border-[#b9c7c3] bg-white p-5"><h2 className="font-bold text-[#101f25]">개인정보 및 계좌</h2><p className="mt-2 text-sm leading-6 text-[#6c7f8e]">정산을 위해 등록한 이름과 계좌 정보를 관리합니다.</p><button type="button" onClick={openAccountModal} className="mt-4 text-sm font-bold text-[#0b6b52]">정보 확인하기 →</button></div><div className="rounded-lg border border-[#b9c7c3] bg-white p-5"><h2 className="font-bold text-[#101f25]">처리 안내</h2><p className="mt-2 text-sm leading-6 text-[#6c7f8e]">증빙자료를 확인한 뒤 총무가 검토 및 정산을 진행합니다. 보완이 필요하면 상태가 변경됩니다.</p></div></section>
      </div>

      {showForm && <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#08275b]/30 p-0 sm:items-center sm:p-6"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-lg sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1678b8]">New claim</p><h2 className="mt-2 text-2xl font-bold text-[#101f25]">청구하기</h2></div><button type="button" onClick={() => setShowForm(false)} className="text-2xl text-[#566970]" aria-label="닫기">×</button></div><form onSubmit={submitClaim} className="mt-6 space-y-4"><label className="block text-sm font-bold text-[#334e60]">청구 항목<input required className="mt-2 w-full rounded-md border border-[#d7e4eb] px-4 py-3 font-normal outline-none focus:border-[#3f9fe8]" placeholder="예: 주일학교 간식비" /></label><label className="block text-sm font-bold text-[#334e60]">실제 청구 금액<input required type="number" min="0" className="mt-2 w-full rounded-md border border-[#d7e4eb] px-4 py-3 font-normal outline-none focus:border-[#3f9fe8]" placeholder="금액을 입력해 주세요" /></label><label className="block text-sm font-bold text-[#334e60]">사용일<input required type="date" className="mt-2 w-full rounded-md border border-[#d7e4eb] px-4 py-3 font-normal outline-none focus:border-[#3f9fe8]" /></label><label className="block text-sm font-bold text-[#334e60]">증빙서류 이미지<input multiple accept="image/*,.pdf" type="file" onChange={(event) => { const selected = Array.from(event.target.files ?? []); setReceiptFiles((current) => [...current, ...selected]); event.currentTarget.value = ""; }} className="mt-2 block w-full rounded-md border border-dashed border-[#9ec9e4] bg-[#f5fbff] px-4 py-4 text-sm font-normal text-[#40525b]" /><span className="mt-2 block text-xs font-normal text-[#566970]">영수증 등 여러 파일을 추가하고, 잘못 선택한 파일은 목록에서 삭제할 수 있습니다.</span>{receiptFiles.length > 0 && <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{receiptFiles.map((file, index) => <li key={`${file.name}-${index}`} className="relative overflow-hidden rounded-md border border-[#cbd6d2] bg-white px-2 py-2 text-xs"><button type="button" onClick={() => setReceiptFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#101f25]/75 text-sm font-bold text-white" aria-label={`${file.name} 삭제`}>×</button>{file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt={file.name} className="aspect-square w-full rounded object-cover" /> : <div className="flex aspect-square items-center justify-center text-xs font-bold text-[#0b6b52]">PDF</div>}<span className="mt-1 block truncate text-[10px] text-[#40525b]">{file.name}</span></li>)}</ul>}</label><label className="block text-sm font-bold text-[#334e60]">설명<textarea rows={4} className="mt-2 w-full rounded-md border border-[#d7e4eb] px-4 py-3 font-normal outline-none focus:border-[#3f9fe8]" placeholder="사용 목적과 내용을 적어 주세요." /></label><div className="flex gap-3 pt-2"><button type="button" onClick={() => setShowForm(false)} className="flex-1 rounded-md border border-[#d7e4eb] px-4 py-3 text-sm font-bold text-[#526b7c]">취소</button><button type="submit" className="flex-1 rounded-md bg-[#0b6b52] px-4 py-3 text-sm font-bold text-white">제출하기</button></div></form></div></div>}
      {accountModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#092b3a]/35 p-5"><div className="max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-xl overflow-y-auto overscroll-contain rounded-lg border border-[#b9c7c3] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0b6b52]">Personal & payout</p><h2 className="mt-2 text-xl font-bold text-[#101f25]">개인정보 및 계좌</h2></div><button type="button" onClick={() => setAccountModalOpen(false)} className="text-2xl text-[#566970]" aria-label="계좌 정보 닫기">×</button></div>{accountLoading ? <p className="py-10 text-center text-sm text-[#566970]">실제 계좌 정보를 불러오는 중...</p> : <><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-[#263f52]">실명<input value={accountInfo.fullName} onChange={(event) => setAccountInfo({ ...accountInfo, fullName: event.target.value })} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label><label className="text-sm font-bold text-[#263f52]">예금주<input value={accountInfo.accountHolderName} onChange={(event) => setAccountInfo({ ...accountInfo, accountHolderName: event.target.value })} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label><label className="text-sm font-bold text-[#263f52]">은행명<input value={accountInfo.bankName} onChange={(event) => setAccountInfo({ ...accountInfo, bankName: event.target.value })} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label><label className="text-sm font-bold text-[#263f52]">계좌번호<input value={accountInfo.accountNumber} onChange={(event) => setAccountInfo({ ...accountInfo, accountNumber: event.target.value })} inputMode="numeric" className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-mono font-normal" /></label></div><p className="mt-4 text-xs text-[#566970]">계좌번호는 정산 지급을 위해 사용되며, 저장 시 안전하게 관리됩니다.</p><button type="button" disabled={accountSaving} onClick={saveAccountInfo} className="mt-5 w-full rounded-md bg-[#0b6b52] px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{accountSaving ? "저장 중..." : "수정 저장"}</button></>}</div></div>}
      {memberReceiptClaimId && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#092b3a]/35 p-5"><div className="w-full max-w-lg rounded-lg border border-[#b9c7c3] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0b6b52]">My receipts</p><h2 className="mt-2 text-xl font-bold text-[#101f25]">증빙서류 확인</h2></div><button type="button" onClick={() => setMemberReceiptClaimId(null)} className="text-2xl text-[#566970]" aria-label="증빙서류 닫기">×</button></div><p className="mt-3 text-sm text-[#40525b]">{claims.find((claim) => claim.id === memberReceiptClaimId)?.title} · 영수증 {claims.find((claim) => claim.id === memberReceiptClaimId)?.receipts}장</p><div className="mt-5 grid grid-cols-2 gap-3">{Array.from({ length: claims.find((claim) => claim.id === memberReceiptClaimId)?.receipts ?? 0 }).map((_, index) => <button type="button" key={index} className="flex aspect-[4/3] items-center justify-center border border-dashed border-[#9ec9e0] bg-[#f5fbff] text-sm font-bold text-[#0b6b52] hover:bg-[#eaf7ff]">영수증 {index + 1}<span className="ml-1 text-xs font-normal">확대</span></button>)}</div><p className="mt-5 text-xs text-[#566970]">실제 Storage 연결 후 업로드된 영수증 이미지를 이 화면에서 바로 확인할 수 있습니다.</p></div></div>}
      {editClaim && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-[#092b3a]/35 p-4 sm:items-center sm:p-5"><div className="max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-xl overflow-y-auto overscroll-contain rounded-lg border border-[#b9c7c3] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0b6b52]">Edit my claim</p><h2 className="mt-2 text-xl font-bold text-[#101f25]">청구 항목 수정</h2></div><button type="button" onClick={() => setEditClaimId(null)} className="text-2xl text-[#566970]" aria-label="수정 닫기">×</button></div><p className="mt-4 rounded-md bg-[#f1f5f3] px-3 py-2 text-sm text-[#40525b]">청구번호 {editClaim.id} · 정산 완료 전까지만 수정할 수 있습니다.</p><label className="mt-4 block text-sm font-bold text-[#263f52]">제출일<input id="member-edit-date" type="date" defaultValue={editClaim.date} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label><label className="mt-4 block text-sm font-bold text-[#263f52]">청구 항목<input id="member-edit-title" defaultValue={editClaim.title} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label><label className="mt-4 block text-sm font-bold text-[#263f52]">실제 청구 금액<input id="member-edit-amount" defaultValue={editClaim.amount.replace(/[^0-9]/g, "")} type="number" className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label><label className="mt-4 block text-sm font-bold text-[#263f52]">설명<textarea id="member-edit-detail" defaultValue={editClaim.detail} rows={4} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label>{editExistingReceiptUrls.length > 0 && <div className="mt-4"><p className="text-sm font-bold text-[#263f52]">기존 증빙서류</p><div className="mt-2 grid grid-cols-3 gap-2">{editExistingReceiptUrls.map((receipt) => <div key={receipt.id} className="relative overflow-hidden rounded-md border border-[#cbd6d2] bg-[#f5fbff]"><button type="button" onClick={() => setZoomedReceipt(receipt)} className="block w-full text-left"><img src={receipt.url} alt={receipt.name} className="aspect-square w-full object-cover" /><span className="block truncate px-1 py-1 text-[10px] text-[#40525b]">{receipt.name}</span></button><button type="button" aria-label="증빙 삭제" onClick={async () => { const supabase = getSupabasePublicClient(); await supabase.storage.from("claim-receipts").remove([receipt.path]); await supabase.schema("church").from("claim_receipts").delete().eq("id", receipt.id); setEditExistingReceiptUrls((current) => current.filter((item) => item.id !== receipt.id)); setClaims((current) => current.map((item) => item.id === editClaim.id ? { ...item, receipts: Math.max(0, item.receipts - 1) } : item)); }} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#101f25]/80 text-sm font-bold text-white">×</button></div>)}</div></div>}<label className="mt-4 block text-sm font-bold text-[#263f52]">증빙서류 추가<input multiple accept="image/*,.pdf" type="file" onChange={(event) => { const selected = Array.from(event.target.files ?? []); setEditReceiptFiles((current) => [...current, ...selected]); event.currentTarget.value = ""; }} className="mt-2 block w-full rounded-md border border-dashed border-[#9ec9e4] bg-[#f5fbff] px-3 py-3 text-sm font-normal text-[#40525b]" /><span className="mt-1 block text-xs font-normal text-[#566970]">기존 증빙은 유지되고, 새 파일을 추가하거나 선택 목록에서 삭제할 수 있습니다.</span>{editReceiptFiles.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">{editReceiptFiles.map((file, index) => <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-md border border-[#cbd6d2] bg-white"><button type="button" onClick={() => setEditReceiptFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))} className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-[#101f25]/80 text-sm font-bold text-white" aria-label={`${file.name} 삭제`}>×</button>{file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt={file.name} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center text-xs font-bold text-[#0b6b52]">PDF</div>}<span className="block truncate px-1 py-1 text-[10px] text-[#40525b]">{file.name}</span></div>)}</div>}</label><button type="button" onClick={() => { void saveEditClaim(); }} className="mt-5 w-full rounded-md bg-[#0b6b52] px-4 py-3 text-sm font-bold text-white">수정 저장</button></div></div>}
    </main>
    </>
  );
}

export function ClaimsAdminPrototype() {
  const router = useRouter();
  const [adminAuthChecking, setAdminAuthChecking] = useState(true);
  const [adminClaims, setAdminClaims] = useState(initialClaims);
  const [statuses, setStatuses] = useState<Record<string, ClaimStatus>>(() => Object.fromEntries(initialClaims.map((claim) => [claim.id, claim.status])) as Record<string, ClaimStatus>);
  const [accountVisible, setAccountVisible] = useState<string | null>(null);
  const [adminAccount, setAdminAccount] = useState<{bank:string; number:string} | null>(null);
  const [receiptClaimId, setReceiptClaimId] = useState<string | null>(null);
  const [adminReceiptUrls, setAdminReceiptUrls] = useState<Array<{ name: string; url: string }>>([]);
  const [adminZoomedReceipt, setAdminZoomedReceipt] = useState<{name:string;url:string} | null>(null);
  const [adminReceiptRotation, setAdminReceiptRotation] = useState(0);
  const [editClaimId, setEditClaimId] = useState<string | null>(null);
  const [adminEditReceiptFiles, setAdminEditReceiptFiles] = useState<File[]>([]);
  const [adminAmountChanged, setAdminAmountChanged] = useState(false);
  const [adminExistingReceiptUrls, setAdminExistingReceiptUrls] = useState<Array<{id:string;name:string;path:string;url:string}>>([]);
  const [memoClaimId, setMemoClaimId] = useState<string | null>(null);
  const [amountHistoryId, setAmountHistoryId] = useState<string | null>(null);
  const [amountHistoryRows, setAmountHistoryRows] = useState<Array<{created_at:string; previous_amount:number; new_amount:number; change_reason:string; changed_by:string; changed_by_name?:string}>>([]);
  const [notes, setNotes] = useState<Record<string, string>>({ "CL-2026-001": "", "CL-2026-002": "", "CL-2026-003": "", "CL-2026-004": "주차 영수증 보완 필요", "CL-2026-005": "" });
  const [nameFilter, setNameFilter] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
  });
  const [endDate, setEndDate] = useState(() => { const today = new Date(); return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`; });
  const [statusFilter, setStatusFilter] = useState<"전체" | ClaimStatus>("전체");
  const [statusNotice, setStatusNotice] = useState("");
  const [proxyModalOpen, setProxyModalOpen] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteError, setInviteError] = useState("");

  useEffect(() => {
    if (!editClaimId) return;
    async function loadAdminEditReceipts() {
      const supabase = getSupabasePublicClient();
      const { data: claim } = await supabase.schema("church").from("claims").select("id").eq("claim_number", editClaimId).maybeSingle();
      if (!claim) return;
      const { data } = await supabase.schema("church").from("claim_receipts").select("id, original_file_name, storage_path").eq("claim_id", claim.id);
      const urls = await Promise.all((data ?? []).map(async (r) => { const { data: signed } = await supabase.storage.from("claim-receipts").createSignedUrl(r.storage_path, 300); return signed?.signedUrl ? { id: r.id, name: r.original_file_name, path: r.storage_path, url: signed.signedUrl } : null; }));
      setAdminExistingReceiptUrls(urls.filter((v): v is {id:string;name:string;path:string;url:string} => Boolean(v)));
    }
    void loadAdminEditReceipts();
  }, [editClaimId]);

  useEffect(() => {
    async function guardAdminPage() {
      const supabase = getSupabasePublicClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/claims/login"); return; }
      const { data: profile } = await supabase.schema("church").from("profiles").select("role").eq("id", user.id).maybeSingle();
      if (!profile || (profile.role !== "accountant" && profile.role !== "admin")) { router.replace("/claims"); return; }
      const { data: rows, error: claimsError } = await supabase.schema("church").from("claims").select("id, claim_number, category, amount, used_at, created_at, description, accounting_memo, user_id, claimant_name, status").order("created_at", { ascending: false });
      if (claimsError) {
        console.error("[admin/claims] claims lookup failed", claimsError);
        setAdminClaims([]);
      } else if (rows) {
        const { data: receipts } = await supabase.schema("church").from("claim_receipts").select("claim_id");
        const counts = new Map<string, number>();
        for (const receipt of receipts ?? []) counts.set(receipt.claim_id, (counts.get(receipt.claim_id) ?? 0) + 1);
        const userIds = [...new Set(rows.map((row) => row.user_id).filter(Boolean))];
        const { data: profiles } = userIds.length ? await supabase.schema("church").from("profiles").select("id, full_name").in("id", userIds) : { data: [] };
        const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
        const mapped = mapDatabaseClaims(rows.map((row) => ({ ...row, claimant: row.user_id ? (names.get(row.user_id) ?? "이름 미등록") : "이름 미등록" })), counts);
        setAdminClaims(mapped);
        setNotes((current) => ({ ...current, ...Object.fromEntries(rows.map((row) => [row.claim_number, row.accounting_memo ?? ""])) }));
        setStatuses(Object.fromEntries(mapped.map((claim) => [claim.id, claim.status])) as Record<string, ClaimStatus>);
      }
      setAdminAuthChecking(false);
    }
    void guardAdminPage();
  }, [router]);

  async function openAmountHistory(claimNumber: string) {
    const supabase = getSupabasePublicClient();
    const { data: claim } = await supabase.schema("church").from("claims").select("id").eq("claim_number", claimNumber).maybeSingle();
    if (!claim) return;
    const { data } = await supabase.schema("church").from("claim_amount_history").select("created_at, previous_amount, new_amount, change_reason, changed_by").eq("claim_id", claim.id).order("created_at", { ascending: false });
    const ids = [...new Set((data ?? []).map((row) => row.changed_by))];
    const { data: profiles } = ids.length ? await supabase.schema("church").from("profiles").select("id, full_name").in("id", ids) : { data: [] };
    const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
    setAmountHistoryRows((data ?? []).map((row) => ({ ...row, changed_by_name: names.get(row.changed_by) ?? "이름 미등록" }))); setAmountHistoryId(claimNumber);
  }

  async function openAdminReceipts(claimNumber: string) {
    setReceiptClaimId(claimNumber);
    const supabase = getSupabasePublicClient();
    const { data: claim } = await supabase.schema("church").from("claims").select("id").eq("claim_number", claimNumber).maybeSingle();
    if (!claim) return;
    const { data: receipts } = await supabase.schema("church").from("claim_receipts").select("original_file_name, storage_path").eq("claim_id", claim.id);
    const urls = await Promise.all((receipts ?? []).map(async (receipt) => { const { data } = await supabase.storage.from("claim-receipts").createSignedUrl(receipt.storage_path, 300); return data?.signedUrl ? { name: receipt.original_file_name, url: data.signedUrl } : null; }));
    setAdminReceiptUrls(urls.filter((item): item is { name: string; url: string } => Boolean(item)));
  }

  async function saveAdminEditClaim() {
    if (!editClaimId) return;
    const supabase = getSupabasePublicClient();
    const { data: claim } = await supabase.schema("church").from("claims").select("id, claim_number, amount").eq("claim_number", editClaimId).maybeSingle();
    if (!claim) return;
    const title = (document.getElementById("admin-edit-title") as HTMLInputElement)?.value ?? "";
    const date = (document.getElementById("admin-edit-date") as HTMLInputElement)?.value ?? "";
    const amount = Number((document.getElementById("admin-edit-amount") as HTMLInputElement)?.value ?? 0);
    const detail = (document.getElementById("admin-edit-detail") as HTMLTextAreaElement)?.value ?? "";
    const memo = (document.getElementById("admin-edit-memo") as HTMLInputElement)?.value ?? "";
    const changeReason = (document.getElementById("admin-edit-reason") as HTMLInputElement)?.value.trim() ?? "";
    await supabase.schema("church").from("claims").update({ category: title, amount, used_at: date || null, description: detail, accounting_memo: memo }).eq("id", claim.id);
    if (Number(claim.amount) !== amount) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.schema("church").from("claim_amount_history").insert({ claim_id: claim.id, changed_by: user.id, previous_amount: Number(claim.amount), new_amount: amount, change_reason: changeReason || "관리자 수정" });
    }
    let uploaded = 0;
    for (const file of adminEditReceiptFiles) {
      const uploadFile = await prepareReceiptFile(file);
      const ext = uploadFile.name.includes(".") ? `.${uploadFile.name.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")}` : "";
      const path = `${(await supabase.auth.getUser()).data.user?.id ?? "admin"}/${claim.claim_number}/${crypto.randomUUID()}${ext}`;
      const { error: uploadError } = await supabase.storage.from("claim-receipts").upload(path, uploadFile);
      if (uploadError) continue;
      const { error } = await supabase.schema("church").from("claim_receipts").insert({ claim_id: claim.id, storage_path: path, original_file_name: file.name, mime_type: uploadFile.type, file_size: uploadFile.size });
      if (!error) uploaded += 1;
    }
    if (uploaded) setAdminClaims((current) => current.map((item) => item.id === editClaimId ? { ...item, receipts: item.receipts + uploaded } : item));
    setAdminClaims((current) => current.map((item) => item.id === editClaimId ? { ...item, date, title, amount: `${amount.toLocaleString("ko-KR")}원`, detail } : item));
    setNotes((current) => ({ ...current, [editClaimId]: memo }));
    setAdminEditReceiptFiles([]); setEditClaimId(null);
  }

  const filteredClaims = adminClaims.filter((item) => {
    const matchesName = !nameFilter || item.claimant.includes(nameFilter.trim());
    const itemDateMatch = item.date.match(/(\d{4})[-.]\s*(\d{1,2})[-.]\s*(\d{1,2})/);
    const itemDate = itemDateMatch ? `${itemDateMatch[1]}-${itemDateMatch[2].padStart(2, "0")}-${itemDateMatch[3].padStart(2, "0")}` : "";
    const matchesDate = (!startDate || itemDate >= startDate) && (!endDate || itemDate <= endDate);
    const matchesStatus = statusFilter === "전체" || statuses[item.id] === statusFilter;
    return matchesName && matchesDate && matchesStatus;
  });
  const totalClaimAmount = filteredClaims.reduce((sum, item) => sum + Number(item.amount.replace(/[^0-9]/g, "")), 0);
  const totalPaidAmount = filteredClaims.reduce((sum, item) => statuses[item.id] === "정산 완료" ? sum + Number(item.amount.replace(/[^0-9]/g, "")) : sum, 0);
  const formatAmount = (amount: number) => `${amount.toLocaleString("ko-KR")}원`;
  const editLocked = editClaimId ? statuses[editClaimId] === "정산 완료" : false;

  async function sendInvite() {
    const email = (document.getElementById("invite-email") as HTMLInputElement)?.value.trim();
    const { data: { session } } = await getSupabasePublicClient().auth.getSession();
    const response = await fetch("/api/claims/invites", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session?.access_token ?? ""}` }, body: JSON.stringify({ email }) });
    const result = await response.json();
    if (!response.ok) { setInviteError(result.error ?? "초대에 실패했습니다."); return; }
    setInviteError(""); setInviteModalOpen(false); setStatusNotice("초대 이메일을 보냈습니다."); window.setTimeout(() => setStatusNotice(""), 2200);
  }

  async function createProxyClaim() {
    const name = (document.getElementById("proxy-name") as HTMLInputElement)?.value.trim();
    const category = (document.getElementById("proxy-category") as HTMLInputElement)?.value.trim();
    const amount = Number((document.getElementById("proxy-amount") as HTMLInputElement)?.value ?? 0);
    const usedAt = (document.getElementById("proxy-date") as HTMLInputElement)?.value;
    const description = (document.getElementById("proxy-description") as HTMLTextAreaElement)?.value.trim() ?? "";
    if (!name || !category || !amount || !usedAt) { setStatusNotice("이름·항목·금액·사용일을 입력해 주세요."); return; }
    const supabase = getSupabasePublicClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const claimNumber = `CL-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
    const { data: created, error } = await supabase.schema("church").from("claims").insert({ claim_number: claimNumber, user_id: null, claimant_type: "proxy", claimant_name: name, created_by: user.id, category, amount, used_at: usedAt, description, status: "under_review" }).select("id, claim_number, category, amount, used_at, created_at, description, user_id, status").single();
    if (error || !created) { console.error(error); setStatusNotice("대리 청구를 저장하지 못했습니다."); return; }
    setProxyModalOpen(false); setStatusNotice("대리 청구가 저장되었습니다."); window.setTimeout(() => setStatusNotice(""), 2200);
    window.location.reload();
  }

  async function saveAccountingMemo() {
    if (!memoClaimId) return;
    const editor = document.getElementById("memo-editor") as HTMLTextAreaElement | null;
    const memo = editor?.value ?? "";
    const supabase = getSupabasePublicClient();
    const { error } = await supabase.schema("church").from("claims").update({ accounting_memo: memo }).eq("claim_number", memoClaimId);
    if (error) { console.error("[admin/claims] memo update failed", error); return; }
    setNotes((current) => ({ ...current, [memoClaimId]: memo }));
    setMemoClaimId(null);
    setStatusNotice("회계 메모가 저장되었습니다."); window.setTimeout(() => setStatusNotice(""), 2200);
  }

  async function openAdminAccount(itemId: string) {
    const item = adminClaims.find((claim) => claim.id === itemId) as (Claim & { userId?: string }) | undefined;
    if (!item?.userId) return;
    const supabase = getSupabasePublicClient();
    const { data } = await supabase.schema("church").from("payout_accounts").select("bank_name, account_number").eq("user_id", item.userId).eq("is_primary", true).maybeSingle();
    setAdminAccount(data ? { bank: data.bank_name, number: data.account_number } : null); setAccountVisible(itemId);
  }

  async function updateStatus(id: string, status: ClaimStatus) {
    if (statuses[id] === "정산 완료") return;
    if (status === "정산 완료" && !window.confirm("정산 완료로 변경하면 이후 청구 내용과 증빙서류를 수정하거나 삭제할 수 없습니다. 계속하시겠습니까?")) return;
    setStatuses((current) => ({ ...current, [id]: status }));
    const dbStatus = status === "검토 중" ? "under_review" : status === "보완 요청" ? "needs_revision" : "paid";
    const supabase = getSupabasePublicClient();
    const { error } = await supabase.schema("church").from("claims").update({ status: dbStatus }).eq("claim_number", id);
    if (error) console.error("[admin/claims] status update failed", error);
    else { setStatusNotice("상태가 저장되었습니다."); window.setTimeout(() => setStatusNotice(""), 2200); }
  }

  const reviewCount = adminClaims.filter((item) => statuses[item.id] === "검토 중").length;
  const revisionCount = adminClaims.filter((item) => statuses[item.id] === "보완 요청").length;
  const paidThisMonth = adminClaims.filter((item) => statuses[item.id] === "정산 완료").reduce((sum, item) => sum + Number(item.amount.replace(/[^0-9]/g, "")), 0);

  if (adminAuthChecking) return <main className="flex min-h-screen items-center justify-center bg-[#fbfcfb] text-sm text-[#566970]">권한을 확인하는 중...</main>;

  return (
    <main className="min-h-screen bg-[#fbfcfb] px-5 py-8 text-[#252525] sm:px-8 sm:py-12">{statusNotice && <div className="fixed right-5 top-5 z-[80] rounded-md border border-[#8bd3a9] bg-[#effaf3] px-4 py-3 text-sm font-bold text-[#16734b] shadow-lg">{statusNotice}</div>}
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-[#b9c7c3] pb-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#0b6b52]">Settlement manager</p>
            <h1 className="mt-3 text-3xl font-bold text-[#101f25]">청구 관리</h1>
            <p className="mt-3 text-sm text-[#40525b]"></p>
          </div>
          <div className="flex gap-2"><button type="button" onClick={() => { setInviteError(""); setInviteModalOpen(true); }} className="rounded-full border border-[#0b6b52] bg-white px-4 py-2 text-sm font-bold text-[#0b6b52]">회원 초대</button><button type="button" onClick={() => setProxyModalOpen(true)} className="rounded-full bg-[#0b6b52] px-4 py-2 text-sm font-bold text-white">+ 대리 청구</button><Link href="/" className="rounded-full border border-[#c9dce8] bg-white px-4 py-2 text-sm font-bold text-[#31546c]">홈으로</Link></div>
        </header>

        <section className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
          {[["검토 대기", `${reviewCount}건`], ["보완 요청", `${revisionCount}건`], ["이번 달 지급", `${paidThisMonth.toLocaleString("ko-KR")}원`]].map(([label, value]) => (
            <div key={label} className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-[#b9c7c3] bg-white px-3 py-2.5"><p className="truncate text-xs text-[#4f626b] sm:text-sm">{label}</p><p className="shrink-0 text-sm font-bold text-[#101f25] sm:text-base">{value}</p></div>
          ))}
        </section>

        <section className="mt-8 overflow-hidden rounded-lg border border-[#b9c7c3] bg-white shadow-[0_16px_45px_rgba(8,39,91,0.06)]">
          <div className="flex items-center justify-between gap-4 border-b border-[#b9c7c3] px-5 py-5 sm:px-7">
            <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0b6b52]">Claims spreadsheet</p><h2 className="mt-2 text-xl font-bold text-[#101f25]">청구 항목</h2></div>
            <div className="flex flex-wrap items-center justify-end gap-2"><input value={nameFilter} onChange={(event) => setNameFilter(event.target.value)} placeholder="이름" aria-label="청구자 이름 필터" className="w-20 rounded-md border border-[#c9dce8] px-2.5 py-1.5 text-xs outline-none focus:border-[#3f9fe8]" /><label className="flex items-center gap-1 text-[11px] text-[#566970]">시작일<input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} aria-label="시작일 필터" className="rounded-md border border-[#c9dce8] bg-white px-2 py-1.5 text-xs text-[#526b7c] outline-none focus:border-[#3f9fe8]" /></label><span className="text-[#a1b0ba]">~</span><label className="flex items-center gap-1 text-[11px] text-[#566970]">종료일<input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} aria-label="종료일 필터" className="rounded-md border border-[#c9dce8] bg-white px-2 py-1.5 text-xs text-[#526b7c] outline-none focus:border-[#3f9fe8]" /></label><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "전체" | ClaimStatus)} aria-label="상태 필터" className="claims-select rounded-md border border-[#c9dce8] bg-white px-2.5 py-1.5 text-xs outline-none focus:border-[#3f9fe8]"><option>전체</option><option>검토 중</option><option>보완 요청</option><option>정산 완료</option></select><span className="text-xs text-[#566970]">{filteredClaims.length}/{adminClaims.length}건</span></div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] border-collapse text-left text-sm">
              <thead className="bg-[#f1f5f3] text-xs font-bold text-[#526b7c]">
                <tr><th className="border-r border-b border-[#b9c7c3] px-3 py-3">제출일</th><th className="border-r border-b border-[#b9c7c3] px-3 py-3">청구번호</th><th className="border-r border-b border-[#b9c7c3] px-3 py-3">청구자</th><th className="border-r border-b border-[#b9c7c3] px-3 py-3">항목</th><th className="border-r border-b border-[#b9c7c3] px-3 py-3">설명</th><th className="border-r border-b border-[#b9c7c3] px-3 py-3 text-right">실제 청구금액</th><th className="border-r border-b border-[#b9c7c3] px-3 py-3">증빙</th><th className="border-r border-b border-[#b9c7c3] px-3 py-3">회계 메모</th><th className="border-r border-b border-[#b9c7c3] px-3 py-3">관리</th><th className="border-b border-[#b9c7c3] px-3 py-3">상태 <span className="font-normal text-[#566970]">(선택 즉시 저장)</span></th></tr>
              </thead>
              <tbody>
                {filteredClaims.map((item, index) => (
                  <tr key={item.id} className={`hover:bg-[#f8fbfc] ${index < filteredClaims.length - 1 ? "border-b border-[#c3cfcb]" : ""}`}>
                    <td className="whitespace-nowrap border-r border-[#cbd6d2] px-3 py-3 text-xs text-[#40525b]">{item.date}</td>
                    <td className="whitespace-nowrap border-r border-[#cbd6d2] px-3 py-3 font-mono text-xs text-[#566970]">{item.id}</td>
                    <td className="border-r border-[#cbd6d2] px-3 py-2.5 font-bold text-[#263f52]"><div className="flex items-center gap-2"><span className="whitespace-nowrap">{item.claimant}</span>{item.userId && <button type="button" aria-label={`${item.claimant} 계좌번호 보기`} onClick={() => { if (accountVisible === item.id) { setAccountVisible(null); setAdminAccount(null); } else void openAdminAccount(item.id); }} className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-[#b9d2df] bg-white text-xs text-[#0b6b52] transition hover:border-[#527a6c] hover:bg-[#effaf3]" title="계좌번호 보기">₩</button>}</div>{accountVisible === item.id && <div className="mt-2 w-fit rounded-md border-2 border-[#39e75f] bg-[#effff2] px-3 py-2"><p className="text-[11px] font-bold text-[#527a6c]">{adminAccount?.bank ?? "계좌 정보 없음"}</p><p className="mt-0.5 whitespace-nowrap font-mono text-base font-bold tracking-wide text-[#063d18]">{adminAccount?.number ?? "-"}</p></div>}</td>
                    <td className="whitespace-nowrap border-r border-[#cbd6d2] px-3 py-3 text-[#263f52]">{item.title}</td>
                    <td className="max-w-[220px] border-r border-[#cbd6d2] px-3 py-2.5 text-[#40525b]" title={item.detail}><span className="block truncate">{item.detail}</span></td>
                    <td className="whitespace-nowrap border-r border-[#cbd6d2] px-3 py-3 text-right font-bold text-[#101f25]">{item.amount}</td>
                    <td className="whitespace-nowrap border-r border-[#cbd6d2] px-3 py-2.5"><button type="button" onClick={() => void openAdminReceipts(item.id)} className="inline-flex items-center gap-1.5 rounded-md border border-[#b9d2df] bg-white px-2 py-1 text-xs font-bold text-[#0b6b52] transition hover:border-[#3f9fe8] hover:bg-[#f1faff]" title="증빙서류 보기"><span aria-hidden="true">▣</span>{item.receipts}장</button></td>
                    <td className="max-w-[220px] border-r border-[#cbd6d2] px-3 py-2.5"><button type="button" onClick={() => setMemoClaimId(item.id)} className="block w-full rounded-md border border-dashed border-[#9eb5ad] bg-[#fbfffc] px-2 py-1.5 text-left text-[#40525b] transition hover:border-[#0b6b52] hover:bg-[#effaf3]" title="회계 메모 입력"><span className="block min-h-5 truncate">{notes[item.id]}</span><span className="mt-0.5 block text-[10px] font-bold text-[#0b6b52]">{notes[item.id] ? "메모 수정 →" : "메모입력"}</span></button></td>
                    <td className="border-r border-[#cbd6d2] px-3 py-2"><div className="flex items-center gap-1">{statuses[item.id] !== "정산 완료" ? <button type="button" onClick={() => { setAdminAmountChanged(false); setEditClaimId(item.id); }} className="rounded-md border border-[#b9d2df] bg-white px-2 py-1 text-xs font-bold text-[#0b6b52] hover:bg-[#effaf3]">편집</button> : <span className="rounded-md border border-[#cbd6d2] bg-[#f1f5f3] px-2 py-1 text-xs font-bold text-[#566970]">잠금</span>}<button type="button" onClick={() => void openAmountHistory(item.id)} className="rounded-md border border-[#b9d2df] bg-white px-2 py-1 text-xs font-bold text-[#40525b] hover:bg-[#f1f5f3]">금액 이력</button></div></td>
                    <td className="px-3 py-2"><select aria-label={`${item.title} 상태`} disabled={statuses[item.id] === "정산 완료"} value={statuses[item.id]} onChange={(event) => updateStatus(item.id, event.target.value as ClaimStatus)} className={`claims-select rounded-md border px-2.5 py-1.5 text-xs font-bold outline-none focus:ring-2 focus:ring-[#8ec7e5] disabled:cursor-not-allowed disabled:opacity-80 ${statusStyle[statuses[item.id]]}`}><option>검토 중</option><option>보완 요청</option><option>정산 완료</option></select></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-x-6 gap-y-2 border-t border-[#b9c7c3] bg-[#f8fbfc] px-4 py-3 text-sm sm:px-5"><p className="text-[#526b7c]">총 청구금액: <strong className="ml-1 text-[#101f25]">{formatAmount(totalClaimAmount)}</strong></p><p className="text-[#526b7c]">총 정산완료 청구금액: <strong className="ml-1 text-[#145a39]">{formatAmount(totalPaidAmount)}</strong></p></div>
        </section>
        {inviteModalOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#092b3a]/35 p-4"><div className="w-full max-w-md rounded-lg bg-white p-6"><div className="flex justify-between"><h2 className="text-xl font-bold">회원 초대</h2><button type="button" onClick={() => setInviteModalOpen(false)} className="text-2xl">×</button></div><p className="mt-3 text-sm text-[#566970]">Supabase 기본 초대 이메일이 발송됩니다.</p>{inviteError && <p className="mt-4 rounded-md border border-[#f0b5b5] bg-[#fff3f3] px-3 py-2 text-sm font-bold text-[#a52a2a]">{inviteError}</p>}<input id="invite-email" type="email" placeholder="초대할 이메일 주소" className="mt-5 w-full rounded-md border px-3 py-2" /><button type="button" onClick={() => void sendInvite()} className="mt-4 w-full rounded-md bg-[#0b6b52] px-4 py-3 font-bold text-white">초대 이메일 보내기</button></div></div>}
        {proxyModalOpen && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#092b3a]/35 p-4 sm:items-center"><div className="max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-6"><div className="flex justify-between"><h2 className="text-xl font-bold">대리 청구하기</h2><button type="button" onClick={() => setProxyModalOpen(false)} className="text-2xl">×</button></div><p className="mt-2 text-sm text-[#566970]">회원가입이 어려운 성도의 청구를 회계 담당자가 대신 등록합니다.</p><div className="mt-5 space-y-3"><input id="proxy-name" placeholder="청구자 실명" className="w-full rounded-md border px-3 py-2" /><input id="proxy-category" placeholder="청구 항목" className="w-full rounded-md border px-3 py-2" /><input id="proxy-amount" type="number" placeholder="실제 청구금액" className="w-full rounded-md border px-3 py-2" /><input id="proxy-date" type="date" className="w-full rounded-md border px-3 py-2" /><textarea id="proxy-description" placeholder="설명 (선택)" className="w-full rounded-md border px-3 py-2" rows={3} /><p className="text-xs text-[#566970]">증빙서류는 저장 후 수정 모달에서 추가할 수 있습니다.</p><button type="button" onClick={() => void createProxyClaim()} className="w-full rounded-md bg-[#0b6b52] px-4 py-3 font-bold text-white">대리 청구 저장</button></div></div></div>}
        {memoClaimId && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#092b3a]/35 p-5"><div className="w-full max-w-lg rounded-lg border border-[#b9c7c3] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0b6b52]">Accounting note</p><h2 className="mt-2 text-xl font-bold text-[#101f25]">회계 메모 수정</h2></div><button type="button" onClick={() => setMemoClaimId(null)} className="text-2xl text-[#566970]" aria-label="회계 메모 닫기">×</button></div><p className="mt-4 text-sm text-[#40525b]">{adminClaims.find((item) => item.id === memoClaimId)?.title}</p><textarea id="memo-editor" defaultValue={notes[memoClaimId]} rows={5} className="mt-4 w-full rounded-md border border-[#b9c7c3] px-3 py-2.5 text-sm text-[#101f25] outline-none focus:border-[#0b6b52]" placeholder="검토 내용이나 지급 메모를 입력해 주세요." /><p className="mt-3 text-xs text-[#566970]">저장 시 수정자와 수정일시가 기록됩니다.</p><button type="button" onClick={() => { void saveAccountingMemo(); }} className="mt-5 w-full rounded-md bg-[#0b6b52] px-4 py-3 text-sm font-bold text-white">메모 저장</button></div></div>}
        {editClaimId && <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-[#092b3a]/35 p-4 sm:items-center sm:p-5"><div className="max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-xl overflow-y-auto overscroll-contain rounded-lg border border-[#b9c7c3] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0b6b52]">Edit claim</p><h2 className="mt-2 text-xl font-bold text-[#101f25]">청구 항목 수정</h2></div><button type="button" onClick={() => setEditClaimId(null)} className="text-2xl text-[#566970]" aria-label="수정 닫기">×</button></div><p className="mt-4 rounded-md bg-[#f1f5f3] px-3 py-2 text-sm text-[#40525b]">청구자 이름과 청구번호는 식별값이므로 수정할 수 없습니다.{editLocked && " 정산 완료된 청구는 수정할 수 없습니다."}</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold text-[#263f52]">제출일<input id="admin-edit-date" type="date" defaultValue={adminClaims.find((item) => item.id === editClaimId)?.date} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label><label className="text-sm font-bold text-[#263f52]">항목<input id="admin-edit-title" defaultValue={adminClaims.find((item) => item.id === editClaimId)?.title} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label><label className="text-sm font-bold text-[#263f52]">실제 청구금액<input id="admin-edit-amount" onChange={(event) => setAdminAmountChanged(Number(event.target.value) !== Number(adminClaims.find((item) => item.id === editClaimId)?.amount.replace(/[^0-9]/g, "")))} disabled={editLocked} defaultValue={adminClaims.find((item) => item.id === editClaimId)?.amount.replace(/[^0-9]/g, "")} type="number" className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label>{adminAmountChanged && <label className="col-span-2 rounded-md border border-[#f0b34a] bg-[#fff9e8] p-3 text-sm font-bold text-[#8a5200]">금액 변경 사유<input id="admin-edit-reason" required={adminAmountChanged} placeholder="금액을 변경한 이유를 입력해 주세요" className="mt-2 w-full rounded-md border border-[#e7b34a] bg-white px-3 py-2 font-normal text-[#263f52]" /></label>}<label className="text-sm font-bold text-[#263f52]">회계 메모<input id="admin-edit-memo" disabled={editLocked} defaultValue={notes[editClaimId] ?? ""} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label></div><label className="mt-4 block text-sm font-bold text-[#263f52]">설명<textarea id="admin-edit-detail" disabled={editLocked} defaultValue={adminClaims.find((item) => item.id === editClaimId)?.detail} rows={3} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2 font-normal" /></label><div className="mt-4 grid grid-cols-3 gap-2">{adminExistingReceiptUrls.map((r) => <div key={r.url} className="relative overflow-hidden rounded-md"><img src={r.url} alt={r.name} className="aspect-square w-full object-cover" /><button type="button" onClick={async () => { const supabase = getSupabasePublicClient(); await supabase.storage.from("claim-receipts").remove([r.path]); await supabase.schema("church").from("claim_receipts").delete().eq("id", r.id); setAdminExistingReceiptUrls((current) => current.filter((item) => item.id !== r.id)); setAdminClaims((current) => current.map((item) => item.id === editClaimId ? { ...item, receipts: Math.max(0, item.receipts - 1) } : item)); }} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#101f25]/80 text-sm font-bold text-white" aria-label={`${r.name} 삭제`}>×</button></div>)}</div><label className="mt-4 block text-sm font-bold text-[#263f52]">증빙서류 추가<input multiple accept="image/*,.pdf" type="file" onChange={(event) => { setAdminEditReceiptFiles((current) => [...current, ...Array.from(event.target.files ?? [])]); }} className="mt-2 block w-full rounded-md border border-dashed border-[#9ec9e4] bg-[#f5fbff] px-3 py-3 text-sm font-normal" />{adminEditReceiptFiles.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2">{adminEditReceiptFiles.map((file, index) => <div key={`${file.name}-${index}`} className="relative overflow-hidden rounded-md border"><button type="button" onClick={() => setAdminEditReceiptFiles((current) => current.filter((_, i) => i !== index))} className="absolute right-1 top-1 z-10 rounded-full bg-black/75 px-1.5 text-white">×</button>{file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt={file.name} className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center text-xs">PDF</div>}</div>)}</div>}</label><p className="mt-4 text-xs text-[#566970]">저장 시 수정자, 수정일시, 변경 전·후 값이 감사 로그에 기록됩니다.</p><button type="button" disabled={editLocked} onClick={() => { void saveAdminEditClaim(); }} className="mt-5 w-full rounded-md bg-[#0b6b52] px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:bg-[#aebbb6]">{editLocked ? "정산 완료 — 수정 잠금" : "수정 저장"}</button></div></div>}
        {amountHistoryId && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#092b3a]/35 p-5"><div className="w-full max-w-lg rounded-lg border border-[#b9c7c3] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#0b6b52]">Amount history</p><h2 className="mt-2 text-xl font-bold text-[#101f25]">금액 변경 이력</h2></div><button type="button" onClick={() => setAmountHistoryId(null)} className="text-2xl text-[#566970]" aria-label="금액 이력 닫기">×</button></div><div className="mt-5 overflow-hidden rounded-md border border-[#b9c7c3] text-sm"><div className="grid grid-cols-4 bg-[#f1f5f3] px-3 py-2 font-bold text-[#40525b]"><span>일시</span><span>수정자</span><span>변경 전</span><span>변경 후</span></div>{amountHistoryRows.length === 0 ? <p className="px-3 py-4 text-sm text-[#566970]">금액 변경 이력이 없습니다.</p> : amountHistoryRows.map((row) => <div key={row.created_at} className="grid grid-cols-4 border-t border-[#cbd6d2] px-3 py-3 text-[#263f52]"><span>{new Date(row.created_at).toLocaleString("ko-KR")}</span><span><strong>{row.changed_by_name ?? "이름 미등록"}</strong><small className="block text-[10px] text-[#566970]">{row.change_reason || "관리자 수정"}</small></span><span>{row.previous_amount.toLocaleString("ko-KR")}원</span><span className="font-bold text-[#0b6b52]">{row.new_amount.toLocaleString("ko-KR")}원</span></div>)}</div><p className="mt-4 text-xs text-[#566970]">실제 저장 연결 후 모든 금액 수정 기록이 시간순으로 표시됩니다.</p></div></div>}
        {receiptClaimId && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08275b]/35 p-5"><div className="w-full max-w-lg rounded-lg border border-[#b9c7c3] bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1678b8]">Receipts</p><h2 className="mt-2 text-xl font-bold text-[#101f25]">증빙서류 확인</h2></div><button type="button" onClick={() => setReceiptClaimId(null)} className="text-2xl leading-none text-[#566970]" aria-label="증빙서류 닫기">×</button></div><p className="mt-3 text-sm text-[#40525b]">{adminClaims.find((item) => item.id === receiptClaimId)?.title}</p><div className="mt-5 grid grid-cols-2 gap-3">{adminReceiptUrls.map((receipt) => <div key={receipt.url} className="overflow-hidden rounded-md border border-[#9ec9e0] bg-[#f5fbff]"><button type="button" onClick={() => { setAdminZoomedReceipt(receipt); setAdminReceiptRotation(0); }} className="block w-full"><img src={receipt.url} alt={receipt.name} className="aspect-[4/3] w-full object-cover transition-transform" style={{ transform: `rotate(${adminReceiptRotation}deg)` }} /></button><div className="flex items-center justify-between gap-2 px-2 py-1"><span className="truncate text-xs text-[#40525b]">{receipt.name}</span><button type="button" onClick={() => setAdminReceiptRotation((r) => (r + 90) % 360)} className="shrink-0 rounded border border-[#9ec9e0] px-2 py-1 text-xs font-bold text-[#0b6b52]">↻ 90°</button></div></div>)}</div><p className="mt-5 text-xs text-[#566970]">이미지를 클릭하면 새 창에서 크게 확인할 수 있습니다.</p></div></div>}
      </div>
      {adminZoomedReceipt && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4"><div className="relative flex max-h-full max-w-5xl flex-col items-center"><button type="button" onClick={() => setAdminZoomedReceipt(null)} className="absolute right-0 top-0 z-10 rounded-full bg-white/90 px-3 py-1 text-2xl">×</button><img src={adminZoomedReceipt.url} alt={adminZoomedReceipt.name} className="max-h-[78vh] max-w-full object-contain" style={{ transform: `rotate(${adminReceiptRotation}deg)` }} /><button type="button" onClick={() => setAdminReceiptRotation((r) => (r + 90) % 360)} className="mt-4 rounded-md bg-white px-3 py-2 font-bold text-[#0b6b52]">↻ 90° 회전</button></div></div>}
    </main>
  );
}
