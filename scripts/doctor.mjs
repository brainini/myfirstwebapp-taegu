#!/usr/bin/env node
// 막히면 먼저 — 내 PC · 저장소 · DB · 비밀을 점검하고, 걸린 곳마다 고치는 법을 한 줄로 알려 준다. 고치지 않는다.
//
//   npm run doctor            기본 점검(Node · npm · git · 패키지 · 저장소 · .env · claude · 경로 · 연결)
//   npm run doctor:db         .env의 DB 주소 두 개를 검사하고 실제로 접속해 본다(비밀번호는 가려서 보여 준다)
//   npm run doctor:secrets    커밋 · 배포 전에 비밀이 섞이지 않았는지(PASS · WARN · FAIL)
//   node scripts/doctor.mjs rls   public 표 전부에 RLS를 켠다(npm run db:push가 마지막에 부른다)
//   선택: --no-net(기본 점검에서 연결 시험 건너뛰기)
import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { findClaudeDetail, MIN_VERSION, NOT_FOUND_HELP, skippedLine } from "./lib/find-claude.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MODE = process.argv.slice(2).find((a) => !a.startsWith("-")) ?? "default";
const FLAGS = new Set(process.argv.slice(2).filter((a) => a.startsWith("-")));
const WANT = { node: 24, next: "16.4.2", prisma: "7.10.1", client: "7.10.1" };

const count = { ok: 0, warn: 0, fail: 0, info: 0 };
/** 결과 줄 뒤에 찍을 '다음:' 줄(점검 수에는 넣지 않는다) @type {string[]} */
const afterResult = [];
function say(mark, kind, text, fix) {
  count[kind] += 1;
  console.log(`${mark} ${text}`);
  if (fix) for (const f of [].concat(fix)) console.log(`    → ${f}`);
}
const ok = (t) => say("✓", "ok", t);
const warn = (t, fix) => say("!", "warn", t, fix);
const fail = (t, fix) => say("✗", "fail", t, fix);
const info = (t, fix) => say("–", "info", t, fix);

function git(args, opts = {}) {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], ...opts }).trim();
}
function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

// .env를 읽는다(값은 화면에 쓰지 않는다)
function readEnvFile() {
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) return null;
  const vars = {};
  for (const raw of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = raw.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    else v = v.replace(/\s+#.*$/, "");
    vars[m[1]] = v;
  }
  return vars;
}

function maskUrl(raw) {
  try {
    const u = new URL(raw);
    const user = decodeURIComponent(u.username);
    const shownUser = user.length > 14 ? `${user.slice(0, 14)}…` : user;
    return `${u.protocol}//${shownUser}${u.password ? ":****" : ""}@${u.hostname}${u.port ? `:${u.port}` : ""}${u.pathname}`;
  } catch {
    return "(주소 모양이 아님)";
  }
}

function cleanDbUrl(raw) {
  const u = new URL(raw);
  u.searchParams.delete("pgbouncer");
  u.searchParams.delete("sslmode");
  return u.toString();
}

