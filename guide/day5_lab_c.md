# 5일차 실습 C 작업 안내서 — 사라지는 수첩 미스터리(확인 기록 · DB 붙이기)

이 파일은 AI(Claude Code)에게 주는 **작업 안내서**입니다. 프롬프트는 '목적 + 할 일' 두 줄로 짧게 말하고 이 안내서의 절을 가리킵니다. 사람이 읽어도 됩니다. 고치지는 않습니다(고칠 것이 있으면 강사가 `npm run guide:update`로 내려보냅니다).

오늘의 사건 한 줄 — 박 팀장님이 적은 'B048 · 다음 주 입금 약속'이 새로 고침 한 번에 사라졌다. 범인은 **아무것도 기억하지 못하는 앱**. 그래서 앱 밖에 금고(Supabase의 PostgreSQL DB)를 달고, 표 두 개(바이어 · 확인 기록)를 만들어, 쪽이 금고를 읽고 쓰게 한다. 내 PC와 배포 주소가 **같은 금고**를 보면 끝.

| 퀘스트 | 파일 · 명령 | 이 안내서의 절 | 실습 단계 · 프롬프트 |
|---|---|---|---|
| 금고 터 잡기(오늘의 설계 읽기) | 읽기만 | 1 | C-1 · 01 · c1 |
| 금고 열쇠(사람이 직접) | `.env` · `npm run doctor:db` | 8 | C-1 · 02 · 프롬프트 없음 |
| 서랍 두 칸 | `prisma/schema.prisma` · `npm run db:push` | 2 | C-1 · 03 · c2 |
| 서랍 채우기 | `prisma/seed.ts` · `npm run db:seed` | 3 | C-1 · 04 · c3 |
| 세이브 포인트 1 | 커밋 | 9 | C-1 · 05 · c-commit |
| 쪽이 금고를 읽는다 | `lib/buyers.ts` · 쪽 셋 | 4 | C-2 · 01 · c4 |
| 사라지지 않는 수첩 | `actions.ts` · `ReviewForm.tsx` · `lib/reviews.ts` | 5 | C-2 · 02 · c5 |
| 보스전 준비 · 출격 | `npm run doctor:secrets` · 커밋 · push | 6 · 9 | C-2 · 03 · c6 |
| 자유 퀘스트 | 내가 고른 방향 | 7 | C-2 · 04 · c-free · c-wow |
| 세이브 포인트 2 | 점검 · 커밋 · push | 6 · 9 | C-2 · 05 · c-push |
| 막힐 때 · 숫자가 다를 때 · 채팅 | – | 8 · 10 · 11 | c-dbfix · c-check · c-chat |

## 0. 늘 지킬 것

**AI에게 — 이 안내서를 쓰는 법**
- 프롬프트가 가리킨 절**만** 한다. 다른 절의 일(특히 7절 자유 퀘스트)은 시킬 때까지 미리 하지 않는다. `CLAUDE.md`의 '반드시' 9개가 모든 절에 함께 적용된다.
- **`.env`는 열지도 · 읽지도 · 출력하지도 · 커밋하지도 않는다.** 연결 주소 · 비밀번호를 답 · 파일 · 커밋 · 로그에 쓰지 않는다. DB 상태는 `npm run doctor:db`(비밀번호를 가린다)의 결과로만 본다. 값은 사람이 넣는다.
- 표 바꾸기는 **`npm run db:push`로만** 한다. `prisma migrate` · `migrate reset` · `db push --force-reset` · `--accept-data-loss`는 쓰지 않는다. 명령이 '데이터가 지워질 수 있다(data loss)'고 묻거나 멈추면 **아무것도 고르지 말고** 멈춰 사람에게 알린다.
- 입력은 **읽기만** 한다: `data/` · `guide/` · `lib/db.ts` · `prisma.config.ts` · `scripts/`(doctor · `lib/`)는 고치지 않는다. 바이어 숫자를 셈하는 `lib/metrics.ts`도 오늘은 고치지 않는다.
- **숫자는 코드로 계산한 값만** 쓴다. 눈으로 세거나 짐작하지 않는다. 모르면 '확인 필요'.
- 데이터는 (가상) 한빛정밀(주)의 합성 데이터만. 실명 · 실제 회사 · 실제 이메일(주소는 `@….example`만) · 계좌 · API 키를 코드 · 데이터 · 커밋에 넣지 않는다. 메일 · 문자를 실제로 보내지 않는다.
- AI 엔진(`claude -p`) 실행은 사람이 한다 — 오늘 실습 C에는 없다. 새 패키지는 설치하지 않는다(꼭 필요하면 이름 · 이유 · 고정 버전을 먼저 묻는다).
- 개발 서버(`npm run dev`)는 사람이 터미널에 켜 둔다 — AI는 새로 켜지 않는다. 확인은 `npm run build`로 하고, 화면은 사람이 본다.
- 파일을 여럿 바꾸는 일은 계획을 먼저(바꿀 파일 · 만들 화면 · 실행할 명령) 보여 주고, 승인받은 뒤 만든다. 화면 규칙은 `guide/design_rules.md`.
- 끝나면(코드를 바꿨다면) `npm run build`가 통과해야 한다 — 통과 전에는 '완료'라고 하지 않는다. 그리고 그 절의 **'확인할 것 3줄'**을 보여 준다. 사람은 그 3줄을 실습 쪽의 '확인할 것'과 견준다.

