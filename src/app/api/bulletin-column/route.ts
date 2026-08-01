type GenerateColumnRequest = {
  abstract?: unknown;
  adminPassword?: unknown;
};

type ChurchColumnResponse = {
  ok?: boolean;
  column?: unknown;
  message?: unknown;
};

export async function POST(request: Request) {
  let body: GenerateColumnRequest;

  try {
    body = (await request.json()) as GenerateColumnRequest;
  } catch {
    return Response.json({ message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const abstract = typeof body.abstract === "string" ? body.abstract.trim() : "";
  const adminPassword =
    typeof body.adminPassword === "string" ? body.adminPassword.trim() : "";

  if (!process.env.BULLETIN_ADMIN_PASSWORD) {
    return Response.json(
      { message: "관리자 비밀번호 환경변수가 설정되지 않았습니다." },
      { status: 503 },
    );
  }

  if (adminPassword !== process.env.BULLETIN_ADMIN_PASSWORD) {
    return Response.json(
      { message: "관리자 비밀번호가 올바르지 않습니다." },
      { status: 401 },
    );
  }

  if (!abstract) {
    return Response.json({ message: "설교 초록을 입력해주세요." }, { status: 400 });
  }

  if (abstract.length > 30_000) {
    return Response.json(
      { message: "설교 초록은 30,000자 이내로 입력해주세요." },
      { status: 400 },
    );
  }

  const apiBaseUrl = process.env.API_BASE_URL;
  if (!apiBaseUrl) {
    return Response.json(
      { message: "API_BASE_URL 환경변수를 설정해주세요." },
      { status: 503 },
    );
  }

  const apiKey = process.env.CHURCH_API_KEY;
  if (!apiKey) {
    return Response.json(
      { message: "CHURCH_API_KEY 환경변수를 설정해주세요." },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      `${apiBaseUrl.replace(/\/$/, "")}/church/weekly-column`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-church-api-key": apiKey,
        },
        body: JSON.stringify({ draftText: abstract }),
        cache: "no-store",
        signal: AbortSignal.timeout(90_000),
      },
    );
    const payload = (await response.json()) as ChurchColumnResponse;

    if (!response.ok || !payload.ok) {
      const message =
        typeof payload.message === "string" && payload.message.trim()
          ? payload.message
          : "칼럼 생성에 실패했습니다.";
      return Response.json(
        { message },
        { status: response.ok ? 502 : response.status },
      );
    }

    const column =
      typeof payload.column === "string" ? payload.column.trim() : "";
    if (!column) {
      return Response.json(
        { message: "칼럼 생성 서버가 빈 결과를 반환했습니다." },
        { status: 502 },
      );
    }

    return Response.json({ column });
  } catch (error) {
    const message =
      error instanceof Error && error.name === "TimeoutError"
        ? "칼럼 생성 시간이 너무 오래 걸립니다. 잠시 후 다시 시도해주세요."
        : "칼럼 생성 서버에 연결하지 못했습니다.";
    return Response.json({ message }, { status: 502 });
  }
}
