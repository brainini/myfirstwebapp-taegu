// 배포 확인용 route handler — 부를 때마다 새로 계산한다(캐시 없음).
// Vercel이 넣어 주는 환경 변수(VERCEL_ENV · VERCEL_GIT_COMMIT_SHA · VERCEL_REGION)만 읽는다. 비밀값은 내보내지 않는다.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    env: process.env.VERCEL_ENV ?? "local",
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    region: process.env.VERCEL_REGION ?? "local",
    mode: process.env.NODE_ENV,
  });
}