## 1. 오늘의 설계

**읽기만 한다.** 파일을 만들거나 고치지 않고, `.env`는 열지 않는다. 수강생은 지금 Supabase 프로젝트가 만들어지기를 기다리는 중이다.

읽을 것: 이 안내서 · `prisma/schema.prisma` · `prisma.config.ts` · `lib/db.ts` · `lib/buyers.ts` · `lib/metrics.ts` · `app/page.tsx` · `app/buyers/page.tsx` · `app/buyers/[id]/page.tsx` · `package.json`의 scripts.

답은 표 하나(파일 · 지금 · 오늘 바뀌는 것 · 절)와 세 줄로.

| 파일 | 오늘 바뀌는 것 | 절 |
|---|---|---|
| `prisma/schema.prisma` | 모델 `Buyer` · `Review`를 더한다 | 2 |
| `prisma/seed.ts` | 새 파일 — 바이어를 DB에 넣는다 | 3 |
| `lib/buyers.ts` | `getBuyers` · `getBuyer`의 속만 JSON → DB | 4 |
| `app/page.tsx` | 숫자 카드를 DB로 + '최근 확인 기록' 구역 | 4 · 5 |
| `app/buyers/page.tsx` | 요청 때마다 DB를 읽게(한 줄) | 4 |
| `app/buyers/[id]/page.tsx` | 요청 때마다 DB를 읽게 + '확인 기록' 구역 | 4 · 5 |
| `lib/reviews.ts` | 새 파일 — 확인 기록 읽기 | 5 |
| `app/buyers/[id]/actions.ts` | 새 파일 — 서버 액션(기록 쓰기) | 5 |
| `components/ReviewForm.tsx` | 새 파일 — 입력 칸(`'use client'`) | 5 |

'지금' 칸에는 그 파일의 지금 모습을 한 줄로 쓴다(없으면 '없음'). `lib/buyers.ts`나 `app/buyers/`가 없으면 표 대신 "4일차 쪽이 없습니다 — `npm run catchup -- day4-d`로 합류한 뒤 다시"라고만 답한다.

세 줄: ① 오늘의 흐름 — 금고(새 프로젝트) → 열쇠(`.env`) → 서랍 두 칸(표) → 서랍 채우기(처음 데이터) → 쪽이 금고를 읽기 → 확인 기록 쓰기 → 배포 주소에 열쇠(환경 변수) ② 오늘 쓰는 명령 넷 — `npm run doctor:db` · `npm run db:push` · `npm run db:seed` · `npm run build` ③ 오늘 바꾸지 않는 파일 — `lib/db.ts` · `prisma.config.ts` · `lib/metrics.ts` · `data/`.

**확인할 것 3줄**: 바뀌는 파일 9개(새 4 · 고침 5) · 명령 넷 · 바꾸지 않는 파일 넷.

## 2. 표 설계

Plan 모드에서 받는 일이다 — **먼저 계획**(바꿀 파일 하나 · 더할 모델 글 · 실행할 명령)을 보여 주고, 승인받으면 진행한다.

