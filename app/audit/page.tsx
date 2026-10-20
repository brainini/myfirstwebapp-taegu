import Link from "next/link";
import type { Metadata } from "next";
import DataTable, { type Column } from "@/components/DataTable";
import PageHeader from "@/components/PageHeader";
import { AUDIT_ACTIONS, countAuditLogs, getAuditLogs, toAuditAction } from "@/lib/audit";
import { int, kst } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "감사 기록" };

const COLUMNS: Column[] = [
  { key: "at", label: "시각" },
  { key: "actor", label: "누가" },
  { key: "action", label: "무엇을" },
  { key: "target", label: "대상" },
  { key: "detail", label: "내용" },
];

export default async function Page({ searchParams }: { searchParams: Promise<{ action?: string | string[] }> }) {
  const { action: raw } = await searchParams;
  const action = toAuditAction(raw);
  const [logs, total] = await Promise.all([getAuditLogs(action, 50), countAuditLogs(action)]);

  const filters = [
    { href: "/audit", label: "전체", active: action === null },
    ...AUDIT_ACTIONS.map((a) => ({ href: `/audit?action=${encodeURIComponent(a)}`, label: a, active: action === a })),
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="감사 기록" asof="2026-09-30 · (가상) 합성 데이터" line="이 기록은 지우거나 고치지 않습니다" />

      <nav aria-label="무엇을 했는지로 거르기">
        <ul className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <li key={f.href}>
              <Link
                href={f.href}
                aria-current={f.active ? "page" : undefined}
                className={`inline-flex min-h-11 items-center rounded-md border px-4 text-sm ${
                  f.active ? "border-accent bg-accent text-white" : "border-line text-ink hover:bg-surface"
                }`}
              >
                {f.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <p className="text-sm text-ink">
        모두 <span className="num">{int(total)}줄</span> · 최근 <span className="num">50줄</span>까지
      </p>

      <DataTable
        columns={COLUMNS}
        rows={logs.map((l) => ({
          at: <span className="num">{kst(l.at, true)}</span>,
          actor: l.actor,
          action: l.action,
          target: l.target,
          detail: <span className="wrap-anywhere">{l.detail}</span>,
        }))}
        caption={action ? `감사 기록 — ${action}` : "감사 기록 — 전체"}
        empty="아직 기록이 없습니다"
      />
    </div>
  );
}
