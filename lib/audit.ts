import { db } from "@/lib/db";

// 감사 기록 읽기(서버에서만). 이 표는 쌓기만 한다 — 쓰기는 create뿐, 고치기 · 지우기 코드는 어디에도 두지 않는다.
export const AUDIT_ACTIONS = ["초안 작성", "초안 막힘", "승인", "반려"] as const;

/** 주소의 action 값 → 거르기(모르는 값이면 null = 전체) */
export function toAuditAction(value: string | string[] | undefined): string | null {
  const v = (Array.isArray(value) ? value[0] : value)?.trim();
  return AUDIT_ACTIONS.find((a) => a === v) ?? null;
}

const where = (action: string | null) => (action ? { action } : {});

/** 최신이 위 — 같은 시각이면 나중에 넣은 것(id 큰 것)이 위 */
export async function getAuditLogs(action: string | null, take = 50) {
  return db().auditLog.findMany({ where: where(action), orderBy: [{ at: "desc" }, { id: "desc" }], take });
}

export async function countAuditLogs(action: string | null) {
  return db().auditLog.count({ where: where(action) });
}