// ------------------------------------------------------------------ 기본 점검
async function checkDefault() {
  console.log("== 기본 점검 (npm run doctor)");

  const nodeMajor = Number(process.versions.node.split(".")[0]);
  if (nodeMajor === WANT.node) ok(`Node ${process.versions.node}`);
  else if (nodeMajor === 22 || nodeMajor === 26)
    warn(`Node ${process.versions.node} — 수업 기준은 24.x(대부분 되지만 막히면 24로)`, "nodejs.org/dist/v24.22.0/ 에서 node-v24.22.0-x64.msi(Mac은 .pkg) 설치 → VS Code를 완전히 껐다 켜기");
  else
    fail(`Node ${process.versions.node} — 24.x가 필요합니다`, [
      "nodejs.org/dist/v24.22.0/ 에서 node-v24.22.0-x64.msi(Mac은 node-v24.22.0.pkg) 설치",
      "설치 화면의 'Automatically install the necessary tools'는 체크하지 않는다 → 설치 뒤 VS Code를 완전히 껐다 켜기",
    ]);

  let npmV = (process.env.npm_config_user_agent ?? "").match(/npm\/(\S+)/)?.[1];
  if (!npmV) {
    try {
      npmV = execSync("npm -v", { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 20_000 }).trim();
    } catch {
      npmV = undefined;
    }
  }
  if (npmV) ok(`npm ${npmV}`);
  else fail("npm을 찾지 못했습니다", "Node 24를 다시 설치한 뒤 VS Code를 완전히 껐다 켜기(PowerShell에서 막히면 명령 프롬프트 cmd로)");

  try {
    ok(git(["--version"]).replace("git version", "git"));
  } catch {
    fail("git을 찾지 못했습니다", "git-scm.com 에서 Git 설치 → VS Code를 완전히 껐다 켜기");
  }

  const pkg = (name) => readJson(path.join(ROOT, "node_modules", ...name.split("/"), "package.json"))?.version;
  const vNext = pkg("next");
  const vPrisma = pkg("prisma");
  const vClient = pkg("@prisma/client");
  const generated = fs.existsSync(path.join(ROOT, "lib", "generated", "prisma", "client.ts"));
  if (!vNext || !vPrisma || !vClient) {
    fail("패키지(node_modules)가 아직 없습니다", "터미널에서 npm ci (와이파이에 따라 2–20분) — 15:25까지 안 끝나면 Codespaces로");
  } else if (vNext !== WANT.next || vPrisma !== WANT.prisma || vClient !== WANT.client) {
    fail(`패키지 판이 다릅니다 — next ${vNext} · prisma ${vPrisma} · @prisma/client ${vClient}`, "npm ci 를 다시 실행(package-lock.json 그대로 설치) — npm install 로 판을 바꾸지 않는다");
  } else if (!generated) {
    fail(`next ${vNext} · prisma ${vPrisma} 설치됨 — 그런데 prisma generate 결과(lib/generated)가 없습니다`, "npm run postinstall (= prisma generate)");
  } else {
    ok(`next ${vNext} · prisma ${vPrisma} · @prisma/client ${vClient} 설치됨 · prisma generate 결과 있음`);
  }

  let inRepo = false;
  try {
    inRepo = git(["rev-parse", "--is-inside-work-tree"]) === "true";
  } catch {
    inRepo = false;
  }
  if (!inRepo) {
    fail("git 저장소가 아닙니다(ZIP으로 받았나요?)", "GitHub의 내 저장소를 VS Code 'Git: Clone'으로 받아 그 폴더에서 다시");
  } else {
    let origin = "";
    try {
      origin = git(["remote", "get-url", "origin"]);
    } catch {
      origin = "";
    }
    const shown = origin.replace(/\/\/[^@/]+@/, "//").replace(/\.git$/, "");
    const branch = (() => {
      try {
        return git(["branch", "--show-current"]);
      } catch {
        return "";
      }
    })();
    if (!origin) warn("origin(내 GitHub 저장소)이 없습니다", "GitHub에서 'Use this template'으로 만든 내 저장소를 'Git: Clone'으로 받기");
    else if (/\/tradefin-web-starter$/.test(shown))
      warn(`origin이 템플릿 원본입니다(${shown}) — 여기에는 push할 수 없습니다`, "GitHub 템플릿 쪽에서 'Use this template' → 내 저장소(tradefin-web-T조-번호)를 만들고 그것을 clone");
    else ok(`저장소 origin ${shown}${branch ? ` · 가지 ${branch}` : ""}`);
    if (branch && branch !== "main") warn(`지금 가지가 ${branch}입니다 — 웹 저장소는 main에서 작업합니다(push = 배포)`, "git switch main");
  }

  const env = readEnvFile();
  if (!env) {
    info(".env 없음(5일차)", "5일차 실습 C에서 npm run env:init 으로 만듭니다");
  } else {
    const filled = Object.keys(env).filter((k) => env[k] !== "");
    const empty = Object.keys(env).filter((k) => env[k] === "");
    ok(`.env 있음 — 채운 이름: ${filled.length ? filled.join(" · ") : "없음"}${empty.length ? ` · 빈 이름: ${empty.join(" · ")}` : ""} (값은 보이지 않음)`);
    const leaky = Object.keys(env).filter((k) => /^NEXT_PUBLIC_.*(KEY|SECRET|PASSWORD|PIN|TOKEN|DATABASE)/i.test(k));
    if (leaky.length) fail(`.env에 브라우저로 새는 이름이 있습니다: ${leaky.join(" · ")}`, "비밀값 이름 앞의 NEXT_PUBLIC_ 를 지우고, 그 값을 쓰는 코드는 서버(서버 컴포넌트 · 서버 액션 · route handler)로");
  }
  for (const extra of [".env.local", ".env.development", ".env.production"]) {
    if (fs.existsSync(path.join(ROOT, extra))) warn(`${extra} 이 있습니다 — 이 저장소는 .env 하나만 씁니다(prisma는 .env만 읽음)`, `값을 .env로 옮기고 ${extra}는 지우기`);
  }

  // 2.1.0보다 옛 claude(예: 예전에 따로 설치해 PATH에 남은 것)는 건너뛰고 확장의 새 판을 쓴다
  const { hit: claude, skipped } = findClaudeDetail();
  if (claude) {
    ok(`claude ${claude.version} — ${claude.source} (${claude.path})`);
    for (const s of skipped) info(skippedLine(s));
  } else if (skipped.length) {
    for (const s of skipped) info(skippedLine(s));
    warn(`쓸 수 있는 claude(${MIN_VERSION} 이상)가 없습니다 — 5일차 '초안 로봇'(npm run drafts)에 필요`, [
      ...NOT_FOUND_HELP,
      "PATH의 옛 claude를 계속 쓰려면 터미널에서 claude update 로 올린 뒤 다시 npm run doctor",
    ]);
  } else {
    warn("claude(Claude Code 실행 파일)를 찾지 못했습니다 — 5일차 '초안 로봇'(npm run drafts)에 필요", NOT_FOUND_HELP);
  }

  if (process.env.ANTHROPIC_API_KEY)
    warn("ANTHROPIC_API_KEY가 설정돼 있습니다 — 이 저장소의 도우미는 지우고 부르므로 추가 청구는 없습니다", "쓰지 않는 키라면 Windows '환경 변수 편집'에서 지우기");
  else ok("ANTHROPIC_API_KEY 없음 — 구독 사용, 추가 청구 없음");

  const nonAscii = (s) => /[^\x00-\x7F]/.test(s);
  if (nonAscii(os.homedir())) warn(`홈 폴더 경로에 한글 등이 있습니다(${os.homedir()}) — 일부 도구가 실패할 수 있음`, "저장소는 C:\\work\\ 처럼 영문 경로에 두기 · 막히면 Codespaces");
  if (nonAscii(ROOT) || /\s/.test(ROOT)) warn(`저장소 경로에 한글 · 빈칸이 있습니다(${ROOT})`, "C:\\work\\tradefin-web-T조-번호 처럼 영문 · 빈칸 없는 경로로 다시 clone");
  if (/onedrive/i.test(ROOT)) warn("저장소가 OneDrive 폴더 안에 있습니다 — 동기화가 파일을 잠가 npm ci · build가 자주 실패합니다", "C:\\work\\ 아래로 다시 clone");

  if (!FLAGS.has("--no-net")) await checkNet();
}

