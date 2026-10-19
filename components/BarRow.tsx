import { int } from "@/lib/format";

// 가로 막대 한 줄: 이름 · 막대(value ÷ max) · 값 글자. display에 형식을 맞춘 글자(예: usd(v))를 주면 그것을 쓴다.
export default function BarRow({
  label,
  value,
  max,
  strong = false,
  display,
}: {
  label: string;
  value: number;
  max: number;
  strong?: boolean;
  display?: string;
}) {
  const width = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3 py-1.5 sm:grid-cols-[minmax(0,10rem)_1fr_auto]">
      <span className={`truncate text-sm ${strong ? "font-semibold text-ink" : "text-muted"}`} title={label}>
        {label}
      </span>
      <span className="h-3 rounded-sm bg-surface" aria-hidden="true">
        <span
          className={`block h-3 rounded-sm ${strong ? "bg-warn" : "bg-accent"}`}
          style={{ width: `${width}%` }}
        />
      </span>
      <span className={`num text-right text-sm ${strong ? "font-semibold text-ink" : "text-ink"}`}>
        {display ?? int(value)}
      </span>
    </div>
  );
}
