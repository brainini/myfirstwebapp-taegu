// claude 명령(Claude Code의 실행 파일)을 찾는다 — 따로 설치하지 않는다(VS Code 확장에 들어 있는 것을 쓴다).
// 고치지 않는다.
//
// 찾는 순서(각 자리에서는 가장 새 판):
//   0. 환경 변수 CLAUDE_BIN(직접 지정한 경로)
//   1. PATH
//   2. ~/.vscode/extensions/anthropic.claude-code-*/resources/native-binary/claude(.exe)
//   3. ~/.cursor/extensions/…
//   4. ~/.vscode-server/… · ~/.cursor-server/… · ~/.vscode-remote/…(Codespaces)
//   5. ~/.local/bin
// 자리마다 `claude --version`으로 판을 묻는다. 2.1.0보다 옛 판이거나 실행되지 않으면 건너뛰고 다음 자리를 본다
// (--json-schema · --tools ""가 되는 판 — 4일차 ask_claude.py와 같은 규칙). 한 번 찾으면 그 실행 동안 기억한다.
//
//   node scripts/lib/find-claude.mjs --print     # 찾은 경로 · 판 번호 · 건너뛴 것을 보여 준다(못 찾으면 종료 코드 1)
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const IS_WIN = process.platform === "win32";
const EXE = IS_WIN ? "claude.exe" : "claude";
const EXT_PREFIX = "anthropic.claude-code-";
/** 이보다 옛 판은 건너뛴다(--json-schema · --tools ""가 없을 수 있음) */
export const MIN_VERSION = "2.1.0";
const MIN = [2, 1, 0];

/**
 * @typedef {{ path: string, source: string, version: string }} ClaudeHit 쓸 claude(판은 "2.1.301" 모양)
 * @typedef {{ path: string, source: string, version: string | null }} ClaudeSkipped 건너뛴 것(판을 못 읽었으면 null)
 */

