# CLAUDE.md — tradefin-web (4–6일차 웹 실습 저장소)
(가상) 한빛정밀(주)의 합성 데이터로 Next.js 웹앱을 만들어 Vercel에 배포합니다. 판단 · 승인은 사람이 합니다.

## 스택 — 버전 고정(바꾸지 않는다)
Next.js 16.4.2(App Router) · React 19.3.1 · TypeScript 5.9.3 · Tailwind CSS 4.3.3 · Prisma 7.10.1(@prisma/adapter-pg · pg) · Node 24
- 새 패키지는 설치하지 않는다. 꼭 필요하면 이름 · 이유 · 고정 버전을 먼저 묻는다(`npm i 이름@버전 --save-exact`).
  버전 없이 설치하지 않는다(prisma의 최신 태그는 8 시험판이다).
- Next.js 문서는 node_modules/next/dist/docs/에 있다 — 필요한 절만 찾아 읽는다. pages/ 라우터 · getServerSideProps는 쓰지 않는다. cacheComponents는 켜지 않는다.

## 폴더
app/ 쪽 · components/ 부품(있는 것을 먼저 쓴다) · lib/ 계산 · 데이터 · DB(lib/db.ts는 고치지 않는다) · data/ 원본(읽기만)
guide/ 실습 작업 안내서(읽기만 — 새 판은 사람이 npm run guide:update로 받는다) · hackathon/ 6일차 양식 · scripts/ 도구(doctor · lib/는 고치지 않는다) · prisma/ 표 설계

## 반드시
1. 끝나면 `npm run build`가 통과해야 한다(타입 오류 0). 통과 전에는 '완료'라고 하지 않는다.
2. 데이터 · DB · 비밀은 서버에서만: data/*.json · lib/db.ts · process.env는 서버 컴포넌트 · 서버 액션 · route handler에서만.
   'use client' 파일은 화면 움직임만 — 필요한 값은 props로 받는다. 데이터 파일은 fs가 아니라 import로 읽는다.
3. .env는 열지도 · 출력하지도 · 커밋하지도 않는다. 새 변수는 이름만 .env.example에. NEXT_PUBLIC_에는 비밀을 넣지 않는다(브라우저로 간다).
4. 화면 글은 한국어 · word-break: keep-all · 숫자는 tabular-nums · 금액 · %는 한 줄 · 390px에서 가로 스크롤 없음 · 이모지 없음 · guide/design_rules.md.
5. 숫자는 코드로 계산한 값만. 모르면 '확인 필요'. 시각은 lib/format.ts의 kst()로(서버에서).
6. 실제 회사 · 실명 · 실제 이메일 · 계좌 · API 키를 코드 · 데이터 · 커밋에 넣지 않는다. 메일은 실제로 보내지 않는다.
7. 표 바꾸기는 `npm run db:push`로만(migrate는 쓰지 않는다). '데이터가 지워진다'고 물으면 멈추고 사람에게 묻는다.
   파일 삭제 · 덮어쓰기 · git reset --hard · push --force도 먼저 묻는다.
8. 프롬프트가 가리킨 안내서의 절만 한다. 끝나면 그 절의 '확인할 것 3줄'을 보여 준다.
9. AI 엔진(claude -p)을 부르는 스크립트는 --dry-run으로만 시험한다 — 진짜 실행은 사람이 터미널에서.

## 2부 = 자유 퀘스트
프롬프트가 안내서의 「자유 퀘스트」 절을 가리키면 정해진 사양이 없다 — 수강생이 원하는 쪽으로 키운다.
재미있는 방향 3개('와!' 한 줄 · 걸릴 시간 · 키가 필요한지)를 먼저 제안하고, 고르면 계획 3줄 → 승인 → 만든다.
키 없이 되는 브라우저 기능(말하기 · 듣기 · 알림 · 홈 화면 설치)이나 게임도 좋다. 패키지 · 키 · 바깥 발송은 먼저 묻고, 1부의 쪽 · 숫자와 위 '반드시'는 그대로.

## 명령
npm run dev(http://localhost:3000) · npm run build · npm run doctor(막히면 먼저) · npm run doctor:db · npm run doctor:secrets
npm run env:init · npm run db:push · npm run db:seed · npm run drafts · npm run guide:update

## 커밋
한국어 두 줄 — 첫 줄 `N일차: 무엇`, 빈 줄, `왜: 이유`. main에 커밋 · push하면 Vercel이 다시 배포한다.
커밋 · push 전에 파일 목록 · 메시지 · 브랜치를 먼저 보여 준다.

## Next.js 판 안내
@AGENTS.md
