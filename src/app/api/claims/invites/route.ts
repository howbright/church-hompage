import { NextResponse } from "next/server";
import { getSupabaseAdminClient, getSupabasePublicClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : "";
    const publicClient = getSupabasePublicClient();
    const { data: { user } } = await publicClient.auth.getUser(token);
    if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
    const admin = getSupabaseAdminClient();
    const { data: profile } = await admin.schema("church").from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (!profile || !["accountant", "admin"].includes(profile.role)) return NextResponse.json({ error: "초대 권한이 없습니다." }, { status: 403 });
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return NextResponse.json({ error: "올바른 이메일을 입력해 주세요." }, { status: 400 });
    const redirectTo = `${new URL(request.url).origin}/claims/signup`;
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo });
    if (error) {
      const message = error.message.includes("already been registered") || error.message.includes("already registered")
        ? "이 이메일은 이미 가입된 회원입니다."
        : error.message;
      return NextResponse.json({ error: message }, { status: 502 });
    }
    return NextResponse.json({ ok: true, userId: data.user.id });
  } catch (error) { console.error("[claims/invites]", error); return NextResponse.json({ error: "초대 처리 중 오류가 발생했습니다." }, { status: 500 }); }
}