async function checkNet() {
  const targets = [
    ["npm", "https://registry.npmjs.org/-/ping"],
    ["prisma 엔진", "https://binaries.prisma.sh/"],
    ["GitHub", "https://github.com/"],
    ["Vercel", "https://vercel.com/"],
    ["Supabase", "https://supabase.com/"],
    ["환율 API", "https://api.frankfurter.dev/v2/rates?base=USD&quotes=KRW"],
  ];
  const results = await Promise.all(
    targets.map(async ([label, url]) => {
      try {
        await fetch(url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(6000) });
        return [label, true];
      } catch {
        return [label, false];
      }
    }),
  );
  const down = results.filter(([, up]) => !up).map(([l]) => l);
  if (!down.length) ok(`연결: ${results.map(([l]) => l).join(" · ")}`);
  else warn(`연결 안 됨: ${down.join(" · ")}`, "와이파이를 바꾸거나 휴대폰 핫스팟으로 → 그래도 안 되면 Codespaces");
}

// ------------------------------------------------------------------ DB 공통
function loadEnvForDb() {
  const p = path.join(ROOT, ".env");
  if (!fs.existsSync(p)) {
    fail(".env가 없습니다", "npm run env:init → Ctrl+P → .env 를 열어 Supabase의 두 줄을 붙여 넣고 저장");
    return null;
  }
  const env = readEnvFile();
  return { DATABASE_URL: env.DATABASE_URL ?? "", DIRECT_URL: env.DIRECT_URL ?? "" };
}

