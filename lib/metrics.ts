import type { Buyer, Grade } from "@/lib/buyers";

// 화면 숫자 계산 — 순수 함수만(화면 글자는 만들지 않는다. 형식은 lib/format.ts).
// 등급은 데이터의 grade 칸 그대로 쓰고 pd30d로 다시 매기지 않는다.
export const GRADES: Grade[] = ["S", "A", "B", "C"];

const sum = (buyers: Buyer[], pick: (b: Buyer) => number) => buyers.reduce((s, b) => s + pick(b), 0);
const ratio = (part: number, whole: number) => (whole > 0 ? part / whole : null);

/** 주소의 grade 값을 등급으로: 's' · 'S' → 'S', 배열이면 첫 값, 그 밖은 null(= 전체) */
export function toGrade(value: string | string[] | undefined | null): Grade | null {
  const v = (Array.isArray(value) ? value[0] : value)?.trim().toUpperCase();
  return GRADES.find((g) => g === v) ?? null;
}

export function kpis(buyers: Buyer[]) {
  const gradeC = buyers.filter((b) => b.grade === "C");
  const totalArUsd = sum(buyers, (b) => b.openArUsd);
  const gradeCArUsd = sum(gradeC, (b) => b.openArUsd);
  return {
    gradeCCount: gradeC.length,
    gradeCArUsd,
    gradeCShare: ratio(gradeCArUsd, totalArUsd),
    totalArUsd,
    total: buyers.length,
    overdueUsd: sum(buyers, (b) => b.overdueUsd),
    overdueCount: buyers.filter((b) => b.overdueUsd > 0).length,
  };
}

/** S · A · B · C 곳 수(이 순서) */
export function gradeCounts(buyers: Buyer[]): { grade: Grade; count: number }[] {
  return GRADES.map((grade) => ({ grade, count: buyers.filter((b) => b.grade === grade).length }));
}

/** pd30d 큰 순, 같으면 id 순 */
function byRisk(a: Buyer, b: Buyer) {
  return b.pd30d - a.pd30d || a.id.localeCompare(b.id);
}

export function topRisk(buyers: Buyer[], n = 10): Buyer[] {
  return [...buyers].sort(byRisk).slice(0, n);
}

/** 지역마다 곳 수 · 채권 합 · C등급 채권 합 · C 몫(그 지역 C 합 ÷ 그 지역 합), 합이 큰 순 */
export function byRegion(buyers: Buyer[]) {
  const regions = [...new Set(buyers.map((b) => b.region))];
  return regions
    .map((region) => {
      const rows = buyers.filter((b) => b.region === region);
      const arUsd = sum(rows, (b) => b.openArUsd);
      const gradeCArUsd = sum(
        rows.filter((b) => b.grade === "C"),
        (b) => b.openArUsd,
      );
      return { region, count: rows.length, arUsd, gradeCArUsd, gradeCShare: ratio(gradeCArUsd, arUsd) };
    })
    .sort((a, b) => b.arUsd - a.arUsd);
}

/** grade가 S · A · B · C 중 하나면 그 등급만, 아니면 전부. 순서는 topRisk와 같다. */
export function filterByGrade(buyers: Buyer[], grade: string | string[] | undefined | null): Buyer[] {
  const g = toGrade(grade);
  return (g ? buyers.filter((b) => b.grade === g) : [...buyers]).sort(byRisk);
}
