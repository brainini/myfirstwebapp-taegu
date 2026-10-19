# 4일차 실습 D 작업 안내서 — 첫 웹앱 + 배포

이 파일은 **AI(Claude Code)가 읽고 따르는 작업 안내서**입니다. 수강생의 프롬프트는 '목적 한 줄 + 할 일'만 짧게 쓰고, 긴 규칙은 이 파일의 절을 가리킵니다(3일차 안내서와 같은 방식). 저장소 규칙은 `CLAUDE.md`, 화면 규칙은 `guide/design_rules.md`에 있습니다. 사람이 읽어도 됩니다 — 고치지는 않습니다(새 판은 `npm run guide:update`).

**오늘의 이야기** — (가상) 한빛정밀(주) 대표님: "바이어마다 주소가 따로 있으면 해요 — 회의 중에 B048만 보내 주게. 주소가 바뀌지 않게요." 그래서 바이어 150곳의 목록 쪽 `/buyers`와 바이어마다 하나씩 생기는 상세 쪽 `/buyers/B048`을 만들어 Vercel 운영 주소로 띄웁니다.

| 절 | 쓰는 단계 |
|---|---|
| 0. 늘 지킬 것 | 모든 단계 |
| 1. 저장소 둘러보기 | D-1 · 01 |
| 2. 목록 쪽 | D-1 · 02 |
| 3. 상세 쪽 | D-1 · 02 |
| 4. 화면 규칙 | 화면을 만들거나 고치는 모든 단계 |
| 5. 검사 · 커밋 · push | D-1 · 03 · D-2 · 02 |
| 6. 자유 퀘스트 | D-2 · 01 |
| 7. 배포 확인 | push한 뒤 |
| 8. 막힐 때 | 빌드 · 실행 · 배포 오류가 났을 때 |
| 9. 숫자가 다를 때 | 언제든 |
| 10. 채팅 경로 | Claude Code를 못 쓸 때(claude.ai + GitHub 웹) |

---

## 0. 늘 지킬 것

- `CLAUDE.md`의 '반드시'를 지킨다. 특히 끝나면 `npm run build` 통과(타입 오류 0) — 통과 전에는 '완료'라고 하지 않는다.
- **프롬프트가 가리킨 절만 한다.** 다른 절의 일(특히 6절 자유 퀘스트)은 그 단계에서 시킬 때까지 미리 하지 않는다.
- **입력은 읽기만**: `data/` · `guide/` · `scripts/` · `lib/db.ts` · `prisma/`는 고치지 않는다. `components/`의 부품은 그대로 쓰고, 메뉴처럼 꼭 고쳐야 하는 곳은 한 줄만 고치고 알린다.
- **숫자는 코드로 계산한 값만** 쓴다. 화면 숫자는 `data/buyers.json`에서 `lib/`의 함수가 계산한다(손으로 적은 숫자 없음). 모르면 '확인 필요'.
- 비밀 · 실명 · 실제 회사 · 실제 메일 발송은 하지 않는다. `.env`는 열지도 · 출력하지도 · 커밋하지도 않는다. 데이터는 가상 데이터만.
- 새 패키지는 설치하지 않는다 — 꼭 필요하면 이름 · 이유 · 고정 버전을 먼저 묻는다.
- AI 엔진 실행(`claude -p`)은 사람이 한다 — 오늘은 쓰지 않는다.
- 개발 서버(`npm run dev`)는 사람이 터미널에 켜 두었다 — AI는 새로 켜지 않는다(이미 켜져 있으면 'Another next dev server is already running'으로 실패한다). 확인은 `npm run build`로 한다(개발 서버와 함께 돌려도 된다).
- 답은 한국어, 표는 Markdown 표. **끝나면 '확인할 것 3줄'**(절에 정해진 것이 있으면 그것) — 그 3줄을 화면과 대조하는 것은 사람이다.

---

## 1. 저장소 둘러보기

**읽기만 한다.** 파일을 만들거나 고치지 않는다. 숫자를 셀 때는 `node`로 `data/buyers.json`을 읽는 짧은 명령만 쓴다.