function explainDbError(e) {
  const code = e?.code ?? "";
  const msg = String(e?.message ?? e);
  if (code === "28P01" || /password authentication failed/i.test(msg))
    return ["비밀번호가 틀렸습니다", "[YOUR-PASSWORD]를 내 비밀번호로 바꿨는지(대괄호까지 지움) 확인 · 모르면 Supabase → Database → Settings → Reset database password(영문+숫자) → .env의 두 줄 모두 고치기"];
  if (/tenant or user not found/i.test(msg))
    return ["사용자 이름이 틀렸습니다(Tenant or user not found)", "사용자는 postgres.<프로젝트ref> 모양 — Connect → ORMs → Prisma 화면에서 두 줄을 다시 복사"];
  if (code === "ENOTFOUND" || code === "EAI_AGAIN")
    return ["주소(호스트)를 찾지 못했습니다", "오타 확인 · db.….supabase.co(직접 연결, IPv6 전용) 주소라면 pooler 주소로 · 인터넷 연결 확인"];
  if (code === "ENETUNREACH" || code === "EHOSTUNREACH")
    return ["이 네트워크에서 DB에 닿지 않습니다(IPv6 문제일 수 있음)", "Connect 화면의 pooler 주소(…pooler.supabase.com) 쓰기 · 휴대폰 핫스팟 · Codespaces"];
  if (code === "ETIMEDOUT" || /timeout|timed out/i.test(msg))
    return ["시간 초과", "회사 · 학교 네트워크가 5432 · 6543 포트를 막을 수 있음 → 핫스팟 · Codespaces · 프로젝트가 일시 정지(Paused)면 Supabase에서 Restore"];
  if (code === "ECONNREFUSED") return ["연결이 거부됐습니다", "주소 · 포트(6543 · 5432)를 다시 복사"];
  if (/self[- ]signed|certificate/i.test(msg))
    return ["SSL 인증서 오류", "주소 끝에 ?sslmode=… 를 손으로 더했다면 지우기(lib/db.ts가 SSL을 처리)"];
  if (code === "3D000") return ["DB 이름이 틀렸습니다", "주소 끝은 /postgres — 다시 복사"];
  if (code === "42501" || /permission denied|P1010/i.test(msg)) return ["권한이 없습니다", "사용자 postgres.<프로젝트ref> 주소인지 확인 → 다시 복사"];
  if (code === "53300" || /too many|circuit breaker/i.test(msg)) return ["연결이 너무 많습니다", "npm run dev를 끄고 1분 뒤 다시"];
  return [`연결 실패(${code || "오류"}): ${msg.slice(0, 160)}`, "npm run doctor:db 결과 전체를 c-dbfix 프롬프트에 붙여 원인부터 찾기"];
}

async function pgClient(raw) {
  const pg = (await import("pg")).default;
  const client = new pg.Client({ connectionString: cleanDbUrl(raw), ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10_000 });
  await client.connect();
  return client;
}

