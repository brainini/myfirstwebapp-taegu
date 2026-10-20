import Link from "next/link";
import type { Metadata } from "next";
import BarRow from "@/components/BarRow";
import DataTable, { type Column } from "@/components/DataTable";
import GradeBadge from "@/components/GradeBadge";
import KpiCard from "@/components/KpiCard";
import PageHeader from "@/components/PageHeader";
import { getBuyers, type Buyer } from "@/lib/buyers";
import { byRegion, filterByGrade, gradeCounts, kpis, toGrade, topRisk } from "@/lib/metrics";
import { int, pct, usd } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "바이어" };

const TOP_COLUMNS: Column[] = [
  { key: "buyer", label: "바이어" },
  { key: "country", label: "나라" },
  { key: "grade", label: "등급" },
  { key: "pd", label: "위험 점수", align: "right" },
  { key: "ar", label: "채권", align: "right" },
  { key: "overdue", label: "연체", align: "right" },
  { key: "signal", label: "첫 신호" },
];

const LIST_COLUMNS: Column[] = TOP_COLUMNS.filter((c) => c.key !== "signal");

function buyerCell(b: Buyer, rank?: number) {
  return (
    <div>
      <Link href={`/buyers/${b.id}`} className="inline-flex min-h-11 items-center text-accent hover:underline">
        {rank ? `${rank}. ${b.name}` : b.name}
      </Link>
      <div className="num text-xs font-normal text-muted">{b.id}</div>
    </div>
  );
}

function row(b: Buyer, rank?: number) {
  return {
    buyer: buyerCell(b, rank),
    country: b.countryKo,
    grade: <GradeBadge grade={b.grade} />,
    pd: pct(b.pd30d),
    ar: usd(b.openArUsd),
    overdue: usd(b.overdueUsd),
    signal: b.signals[0] ?? "—",
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ grade?: string | string[] }> }) {
  const { grade } = await searchParams;
  const buyers = await getBuyers();

  // KPI · 위험 상위 10 · 지역별은 언제나 전체 기준 — 등급 칩은 아래 '전체 목록'만 거른다.
  const k = kpis(buyers);
  const top = topRisk(buyers, 10);
  const regions = byRegion(buyers);
  const maxRegionAr = regions[0]?.arUsd ?? 0;
  const strongRegion = regions.reduce<(typeof regions)[number] | null>(
    (best, r) => ((r.gradeCShare ?? -1) > (best?.gradeCShare ?? -1) ? r : best),
    null,
  )?.region;

  const selected = toGrade(grade);
  const list = filterByGrade(buyers, grade);
  const chips = [
    { href: "/buyers", label: "전체", count: k.total, active: selected === null },
    ...gradeCounts(buyers).map((g) => ({
      href: `/buyers?grade=${g.grade}`,
      label: g.grade,
      count: g.count,
      active: selected === g.grade,
    })),
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`바이어 ${int(k.total)}곳`}
        asof="2026-09-30 · (가상) 합성 데이터"
        line="위험 점수는 판단을 돕는 값이고, 결정은 사람이 합니다."
      />

      <section aria-label="요약 숫자" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="위험 바이어(C등급)" value={`${int(k.gradeCCount)}곳`} />
        <KpiCard label="C등급 채권" value={usd(k.gradeCArUsd)} sub={`전체의 ${pct(k.gradeCShare)}`} />
        <KpiCard label="전체 채권" value={usd(k.totalArUsd)} sub={`${int(k.total)}곳`} />
        <KpiCard label="연체 금액" value={usd(k.overdueUsd)} sub={`${int(k.overdueCount)}곳`} />
      </section>

      <section aria-labelledby="top-risk" className="space-y-3">
        <h2 id="top-risk" className="text-lg font-bold text-ink">
          위험 상위 10
        </h2>
        <p className="text-sm text-muted">위험 점수가 큰 순, 같으면 바이어 번호 순입니다.</p>
        <DataTable columns={TOP_COLUMNS} rows={top.map((b, i) => row(b, i + 1))} caption="위험 점수 상위 10곳" />
      </section>

      <section aria-labelledby="by-region" className="space-y-3">
        <h2 id="by-region" className="text-lg font-bold text-ink">
          지역별 채권
        </h2>
        <p className="text-sm text-muted">채권 합이 큰 순입니다. 굵은 줄은 C등급 몫이 가장 큰 지역입니다.</p>
        <ul className="rounded-lg border border-line p-3">
          {regions.map((r) => (
            <li key={r.region} className="border-b border-line pb-1 last:border-b-0 last:pb-0">
              <BarRow
                label={r.region}
                value={r.arUsd}
                max={maxRegionAr}
                display={usd(r.arUsd)}
                strong={r.region === strongRegion}
              />
              <p className="pb-1 text-xs text-muted">
                C등급 <span className="num">{usd(r.gradeCArUsd)}</span> ·{" "}
                <span className="num">{pct(r.gradeCShare)}</span>
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="all-buyers" className="space-y-3">
        <h2 id="all-buyers" className="text-lg font-bold text-ink">
          전체 목록
        </h2>
        <nav aria-label="등급으로 거르기">
          <ul className="flex flex-wrap gap-2">
            {chips.map((c) => (
              <li key={c.href}>
                <Link
                  href={c.href}
                  aria-current={c.active ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-1 rounded-md border px-4 text-sm ${
                    c.active ? "border-accent bg-accent text-white" : "border-line text-ink hover:bg-surface"
                  }`}
                >
                  {c.label} <span className="num">{int(c.count)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-ink">
          {selected ? `${selected}등급` : "전체"} <span className="num">{int(list.length)}곳</span>
        </p>
        <DataTable
          columns={LIST_COLUMNS}
          rows={list.map((b) => row(b))}
          caption={selected ? `${selected}등급 바이어` : "전체 바이어"}
        />
      </section>
    </div>
  );
}
