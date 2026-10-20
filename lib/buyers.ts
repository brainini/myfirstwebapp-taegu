import { db } from "@/lib/db";

// 바이어 데이터: Supabase DB의 Buyer 표를 읽는다(서버에서만).
// 함수 이름 · 인자 · 돌려주는 모양은 4일차(JSON) 그대로 — 속만 DB로 바뀌었다.
export type Grade = "S" | "A" | "B" | "C";

export type Buyer = {
  id: string;
  name: string;
  countryCode: string;
  countryKo: string;
  region: string;
  industry: string;
  paymentMethod: string;
  termsDays: number;
  openArUsd: number;
  overdueUsd: number;
  /** 31일 넘긴 채권 비중(0–1) · 없으면 null */
  pctAr31p: number | null;
  oldestOpenDays: number;
  /** 최근 1년 평균 지연 일수 · 없으면 null */
  avgDaysLate12m: number | null;
  /** 30일 안 연체 위험 점수(0–1) */
  pd30d: number;
  grade: Grade;
  signals: string[];
};

// DB의 grade 칸은 string이라 Grade로 맞춰 돌려준다(나머지 15칸은 형이 같다).
export async function getBuyers(): Promise<Buyer[]> {
  const rows = await db().buyer.findMany({ orderBy: { id: "asc" } });
  return rows as Buyer[];
}

/** id는 대문자로 맞춰 찾는다(b048 → B048). 없으면 null. */
export async function getBuyer(id: string): Promise<Buyer | null> {
  const row = await db().buyer.findUnique({ where: { id: id.trim().toUpperCase() } });
  return row as Buyer | null;
}