function lintUrl(name, raw, wantPort, label) {
  if (!raw) {
    fail(`${name}가 비어 있습니다`, "Supabase → 내 프로젝트 → Connect → ORMs → Prisma 에서 복사해 .env에 붙여 넣기");
    return false;
  }
  if (raw.includes("[YOUR-PASSWORD]")) {
    fail(`${name}에 [YOUR-PASSWORD]가 그대로 있습니다`, "[YOUR-PASSWORD]를 대괄호까지 지우고 내 DB 비밀번호로 바꾸기(두 줄 모두)");
    return false;
  }
  let u;
  try {
    u = new URL(raw);
  } catch {
    fail(`${name}의 주소 모양이 깨졌습니다`, "비밀번호에 @ : / # ? 같은 기호가 있으면 주소가 깨집니다 → Supabase에서 영문+숫자 16자 이상으로 Reset → 다시 붙여 넣기");
    return false;
  }
  if (!/^postgres(ql)?:$/.test(u.protocol)) {
    fail(`${name}가 postgresql:// 로 시작하지 않습니다 — ${maskUrl(raw)}`, "Connect → ORMs → Prisma 화면의 줄을 그대로 복사");
    return false;
  }
  let good = true;
  const shown = maskUrl(raw);
  const pw = decodeURIComponent(u.password);
  if (/^db\.[a-z0-9]+\.supabase\.co$/i.test(u.hostname)) {
    fail(`${name}가 직접 연결 주소입니다(db.….supabase.co — IPv6 전용이라 대부분의 네트워크에서 안 됨) — ${shown}`, "Connect → ORMs → Prisma 화면의 pooler 주소(…pooler.supabase.com)로 바꾸기");
    good = false;
  }
  if (u.port !== String(wantPort)) {
    fail(`${name}의 포트가 ${u.port || "없음"}입니다 — ${wantPort}(${label})여야 합니다 — ${shown}`, "DATABASE_URL = 6543(Transaction pooler) · DIRECT_URL = 5432(Session pooler) — 두 줄이 바뀌지 않았는지");
    good = false;
  }
  if (/pooler\.supabase\.com$/i.test(u.hostname) && !decodeURIComponent(u.username).startsWith("postgres.")) {
    fail(`${name}의 사용자 이름이 postgres.<프로젝트ref> 모양이 아닙니다 — ${shown}`, "Connect 화면에서 다시 복사(사용자 이름을 고치지 않는다)");
    good = false;
  }
  if (!pw) {
    fail(`${name}에 비밀번호가 없습니다 — ${shown}`, "postgres.<ref>:비밀번호@ 모양인지 확인 → 다시 복사");
    good = false;
  } else if (/[[\]]/.test(pw)) {
    fail(`${name}의 비밀번호에 대괄호 [ ]가 남아 있습니다`, "[YOUR-PASSWORD]를 바꿀 때 대괄호까지 지우기");
    good = false;
  } else if (/[^A-Za-z0-9]/.test(pw)) {
    warn(`${name}의 비밀번호에 기호가 있습니다 — 주소가 깨질 수 있습니다`, "Supabase에서 영문+숫자 16자 이상으로 Reset 권장(두 줄 모두 고치기)");
  }
  if (good) ok(`${name} 모양 OK — ${shown} (${label})`);
  return good;
}

async function checkDb() {
  console.log("== DB 점검 (npm run doctor:db) — .env의 주소 두 개(비밀번호는 ****)");
  const env = loadEnvForDb();
  if (!env) return;
  const rows = [
    ["DATABASE_URL", env.DATABASE_URL, 6543, "트랜잭션 풀러", "앱 · Vercel"],
    ["DIRECT_URL", env.DIRECT_URL, 5432, "세션 풀러", "db:push"],
  ];
  let tablesShown = false;
  for (const [name, raw, port, label, use] of rows) {
    if (!lintUrl(name, raw, port, `${label} — ${use}`)) continue;
    const t0 = Date.now();
    let client;
    try {
      client = await pgClient(raw);
      const r = await client.query("select current_setting('server_version') as v");
      ok(`${name} … :${port} (${label}) 연결 OK · PostgreSQL ${r.rows[0].v.split(" ")[0]} · ${Date.now() - t0}ms`);
      if (!tablesShown) {
        tablesShown = true;
        const t = await client.query(
          "select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by 1",
        );
        if (!t.rows.length) info("표: 아직 없음(표 만들기는 npm run db:push)");
        else {
          const parts = [];
          for (const { table_name } of t.rows) {
            const c = await client.query(`select count(*)::int as n from public."${table_name.replace(/"/g, '""')}"`);
            parts.push(`${table_name} ${c.rows[0].n}행`);
          }
          ok(`표: ${parts.join(" · ")}`);
        }
      }
    } catch (e) {
      const [what, fix] = explainDbError(e);
      fail(`${name} … :${port} (${label}) ${what}`, fix);
    } finally {
      await client?.end().catch(() => {});
    }
  }
}

