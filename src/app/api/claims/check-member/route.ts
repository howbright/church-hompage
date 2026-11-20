import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || !email.includes("@")) return NextResponse.json({ error: "이메일 주소를 입력해 주세요." }, { status: 400 });
    const { data, error } = await getSupabaseAdminClient().schema("church").from("profiles").select("id").eq("email", email).maybeSingle();
    if (error) {
      console.error("[claims/check-member] Supabase profile lookup failed", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json({ error: "회원 여부를 확인하지 못했습니다." }, { status: 500 });
    }
    return NextResponse.json({ isMember: Boolean(data) });
  } catch (error) {
    console.error("[claims/check-member] Unexpected error", error);
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }
}