답은 표 다섯 개로:

1. **부품** — `components/`의 파일마다 이름 · 하는 일 한 줄 · 받는 props · 서버/브라우저(`'use client'` 여부)
2. **숫자 모양** — `lib/format.ts`의 함수마다 이름 · 넣는 값 · 나오는 모양(예: `usd(1234567)` → `$1,234,567`)
3. **데이터** — `data/buyers.json`의 줄 수 · 키 수, 키마다 뜻 한 줄과 B048의 값, 비어 있을 수 있는 키(null)와 그 줄 수
4. **지금 있는 쪽** — `app/`의 주소마다(`/` · `/api/health` · 없는 주소) 무엇을 보여 주나
5. **다음 계획** — 만들 쪽 2개(`/buyers` 목록 · `/buyers/[id]` 상세)와 새로 만들 파일 · 고칠 파일 · 가져다 쓸 부품(2 · 3절 기준, 아직 만들지 않는다)

끝나면 확인할 것 3줄: 부품 수 · `buyers.json`의 줄 수와 키 수 · 만들 쪽 2개의 주소.

---

## 2. 목록 쪽

Plan 모드면 **먼저 계획을 보여 주고 승인받은 뒤** 만든다. 2절과 3절은 한 번에 계획하고 한 번에 만든다. 계획에는 ① 새로 만들 파일 ② 고칠 파일 ③ 쪽마다 구역 순서 ④ 마지막 명령 `npm run build`를 적는다. 정할 것이 있으면 질문마다 기본값을 함께 적는다(승인하면 기본값으로 만든다).

**데이터 — `lib/buyers.ts`(새 파일)**

- `data/buyers.json`을 **import**로 읽는다(`fs` · `fetch`가 아니다).
- 형 `Buyer`를 export한다 — 키 16개 그대로: `id` · `name` · `countryCode` · `countryKo` · `region` · `industry` · `paymentMethod` · `termsDays` · `openArUsd` · `overdueUsd` · `pctAr31p`(0–1, 없으면 `null`) · `oldestOpenDays` · `avgDaysLate12m`(없으면 `null`) · `pd30d`(0–1) · `grade`(`S` · `A` · `B` · `C`) · `signals`(글자 배열).
- `export async function getBuyers(): Promise<Buyer[]>` · `export async function getBuyer(id: string): Promise<Buyer | null>`. 지금은 JSON을 돌려줄 뿐이지만 **async로 둔다** — 5일차에 DB로 바꿀 때 이 두 함수의 속만 바뀐다. `getBuyer`는 id를 대문자로 맞춰 찾는다(`b048` → `B048`).

**계산 — `lib/metrics.ts`(새 파일 · 순수 함수만 · 화면 글자는 만들지 않는다)**

- `kpis(buyers)` → C등급 곳 수 · C등급 `openArUsd` 합 · 그 합 ÷ 전체 합 · 전체 `openArUsd` 합 · 전체 곳 수 · `overdueUsd` 합 · `overdueUsd`가 0보다 큰 곳 수
- `gradeCounts(buyers)` → S · A · B · C 곳 수(이 순서)
- `topRisk(buyers, n = 10)` → `pd30d` 큰 순, 같으면 `id` 순으로 n곳
- `byRegion(buyers)` → 지역마다 곳 수 · `openArUsd` 합 · C등급 `openArUsd` 합 · C 몫(그 지역 C등급 합 ÷ 그 지역 합), 합이 큰 순
- `filterByGrade(buyers, grade)` → grade가 `S` · `A` · `B` · `C` 중 하나면 그 등급만, 아니면(없거나 엉뚱한 값) 전부. 순서는 `topRisk`와 같은 정렬
- **등급은 `grade` 칸 그대로** — `pd30d`로 다시 매기지 않는다.

**쪽 — `app/buyers/page.tsx`(새 파일 · 서버 컴포넌트)**

