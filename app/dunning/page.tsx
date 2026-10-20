import Link from "next/link";
import type { Metadata } from "next";
import DecisionForm from "@/components/DecisionForm";
import GradeBadge from "@/components/GradeBadge";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import { countDrafts, DRAFT_TABS, getDrafts, toDraftStatus } from "@/lib/drafts";
import { int, kst, usd } from "@/lib/format";
import type { GuardCheck } from "@/lib/guardrails";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "독촉 승인" };

function Checks({ checks, onlyFailed = false }: { checks: GuardCheck[]; onlyFailed?: boolean }) {
  const shown = onlyFailed ? checks.filter((c) => !c.ok) : checks;
  return (
    <ul className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
      {shown.map((c) => (
        <li key={c.id} className="rounded border border-line bg-bg px-2 py-1">
          <span className="num text-muted">{c.id}</span> <span className="text-ink">{c.label}</span>{" "}
          <span className={`font-semibold ${c.ok ? "text-grade-s" : "text-warn"}`}>{c.ok ? "통과" : "걸림"}</span>
          {!c.ok && c.note ? <span className="block text-warn">{c.note}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export default async function Page({ searchParams }: { searchParams: Promise<{ tab?: string | string[] }> }) {
  const { tab } = await searchParams;
  const status = toDraftStatus(tab);
  const [drafts, counts] = await Promise.all([getDrafts(status), countDrafts()]);
  const label = DRAFT_TABS.find((t) => t.status === status)?.label ?? "대기";

  return (
    <div className="space-y-6">
      <PageHeader
        title="독촉 승인"
        asof="2026-09-30 · (가상) 합성 데이터"
        line="AI는 초안까지만 — 승인해도 메일은 나가지 않습니다(실제 발송 없음)"
      />

      <nav aria-label="초안 상태">
        <ul className="flex flex-wrap gap-2">
          {DRAFT_TABS.map((t) => {
            const active = t.status === status;
            return (
              <li key={t.status}>
                <Link
                  href={`/dunning?tab=${t.status}`}
                  aria-current={active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-md border px-4 text-sm ${
                    active ? "border-accent bg-accent text-white" : "border-line text-ink hover:bg-surface"
                  }`}
                >
                  {t.label} <span className="num">{int(counts[t.status])}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {drafts.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-4 text-muted">{label} 초안이 없습니다</p>
      ) : (
        <ul className="space-y-4" aria-label={`${label} 초안`}>
          {drafts.map((d) => (
            <li key={d.id} className="space-y-3 rounded-lg border border-line p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Link href={`/buyers/${d.buyerId}`} className="inline-flex min-h-11 items-center font-semibold text-accent hover:underline">
                  {`${d.buyerId} · ${d.buyer.name}`}
                </Link>
                <GradeBadge grade={d.buyer.grade} />
              </div>
              <p className="text-sm text-ink">
                <span className="num">{d.stage}</span> · <span className="num">{d.tone}</span> · 연체{" "}
                <span className="num">{usd(d.overdueUsd)}</span> · 초안 <span className="num">#{d.id}</span>
              </p>
              <p className="text-ink">{d.summaryKo}</p>

              <div className="rounded-lg border border-line bg-surface p-3">
                <p className="font-semibold text-ink">{d.subject}</p>
                <p className="mt-2 whitespace-pre-wrap wrap-anywhere text-sm text-ink">{d.body}</p>
              </div>

              {d.status === "blocked" ? (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-warn">걸린 검사 — 승인할 수 없습니다</p>
                  <Checks checks={d.checks} onlyFailed />
                </div>
              ) : (
                <Checks checks={d.checks} />
              )}

              {d.status === "pending" ? <DecisionForm draftId={d.id} /> : null}
              {d.status === "approved" ? (
                <Notice tone="ok" title="발송 대기 — 실제 발송 없음">
                  {d.decidedBy} · <span className="num">{d.decidedAt ? kst(d.decidedAt) : "—"}</span>
                </Notice>
              ) : null}
              {d.status === "rejected" ? (
                <Notice tone="warn" title={`반려 — 사유: ${d.reason ?? "—"}`}>
                  {d.decidedBy} · <span className="num">{d.decidedAt ? kst(d.decidedAt) : "—"}</span>
                </Notice>
              ) : null}

              <p className="text-sm text-muted">
                만든 시각 <span className="num">{kst(d.createdAt)}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
