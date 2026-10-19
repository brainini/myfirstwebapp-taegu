import "dotenv/config";
import { defineConfig } from "prisma/config";

// 고치지 않는다 — 4–6일차 내내 이 설정 그대로 쓴다.
// 'Update available … prisma@latest' 안내를 끈다(최신 태그는 8 시험판 — 따라 올리면 깨진다).
process.env.PRISMA_HIDE_UPDATE_MESSAGE ??= "1";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations", seed: "tsx prisma/seed.ts" },
  // CLI(db push)는 세션 풀러 5432. Vercel 빌드의 generate는 주소가 없어도 되게 자리표시 주소.
  datasource: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "postgresql://u:p@localhost:5432/placeholder" },
});