- `export default async function Page({ searchParams }: { searchParams: Promise<{ grade?: string | string[] }> })` — Next.js 16에서 `searchParams`는 Promise라 `await`한다. `export const metadata = { title: "바이어" }`.
- 구역(위에서 아래로):
    1. `PageHeader` — title '바이어 {곳 수}곳' · asof '2026-09-30 · (가상) 합성 데이터' · line '위험 점수는 판단을 돕는 값이고, 결정은 사람이 합니다.'
    2. **KPI 4개**(`KpiCard` · 휴대폰 1열 · `sm` 2열 · `lg` 4열): '위험 바이어(C등급)' `N곳` · 'C등급 채권' `usd` + sub '전체의 {pct}' · '전체 채권' `usd` + sub '{N}곳' · '연체 금액' `usd` + sub '{N}곳'
    3. **위험 상위 10**(`DataTable`): 열 순서 — 바이어('{순위}. {name}'을 `/buyers/{id}` 링크로, 아래에 작게 id) · 나라(`countryKo`) · 등급(`GradeBadge`) · 위험 점수(`pct`) · 채권 · 연체 · 첫 신호(`signals[0]`). 숫자 열은 `align: "right"`. 바이어 열이 첫 열이어야 휴대폰 카드의 제목이 이름이 된다.
    4. **지역별 채권**(`BarRow` 6줄, 합이 큰 순): label 지역 · value 합 · max 가장 큰 지역의 합 · display `usd(합)`. 줄마다 아래에 작게 'C등급 {usd} · {pct}'. C 몫(%)이 가장 큰 지역 줄만 `strong`.
    5. **전체 목록**: 등급 칩 5개 — '전체 {N}' · 'S {N}' · 'A {N}' · 'B {N}' · 'C {N}'(N은 곳 수 — 등급은 `gradeCounts`, 전체는 `kpis`로 계산) — 각각 `/buyers` · `/buyers?grade=S` … 로 가는 `Link`(44px). 지금 고른 칩은 `aria-current="page"` + `bg-accent text-white`. 칩 아래 한 줄 '{등급}등급 {N}곳'(전체면 '전체 {N}곳')과 `DataTable`(열: 바이어 링크 · 나라 · 등급 · 위험 점수 · 채권 · 연체).
- KPI · 위험 상위 10 · 지역별은 언제나 150곳 전체 기준이다 — 등급 칩은 5번 전체 목록만 거른다.
- 메뉴: `components/SiteNav.tsx`의 `NAV_ITEMS`에 `{ href: "/buyers", label: "바이어" }` 한 줄만 더한다. 홈 `app/page.tsx`는 고치지 않는다.

---

## 3. 상세 쪽

- `app/buyers/[id]/page.tsx`(새 파일 · 서버 컴포넌트): `{ params }: { params: Promise<{ id: string }> }` → `const { id } = await params` → `getBuyer(id)` → 없으면 `notFound()`(`next/navigation`).
- `generateMetadata`도 같은 방법으로 `params`를 await해 제목을 '{id} · {name}'으로(없으면 '바이어를 찾을 수 없습니다').
- `generateStaticParams`는 쓰지 않는다 — 쪽은 요청 때 만든다(5일차에 DB로 바꿔도 그대로).
- 구역:
    1. `PageHeader` — title `name` · asof '2026-09-30 · (가상) 합성 데이터' · line '{id} · {countryKo} · {region}'
    2. **12칸**(`dl` · 휴대폰 2열 · 넓은 화면 3열 · 칸마다 이름 위 · 값 아래 · 숫자는 `num`): 나라 · 지역 · 업종 · 결제방식 · 결제기간(`{termsDays}일`) · 채권(`usd`) · 연체(`usd`) · 31일 넘긴 채권 비중(`pct(pctAr31p)`) · 가장 오래 밀린 인보이스(`{oldestOpenDays}일`) · 최근 1년 평균 지연(`avgDaysLate12m.toFixed(1)`일, 없으면 `—`) · 위험 점수(`pct(pd30d)`) · 등급(`GradeBadge`)
    3. **위험 신호** — `signals`를 글자 그대로 목록으로, 그 아래 언제나 같은 한 줄 **'이 신호들은 확인해 볼 이유이지, 연체의 원인이라는 뜻은 아닙니다.'** 표에 없는 사실이나 '때문에'는 쓰지 않는다.
    4. '바이어 목록으로' 링크(`/buyers` · 44px)
