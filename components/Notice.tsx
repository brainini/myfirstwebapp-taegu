import type { ReactNode } from "react";

// 알림 상자: 색 + 글자 표지(안내 · 확인 · 주의). 색만으로 뜻을 나르지 않는다.
const TONE = {
  info: { tag: "안내", box: "border-accent", tagClass: "text-accent" },
  ok: { tag: "확인", box: "border-grade-s", tagClass: "text-grade-s" },
  warn: { tag: "주의", box: "border-warn", tagClass: "text-warn" },
} as const;

export default function Notice({
  tone = "info",
  title,
  children,
}: {
  tone?: keyof typeof TONE;
  title?: string;
  children?: ReactNode;
}) {
  const t = TONE[tone];
  return (
    <div role={tone === "warn" ? "alert" : "status"} className={`rounded-lg border-l-4 bg-surface p-4 ${t.box}`}>
      <p className="font-semibold text-ink">
        <span className={`mr-2 text-sm ${t.tagClass}`}>[{t.tag}]</span>
        {title}
      </p>
      {children ? <div className="mt-1 text-sm text-ink">{children}</div> : null}
    </div>
  );
}
