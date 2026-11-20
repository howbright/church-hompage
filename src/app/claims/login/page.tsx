"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabasePublicClient } from "@/lib/supabase";

export default function ClaimsLoginPage() {
  const router = useRouter();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    const memberCheck = await fetch("/api/claims/check-member", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email }) });
    const memberResult = await memberCheck.json();
    if (!memberCheck.ok) { setBusy(false); setError(memberResult.error ?? "회원 여부를 확인하지 못했습니다."); return; }
    if (!memberResult.isMember) { setBusy(false); router.push(`/claims/signup?email=${encodeURIComponent(email.trim())}`); return; }
    const { error: sendError } = await getSupabasePublicClient().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: false } });
    setBusy(false);
    if (sendError) { setError("등록된 이메일인지 확인하거나 잠시 후 다시 시도해 주세요."); return; }
    setSent(true); setNotice("인증번호를 이메일로 보냈습니다.");
  }

  async function verifyCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    const supabase = getSupabasePublicClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({ email: email.trim(), token: otp.trim(), type: "email" });
    if (verifyError) { setBusy(false); setError("인증번호가 올바르지 않거나 만료되었습니다. 다시 확인해 주세요."); return; }
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) { setBusy(false); setError("로그인 세션을 확인하지 못했습니다. 다시 시도해 주세요."); return; }
    const { data: profile, error: profileError } = await supabase.schema("church").from("profiles").select("id").eq("id", user.id).maybeSingle();
    setBusy(false);
    if (profileError) { await supabase.auth.signOut(); setError("회원정보를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요."); return; }
    if (!profile) { await supabase.auth.signOut(); router.push(`/claims/signup?email=${encodeURIComponent(email.trim())}`); return; }
    router.push("/claims");
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#fbfcfb] px-5 py-10 text-[#101f25] sm:px-8"><section className="w-full max-w-md rounded-lg border border-[#b9c7c3] bg-white p-7 shadow-[0_20px_55px_rgba(9,43,58,0.08)] sm:p-9"><Link href="/" className="text-xs font-bold uppercase tracking-[0.22em] text-[#0b6b52]">Calvary Chapel Gangnam</Link><h1 className="mt-6 text-3xl font-bold tracking-tight">교인 로그인</h1><p className="mt-3 text-sm leading-6 text-[#40525b]">등록한 이메일로 일회용 인증번호를 받아 청구 서비스에 로그인합니다.</p>{notice && <p className="mt-5 rounded-md border border-[#b9c7c3] bg-[#f1f5f3] px-3 py-2.5 text-sm text-[#0b6b52]">{notice}</p>}{error && <p role="alert" className="mt-5 rounded-md border border-[#e8b4b4] bg-[#fff3f3] px-3 py-2.5 text-sm text-[#a52a2a]">{error}</p>}{!sent ? <form onSubmit={sendCode} className="mt-7 space-y-4"><label className="block text-sm font-bold">이메일 주소<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3.5 py-3 outline-none focus:border-[#0b6b52]" /></label><button disabled={busy} type="submit" className="w-full rounded-md bg-[#0b6b52] px-4 py-3 text-sm font-bold text-white hover:bg-[#075740] disabled:opacity-60">{busy ? "전송 중..." : "인증번호 받기"}</button></form> : <form onSubmit={verifyCode} className="mt-7 space-y-4"><p className="text-sm text-[#566970]">{email}</p><label className="block text-sm font-bold">이메일 인증번호<input required inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="6자리 인증번호" className="mt-2 w-full rounded-md border border-[#b9c7c3] px-3.5 py-3 tracking-[0.35em] outline-none focus:border-[#0b6b52]" /></label><button disabled={busy || otp.length !== 6} type="submit" className="w-full rounded-md bg-[#0b6b52] px-4 py-3 text-sm font-bold text-white hover:bg-[#075740] disabled:opacity-60">{busy ? "확인 중..." : "로그인"}</button><button type="button" onClick={() => { setSent(false); setOtp(""); setError(""); }} className="w-full py-2 text-sm font-bold text-[#40525b]">이메일 다시 입력</button></form>}<div className="mt-7 border-t border-[#e1e9e6] pt-5 text-center text-sm text-[#566970]"><span>아직 회원이 아니신가요?</span><Link href="/claims/signup" className="ml-2 font-bold text-[#0b6b52]">회원가입</Link></div></section></main>;
}