- `app/buyers/[id]/not-found.tsx`(새 파일): 제목 '바이어를 찾을 수 없습니다' · 한 줄 '주소의 바이어 번호(예: B048)를 확인해 주세요.' · '바이어 목록으로' 링크.
- 끝나면 `npm run build`. 확인할 것 3줄은 2 · 3절을 합쳐서: ① `/buyers`의 KPI 4개 값과 등급 칩 곳 수 ② 위험 상위 10의 id 순서와 `?grade=C`의 줄 수 ③ B048의 12칸 값 · 신호 수 · build 표의 `/buyers` · `/buyers/[id]` 줄. 숫자는 `node`로 `data/buyers.json`을 다시 세어 확인한 값만.

---

## 4. 화면 규칙

- `guide/design_rules.md`를 모두 지킨다 — 토큰 색만 · 'AI 티' 금지 · `lib/format.ts` · 390px 가로 스크롤 없음 · 44px · 색 + 글자 · 그림 · CDN 없음 · 서버와 브라우저 나누기.
- 레이아웃(`app/layout.tsx`)의 바닥글과 홈의 배포 배지는 그대로 둔다.
- 쪽이 늘면 `NAV_ITEMS`에 한 줄씩 더한다(휴대폰에서 메뉴가 두 줄을 넘으면 알린다).

---

## 5. 검사 · 커밋 · push

순서대로 하고, 3번에서 **사람의 승인을 기다린다.**

1. `npm run build` → 통과. route 표에서 이번에 더한 줄을 그대로 옮겨 보여 준다(예: `ƒ /buyers` · `ƒ /buyers/[id]`).
2. `npm run doctor:secrets` → 모두 PASS(FAIL이면 멈추고 그 줄을 보여 준다).
3. `git status --short`로 바뀐 파일을 보고 **파일 목록 · 메시지 두 줄 · 브랜치(`main`)**를 먼저 보여 준다.
    - 올리지 않는 것: `.env*`(`.env.example`만 예외) · `.next/` · `node_modules/` · `lib/generated/` · 로그 · 내 PC 전용 파일. 목록에 보이면 빼고 알린다.
    - 메시지(한국어 두 줄, 사이에 빈 줄):
        - 1부: `4일차: 바이어 목록 · 상세 쪽 추가` / `왜: 대표님이 150곳을 주소 하나로 휴대폰에서 보게`
        - 2부: `4일차: 자유 퀘스트 — {더한 것 한 줄}` / `왜: {누가 무엇이 편해지나 한 줄}`
4. 승인받으면 필요한 파일만 `git add` → `git commit` → `git push origin main`. 강제 push · `git reset --hard`는 하지 않는다.
5. `git log --oneline -3`과 `git rev-parse --short=7 HEAD`를 보여 주고, "Vercel → Deployments에서 이 커밋이 Ready가 되면 7절대로 확인"이라고 알린다.

확인할 것 3줄: build 통과와 route 줄 · `doctor:secrets` 결과 · push한 커밋 7글자.

---

## 6. 자유 퀘스트

프롬프트의 '하고 싶은 것 한 줄'을 따르고, 없거나 '몰라도 됨'이면 지금 웹앱(쪽 · 데이터 · 부품)을 보고 고른다.