- `prisma/schema.prisma`의 맨 위 주석 · `generator` · `datasource` 블록은 그대로 둔다. **`datasource`에 `url` · `directUrl`을 더하지 않는다** — Prisma 7은 주소를 `prisma.config.ts`(→ `.env`)에서 읽는다. Supabase Connect 화면에 보이는 schema.prisma 조각은 옛 방식이라 쓰지 않는다.
- 파일 끝에 아래 두 모델을 **글자 그대로** 더한다. 필드 이름은 `data/buyers.json`의 키 이름과 같다. 바이어 하나에 확인 기록 여럿(1:N) — `Review.buyerId`가 `Buyer.id`를 가리킨다.

```prisma
model Buyer {
  id             String   @id
  name           String
  countryCode    String
  countryKo      String
  region         String
  industry       String
  paymentMethod  String
  termsDays      Int
  openArUsd      Int
  overdueUsd     Int
  pctAr31p       Float?
  oldestOpenDays Int
  avgDaysLate12m Float?
  pd30d          Float
  grade          String
  signals        String[]
  reviews        Review[]
}

model Review {
  id        Int      @id @default(autoincrement())
  buyerId   String
  buyer     Buyer    @relation(fields: [buyerId], references: [id])
  status    String
  memo      String
  reviewer  String
  createdAt DateTime @default(now())

  @@index([buyerId])
}
```

- 실행은 `npm run db:push` 하나(= `prisma db push` → `prisma generate` → `node scripts/doctor.mjs rls`). 허락 창은 사람이 읽고 승인한다. 이 명령은 `.env`의 `DIRECT_URL`(세션 풀러 5432)로 DB에 표를 만들고, 앱이 쓸 코드를 `lib/generated/prisma`에 다시 만들고, 표마다 RLS(행 단위 보안)를 켠다.
- 'data loss' 경고가 보이면 멈춘다(0절). 오류가 나면 고치지 말고 8절 표로 원인 후보와 확인 방법만 알려 준다.
- 끝으로 `npm run build`(아직 모델을 쓰는 코드가 없으니 그대로 통과해야 한다).

**확인할 것 3줄**: ① db push 출력의 `Your database is now in sync` 줄 ② 끝 줄 `RLS 켬 …`(표 둘) ③ 더한 모델 둘의 필드 수(Buyer 17 · Review 7 + `@@index`)와 build 결과.

## 3. 처음 데이터

`prisma/seed.ts`(새 파일)를 만들고 `npm run db:seed`(= `prisma db seed` → `tsx prisma/seed.ts`)로 **두 번** 실행한다. 두 번 넣어도 바이어 수는 JSON의 줄 수 그대로여야 한다.

- 첫 줄 `import "dotenv/config";`(Prisma 7 · tsx는 `.env`를 저절로 읽지 않는다). 이어서 `import buyers from "../data/buyers.json";` · `import { db } from "../lib/db";` — 새 `PrismaClient`를 만들지 않는다(`lib/db.ts`가 풀러 · SSL을 맞춰 두었다).
- 넣기는 `db().buyer.createMany({ data, skipDuplicates: true })` 한 번. `data`는 JSON의 16개 키를 같은 이름의 필드로 옮긴 배열이다 — 빈값(`null`)은 그대로, `signals`는 배열 그대로, 숫자를 글자로 바꾸지 않는다. `skipDuplicates`가 있어서 이미 있는 `id`는 건너뛴다.
- 넣은 뒤 **DB에서 다시 센다**: `db().buyer.count()` · `db().buyer.groupBy({ by: ["grade"], _count: { _all: true } })` · `db().review.count()`.
- 출력은 세 줄, 글자 그대로({…}만 센 값으로 바꾼다. `{new}` = `createMany`가 돌려준 `count`, `{old}` = JSON 줄 수 − `{new}`):

```text
새로 넣음 {new}행 · 이미 있던 행 {old}행
Buyer {total}행 (S {S} · A {A} · B {B} · C {C})
Review {n}행
```

- 끝에 `await db().$disconnect()`. 오류면 그 메시지를 보이고 `process.exitCode = 1`.
- 실행 두 번 — 허락 창마다 사람이 승인한다. 두 번째의 `새로 넣음`은 0행이어야 하고, `Buyer` 줄은 두 번 다 같아야 한다. 다르면 고치지 말고 10절.
- `npm run build`도 통과해야 한다 — `tsconfig.json`이 모든 `.ts`를 보므로 `seed.ts`도 타입 검사를 받는다.

