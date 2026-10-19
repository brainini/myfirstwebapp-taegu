// claude -p(내 PC의 Claude Code, 구독 로그인)를 한 번 불러 JSON 하나를 받는다 — scripts/에서만 쓴다(앱 화면 코드에서 import 하지 않는다).
// 고치지 않는다. API 키는 쓰지 않는다(ANTHROPIC_API_KEY를 지우고 부른다 → 추가 청구 없음).
//
//   import { askClaudeJson } from "./lib/ask-claude";
//   const out = await askClaudeJson<{ answer: string }>({ prompt: "…", schema: { type: "object", … } });
//
//   npx tsx scripts/lib/ask-claude.ts --check    # 찾기 · 판 · 키 상태 · 시험 호출 한 번(pong)
import { spawn } from "node:child_process";
import os from "node:os";
import { findClaudeDetail, MIN_VERSION, NOT_FOUND_HELP, skippedLine } from "./find-claude.mjs";

export type AskOptions = {
  prompt: string; // 표준입력(UTF-8)으로 보낸다
  schema: Record<string, unknown>; // JSON Schema — 답의 모양
  model?: string; // 기본 "sonnet"
  system?: string; // 시스템 지시문(선택)
  timeoutMs?: number; // 기본 120초
};

export type AskErrorKind = "not-found" | "login" | "limit" | "timeout" | "output" | "failed";

export class AskClaudeError extends Error {
  kind: AskErrorKind;
  constructor(kind: AskErrorKind, message: string) {
    super(message);
    this.name = "AskClaudeError";
    this.kind = kind;
  }
}

const LOGIN_RE = /not logged in|please run \/login|invalid api key|oauth|authenticat|login/i;
const LIMIT_RE = /usage limit|limit reached|rate limit|too many requests|overloaded|quota/i;

/** 자식 프로세스에 넘길 환경: 키 · 중첩 세션 표시를 지운다 */
export function cleanEnv(): NodeJS.ProcessEnv {
  const env: NodeJS.ProcessEnv = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  delete env.CLAUDECODE;
  for (const k of Object.keys(env)) if (k.startsWith("CLAUDE_CODE_")) delete env[k];
  env.DISABLE_AUTOUPDATER = "1";
  return env;
}

function classify(text: string): AskClaudeError {
  const t = text.slice(0, 300);
  if (LIMIT_RE.test(t)) return new AskClaudeError("limit", `사용량 한도에 걸렸습니다 — 잠시 뒤 다시 실행하세요(이미 만든 결과는 그대로 둡니다). 원문: ${t}`);
  if (LOGIN_RE.test(t)) return new AskClaudeError("login", `로그인이 필요합니다 — VS Code의 Claude Code 창에서 한 번 로그인한 뒤 다시 실행하세요. 원문: ${t}`);
  return new AskClaudeError("failed", `claude 실행이 실패했습니다: ${t}`);
}

function parseLoose(text: string): unknown {
  const s = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  return JSON.parse(s);
}

