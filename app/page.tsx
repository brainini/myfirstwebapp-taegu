import buyers from "@/data/buyers.json";
import DeployBadge from "@/components/DeployBadge";
import KpiCard from "@/components/KpiCard";
import Notice from "@/components/Notice";
import PageHeader from "@/components/PageHeader";
import { int, pct, usd } from "@/lib/format";

// 첫 화면 — 숫자는 data/buyers.json에서 그때그때 계산한다(손으로 적은 숫자 없음).
export default function Home() {
  const total = buyers.length;
  const gradeC = buyers.filter((b) => b.grade === "C");
  const arAll = buyers.reduce((sum, b) => sum + b.openArUsd, 0);
  const arC = gradeC.reduce((sum, b) => sum + b.openArUsd, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="한빛정밀 웹 작업대"
        asof="2026-09-30 · (가상) 합성 데이터"
        line="바이어 채권 · 등급을 휴대폰에서 보는 사내 웹앱입니다. 쪽은 실습에서 하나씩 더합니다."
      />

      <section aria-label="요약 숫자" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="바이어" value={`${int(total)}곳`} sub="data/buyers.json" />
        <KpiCard label="C등급" value={`${int(gradeC.length)}곳`} sub="등급은 데이터의 grade 칸 그대로" />
        <KpiCard label="C등급 채권" value={usd(arC)} sub={`전체 미결 ${usd(arAll)}의 ${pct(arAll > 0 ? arC / arAll : null)}`} />
      </section>

      <Notice tone="ok" title="이 쪽이 보이면 배포 성공">
        휴대폰으로도 같은 주소를 열어 보세요. 아래 배지가 <span className="num">production · 커밋 7자리 · icn1</span>이면
        Vercel 서버(서울)에서 도는 중이고, <span className="num">내 PC · development</span>이면 내 PC에서 도는 중입니다.
      </Notice>

      <DeployBadge />
    </div>
  );
}
