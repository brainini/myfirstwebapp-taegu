#!/usr/bin/env node
// npm run catchup -- day4-d | day5-c | day5-d — 앞 실습을 못 끝냈을 때 '기준본'으로 합류한다.
// 템플릿의 ref/<이름> 가지에서 app · components · lib · prisma · scripts/draft-dunning.ts (· data/drafts_ref.json)를 가져온다.
// 작업 트리에 커밋하지 않은 변경이 있으면 멈춘다. 커밋은 내가 한다. .env는 건드리지 않는다.
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STARTER_URL = process.env.STARTER_URL ?? "https://github.com/brainini/tradefin-web-starter.git";
const TARGETS = {
  "day4-d": { label: "4일차 실습 D 기준본(바이어 목록 · 상세)", msg: "5일차: 합류 — 4일차 실습 D 기준본", db: false },
  "day5-c": { label: "5일차 실습 C 기준본(DB · 확인 기록)", msg: "5일차: 합류 — 실습 C 기준본", db: true },
  "day5-d": { label: "5일차 실습 D 기준본(환율 타일 · 독촉 승인)", msg: "5일차: 합류 — 실습 D 기준본", db: true },
};
const PATHS = ["app", "components", "lib", "prisma", "scripts/draft-dunning.ts", "data/drafts_ref.json"];

const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
const git = (a, opts = {}) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
const stop = (msg, fix) => {
  console.log(`✗ ${msg}`);
  if (fix) console.log(`    → ${fix}`);
  process.exit(1);
};

const name = process.argv[2];
const t = TARGETS[name];
if (!t) stop(`합류 지점을 골라 주세요: ${Object.keys(TARGETS).join(" | ")}`, "예: npm run catchup -- day4-d");

try {
  git(["rev-parse", "--is-inside-work-tree"]);
} catch {
  stop("git 저장소가 아닙니다", "내 웹 저장소 폴더에서 다시");
}
const dirty = git(["status", "--porcelain"]);
if (dirty) {
  console.log("✗ 커밋하지 않은 변경이 있어 멈춥니다(내 작업을 덮어쓰지 않게):");
  console.log(dirty.split("\n").map((l) => `    ${l}`).join("\n"));
  console.log("    → 먼저 커밋(내 작업 보관) → 다시 npm run catchup -- " + name);
  process.exit(1);
}

try {
  git(["remote", "get-url", "starter"]);
} catch {
  git(["remote", "add", "starter", STARTER_URL]);
  console.log(`✓ 원격 starter를 더했습니다: ${STARTER_URL}`);
}
const branch = `ref/${name}`;
const REF = `refs/remotes/starter/${branch}`;
console.log(`– 기준본을 받는 중: ${branch} — ${t.label}`);
try {
  git(["fetch", "--no-tags", "starter", `+refs/heads/${branch}:${REF}`], { timeout: 120_000 });
} catch {
  stop(`기준본(${branch})을 받지 못했습니다`, "인터넷 연결 확인 → 그래도 안 되면 강사에게(기준본이 아직 준비되지 않았을 수 있음)");
}

const inRef = (p) => {
  try {
    git(["cat-file", "-e", `${REF}:${p}`]);
    return true;
  } catch {
    return false;
  }
};
const take = PATHS.filter(inRef);
if (!take.length) stop("기준본에 가져올 파일이 없습니다", "강사에게 알려 주세요");

// 기준본에 없는 내 파일(빌드가 깨지면 잠시 옮겨 둔다)
const refFiles = new Set(git(["ls-tree", "-r", "--name-only", REF, "--", ...take]).split("\n").filter(Boolean));
const mine = git(["ls-files", "--", ...take.filter((p) => !p.includes("."))]).split("\n").filter((f) => f && !refFiles.has(f));

git(["checkout", REF, "--", ...take]);
console.log(`✓ 기준본으로 바꿨습니다: ${take.join(" · ")}`);
if (mine.length) {
  console.log(`! 기준본에 없는 내 파일 ${mine.length}개는 그대로 두었습니다: ${mine.slice(0, 8).join(" · ")}${mine.length > 8 ? " …" : ""}`);
  console.log("    → npm run build가 이 파일 때문에 깨지면, 잠시 workbench/로 옮겨 두고 다시 빌드");
}

console.log("\n바뀐 파일(git status --short):");
console.log(git(["status", "--short"]) || "  (없음)");
const steps = ["npm run build (통과 확인)"];
if (t.db) steps.push("내 DB에 표 · 처음 데이터: npm run db:push → npm run db:seed (.env의 주소가 내 Supabase인지 먼저 npm run doctor:db)");
if (name === "day5-d") {
  steps.push(
    take.includes("data/drafts_ref.json")
      ? "독촉 초안: npm run drafts -- --import data/drafts_ref.json (AI 없이 기준 초안 · 바로) 또는 npm run drafts (AI가 새로 씀 · 2–3분)"
      : "독촉 초안: npm run drafts (AI가 새로 씀 · 2–3분)",
  );
  steps.push(".env에 APPROVER_PIN(내가 정한 승인 코드) → npm run dev 다시 시작 · 배포는 Vercel 환경 변수에도");
}
steps.push(`커밋 → push: git add -A → git commit -m "${t.msg}" -m "왜: 앞 실습을 기준본으로 맞추고 다음 실습에 합류"`);
console.log("\n다음:");
steps.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