**확인할 것 3줄**: ① 1차 · 2차 `새로 넣음` 줄 ② `Buyer …행 (S · A · B · C)` 줄(두 번 같음) ③ build 결과.

## 4. 쪽을 DB로

목록 · 상세 · 첫 화면이 `data/buyers.json` 대신 **DB를 읽게** 한다. 화면의 숫자는 어제와 한 자리도 달라지면 안 된다 — 같은 데이터를 다른 곳에서 읽을 뿐이다.

- `lib/buyers.ts`: 맨 위에 `import { db } from "@/lib/db";`. `getBuyers()`는 `db().buyer.findMany({ orderBy: { id: "asc" } })`, `getBuyer(id)`는 `db().buyer.findUnique({ where: { id: id.toUpperCase() } })`. 함수 이름 · 인자 · async · 돌려주는 모양(`Buyer` 형, 필드 16개)은 그대로 두고, `data/buyers.json` import는 지운다. 거르기(`where`)나 `take`를 더하지 않는다.
- `lib/metrics.ts`는 고치지 않는다. 형이 맞지 않으면 `lib/buyers.ts` 쪽에서 맞춘다(Prisma가 돌려주는 `Buyer`도 같은 16칸이다).
- `app/page.tsx`(첫 화면): `data/buyers.json` import 대신 `const buyers = await getBuyers();`(함수를 `async`로) — 숫자 카드 3개의 계산은 그대로. 첫 카드의 작은 글 `data/buyers.json`을 `Supabase DB에서 읽음`으로 바꾼다.
- DB를 읽는 쪽 셋(`app/page.tsx` · `app/buyers/page.tsx` · `app/buyers/[id]/page.tsx`)의 import 아래에 `export const dynamic = "force-dynamic";` 한 줄 — 빌드 때 DB를 부르지 않고 요청 때마다 읽는다(그래야 Vercel 빌드에 DB 주소가 없어도 깨지지 않고, 새 기록이 바로 보인다). `generateStaticParams`가 있으면 지운다.
- `npm run build` → route 표에서 세 줄이 `ƒ`(요청 때 만듦)인지 본다.

**확인할 것 3줄**: ① 바꾼 파일 4개 ② build route 표의 `ƒ /` · `ƒ /buyers` · `ƒ /buyers/[id]` ③ 사람이 화면에서 견줄 곳 — `/buyers`의 KPI 4개 · 위험 상위 1위 · `/buyers/B048`의 12칸(어제와 같아야 한다).

## 5. 확인 기록 쓰기

바이어 상세 쪽에서 남긴 '확인 기록'이 DB에 저장되고, 새로 고쳐도 · 다른 기기에서도 보이게 한다. 계획(파일 · 화면 · 확인 방법)을 먼저 보여 주고 승인받은 뒤 만든다.

**읽기 — `lib/reviews.ts`(새 파일 · 서버 전용)**
- `getReviews(buyerId, take = 20)` — 그 바이어의 기록, `orderBy: [{ createdAt: "desc" }, { id: "desc" }]`.
- `getRecentReviews(take = 5)` — 모든 바이어의 최신 기록, 같은 정렬, 바이어 이름 포함(`include: { buyer: { select: { name: true } } }`).

**쓰기 — `app/buyers/[id]/actions.ts`(새 파일 · 맨 위 `'use server'`)**
- `export async function addReview(prev, formData)` 하나. 이 파일에서는 async 함수만 export한다(처음 상태 값 · 형은 폼 부품 쪽에 둔다).
- `buyerId` · `status` · `memo` · `reviewer`를 꺼내 앞뒤 빈칸을 지운다(`String(formData.get("memo") ?? "").trim()` 꼴).
- 검사는 이 순서로, **처음 걸린 하나만** 돌려준다(저장하지 않는다). 문구는 글자 그대로. 글자 수는 앞뒤 빈칸을 지운 뒤의 `.length`.