/** claude -p를 한 번 불러 schema 모양의 JSON을 돌려준다. 실패하면 AskClaudeError(한국어 메시지). */
export async function askClaudeJson<T>({ prompt, schema, model = "sonnet", system, timeoutMs = 120_000 }: AskOptions): Promise<T> {
  const { hit, skipped } = findClaudeDetail();
  if (!hit) {
    const why = skipped.length ? ` 찾았지만 쓸 수 없는 것: ${skipped.map(skippedLine).join(" · ")}.` : "";
    throw new AskClaudeError("not-found", `claude(${MIN_VERSION} 이상)를 찾지 못했습니다.${why} ${NOT_FOUND_HELP.join(" ")}`);
  }

  const args = [
    "-p",
    "--output-format", "json",
    "--json-schema", JSON.stringify(schema),
    "--tools", "",
    "--no-session-persistence",
    "--model", model,
  ];
  if (system) args.push("--system-prompt", system);

  const { code, stdout, stderr, timedOut } = await new Promise<{ code: number | null; stdout: string; stderr: string; timedOut: boolean }>(
    (resolve, reject) => {
      const child = spawn(hit.path, args, { cwd: os.tmpdir(), env: cleanEnv(), stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
      const out: Buffer[] = [];
      const err: Buffer[] = [];
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        child.kill();
      }, timeoutMs);
      child.stdout.on("data", (b: Buffer) => out.push(b));
      child.stderr.on("data", (b: Buffer) => err.push(b));
      child.on("error", (e) => {
        clearTimeout(timer);
        reject(new AskClaudeError("failed", `claude를 실행하지 못했습니다(${hit.path}): ${e.message}`));
      });
      child.on("close", (c) => {
        clearTimeout(timer);
        resolve({ code: c, stdout: Buffer.concat(out).toString("utf8"), stderr: Buffer.concat(err).toString("utf8"), timedOut });
      });
      child.stdin.on("error", () => {}); // 자식이 먼저 끝나도 멈추지 않게
      child.stdin.end(Buffer.from(prompt, "utf8"));
    },
  );

  if (timedOut) throw new AskClaudeError("timeout", `${Math.round(timeoutMs / 1000)}초 안에 답이 없어 멈췄습니다 — 다시 실행하거나 --limit으로 줄여 보세요.`);

  let res: { is_error?: boolean; result?: string; subtype?: string; structured_output?: unknown };
  try {
    res = JSON.parse(stdout);
  } catch {
    throw classify(stderr || stdout || `종료 코드 ${code}`);
  }
  if (res.is_error || code !== 0) throw classify(String(res.result ?? res.subtype ?? stderr ?? "오류"));

  if (res.structured_output !== undefined && res.structured_output !== null) return res.structured_output as T;
  try {
    return parseLoose(String(res.result ?? "")) as T;
  } catch {
    throw new AskClaudeError("output", "답에서 JSON을 읽지 못했습니다(구조화 출력이 비어 있음) — 다시 실행해 보세요.");
  }
}

/** 동시에 limit개까지만 돌린다(예: 초안 22건을 3개씩). 결과는 입력 순서대로. */
export async function mapLimit<I, O>(items: I[], limit: number, fn: (item: I, index: number) => Promise<O>): Promise<O[]> {
  const results = new Array<O>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// ---- npx tsx scripts/lib/ask-claude.ts --check
async function check() {
  const { hit, skipped } = findClaudeDetail();
  if (!hit) {
    for (const s of skipped) console.log(`– ${skippedLine(s)}`);
    console.log(`✗ claude(${MIN_VERSION} 이상)를 찾지 못했습니다.`);
    for (const line of NOT_FOUND_HELP) console.log(`  → ${line}`);
    process.exit(1);
  }
  console.log(`✓ claude 찾음 — ${hit.source}: ${hit.path}`);
  console.log(`✓ 판: ${hit.version}`);
  for (const s of skipped) console.log(`– ${skippedLine(s)}`);
  console.log(
    process.env.ANTHROPIC_API_KEY
      ? "✓ ANTHROPIC_API_KEY가 있지만 이 도우미는 지우고 부릅니다 — 구독 사용, 추가 청구 없음"
      : "✓ API 키 없음 — 구독 사용, 추가 청구 없음",
  );
  const t0 = Date.now();
  try {
    const out = await askClaudeJson<{ answer: string }>({
      prompt: "pong 이라고만 답해",
      schema: { type: "object", properties: { answer: { type: "string" } }, required: ["answer"], additionalProperties: false },
    });
    console.log(`✓ 시험 호출: ${JSON.stringify(out)} · ${((Date.now() - t0) / 1000).toFixed(1)}초`);
  } catch (e) {
    console.log(`✗ 시험 호출 실패: ${e instanceof Error ? e.message : String(e)}`);
    process.exit(1);
  }
}

if (/ask-claude\.[cm]?[jt]s$/.test(process.argv[1] ?? "") && process.argv.includes("--check")) {
  void check();
}
