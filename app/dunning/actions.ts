"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import type { DecisionState } from "@/components/DecisionForm";
import { db } from "@/lib/db";

// 승인 · 반려 — pending 초안만 결정한다. 승인해도 메일은 나가지 않는다(실제 발송 없음).
// 승인 코드는 서버에서만 견주고, 값은 화면 · 로그 · 응답 어디에도 쓰지 않는다.

const digest = (s: string) => createHash("sha256").update(s, "utf8").digest();
const samePin = (a: string, b: string) => timingSafeEqual(digest(a), digest(b));

const fail = (message: string): DecisionState => ({ ok: false, message });

export async function decide(_prev: DecisionState, formData: FormData): Promise<DecisionState> {
  // 1. 승인 코드 설정
  const pin = (process.env.APPROVER_PIN ?? "").trim();
  if (!pin) return fail("승인 코드가 설정되지 않았습니다");

  // 2. 입력 검사(앞뒤 공백 제거)
  const field = (name: string) => String(formData.get(name) ?? "").trim();
  const id = Number(field("draftId"));
  const decision = field("decision");
  const decidedBy = field("decidedBy");
  const reason = field("reason");
  if (!Number.isInteger(id) || id <= 0) return fail("초안 번호가 올바르지 않습니다");
  if (decision !== "approve" && decision !== "reject") return fail("승인 또는 반려를 눌러 주세요");
  if (decidedBy.length === 0) return fail("승인자 별명을 적어 주세요");
  if (decidedBy.length > 20) return fail("별명은 20자 이내로 적어 주세요");
  if (decision === "reject" && reason.length < 5) return fail("반려 사유를 5자 이상 적어 주세요");
  if (decision === "reject" && reason.length > 200) return fail("반려 사유는 200자 이내로 적어 주세요");

  // 3. 승인 코드 — 다르면 DB는 아무것도 바꾸지 않는다(감사 기록도 쓰지 않는다)
  if (!samePin(field("pin"), pin)) return fail("승인 코드가 다릅니다");

  // 4. pending일 때만 바꾸고, 바뀌었으면 감사 기록 1줄
  const approve = decision === "approve";
  let changed: boolean;
  try {
    changed = await db().$transaction(async (tx) => {
      const r = await tx.dunningDraft.updateMany({
        where: { id, status: "pending" },
        data: { status: approve ? "approved" : "rejected", decidedBy, decidedAt: new Date(), reason: approve ? null : reason },
      });
      if (r.count === 0) return false;
      const d = await tx.dunningDraft.findUniqueOrThrow({ where: { id }, select: { buyerId: true } });
      await tx.auditLog.create({
        data: {
          actor: decidedBy,
          action: approve ? "승인" : "반려",
          target: `${d.buyerId} · 초안 #${id}`,
          detail: approve ? "발송 대기 — 실제 발송 없음" : `사유: ${reason}`,
        },
      });
      return true;
    });
  } catch {
    return fail("저장하지 못했습니다 — 잠시 뒤 다시 눌러 주세요");
  }
  if (!changed) return fail("이미 처리된 초안입니다");

  // 5. 화면 다시 그리기
  revalidatePath("/dunning");
  revalidatePath("/audit");
  return { ok: true, message: approve ? "승인했습니다 — 발송 대기(실제 발송 없음)" : "반려했습니다" };
}