| 순서 | 걸리는 조건 | 돌려줄 문구 |
|---|---|---|
| 1 | `status`가 `확인 필요` · `확인 완료` · `보류`가 아님 | 상태를 골라 주세요 |
| 2 | `memo`가 빔 | 메모를 적어 주세요 |
| 3 | `memo`가 200자를 넘음 | 메모는 200자 이내로 적어 주세요 |
| 4 | `reviewer`가 빔 | 확인한 사람(별명)을 적어 주세요 |
| 5 | `reviewer`가 20자를 넘음 | 별명은 20자 이내로 적어 주세요 |
| 6 | `buyerId`가 DB에 없음 | 바이어를 찾을 수 없습니다 |

- 통과하면 `db().review.create({ data: { buyerId, status, memo, reviewer } })` → ``revalidatePath(`/buyers/${buyerId}`)`` · `revalidatePath("/")` → `{ ok: true, message: "저장했습니다 — 새로 고쳐도 남아 있습니다" }`. 걸리면 `{ ok: false, message }`. DB 오류는 `{ ok: false, message: "저장하지 못했습니다 — 잠시 뒤 다시 눌러 주세요" }`(오류 글 · 주소를 화면에 쓰지 않는다).
- **검사는 서버가 한다.** 입력 칸에 `maxLength` · `required`를 두지 않는다 — 브라우저 검사는 건너뛸 수 있으니 서버 검사가 진짜 문지기다(수강생이 200자 넘는 글로 시험한다).

**입력 칸 — `components/ReviewForm.tsx`(새 파일 · `'use client'`)**
- props는 `buyerId` 하나. `const [state, formAction, pending] = useActionState(addReview, { ok: false, message: "" })`(`react`에서 import).
- 칸: 상태 — 라디오 단추 셋 `확인 필요` · `확인 완료` · `보류`(처음 값 `확인 필요` · 단추마다 44px) / 메모 — `textarea`, 자리 글 `예: 다음 주 입금 약속 — 전화로 확인`, 아래에 `{글자 수}/200`(200을 넘으면 경고색) / 확인한 사람(별명) — `input`, 자리 글 `실명 대신 별명` / 숨은 칸 `buyerId` / 단추 `기록 남기기`(보내는 동안 `저장 중…` · 누를 수 없음).
- 결과 문구는 단추 아래 `Notice`로 — 성공 `tone="ok"`, 실패 `tone="warn"`. 저장되면 메모 칸만 비운다(상태 · 별명은 남긴다).
- 보내기: `<form onSubmit>`에서 `e.preventDefault()` → `startTransition(() => formAction(new FormData(e.currentTarget)))`(`startTransition`도 `react`에서). `<form action={formAction}>`으로 두지 않는다 — React 19는 그렇게 보낸 폼을 결과와 상관없이(검사에 걸려도) 처음 값으로 되돌려, 상태가 `확인 필요`로 · 별명이 빈칸으로 돌아간다. 메모는 `useState`로 제어하고(`{글자 수}/200`에도 쓴다), `state.ok`가 true가 되면 메모 state만 비운다.
- 이 파일은 DB · `data/` · `process.env`를 import하지 않는다.

**보여 주기**
- 상세 쪽: 위험 신호 구역 아래, '바이어 목록으로' 링크 위에 구역 `확인 기록` — `ReviewForm`과 `getReviews(id)`의 목록. 한 줄 = 상태 배지(색 + 글자: 확인 필요 `warn` · 확인 완료 `accent` · 보류 `muted`) · 메모(줄바꿈 그대로) · `{별명} · {kst(createdAt)}`. 없으면 `아직 확인 기록이 없습니다`.
- 첫 화면: 배포 배지(`DeployBadge`) 위에 구역 `최근 확인 기록` — `getRecentReviews(5)`. 한 줄 = `{id} · {바이어 이름}`(`/buyers/{id}` 링크 · 44px) · 상태 배지 · 메모 · `{별명} · {시각}`. 없으면 `아직 확인 기록이 없습니다`.
- 시각 글자는 서버에서 `kst()`로 만들어 넘긴다(브라우저에서 만들지 않는다). 읽기는 서버 컴포넌트에서만.
- 배포 주소는 공개라 누구나 쓸 수 있다 — 오늘은 가상 데이터라 그대로 둔다(막는 법은 7절에서 수강생이 고를 수 있다).

