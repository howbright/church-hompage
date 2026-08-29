import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const envPath = resolve(projectRoot, ".env.local");
const outputPath = resolve(projectRoot, "src/lib/database.types.ts");

function readLocalEnv(path) {
  if (!existsSync(path)) return {};

  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        const value = line
          .slice(separator + 1)
          .trim()
          .replace(/^(['"])(.*)\1$/, "$2");
        return [key, value];
      }),
  );
}

const localEnv = readLocalEnv(envPath);
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || localEnv.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error("NEXT_PUBLIC_SUPABASE_URL이 .env.local에 설정되어 있지 않습니다.");
  process.exit(1);
}

let projectId;
try {
  const hostname = new URL(supabaseUrl).hostname;
  projectId = hostname.endsWith(".supabase.co")
    ? hostname.slice(0, -".supabase.co".length)
    : "";
} catch {
  projectId = "";
}

if (!projectId) {
  console.error("NEXT_PUBLIC_SUPABASE_URL에서 Supabase 프로젝트 ID를 찾지 못했습니다.");
  process.exit(1);
}

const cliPath = resolve(
  projectRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "supabase.cmd" : "supabase",
);

if (!existsSync(cliPath)) {
  console.error("Supabase CLI가 없습니다. 먼저 npm install을 실행해 주세요.");
  process.exit(1);
}

console.log(`Supabase 프로젝트 ${projectId}의 타입을 생성합니다...`);

const result = spawnSync(
  cliPath,
  ["gen", "types", "typescript", "--project-id", projectId, "--schema", "public"],
  {
    cwd: projectRoot,
    encoding: "utf8",
    env: { ...process.env, ...localEnv },
    timeout: 60_000,
  },
);

if (result.status !== 0) {
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.error?.code === "ETIMEDOUT") {
    console.error(
      "Supabase 응답 시간이 초과되었습니다. 네트워크와 프로젝트 접근 권한을 확인해 주세요.",
    );
  }
  console.error(
    "타입 생성에 실패했습니다. 먼저 `npm run db:login`으로 Supabase CLI에 로그인해 주세요.",
  );
  process.exit(result.status ?? 1);
}

if (!result.stdout.trim()) {
  console.error("Supabase CLI가 빈 타입 파일을 반환했습니다.");
  process.exit(1);
}

writeFileSync(outputPath, result.stdout, "utf8");
console.log("src/lib/database.types.ts 생성이 완료되었습니다.");
