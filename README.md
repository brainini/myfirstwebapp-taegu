# tradefin-web — 한빛정밀 웹 작업대

4–6일차 웹 실습 저장소입니다. (가상) 한빛정밀(주)의 합성 데이터로 Next.js 웹앱을 만들고, Vercel에 올려 휴대폰에서 엽니다.
코드는 AI(Claude Code)가 쓰고, 판단 · 승인은 사람이 합니다.

> 이 저장소는 **템플릿**입니다. 그대로 clone하지 말고, 아래 1번처럼 **내 저장소를 만들어** 씁니다.

## 5분 시작(4일차 실습 D)
순서가 중요합니다 — **주소(배포)를 먼저** 만들고, 내 PC 설치는 그다음입니다. 내 PC 설치가 느려도 화면은 이미 인터넷에 떠 있습니다.

0. **Node 24**(한 번만) — <https://nodejs.org/dist/v24.22.0/> 에서 Windows는 `node-v24.22.0-x64.msi`, Mac은 `node-v24.22.0.pkg` → 설치.
   설치 화면의 'Automatically install the necessary tools'는 **체크하지 않습니다**. 설치 뒤 VS Code를 완전히 껐다 켜고 `node -v` → `v24.22.0`.
1. **내 저장소 만들기** — 이 쪽 위의 초록 단추 **Use this template → Create a new repository**
   → Owner: 나 · 이름 `tradefin-web-T{조}-{번호}`(예: `tradefin-web-T2-07`) · **Public** · 'Include all branches'는 끈 채로 → **Create repository**.
2. **주소 만들기(배포)** — vercel.com → **Continue with GitHub** → **Add New → Project**
   → 처음이면 **Install** GitHub App → 'Only select repositories'에서 방금 만든 저장소 → 내 저장소 **Import** → 설정은 그대로 **Deploy**.
   1–2분 뒤 운영 주소 `https://tradefin-web-t2-07.vercel.app`(주소에 `-해시-`가 없는 것)에 이 저장소의 첫 화면이 뜹니다.
3. **내 PC로 받기** — VS Code에서 Ctrl+Shift+P → `Git: Clone` → 내 저장소 주소 → 폴더 `C:\work\` → **Open** → **Trust**(이 폴더를 신뢰).
4. **부품 받기** — VS Code 터미널(Ctrl+`)에서 `npm ci` (와이파이에 따라 2–20분).
5. **점검 · 실행** — `npm run doctor` → 모두 ✓(`– .env 없음(5일차)` 한 줄만 예외) → `npm run dev` → <http://localhost:3000>

막히면: 내 저장소 → 초록 **Code → Codespaces → Create codespace on main**. 브라우저 안의 VS Code에서 `npm ci`가 저절로 돕니다.

## 실습 방식 — 1부는 같이, 2부는 자유 퀘스트
- **1부**는 다 같이 따라 합니다. 프롬프트는 '목적 한 줄 + 안내서(`guide/`)의 절'만 짧게 — 긴 규칙은 안내서에 있고, 결과 숫자는 모두 같습니다.
- **2부는 자유 퀘스트** — 정답이 없습니다. 하고 싶은 것 한 줄(몰라도 됨)과 함께 안내서의 「자유 퀘스트」 절을 가리키면 AI가 재미있는 방향 3개를 먼저 제안합니다. 키 없이 되는 말하기 · 알림 · 게임부터 — "이런 것까지 돼?"가 목표입니다.

  ```text
  목적: 내 웹앱을 내 마음대로 키운다 — {하고 싶은 것 한 줄 · 몰라도 됨}
  @guide/day4_lab_d.md 의 「6. 자유 퀘스트」대로 — 재미있는 방향 3개를 먼저 제안해 줘.
  ```
- 안내서가 고쳐지면(매일 아침 · 강사 공지) `npm run guide:update` → 바뀐 파일을 커밋합니다. 내가 고친 `data/` · `hackathon/` 파일(예: 채운 아이디어 카드)은 덮어쓰지 않고 '건너뜀'으로 알려 줍니다.