**확인할 것 3줄**: ① 만든 파일 3개 · 바꾼 파일 2개 ② build 결과 ③ 사람이 해 볼 시험 셋 — 정상 1건(`확인 완료` · `다음 주 입금 약속` · 별명 → 새로 고쳐도 남는다) · 빈 메모 → `메모를 적어 주세요` · 200자 넘는 메모 → `메모는 200자 이내로 적어 주세요`.

## 6. 배포 전 점검

보스전 준비 — 배포 주소도 같은 금고를 보게 하기 전에, 비밀이 코드에 섞이지 않았는지 보고 올린다.

1. `npm run build` → 통과.
2. `npm run doctor:secrets` → 결과를 표(검사 · PASS/FAIL · 고칠 곳)로. FAIL이면 멈추고 그 줄만 보여 준다(고치기는 사람이 '고쳐'라고 한 뒤).
3. 모두 PASS면 9절대로 커밋하고 `git push origin main` — **먼저 파일 목록 · 메시지 두 줄 · 브랜치(`main`)를 보여 주고** 승인받는다.
4. 사람에게 남은 일을 두 줄로 알린다(AI는 Vercel 화면을 만지지 않는다).
   - Vercel → 내 프로젝트 → Settings → Environment Variables: 이름 `DATABASE_URL` · 값 = `.env`의 그 줄의 따옴표 안(포트 6543) · 종류(Type) Secret · Production과 Preview → Save. `DIRECT_URL`은 넣지 않는다(내 PC의 표 만들기용). 이름 앞에 `NEXT_PUBLIC_`를 붙이지 않는다(브라우저로 새어 나간다).
   - Deployments → 맨 위 배포의 ⋯ → Redeploy — 환경 변수는 저장한 뒤 **새로 만든 배포에만** 들어간다.

**확인할 것 3줄**: ① `doctor:secrets` PASS 수 ② push한 커밋 7글자(`git rev-parse --short=7 HEAD`) ③ 사람에게 남은 두 줄(환경 변수 · Redeploy).

## 7. 자유 퀘스트

수강생이 이 절을 가리키면 사양 없이 함께 정한다. 1부 결과(표 둘 · DB를 읽는 쪽 · 확인 기록)를 수강생이 원하는 쪽으로 키우는 일이다.
1. 먼저 **재미있는 방향 3개**를 제안한다 — 방향마다 '와!' 한 줄(무엇이 놀라운지) · 걸릴 시간(10분 안팎) · 키 없이 되는지. 수강생이 적은 바람이 있으면 그쪽으로, 없거나 '몰라도 됨'이면 지금 앱을 보고 고른다.
2. '가장 놀라운 것'을 물으면 지금 결과로 할 수 있는 가장 놀라운 것 3가지를 같은 꼴로 제안한다. 셋 중 하나 이상은 키 없이 되는 브라우저 기능(말 · 소리 · 알림)이나 게임으로.
3. 수강생이 고르거나 고치면 **계획 3줄**(바꿀 파일 · 화면에 보일 것 · 확인 방법)을 보이고, 승인받은 뒤 만든다.
4. 표를 바꾸면 `npm run db:push`로만(새 칸은 `?`나 기본값으로) — 'data loss'를 물으면 멈춘다. 새 비밀은 이름만 `.env.example`에, 값은 사람이 `.env` · Vercel에.
5. 새 패키지 · API 키 · 가입 · 외부 발송(메일 · 문자 · 메신저 · 웹훅)이 필요하면 만들기 전에 먼저 묻는다.
6. 데이터는 가상 데이터만. 1부의 표 · 숫자 · 쪽과 0절은 그대로 지킨다. 브라우저 기능은 `guide/design_rules.md` 6절대로.
7. 끝나면 `npm run build`가 통과해야 하고, **'확인할 것 3줄'**로 끝낸다.

## 8. DB가 안 될 때

c-dbfix로 불리면 **고치지 말고**, 사람이 붙인 `npm run doctor:db` 결과나 오류 끝 10줄을 읽어 원인 후보와 확인 방법만 표로 답한다. `.env`는 열지 않는다 — 고치는 것은 사람이 `.env`에서 한다.

