// 고치지 않는다 — 미리 시험한 DB 연결 파일(4–6일차 공용).
// 서버 코드(서버 컴포넌트 · 서버 액션 · route handler · scripts)에서만 db()를 부른다.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";

const g = globalThis as unknown as { __prisma?: PrismaClient };

function cleanUrl(raw?: string) {
  if (!raw) throw new Error("DATABASE_URL이 없습니다 — 내 PC는 .env, 배포는 Vercel 환경 변수에 넣으세요.");
  const u = new URL(raw);
  u.searchParams.delete("pgbouncer");
  u.searchParams.delete("sslmode");
  return u.toString();
}

export function db(): PrismaClient {
  // 부를 때 만든다 — 4일차(주소 없음) 빌드가 깨지지 않게
  g.__prisma ??= new PrismaClient({
    adapter: new PrismaPg({ connectionString: cleanUrl(process.env.DATABASE_URL), ssl: { rejectUnauthorized: false }, max: 3 }),
  });
  return g.__prisma;
}