async function enableRls() {
  console.log("== RLS 켜기 (public 표 전부 — 이미 켜져 있으면 그대로)");
  const env = loadEnvForDb();
  if (!env) return;
  const raw = env.DIRECT_URL || env.DATABASE_URL;
  if (!raw || raw.includes("[YOUR-PASSWORD]")) {
    fail("DB 주소가 비어 있거나 [YOUR-PASSWORD]가 그대로입니다", "npm run doctor:db 로 먼저 점검");
    return;
  }
  let client;
  try {
    client = await pgClient(raw);
    await client.query(`DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;`);
    const r = await client.query(`select c.relname as name, c.relrowsecurity as rls
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' order by 1`);
    const on = r.rows.filter((x) => x.rls).length;
    if (!r.rows.length) info("public 표가 아직 없습니다 — 표를 만든 뒤(npm run db:push) 다시");
    else if (on === r.rows.length) ok(`RLS 켬 ${on}/${r.rows.length} (${r.rows.map((x) => x.name).join(" · ")}) — Supabase 공개 API로는 읽고 쓸 수 없음 · 앱은 서버에서 그대로`);
    else fail(`RLS 켬 ${on}/${r.rows.length}`, "다시 실행: node scripts/doctor.mjs rls");
    // db:push가 Prisma 클라이언트를 새로 만들어도, 켜 둔 npm run dev는 예전 것(lib/db.ts가 globalThis에 둔 연결)을 그대로 쓴다
    // → 새 표는 undefined(findMany) · 새 칸은 Unknown argument. 결과 줄 뒤에 '다음:'으로 알린다(점검 수에는 넣지 않는다).
    if (r.rows.length)
      afterResult.push(
        "다음: npm run dev가 켜져 있으면 Ctrl+C 후 다시 켜기 — 새 표 · 칸을 앱이 알게(켜 둔 앱은 예전 연결을 붙잡고 있다 · 그대로 두면 Unknown argument · reading 'findMany' 오류)",
      );
  } catch (e) {
    const [what, fix] = explainDbError(e);
    fail(`RLS 켜기 실패 — ${what}`, fix);
  } finally {
    await client?.end().catch(() => {});
  }
}

// ------------------------------------------------------------------ 비밀 점검
function listFiles() {
  const out = execFileSync("git", ["ls-files", "-z", "--cached", "--others", "--exclude-standard"], { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  return out.split("\0").filter(Boolean);
}

function walk(dir) {
  const res = [];
  if (!fs.existsSync(dir)) return res;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) res.push(...walk(p));
    else if (e.isFile()) res.push(p);
  }
  return res;
}

function readText(abs) {
  try {
    const st = fs.statSync(abs);
    if (st.size > 3 * 1024 * 1024) return null;
    const buf = fs.readFileSync(abs);
    if (buf.subarray(0, 8000).includes(0)) return null; // 이진 파일
    return buf.toString("utf8");
  } catch {
    return null;
  }
}

const PLACEHOLDER_PW = /^(\[.*\]|<.*>|\*+|\.{3}|p|pw|pass|password|PASSWORD|비밀번호|your-password|YOUR-PASSWORD)$/;
const KEY_PATTERNS = [
  ["sk-ant-", /sk-ant-[A-Za-z0-9_-]{16,}/],
  ["sk-proj-", /sk-proj-[A-Za-z0-9_-]{16,}/],
  ["ghp_", /ghp_[A-Za-z0-9]{30,}/],
  ["github_pat_", /github_pat_[A-Za-z0-9_]{30,}/],
  ["AKIA", /AKIA[0-9A-Z]{16}/],
  ["PRIVATE KEY", new RegExp("-----BEGIN [A-Z ]*" + "PRIVATE KEY-----")],
];
const CODE_EXT = /\.(ts|tsx|js|jsx|mjs|cjs|json)$/i;

function lineOf(text, index) {
  return text.slice(0, index).split("\n").length;
}