| 오류 글(일부) | 원인 후보 | 확인 · 고치는 길 |
|---|---|---|
| `[YOUR-PASSWORD]가 그대로` · `비밀번호가 틀렸습니다` · `password authentication failed` · `28P01` | 비밀번호를 안 바꿨거나 틀림 | 두 줄 모두 `[YOUR-PASSWORD]`를 대괄호째 지우고 비밀번호만. 잊었으면 Supabase → Database → Settings → Reset database password(영문 + 숫자) → 두 줄 다시 |
| `주소 모양이 깨졌습니다` · `대괄호 [ ]가 남아` · `기호가 있습니다` | 비밀번호에 기호 · 대괄호가 남음 | 대괄호를 지우고, 기호가 있으면 영문 + 숫자로 Reset |
| `Tenant or user not found` · `사용자 이름이 … 모양이 아닙니다` | 사용자 이름이 `postgres.<프로젝트 ref>`가 아님 | Connect 화면에서 두 줄을 다시 복사 |
| `직접 연결 주소입니다` · `P1001` · `Can't reach database server` · `db.….supabase.co` | 직접 연결 주소(IPv6 전용)를 씀 | Connect → ORMs → Prisma의 풀러 주소(`….pooler.supabase.com`)로 |
| `포트가 …입니다` | 두 줄이 바뀜 | `DATABASE_URL` = 6543 · `DIRECT_URL` = 5432 |
| `ENOTFOUND` · `ENETUNREACH` · `주소(호스트)를 찾지 못했습니다` | 주소 오타 · 줄이 잘림 · 회사망 | 다시 복사 → 휴대폰 핫스팟 |
| `ETIMEDOUT` · `시간 초과` | 회사망이 5432 · 6543을 막음 · 프로젝트가 Paused | 휴대폰 핫스팟 → Codespaces · Supabase에서 Restore |
| `self-signed certificate` · `SSL 인증서 오류` | 주소에 `sslmode`를 손으로 더함 | 그 부분을 지운다(`lib/db.ts`가 SSL을 맞춘다) |
| `P1010` · `permission denied` · `권한이 없습니다` | 사용자가 `postgres.<프로젝트 ref>`가 아님 | Connect 화면에서 다시 복사 |
| `prepared statement … already exists` | `.env`에 `DIRECT_URL` 줄이 없어 명령이 6543 주소를 씀 | `.env`의 `DIRECT_URL`(5432) 줄 확인 |
| `Can't reach database server at localhost:5432` · `placeholder` | `.env`가 없거나 저장하지 않아 자리표시 주소가 쓰임 | `npm run env:init` → 붙여 넣고 Ctrl+S → `npm run doctor:db` |
| `Connection url is empty` · `DATABASE_URL이 없습니다` · `…가 비어 있습니다` | 그 줄이 비었거나(`""`) 붙여 넣기 전 | 두 줄을 붙여 넣고 Ctrl+S → `npm run doctor:db` |
| `An error occurred while running the seed command` | seed가 실패 — 진짜 까닭은 바로 위 줄 | 위 줄의 오류로 이 표를 다시 본다 |
| `The table … does not exist` | 표를 만들기 전 | `npm run db:push` |
| `Cannot find module '@/lib/generated/prisma/client'` · `Property 'review' does not exist` | 코드를 다시 만들기 전 | `npm run db:push`(끝에 generate가 들어 있다) |
| `Unique constraint failed` (seed) | `skipDuplicates`가 빠짐 | 3절대로 |
| db push가 data loss를 묻는다 | 이미 있는 칸을 바꾸거나 지움 | 멈추고 사람에게(N) — 모델 diff부터 본다 |
| 배포 주소만 500 · Vercel Logs에 `DATABASE_URL이 없습니다` | Vercel 환경 변수 없음 · Redeploy 안 함 · 값에 따옴표 | 6절의 두 줄 다시 |
| 프로젝트가 'Paused' | 1주 넘게 안 씀 | Supabase 대시보드에서 Restore |
| 무료 프로젝트 2개 한도 | 이미 프로젝트 둘 | 다른 프로젝트를 Pause |

표에 없으면 오류의 첫 줄로 원인 후보 2–3개와 확인할 명령(`npm run doctor:db` 등)을 알려 준다.

## 9. 커밋

커밋 · push 전에 **파일 목록 · 두 줄 메시지 · 브랜치(`main`)**를 먼저 보여 주고 승인받는다. push = 운영 주소 배포.

