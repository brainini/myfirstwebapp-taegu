#!/usr/bin/env node
// npm run guide:update — 템플릿(brainini/tradefin-web-starter)에서 고쳐진 안내서 · 데이터 · 6일차 양식을 받는다.
//
//   npm run guide:update                  guide/ · data/ · hackathon/
//   npm run guide:update -- --infra       + scripts/doctor.mjs · scripts/lib/ · lib/db.ts · prisma.config.ts
//   npm run guide:update -- --deps        + package.json · package-lock.json → 받은 뒤 npm ci
//   npm run guide:update -- --check       받기만 하고 무엇이 바뀌는지 보여 준다(파일은 그대로)
//
// 그 경로에 커밋하지 않은 변경이 있으면 멈춘다. 끝나면 git status --short를 보여 준다(커밋은 내가 한다).
// data/ · hackathon/에서 내가 고친 파일(예: 채운 아이디어 카드 · 내 데이터 설명)은 덮어쓰지 않고 '건너뜀'으로 알린다
// — 템플릿의 어느 판과도 같지 않으면 내가 고친 파일로 본다. guide/ · --infra · --deps는 언제나 템플릿 판으로 바꾼다.
import { execFileSync, execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STARTER_URL = process.env.STARTER_URL ?? "https://github.com/brainini/tradefin-web-starter.git";
const args = new Set(process.argv.slice(2));
const BASE = ["guide", "data", "hackathon"];
const PROTECT = new Set(["data", "hackathon"]); // 내가 고칠 수 있는 곳 — 템플릿 판 그대로인 파일만 새 판으로
const INFRA = ["scripts/doctor.mjs", "scripts/lib", "lib/db.ts", "prisma.config.ts"];
const DEPS = ["package.json", "package-lock.json"];

const env = { ...process.env, GIT_TERMINAL_PROMPT: "0" };
const git = (a, opts = {}) =>
  execFileSync("git", a, { cwd: ROOT, encoding: "utf8", env, stdio: ["ignore", "pipe", "pipe"], maxBuffer: 64 * 1024 * 1024, ...opts }).trim();
const stop = (msg, fix) => {
  console.log(`✗ ${msg}`);
  if (fix) console.log(`    → ${fix}`);
  process.exit(1);
};

// 커밋 메시지의 일차(한국 시각 날짜로) — 10/19 4일차 · 10/20 5일차 · 10/21 6일차
function dayLabel() {
  const d = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
  if (d <= "2026-10-19") return "4일차";
  if (d === "2026-10-20") return "5일차";
  return "6일차";
}

for (const a of args) if (!["--infra", "--deps", "--check"].includes(a)) stop(`모르는 선택: ${a}`, "npm run guide:update [-- --infra] [-- --deps] [-- --check]");

try {
  git(["rev-parse", "--is-inside-work-tree"]);
} catch {
  stop("git 저장소가 아닙니다", "내 웹 저장소 폴더(VS Code로 연 폴더)에서 다시");
}

const paths = [...BASE, ...(args.has("--infra") ? INFRA : []), ...(args.has("--deps") ? DEPS : [])];

// 커밋하지 않은 변경(추적 중인 파일)이 있으면 멈춘다 — 새로 만든 파일(추적 전)은 덮어쓸 일이 없어 그대로 둔다
const dirty = git(["status", "--porcelain", "--untracked-files=no", "--", ...paths]);
if (dirty && !args.has("--check")) {
  console.log("✗ 받을 경로에 커밋하지 않은 변경이 있어 멈춥니다(덮어쓰지 않게):");
  console.log(dirty.split("\n").map((l) => `    ${l}`).join("\n"));
  console.log("    → 내 변경이면 먼저 커밋, 실수면 되돌리기(git restore --staged <파일> → git restore <파일>) → 다시 npm run guide:update");
  process.exit(1);
}

let remote = "";
try {
  remote = git(["remote", "get-url", "starter"]);
} catch {
  git(["remote", "add", "starter", STARTER_URL]);
  remote = STARTER_URL;
  console.log(`✓ 원격 starter를 더했습니다: ${STARTER_URL}`);
}
console.log(`– 템플릿에서 받는 중: ${remote} (main)`);
try {
  git(["fetch", "--no-tags", "starter", "main"], { timeout: 120_000 });
} catch (e) {
  stop(`템플릿을 받지 못했습니다: ${String(e.stderr ?? e.message).trim().split("\n").pop()}`, "인터넷 연결 확인 → 다시(핫스팟 · Codespaces)");
}

const REF = "refs/remotes/starter/main";
const exists = (p) => {
  try {
    git(["cat-file", "-e", `${REF}:${p}`]);
    return true;
  } catch {
    return false;
  }
};
const take = paths.filter(exists);
const skipped = paths.filter((p) => !take.includes(p));
if (skipped.length) console.log(`– 템플릿에 없어 건너뜀: ${skipped.join(" · ")}`);
if (!take.length) stop("받을 것이 없습니다");

/** ref의 파일 → blob (경로 아래 전부) */
function lsTree(ref, ps) {
  const m = new Map();
  if (!ps.length) return m;
  let out = "";
  try {
    out = git(["ls-tree", "-r", "-z", ref, "--", ...ps]);
  } catch {
    return m; // 커밋이 아직 없음
  }
  for (const rec of out.split("\0")) {
    const tab = rec.indexOf("\t");
    if (tab < 0) continue;
    const [, type, blob] = rec.slice(0, tab).split(" ");
    if (type === "blob") m.set(rec.slice(tab + 1), blob);
  }
  return m;
}

/** 템플릿 이력에 나온 적 있는 판(blob) — 경로마다 */
function templateVersions(ps) {
  const m = new Map();
  if (!ps.length) return m;
  let out = "";
  try {
    out = git(["log", "--format=", "--raw", "--no-abbrev", "--no-renames", "--root", "-z", REF, "--", ...ps]);
  } catch {
    return m;
  }
  const tok = out.split("\0");
  for (let i = 0; i < tok.length - 1; i++) {
    const meta = tok[i].replace(/^\s+/, "");
    if (!meta.startsWith(":")) continue;
    const blob = meta.split(" ")[3];
    const p = tok[++i];
    if (blob && !/^0+$/.test(blob)) {
      if (!m.has(p)) m.set(p, new Set());
      m.get(p).add(blob);
    }
  }
  return m;
}

// 받을 것 정하기 — guide/ · --infra · --deps는 통째로(바뀐 경로만), data/ · hackathon/은 파일마다
const differs = (p) => {
  try {
    return git(["diff", "--name-only", "HEAD", REF, "--", p]) !== "";
  } catch {
    return true; // 커밋이 아직 없음
  }
};
const whole = take.filter((p) => !PROTECT.has(p) && differs(p));
const guarded = take.filter((p) => PROTECT.has(p));
const tpl = lsTree(REF, guarded);
const head = lsTree("HEAD", guarded);
const versions = templateVersions(guarded);
const untracked = new Set(guarded.length ? git(["ls-files", "-z", "--others", "--exclude-standard", "--", ...guarded]).split("\0").filter(Boolean) : []);
const files = [];
const mine = [];
for (const [p, blob] of tpl) {
  const h = head.get(p);
  if (h === blob) continue; // 이미 같다
  if (!h) (untracked.has(p) ? mine : files).push(p); // 새 파일(같은 이름의 커밋 안 한 내 파일이 있으면 건너뜀)
  else if (versions.get(p)?.has(h)) files.push(p); // 템플릿의 옛 판 그대로 → 새 판으로
  else mine.push(p); // 내가 고친 파일 → 그대로 둔다
}
const want = [...whole, ...files];

let stat = "";
if (want.length) {
  try {
    const s = git(["diff", "--stat", "HEAD", REF, "--", ...want]);
    stat = s ? s.replace(/^(?! )/gm, " ") : "";
  } catch {
    stat = want.join("\n");
  }
}
const showMine = () => {
  if (!mine.length) return;
  console.log(`– 내가 고친 파일이라 건너뜀(그대로 둠): ${mine.join(" · ")}`);
  console.log(`    → 템플릿 새 판을 보려면: git show starter/main:${mine[0]}`);
};

if (args.has("--check")) {
  console.log(stat ? `바뀔 파일:\n${stat}` : "✓ 이미 템플릿과 같습니다 — 받을 것이 없습니다");
  showMine();
  if (dirty) console.log("! 커밋하지 않은 변경이 있습니다 — 실제로 받기 전에 커밋하거나 되돌리기(git status)");
  process.exit(0);
}
if (!stat) {
  console.log("✓ 이미 템플릿과 같습니다 — 바뀐 것 없음");
  showMine();
  process.exit(0);
}

git(["checkout", REF, "--", ...want]);
console.log(`✓ 받았습니다: ${[...whole, ...files].join(" · ")}`);
showMine();

if (args.has("--deps")) {
  console.log("– 패키지를 다시 설치합니다(npm ci). npm run dev가 켜져 있으면 먼저 끄세요(Ctrl+C).");
  try {
    execSync("npm ci", { cwd: ROOT, stdio: "inherit" });
  } catch {
    stop("npm ci가 실패했습니다", "npm run dev를 끄고 다시 npm ci → 그래도 안 되면 npm run doctor");
  }
}

console.log("\n바뀐 파일(git status --short):");
console.log(git(["status", "--short"]) || "  (없음)");
console.log(`\n다음: 바뀐 파일을 훑어본 뒤 커밋 — git commit -m "${dayLabel()}: 안내서 받기" -m "왜: 템플릿에서 고친 안내서 · 데이터 반영"`);
