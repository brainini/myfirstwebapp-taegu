import { db } from "@/lib/db";

// 확인 기록 읽기(서버에서만). 최신이 위 — 같은 시각이면 나중에 넣은 것(id 큰 것)이 위.
const NEWEST_FIRST = [{ createdAt: "desc" as const }, { id: "desc" as const }];

/** 한 바이어의 확인 기록 */
export async function getReviews(buyerId: string, take = 20) {
  return db().review.findMany({ where: { buyerId }, orderBy: NEWEST_FIRST, take });
}

/** 모든 바이어의 최신 확인 기록(바이어 이름 포함) */
export async function getRecentReviews(take = 5) {
  return db().review.findMany({
    orderBy: NEWEST_FIRST,
    take,
    include: { buyer: { select: { name: true } } },
  });
}