1. **먼저 제안만** — 재미있는 방향 3개. 방향마다 '와!' 한 줄(사람이 무엇을 보고 놀라나) · 걸리는 시간(15–30분) · 키 · 패키지가 필요한지. 셋 중 하나 이상은 키 없이 되는 브라우저 기능(말 · 소리 · 알림 · 홈 화면 설치)이나 게임으로.
2. '가장 놀라운 것'을 물으면 지금 결과로 할 수 있는 가장 놀라운 것 3가지를 같은 꼴로 제안한다.
3. 사람이 고르거나 고치면 **계획 3줄**(무엇을 · 어느 쪽 어디에 · 어떤 데이터와 기능으로)을 보이고, 승인받은 뒤 만든다.
4. 패키지 설치 · API 키 · 바깥으로 보내기(메일 · 메신저 · 외부 서비스)가 필요하면 만들기 전에 먼저 묻는다. 키 없이 되는 길이 있으면 그 길을 먼저 권한다.
5. 데이터는 `data/buyers.json`과 가상 데이터만. 1부의 쪽과 숫자(`/buyers` · `/buyers/[id]`)는 깨지 않는다.
6. 화면은 `guide/design_rules.md`(브라우저 기능은 6절), 안전은 0절 그대로.
7. 끝: `npm run build` 통과 → **확인할 것 3줄**(사람이 브라우저에서 직접 해 볼 것).

---

## 7. 배포 확인

- push하면 Vercel이 `main`을 빌드해 운영 주소를 새 판으로 바꾼다(1–3분). AI는 브라우저를 볼 수 없으니 **사람이 볼 것**을 알려 준다.
- 보낼 주소는 **운영 주소** 하나 — Vercel 프로젝트의 Domains에 있는 주소(예: `https://tradefin-web-t2-07.vercel.app`). 배포마다 생기는 긴 주소(`tradefin-web-t2-07-abc123xyz-….vercel.app`)는 Vercel 로그인 벽이 있어 남에게 보내지 않는다.
- 새 판인지: 첫 쪽 배지의 7글자(= `<운영 주소>/api/health`의 `commit`)가 `git rev-parse --short=7 HEAD`와 같다. 사람이 운영 주소를 알려 주면 `curl -s <운영 주소>/api/health`로 대조해도 된다.
- 사람이 볼 것 3줄: 시크릿 창에서 로그인 없이 열린다 · `/buyers`의 숫자가 내 PC와 같다 · 휴대폰(390px)에서 가로 스크롤이 없다.
- Deployments가 Error면 빌드 기록의 오류 줄로 8절.

---

## 8. 막힐 때

**아직 고치지 않는다.** 오류 글을 아래 표와 맞춰 **원인 후보와 확인 방법만** 먼저 알려 준다. 고치는 것은 사람이 '고쳐'라고 한 뒤 — 한 번에 하나만.

| 오류 글(일부) | 원인 후보 | 확인 · 고치는 길 |
|---|---|---|
| `Module not found: Can't resolve '@/components/…'`(Vercel에서만) | 파일 이름 대소문자 — Windows는 무시하지만 Vercel(Linux)은 구별 | import 글자와 실제 파일 이름을 한 글자씩 대조해 똑같이 |
| `Type error: … params …` · `searchParams …` · `Promise` | Next.js 16에서 `params` · `searchParams`는 Promise | 형을 `Promise<…>`로 두고 `await` |
| `You're importing a module that depends on "useState"` · `only works in a Client Component` · `Event handlers cannot be passed to Client Component props` | 서버 컴포넌트에서 브라우저 기능(상태 · 클릭)을 씀 | 그 부분만 작은 `'use client'` 부품으로 떼고, 값은 props로 |
| `'use client'` 파일이 `data/buyers.json` · `lib/buyers.ts`를 import | 150곳 데이터가 통째로 브라우저로 간다(빌드는 되기도 한다) | import는 서버 쪽(`page.tsx`)으로 옮기고 필요한 값만 props로 |
| `Hydration failed because the server rendered text didn't match the client` | 시각 · 날짜 · 무작위 값을 브라우저에서 따로 만듦 | 형식은 서버에서 `lib/format.ts`로, 무작위 값은 `useEffect` 안에서 |
| `Another next dev server is already running` | 개발 서버가 다른 터미널에서 이미 켜져 있음 | 그 서버를 그대로 쓴다(새로 켜지 않는다) |
| `Port 3000 is in use by process …, using available port 3001 instead` | 다른 프로그램이 3000을 씀 | 터미널의 `Local:` 주소(3001)로 연다 |
| `npm.ps1 … 이 시스템에서 스크립트를 실행할 수 없으므로` | PowerShell 실행 정책 | 터미널을 명령 프롬프트(cmd)로, 또는 `npm.cmd` |
| `ETIMEDOUT` · `ECONNRESET`(npm) · `binaries.prisma.sh` | 네트워크가 느리거나 막힘 | 다시 시도 → 휴대폰 핫스팟 → Codespaces |
| Vercel `Command "npm run build" exited with 1` | 빌드 오류 — 진짜 원인은 그 위 몇 줄 | 빌드 기록에서 `Error` · `Type error` 줄을 찾아 이 표로 다시 |
| `rejected … (fetch first)` · `non-fast-forward`(push) | GitHub 웹에서 먼저 고친 커밋이 있음 | 사람에게 묻고 `git pull --rebase` 뒤 다시 push |
| `GH007 … private email` | 커밋 메일이 비공개 메일 | GitHub noreply 주소로 `git config user.email` 뒤 커밋을 다시 |

