"use client";

import { startTransition, useActionState, type FormEvent } from "react";
import Notice from "@/components/Notice";
import { decide } from "@/app/dunning/actions";

// 승인 · 반려 폼 — 화면 움직임만. 검사 · 승인 코드 확인 · 저장은 서버 액션(decide)이 한다.
export type DecisionState = { ok: boolean; message: string };

export default function DecisionForm({ draftId }: { draftId: number }) {
  const [state, formAction, pending] = useActionState(decide, { ok: false, message: "" });

  // 결과와 상관없이 입력이 지워지지 않게 직접 보낸다(누른 단추의 decision 값도 함께)
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(e.currentTarget, submitter);
    startTransition(() => formAction(data));
  }

  const ids = { by: `decided-by-${draftId}`, pin: `pin-${draftId}`, reason: `reason-${draftId}` };
  const input = "mt-1 block min-h-11 w-full rounded-md border border-line bg-bg px-3 text-ink";

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border border-line bg-surface p-3">
      <input type="hidden" name="draftId" value={draftId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={ids.by} className="text-sm font-semibold text-ink">
            승인자 별명
          </label>
          <input id={ids.by} name="decidedBy" type="text" placeholder="실명 대신 별명" className={input} />
        </div>
        <div>
          <label htmlFor={ids.pin} className="text-sm font-semibold text-ink">
            승인 코드
          </label>
          <input id={ids.pin} name="pin" type="password" autoComplete="off" className={input} />
        </div>
      </div>
      <div>
        <label htmlFor={ids.reason} className="text-sm font-semibold text-ink">
          반려 사유(반려할 때만 · 5–200자)
        </label>
        <textarea
          id={ids.reason}
          name="reason"
          rows={2}
          placeholder="예: 금액 확인 후 다시 작성"
          className="mt-1 block w-full rounded-md border border-line bg-bg p-3 text-ink"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          name="decision"
          value="approve"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 font-semibold text-white disabled:opacity-60"
        >
          {pending ? "처리 중…" : "승인"}
        </button>
        <button
          type="submit"
          name="decision"
          value="reject"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-md border border-warn bg-bg px-4 font-semibold text-warn disabled:opacity-60"
        >
          반려
        </button>
      </div>
      {state.message ? <Notice tone={state.ok ? "ok" : "warn"} title={state.message} /> : null}
    </form>
  );
}
