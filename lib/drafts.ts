import { db } from "@/lib/db";
import type { GuardCheck } from "@/lib/guardrails";

// 독촉 초안 읽기(서버에서만). 지우는 코드는 두지 않는다 — 결정은 app/dunning/actions.ts에서 pending만.
export type DraftStatus = "pending" | "approved" | "rejected" | "blocked";

export const DRAFT_TABS: { status: DraftStatus; label: string }[] = [
  { status: "pending", label: "대기" },
  { status: "approved", label: "승인" },
  { status: "rejected", label: "반려" },
  { status: "blocked", label: "막힘" },
];

/** 주소의 tab 값 → 상태(모르는 값이면 pending) */
export function toDraftStatus(value: string | string[] | undefined): DraftStatus {
  const v = (Array.isArray(value) ? value[0] : value)?.trim().toLowerCase();
  return DRAFT_TABS.find((t) => t.status === v)?.status ?? "pending";
}

/** 그 상태의 초안 — 연체 금액 큰 순, 같으면 번호 순 */
export async function getDrafts(status: DraftStatus) {
  const rows = await db().dunningDraft.findMany({
    where: { status },
    orderBy: [{ overdueUsd: "desc" }, { buyerId: "asc" }, { id: "asc" }],
    include: { buyer: { select: { name: true, grade: true } } },
  });
  return rows.map((d) => ({ ...d, checks: (Array.isArray(d.checks) ? d.checks : []) as unknown as GuardCheck[] }));
}

/** 상태마다 개수 { pending: 20, … } */
export async function countDrafts(): Promise<Record<DraftStatus, number>> {
  const groups = await db().dunningDraft.groupBy({ by: ["status"], _count: { _all: true } });
  const out: Record<DraftStatus, number> = { pending: 0, approved: 0, rejected: 0, blocked: 0 };
  for (const g of groups) if (g.status in out) out[g.status as DraftStatus] = g._count._all;
  return out;
}