표에 없으면 오류의 첫 줄 · 파일 · 줄 번호로 원인 후보 2–3개와 확인할 명령을 알려 준다.

---

## 9. 숫자가 다를 때

- **아직 고치지 않는다.** `node`로 `data/buyers.json`을 직접 세는 짧은 명령(파일은 만들지 않는다)으로 같은 숫자를 다시 계산해 화면 값 · 다시 센 값을 나란히 보여 준다.
- 어디서 갈렸는지 원인 후보와 확인 방법만 알려 준다. 흔한 갈림길:
    - 등급을 `grade` 칸이 아니라 `pd30d`로 다시 매김
    - 정렬 기준(`pd30d` 대신 채권 순) · 같은 점수일 때 `id` 순을 빠뜨림
    - 비율 기준(0–1 값을 `pct()`에 넣지 않고 이미 100을 곱함 · C 몫을 전체 합으로 나눔)
    - 빈 값(`null`)을 0으로 셈 · 채권 0인 곳을 뺌 · 숫자를 글자로 더함
    - 거르기(`?grade=`)가 KPI까지 바꿈
- 끝나면 확인할 것 3줄.

---

## 10. 채팅 경로

Claude Code 대신 claude.ai(파일 첨부 · 코드 실행이 되는 대화)와 GitHub 웹으로 할 때:

- 첨부: `CLAUDE.md` · 이 안내서 · `guide/design_rules.md` · `data/buyers.json` · `lib/format.ts` · `components/` 파일 8개 · `app/layout.tsx` · `app/page.tsx`. 이어서 오는 프롬프트의 `@경로`는 첨부한 파일로 읽는다.
- Plan 모드가 없으니 큰 작업은 계획을 먼저 보이고, 사람이 좋다고 하면 진행한다.
- 결과는 **파일마다 경로 제목 + 파일 전체 내용**(고친 곳만이 아니라 처음부터 끝까지)으로 준다 — 사람이 GitHub 웹의 **Add file → Create new file**(이름 칸에 `app/buyers/[id]/page.tsx`처럼 경로째)이나 연필(Edit)로 붙여 넣는다. 한 번에 파일 5개 이하.
- `npm run build`를 대신하는 것은 Vercel의 빌드다 — 사람이 붙여 넣는 빌드 기록의 오류 줄로 8절.
- 숫자 확인은 첨부한 `buyers.json`을 코드로 계산한 값만. `doctor:secrets`는 못 돌리니 새 파일에 키 · 실명 · 실제 메일이 없는지 글로 점검한다.
- 커밋은 사람이 GitHub 웹에서 한다(메시지는 5절의 두 줄). 6절 자유 퀘스트도 같은 방식.
- 끝나면 확인할 것 3줄.
