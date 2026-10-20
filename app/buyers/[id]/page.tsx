import Link from "next/link";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import GradeBadge from "@/components/GradeBadge";
import PageHeader from "@/components/PageHeader";
import ReviewForm, { StatusBadge } from "@/components/ReviewForm";
import { getBuyer } from "@/lib/buyers";
import { int, kst, pct, usd } from "@/lib/format";
import { getReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

// 쪽은 요청 때 만든다(generateStaticParams 없음) — 5일차에 DB로 바꿔도 그대로.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const b = await getBuyer(id);
  return { title: b ? `${b.id} · ${b.name}` : "바이어를 찾을 수 없습니다" };
}

export default async function Page({ params }: Props) {
  const { id } = await params;
  const b = await getBuyer(id);
  if (!b) notFound();
  const reviews = await getReviews(b.id);

  const cells: { label: string; value: ReactNode; num?: boolean }[] = [
    { label: "나라", value: b.countryKo },
    { label: "지역", value: b.region },
    { label: "업종", value: b.industry },
    { label: "결제방식", value: b.paymentMethod },
    { label: "결제기간", value: `${int(b.termsDays)}일`, num: true },
    { label: "채권", value: usd(b.openArUsd), num: true },
    { label: "연체", value: usd(b.overdueUsd), num: true },
    { label: "31일 넘긴 채권 비중", value: pct(b.pctAr31p), num: true },
    { label: "가장 오래 밀린 인보이스", value: `${int(b.oldestOpenDays)}일`, num: true },
    {
      label: "최근 1년 평균 지연",
      value: b.avgDaysLate12m === null ? "—" : `${b.avgDaysLate12m.toFixed(1)}일`,
      num: true,
    },
    { label: "위험 점수", value: pct(b.pd30d), num: true },
    { label: "등급", value: <GradeBadge grade={b.grade} /> },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={b.name}
        asof="2026-09-30 · (가상) 합성 데이터"
        line={`${b.id} · ${b.countryKo} · ${b.region}`}
      />

      <section aria-label="바이어 정보">
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cells.map((c) => (
            <div key={c.label} className="rounded-lg border border-line bg-surface p-3">
              <dt className="text-sm text-muted">{c.label}</dt>
              <dd className={`mt-1 font-semibold text-ink ${c.num ? "num" : ""}`}>{c.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="signals" className="space-y-3">
        <h2 id="signals" className="text-lg font-bold text-ink">
          위험 신호
        </h2>
        <ul className="list-disc space-y-1 pl-5 text-ink">
          {b.signals.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <p className="text-sm text-muted">이 신호들은 확인해 볼 이유이지, 연체의 원인이라는 뜻은 아닙니다.</p>
      </section>

      <section aria-labelledby="reviews" className="space-y-3">
        <h2 id="reviews" className="text-lg font-bold text-ink">
          확인 기록
        </h2>
        <ReviewForm buyerId={b.id} />
        {reviews.length === 0 ? (
          <p className="text-sm text-muted">아직 확인 기록이 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {reviews.map((r) => (
              <li key={r.id} className="rounded-lg border border-line p-3">
                <StatusBadge status={r.status} />
                <p className="mt-2 whitespace-pre-wrap wrap-anywhere text-ink">{r.memo}</p>
                <p className="mt-1 text-sm text-muted">
                  {r.reviewer} · <span className="num">{kst(r.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link href="/buyers" className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-accent">
        바이어 목록으로
      </Link>
    </div>
  );
}