/** @param {string} p */
function isRunnable(p) {
  try {
    const st = fs.statSync(p);
    if (!st.isFile()) return false;
    if (!IS_WIN) fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

/** "2.1.301 (Claude Code)" · "2.1.301-win32-x64" → [2, 1, 301] @param {string | null | undefined} text */
function parseVersion(text) {
  const m = String(text ?? "").match(/(\d+)\.(\d+)\.(\d+)/);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

/** @param {number[]} a @param {number[]} b */
function cmpVersion(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

/** 확장 폴더 하나에 든 실행 파일들 — 새 판부터 @param {string} extDir @returns {string[]} */
function inExtensions(extDir) {
  let names;
  try {
    names = fs.readdirSync(extDir);
  } catch {
    return [];
  }
  // VS Code가 지우기로 표시한 옛 판(.obsolete)은 건너뛴다
  let obsolete = {};
  try {
    obsolete = JSON.parse(fs.readFileSync(path.join(extDir, ".obsolete"), "utf8")) ?? {};
  } catch {
    obsolete = {};
  }
  return names
    .filter((n) => n.startsWith(EXT_PREFIX) && !Object.prototype.hasOwnProperty.call(obsolete, n))
    .map((n) => ({ v: parseVersion(n.slice(EXT_PREFIX.length)), p: path.join(extDir, n, "resources", "native-binary", EXE) }))
    .filter((x) => x.v && isRunnable(x.p))
    .sort((a, b) => cmpVersion(/** @type {number[]} */ (b.v), /** @type {number[]} */ (a.v)))
    .map((x) => x.p);
}

function onPath() {
  const dirs = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  for (const d of dirs) {
    const p = path.join(d.replace(/^"|"$/g, ""), EXE);
    if (isRunnable(p)) return p;
  }
  return null;
}

/** 찾는 순서대로 [경로, 어디서] — 같은 경로는 한 번만 @returns {[string, string][]} */
function candidates() {
  const home = os.homedir();
  /** @type {[string, string][]} */
  const list = [];
  const fromEnv = (process.env.CLAUDE_BIN ?? "").trim().replace(/^"|"$/g, "");
  if (fromEnv) list.push([fromEnv, "CLAUDE_BIN"]);
  const p = onPath();
  if (p) list.push([p, "PATH"]);
  /** @type {[string, string][]} */
  const extDirs = [
    [path.join(home, ".vscode", "extensions"), "VS Code 확장"],
    [path.join(home, ".cursor", "extensions"), "Cursor 확장"],
    [path.join(home, ".vscode-server", "extensions"), "VS Code 원격 확장"],
    [path.join(home, ".cursor-server", "extensions"), "Cursor 원격 확장"],
    [path.join(home, ".vscode-remote", "extensions"), "Codespaces 확장"],
  ];
  for (const [dir, label] of extDirs) for (const x of inExtensions(dir)) list.push([x, label]);
  list.push([path.join(home, ".local", "bin", EXE), "~/.local/bin"]);
  const seen = new Set();
  return list.filter(([q]) => {
    const key = IS_WIN ? q.toLowerCase() : q;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** @type {{ hit: ClaudeHit | null, skipped: ClaudeSkipped[] } | null} */
let memo = null;

/**
 * 쓸 claude(2.1.0 이상)와, 그 앞에서 건너뛴 것들(옛 판 · 실행 안 됨)을 함께 돌려준다. 한 번만 찾는다.
 * @returns {{ hit: ClaudeHit | null, skipped: ClaudeSkipped[] }}
 */
export function findClaudeDetail() {
  if (memo) return memo;
  /** @type {ClaudeSkipped[]} */
  const skipped = [];
  for (const [p, source] of candidates()) {
    if (!isRunnable(p)) continue;
    const v = parseVersion(claudeVersion(p));
    if (v && cmpVersion(v, MIN) >= 0) {
      memo = { hit: { path: p, source, version: v.join(".") }, skipped };
      return memo;
    }
    skipped.push({ path: p, source, version: v ? v.join(".") : null });
  }
  memo = { hit: null, skipped };
  return memo;
}

/**
 * claude 실행 파일을 찾는다(2.1.0 이상만 — 옛 판은 건너뛰고 다음 자리로).
 * @returns {ClaudeHit | null}
 */
export function findClaude() {
  return findClaudeDetail().hit;
}

/** 건너뛴 것 한 줄(한국어) @param {ClaudeSkipped} s */
export function skippedLine(s) {
  return s.version
    ? `${s.source}의 claude(${s.version})는 옛 판(${MIN_VERSION} 미만)이라 건너뜀 — ${s.path}`
    : `${s.source}의 claude는 실행되지 않아 건너뜀 — ${s.path}`;
}

/** 실행 파일의 판 번호(예: "2.1.301 (Claude Code)"). 실패하면 null. @param {string} bin */
export function claudeVersion(bin) {
  const env = { ...process.env, DISABLE_AUTOUPDATER: "1" };
  delete env.ANTHROPIC_API_KEY;
  delete env.CLAUDECODE;
  for (const k of Object.keys(env)) if (k.startsWith("CLAUDE_CODE_")) delete env[k];
  try {
    const out = execFileSync(bin, ["--version"], {
      encoding: "utf8",
      timeout: 30_000,
      stdio: ["ignore", "pipe", "ignore"],
      env,
      cwd: os.tmpdir(),
      windowsHide: true,
    }).trim();
    return out || null;
  } catch {
    return null;
  }
}

/** 못 찾았을 때 보여 줄 고치는 법(한국어) */
export const NOT_FOUND_HELP = [
  "VS Code 왼쪽 확장(Extensions)에서 'Claude Code'를 설치하거나 업데이트한 뒤 VS Code를 완전히 껐다 켭니다.",
  "그래도 안 되면 Codespaces(GitHub 저장소 → Code → Codespaces)에서 합니다.",
  "경로를 알면 환경 변수 CLAUDE_BIN에 실행 파일 경로를 넣습니다.",
];

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain && process.argv.includes("--print")) {
  const { hit, skipped } = findClaudeDetail();
  if (!hit) {
    for (const s of skipped) console.log(`– ${skippedLine(s)}`);
    console.log(`✗ claude(${MIN_VERSION} 이상)를 찾지 못했습니다.`);
    for (const line of NOT_FOUND_HELP) console.log(`  → ${line}`);
    process.exit(1);
  }
  console.log(`✓ claude 찾음 — ${hit.source}`);
  console.log(`  경로: ${hit.path}`);
  console.log(`  판: ${hit.version}`);
  for (const s of skipped) console.log(`– ${skippedLine(s)}`);
}
