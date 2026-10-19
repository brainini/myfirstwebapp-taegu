// 등급 배지: 색 + 글자(색만으로 구분하지 않는다). grade는 데이터의 grade 칸 그대로 — 다시 계산하지 않는다.
const STYLE: Record<string, string> = {
  S: "border-grade-s text-grade-s",
  A: "border-grade-a text-grade-a",
  B: "border-grade-b text-grade-b",
  C: "border-grade-c bg-grade-c text-white",
};

export default function GradeBadge({ grade }: { grade: string }) {
  const style = STYLE[grade] ?? "border-line text-muted";
  return (
    <span
      className={`inline-flex min-w-7 items-center justify-center rounded border px-1.5 text-sm font-semibold ${style}`}
      aria-label={`${grade}등급`}
    >
      {grade}
    </span>
  );
}