async function checkSecrets() {
  let files;
  try {
    files = listFiles();
  } catch {
    console.log("== 비밀 점검 (npm run doctor:secrets)");
    fail("git 저장소가 아닙니다", "저장소 폴더에서 다시 실행");
    return;
  }
  const scan = files.filter((f) => f !== "package-lock.json" && !f.startsWith("lib/generated/"));
  const staticDir = path.join(ROOT, ".next", "static");
  const staticFiles = walk(staticDir);
  console.log(`== 비밀 점검 (npm run doctor:secrets) — 커밋될 파일 ${scan.length}개 · .next/static ${staticFiles.length}개`);
  const pass = (t) => say("✓ PASS", "ok", t);
  const bad = (t, fix) => say("✗ FAIL", "fail", t, fix);
  const careful = (t, fix) => say("! WARN", "warn", t, fix);

  // 1) .env가 커밋되는가
  const envish = (f) => /(^|\/)\.env(\..+)?$/.test(f) && !f.endsWith(".env.example");
  let tracked = [];
  try {
    tracked = execFileSync("git", ["ls-files", "-z", "--cached"], { cwd: ROOT, encoding: "utf8" }).split("\0").filter(Boolean);
  } catch {
    tracked = [];
  }
  const envTracked = tracked.filter(envish);
  const envLoose = files.filter(envish).filter((f) => !envTracked.includes(f));
  if (envTracked.length)
    bad(`추적 중인 .env: ${envTracked.join(" · ")}`, [
      "git rm --cached .env → 커밋 → push",
      "이미 push했다면 비밀번호가 공개된 것 — Supabase에서 DB 비밀번호 Reset → .env · Vercel 환경 변수 두 곳 고치기",
    ]);
  else if (envLoose.length) bad(`.gitignore에 걸리지 않은 .env 파일: ${envLoose.join(" · ")}`, ".gitignore에 .env · .env.* 줄이 있는지 확인(템플릿 그대로 두기)");
  else pass("추적 중인 .env 없음");
  try {
    const hist = execFileSync("git", ["log", "--all", "--format=", "--name-only", "--diff-filter=A", "--", ".env", ".env.*", "**/.env", "**/.env.*"], { cwd: ROOT, encoding: "utf8" })
      .split("\n")
      .map((s) => s.trim())
      .filter((f) => f && envish(f));
    if (hist.length) careful(`예전 커밋에 .env가 들어간 적이 있습니다: ${[...new Set(hist)].join(" · ")}`, "push한 적이 있다면 그 비밀번호는 공개된 것 — Supabase에서 Reset 했는지 확인");
  } catch {
    /* 커밋이 아직 없음 */
  }

  // 2) 비밀번호가 든 DB 주소 · 3) NEXT_PUBLIC_ 비밀 · 4) 키 모양
  const dbHits = [];
  const pubHits = [];
  const keyHits = [];
  const emailHits = [];
  const dbRe = /postgres(?:ql)?:\/\/([^\s:@/'"`]+):([^\s@/'"`]+)@([^\s/:'"`?]+)/gi;
  const pubRe = /NEXT_PUBLIC_[A-Z0-9_]*(KEY|SECRET|PASSWORD|PIN|TOKEN|DATABASE)[A-Z0-9_]*/g;
  const emailRe = /[A-Za-z0-9._%+-]+@([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,})/g;
  const emailDirs = /^(app|components|lib|data|prisma)\//;
  for (const f of scan) {
    const text = readText(path.join(ROOT, f));
    if (text === null) continue;
    for (const m of text.matchAll(dbRe)) {
      const pw = decodeURIComponent(m[2]);
      const host = m[3].toLowerCase();
      if (PLACEHOLDER_PW.test(pw) || /^(localhost|127\.0\.0\.1)$/.test(host) || host.endsWith(".example") || host.includes("example.com")) continue;
      dbHits.push(`${f}:${lineOf(text, m.index)}`);
    }
    if (CODE_EXT.test(f) || /(^|\/)\.env/.test(f)) for (const m of text.matchAll(pubRe)) pubHits.push(`${f}:${lineOf(text, m.index)} ${m[0]}`);
    for (const [label, re] of KEY_PATTERNS) {
      const m = text.match(re);
      if (m) keyHits.push(`${f}:${lineOf(text, m.index ?? 0)} (${label}…)`);
    }
    if (emailDirs.test(f) && !f.startsWith("lib/generated/")) {
      for (const m of text.matchAll(emailRe)) {
        const domain = m[1].toLowerCase();
        if (domain.endsWith(".example") || /^example\.(com|org|net)$/.test(domain)) continue;
        emailHits.push(`${f}:${lineOf(text, m.index)} ${m[0]}`);
      }
    }
  }
  if (dbHits.length) bad(`비밀번호가 든 DB 주소: ${dbHits.slice(0, 5).join(" · ")}`, "주소는 .env에만 — 코드 · 문서에서 지우고, 이미 push했다면 Supabase에서 비밀번호 Reset");
  else pass("비밀번호가 든 DB 주소 없음");
  if (pubHits.length) bad(`브라우저로 가는 이름에 비밀: ${pubHits.slice(0, 5).join(" · ")}`, "NEXT_PUBLIC_ 를 떼고 서버 코드(서버 액션 · route handler)에서만 process.env로 읽기");
  else pass("NEXT_PUBLIC_ 이름에 비밀 없음");
  if (keyHits.length) bad(`키 모양 글자: ${keyHits.slice(0, 5).join(" · ")}`, "그 줄을 지우고, 진짜 키였다면 발급한 곳에서 키를 폐기(revoke) 후 새로 발급");
  else pass("키 모양(sk-ant- · sk-proj- · ghp_ · github_pat_ · AKIA · PRIVATE KEY) 없음");

  // 5) .env 값이 브라우저로 가는 파일(.next/static)에 들어갔나
  const env = readEnvFile();
  if (!staticFiles.length) info(".next/static 없음 — npm run build 뒤에 다시 돌리면 이 검사도 합니다");
  else if (!env) info(".env 없음 — 값 검사는 건너뜀");
  else {
    const needles = [];
    for (const [k, v] of Object.entries(env)) {
      if (!v) continue;
      if (/^postgres(ql)?:\/\//.test(v)) {
        try {
          const pw = decodeURIComponent(new URL(v).password);
          if (pw.length >= 6) needles.push([k, pw]);
        } catch {
          /* 깨진 주소 */
        }
        needles.push([k, v]);
      } else if (v.length >= 6) needles.push([k, v]);
    }
    const leaked = new Set();
    for (const abs of staticFiles) {
      const text = readText(abs);
      if (text === null) continue;
      for (const [k, v] of needles) if (text.includes(v)) leaked.add(k);
    }
    if (leaked.size) bad(`브라우저로 가는 파일(.next/static)에 .env 값이 있습니다: ${[...leaked].join(" · ")}`, "'use client' 파일 · NEXT_PUBLIC_에서 그 값을 쓰지 않게 고치고 npm run build 후 다시");
    else pass(`.next/static에 .env 값 없음(이름 ${needles.length ? [...new Set(needles.map(([k]) => k))].join(" · ") : "없음"} 확인)`);
  }

  // 6) 실제처럼 보이는 이메일
  if (emailHits.length) careful(`가상 주소가 아닌 이메일: ${emailHits.slice(0, 5).join(" · ")}`, "이메일은 @….example 로만(예: credit@hanbitprecision.example)");
  else pass("실제처럼 보이는 이메일 없음(app · components · lib · data · prisma)");
}

// ------------------------------------------------------------------ 실행
const runners = { default: checkDefault, db: checkDb, rls: enableRls, secrets: checkSecrets };
const run = runners[MODE];
if (!run) {
  console.log(`모르는 점검: ${MODE} — node scripts/doctor.mjs [db | rls | secrets]`);
  process.exit(2);
}
await run();
if (MODE === "secrets") {
  console.log(`\n결과: PASS ${count.ok} · WARN ${count.warn} · FAIL ${count.fail}${count.fail ? " — FAIL을 고친 뒤 커밋 · push" : ""}`);
} else {
  console.log(`\n결과: ✓ ${count.ok} · ! ${count.warn} · ✗ ${count.fail}${count.info ? ` · – ${count.info}` : ""}${count.fail ? " — ✗ 줄의 → 를 따라 고친 뒤 다시" : " — 문제 없음"}`);
}
for (const line of afterResult) console.log(line);
process.exit(count.fail ? 1 : 0);
