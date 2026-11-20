"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabasePublicClient } from "@/lib/supabase";

export default function ClaimsSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [fullName, setFullName] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function requestCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSending(true);
    const memberCheck = await fetch("/api/claims/check-member", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const memberResult = await memberCheck.json();
    if (!memberCheck.ok) {
      setIsSending(false);
      setError(memberResult.error ?? "회원 여부를 확인하지 못했습니다.");
      return;
    }
    if (memberResult.isMember) {
      setIsSending(false);
      router.push(`/claims/login?email=${encodeURIComponent(email.trim())}`);
      return;
    }
    const { error: sendError } = await getSupabasePublicClient().auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    setIsSending(false);
    if (sendError) {
      setError(sendError.message.includes("60") ? "인증번호는 60초에 한 번만 요청할 수 있습니다." : "인증번호를 보내지 못했습니다. 이메일 주소를 확인해 주세요.");
      return;
    }
    setStep(2);
    setNotice(`${email.trim()}로 인증번호를 보냈습니다. 받은 인증번호를 입력해 주세요.`);
  }

  async function completeSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsVerifying(true);
    const { error: verifyError } = await getSupabasePublicClient().auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "email",
    });
    setIsVerifying(false);
    if (verifyError) {
      setError("인증번호가 올바르지 않거나 만료되었습니다. 다시 확인해 주세요.");
      return;
    }
    setIsVerified(true);
    setNotice("이메일 인증이 완료되었습니다. 다음 단계에서 회원 정보를 등록합니다.");
  }

  async function saveMemberInfo(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const supabase = getSupabasePublicClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setError("인증 세션이 만료되었습니다. 이메일 인증을 다시 진행해 주세요.");
      return;
    }
    const { error: profileError } = await supabase.schema("church").from("profiles").upsert({ id: user.id, email: email.trim().toLowerCase(), full_name: fullName.trim(), role: "member" });
    if (profileError) {
      console.error("[claims/signup] Profile save failed", profileError);
      setError("회원 정보를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }
    const accountPayload = { user_id: user.id, bank_name: bankName.trim(), account_number: accountNumber.trim(), account_holder_name: accountHolderName.trim(), is_primary: true };
    const { data: existingAccount } = await supabase.schema("church").from("payout_accounts").select("id").eq("user_id", user.id).eq("is_primary", true).maybeSingle();
    const { error: accountError } = existingAccount
      ? await supabase.schema("church").from("payout_accounts").update(accountPayload).eq("id", existingAccount.id)
      : await supabase.schema("church").from("payout_accounts").insert(accountPayload);
    if (accountError) {
      console.error("[claims/signup] Payout account save failed", accountError);
      setError("정산 계좌를 저장하지 못했습니다. 입력 내용을 확인해 주세요.");
      return;
    }
    setNotice("회원가입이 완료되었습니다. 청구서비스로 이동합니다.");
    window.setTimeout(() => router.push("/claims"), 900);
  }

  return <main className="min-h-screen bg-[#fbfcfb] px-5 py-10 text-[#101f25] sm:px-8"><section className="mx-auto w-full max-w-2xl rounded-lg border border-[#b9c7c3] bg-white p-7 shadow-[0_20px_55px_rgba(9,43,58,0.08)] sm:p-9"><Link href="/" className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b6b52]">Calvary Chapel Gangnam</Link><h1 className="mt-6 text-3xl font-bold tracking-tight">교인 회원가입</h1><div className="mt-6 grid grid-cols-2 gap-2"><div className={`border-t-4 pt-2 text-xs font-bold ${step === 1 ? "border-[#0b6b52] text-[#0b6b52]" : "border-[#b9c7c3] text-[#566970]"}`}>1. 이메일 인증</div><div className={`border-t-4 pt-2 text-xs font-bold ${step === 2 ? "border-[#0b6b52] text-[#0b6b52]" : "border-[#b9c7c3] text-[#566970]"}`}>2. 정보 등록</div></div><p className="mt-4 text-sm leading-6 text-[#40525b]">이메일을 먼저 인증한 뒤 실명과 정산 계좌를 등록합니다.</p>{notice && <p className="mt-5 rounded-md border border-[#b9c7c3] bg-[#f1f5f3] px-3 py-2.5 text-sm text-[#0b6b52]">{notice}</p>}{error && <p role="alert" className="mt-5 rounded-md border border-[#e8b4b4] bg-[#fff3f3] px-3 py-2.5 text-sm text-[#a52a2a]">{error}</p>}{step === 1 ? <form onSubmit={requestCode} className="mt-7 space-y-4"><label className="block text-sm font-bold">이메일 주소<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3.5 py-3 font-normal outline-none focus:border-[#0b6b52]" /><span className="mt-2 block text-xs font-normal text-[#566970]">인증번호를 받을 수 있는 이메일을 정확히 입력해 주세요.</span></label><button disabled={isSending} type="submit" className="w-full rounded-md bg-[#0b6b52] px-4 py-3 text-sm font-bold text-white hover:bg-[#075740] disabled:cursor-not-allowed disabled:opacity-60">{isSending ? "전송 중..." : "인증번호 보내기"}</button></form> : isVerified ? <form onSubmit={saveMemberInfo} className="mt-7 space-y-5"><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm font-bold">실명<input required value={fullName} onChange={(event) => setFullName(event.target.value)} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2.5 font-normal" /></label><label className="text-sm font-bold">예금주<input required value={accountHolderName} onChange={(event) => setAccountHolderName(event.target.value)} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2.5 font-normal" /></label><label className="text-sm font-bold">은행명<input required value={bankName} onChange={(event) => setBankName(event.target.value)} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2.5 font-normal" /></label><label className="text-sm font-bold">계좌번호<input required inputMode="numeric" value={accountNumber} onChange={(event) => setAccountNumber(event.target.value)} className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3 py-2.5 font-mono font-normal" /></label></div><label className="flex items-start gap-2 text-sm text-[#40525b]"><input required type="checkbox" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} className="mt-1 accent-[#0b6b52]" /><span>개인정보와 계좌 정보를 청구·정산 목적으로 사용하는 것에 동의합니다.</span></label><button type="submit" className="w-full rounded-md bg-[#0b6b52] px-4 py-3 text-sm font-bold text-white hover:bg-[#075740]">회원가입 완료</button></form> : <form onSubmit={completeSignup} className="mt-7 space-y-5"><div className="rounded-md border border-[#b9c7c3] bg-[#fbfffc] px-3 py-2.5 text-sm"><span className="text-[#566970]">인증 이메일</span><strong className="ml-2 text-[#101f25]">{email}</strong><button type="button" onClick={() => { setStep(1); setError(""); setIsVerified(false); }} className="float-right font-bold text-[#0b6b52]">수정</button></div><label className="block text-sm font-bold">인증번호<input required inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6자리 인증번호" className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3.5 py-3 tracking-[0.35em] outline-none focus:border-[#0b6b52]" /></label><button disabled={isVerifying || otp.length !== 6} type="submit" className="w-full rounded-md bg-[#0b6b52] px-4 py-3 text-sm font-bold text-white hover:bg-[#075740] disabled:cursor-not-allowed disabled:opacity-60">{isVerifying ? "확인 중..." : "이메일 인증하기"}</button><button type="button" disabled={isSending} onClick={requestCode as unknown as React.MouseEventHandler<HTMLButtonElement>} className="w-full text-sm font-bold text-[#0b6b52] disabled:opacity-60">{isSending ? "재전송 중..." : "인증번호 다시 보내기"}</button></form>}<p className="mt-6 text-center text-sm text-[#566970]">이미 가입하셨나요? <Link href="/claims/login" className="font-bold text-[#0b6b52]">로그인하기</Link></p></section></main>;
}