## 명령
| 명령 | 하는 일 |
|---|---|
| `npm run dev` | 내 PC에서 실행 — <http://localhost:3000> (끄기: 터미널에서 Ctrl+C) |
| `npm run build` | 배포 전 검사 — 타입 오류가 0이어야 통과 |
| `npm run doctor` | 막히면 먼저 — ✓ · ✗와 고치는 법을 한국어로 |
| `npm run doctor:db` | DB 주소 두 개를 점검하고 접속해 본다(5일차) |
| `npm run doctor:secrets` | push 전 비밀 점검 — 모두 PASS여야 한다 |
| `npm run env:init` | `.env` 만들기(5일차) |
| `npm run db:push` | 표 설계를 DB에 반영 + RLS 켜기(5일차) |
| `npm run db:seed` | 처음 데이터 넣기(5일차) |
| `npm run drafts` | AI 독촉 초안 만들기(5일차 실습 D · 진짜 실행은 사람이) |
| `npm run guide:update` | 고쳐진 안내서 · 데이터 · 6일차 양식 받기(무엇이 바뀌는지만 보기: `npm run guide:update -- --check`) |
| `npm run catchup -- day4-d` | 앞 실습을 못 끝냈을 때 기준본으로 합류(`day4-d` · `day5-c` · `day5-d`) |

## 폴더
```text
app/          쪽(화면) — page.tsx = 첫 화면 · api/health = 배포 배지가 부르는 주소
components/   부품 8개 — SiteNav · PageHeader · KpiCard · GradeBadge · BarRow · DataTable · Notice · DeployBadge
lib/          계산 · 형식(format.ts) · DB 연결(db.ts — 고치지 않음)
data/         원본 데이터(읽기만) — 설명은 data/README.md
guide/        실습 작업 안내서(AI가 읽음) — 목록은 guide/README.md
hackathon/    6일차 양식
prisma/       표 설계(schema.prisma — 5일차에 모델을 더함)
scripts/      도구 — doctor · env-init · update-guide · catchup · lib/(claude 찾기 · 부르기)
CLAUDE.md     AI가 지킬 저장소 규칙(한국어) · AGENTS.md = Next.js 판 안내
```

## 환경 변수 · 배포(5일차)
- `.env` = 내 PC의 비밀값(커밋되지 않음). `npm run env:init`으로 만들고 값을 붙여 넣습니다. 이름표는 `.env.example`.
- Vercel → 내 프로젝트 → **Settings → Environment Variables**에 `DATABASE_URL`(6543 주소)과 `APPROVER_PIN`(5일차 실습 D)을 넣고 **Redeploy**. `DIRECT_URL`은 Vercel에 넣지 않습니다.
- `main`에 push하면 Vercel이 다시 배포합니다. 빌드가 실패해도 마지막 성공본이 그대로 떠 있습니다.
- 앱은 서울에서 돕니다(`vercel.json`의 `icn1`). Supabase 프로젝트도 **Northeast Asia (Seoul)**로 만듭니다.
- 다른 사람에게 보낼 주소는 운영 주소(`…vercel.app`, `-해시-` 없음)입니다. 배포마다 생기는 주소는 Vercel 로그인을 요구합니다.

## 알아 둘 것
- Supabase 무료 프로젝트는 1주일 동안 쓰지 않으면 **일시 정지(Paused)** 됩니다 — 대시보드에서 **Restore**를 누르면 돌아옵니다.
- Vercel **Hobby**(무료)는 개인 · 비상업용입니다. 회사 업무에 들이려면 회사 계정과 요금제를 따로 검토합니다.
- 패키지는 판을 고정했습니다. `npm install`로 판을 올리지 않습니다(prisma의 최신 태그는 8 시험판). 새 패키지는 `npm i 이름@버전 --save-exact`.
  `ETARGET`(그 판이 없다)이 나오면 `--prefer-online --prefer-offline=false`를 붙여 한 번 더(오래된 내 PC 캐시 때문).
- PowerShell에서 `npm.ps1 … 실행할 수 없습니다`가 나오면: 이 저장소의 VS Code 터미널은 명령 프롬프트(cmd)가 기본입니다. 또는 `npm.cmd ci`.

## 데이터 · 라이선스
- `data/`는 모두 (가상) 합성 데이터입니다 — 실제 회사 · 사람 · 거래가 아닙니다. 환율 저장본은 Frankfurter API에서 받은 참고값입니다.
- 코드는 MIT(`LICENSE`). 쓰인 오픈소스는 `NOTICE.md`.
