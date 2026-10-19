// 큰 숫자 하나: 이름 · 값(이미 형식을 맞춘 글자) · 보조 한 줄.
export default function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="num mt-1 text-2xl font-bold text-ink">{value}</p>
      {sub ? <p className="mt-1 text-sm text-muted">{sub}</p> : null}
    </div>
  );
}
