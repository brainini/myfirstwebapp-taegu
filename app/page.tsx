import Link from "next/link";
import DeployBadge from "@/components/DeployBadge";
import KpiCard from "@/components/KpiCard";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import { StatusBadge } from "@/components/ReviewForm";
import { getBuyers } from "@/lib/buyers";
import { int, kst, pct, usd } from "@/lib/format";
import { getRecentReviews } from "@/lib/reviews";

export const dynamic = "force-dynamic";

// 첫 화면 — 숫자는 DB에서 읽어 그때그때 계산한다(손으로 적은 숫자 없음).
export default async function Home() {
  const buyers = await getBuyers();
  const total = buyers.length;
  const gradeC = buyers.filter((b) => b.grade === "C");
  const arAll = buyers.reduce((sum, b) => sum + b.openArUsd, 0);
  const arC = gradeC.reduce((sum, b) => sum + b.openArUsd, 0);
  const recent = await getRecentReviews(5);

  return (
    <div className="space-y-6">
      <PageHeader
        title="한빛정밀 웹 작업대"
        asof="2026-09-30 · (가상) 합성 데이터"
        line="바이어 채권 · 등급을 휴대폰에서 보는 사내 웹앱입니다. 쪽은 실습에서 하나씩 더합니다."
      />

      <section aria-label="요약 숫자" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="바이어" value={`${int(total)}곳`} sub="Supabase DB에서 읽음" />
        <KpiCard label="C등급" value={`${int(gradeC.length)}곳`} sub="등급은 데이터의 grade 칸 그대로" />
        <KpiCard label="C등급 채권" value={usd(arC)} sub={`전체 미결 ${usd(arAll)}의 ${pct(arAll > 0 ? arC / arAll : null)}`} />
      </section>

      <Notice tone="ok" title="이 쪽이 보이면 배포 성공">
        휴대폰으로도 같은 주소를 열어 보세요. 아래 배지가 <span className="num">production · 커밋 7자리 · icn1</span>이면
        Vercel 서버(서울)에서 도는 중이고, <span className="num">내 PC · development</span>이면 내 PC에서 도는 중입니다.
      </Notice>

      <section aria-labelledby="recent-reviews" className="space-y-3">
        <h2 id="recent-reviews" className="text-lg font-bold text-ink">
          최근 확인 기록
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted">아직 확인 기록이 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {recent.map((r) => (
              <li key={r.id} className="rounded-lg border border-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/buyers/${r.buyerId}`} className="inline-flex min-h-11 items-center text-accent hover:underline">
                    {`${r.buyerId} · ${r.buyer.name}`}
                  </Link>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 whitespace-pre-wrap wrap-anywhere text-ink">{r.memo}</p>
                <p className="mt-1 text-sm text-muted">
                  {r.reviewer} · <span className="num">{kst(r.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <DeployBadge />
    </div>
  );
}