- 올리지 않는 것: `.env*`(`.env.example`만 예외) · `.next/` · `node_modules/` · `lib/generated/`. 목록에 보이면 빼고 알린다. `data/`의 원본은 바뀌지 않았어야 한다.
- 메시지(한국어 두 줄, 사이에 빈 줄):
    - 세이브 포인트 1(C-1 · 05, 커밋만 · push는 아직): `5일차: 바이어 · 확인 기록 표와 처음 데이터 추가` / `왜: 새로 고쳐도 사라지지 않게 기록을 DB에 남기려고`
    - 출격(C-2 · 03): `5일차: 쪽이 DB를 읽고 확인 기록을 남기게` / `왜: 대표님이 휴대폰에서 확인 기록을 바로 보시게`
    - 세이브 포인트 2(C-2 · 05): `5일차: 자유 퀘스트 — {더한 것 한 줄}` / `왜: {누가 무엇이 편해지나 한 줄}`
- `guide:update`로 바뀐 `guide/` 파일이 아직 커밋 전이면 같은 커밋에 넣어도 된다(목록에 밝힌다).
- 강제 push · `git reset --hard`는 하지 않는다. push 뒤 `git log --oneline -3`과 커밋 7글자를 보여 준다.

**확인할 것 3줄**: 커밋 파일 목록(`.env` 없음) · 메시지 첫 줄 · (push했다면) 커밋 7글자.

## 10. 숫자가 다를 때

c-check로 불리면 **아직 고치지 않는다.** 다시 세어 나란히 보여 주고, 어디서 갈렸는지 원인 후보와 확인 방법만 답한다.
- 다시 세는 법: JSON 쪽은 `node`로 `data/buyers.json`을 세는 짧은 명령(파일은 만들지 않는다). DB 쪽은 `npm run db:seed`를 한 번 더 — 두 번 넣어도 같으니 안전하고, DB에서 다시 센 세 줄을 찍는다.
- 흔한 갈림길:
    - seed가 일부만 들어감(중간 오류) · `skipDuplicates` 없이 넣다 멈춤 → `Buyer` 행 수
    - `getBuyers()`에 `where` · `take` · 다른 정렬을 넣음 → 곳 수 · 상위 10
    - 숫자 칸을 글자로 넣음 · `null`을 0으로 넣음 → 합 · 비율
    - `lib/metrics.ts`를 고침 · 등급을 `pd30d`로 다시 매김
    - `force-dynamic`이 빠져 빌드 때의 값이 남음 → 새 기록이 안 보임 · 예전 숫자
    - 확인 기록의 순서(`createdAt` 최신이 위)가 빠짐
- 끝나면 확인할 것 3줄.

## 11. 채팅 경로

Claude Code 대신 claude.ai 대화로 할 때. 표 만들기 · 데이터 넣기는 **터미널이 필요하다** — GitHub의 내 저장소 → Code → Codespaces(또는 짝의 PC)의 터미널에서 사람이 명령을 친다.
- 첨부: `CLAUDE.md` · 이 안내서 · `guide/design_rules.md` · `prisma/schema.prisma` · `lib/buyers.ts` · `lib/db.ts` · `lib/format.ts` · `app/page.tsx` · `app/buyers/page.tsx` · `app/buyers/[id]/page.tsx` · `components/Notice.tsx`. 이어서 오는 프롬프트의 `@경로`는 첨부한 파일로 읽는다. `data/buyers.json`은 가상 데이터라 첨부해도 된다.
- Plan 모드가 없으니 큰 작업은 계획을 먼저 보이고, 사람이 좋다고 하면 진행한다.
- 결과는 **파일마다 경로 제목 + 파일 전체 내용**(고친 곳만이 아니라 처음부터 끝까지). 사람이 Codespaces 편집기에 붙여 넣고 명령(`npm run db:push` · `npm run db:seed` · `npm run build`)을 친 뒤 끝 10줄을 대화에 붙인다.
- `.env` 내용 · 비밀번호 · 연결 주소는 대화에 붙이지 말라고 먼저 말한다. DB 상태는 `npm run doctor:db`의 결과(비밀번호가 가려진다)만 받는다.
- 커밋 · push는 사람이 Codespaces의 소스 제어에서 한다(메시지는 9절). Vercel 환경 변수 · Redeploy는 6절의 두 줄 그대로.
- 끝나면 확인할 것 3줄.
