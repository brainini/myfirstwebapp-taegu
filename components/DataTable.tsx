import type { ReactNode } from "react";

// 표: md(768px) 이상은 표, 그보다 좁으면 카드 목록(휴대폰에서 가로 스크롤 없음).
// rows의 각 칸에는 글자나 부품(링크 · GradeBadge 등)을 넣는다. 숫자는 lib/format으로 형식을 맞춰서 넣는다.
export type Column = { key: string; label: string; align?: "left" | "right" };

export default function DataTable({
  columns,
  rows,
  caption,
  empty = "보여 줄 행이 없습니다.",
}: {
  columns: Column[];
  rows: Record<string, ReactNode>[];
  caption?: string;
  empty?: string;
}) {
  if (rows.length === 0) {
    return <p className="rounded-lg border border-line bg-surface p-4 text-muted">{empty}</p>;
  }
  const [first, ...rest] = columns;
  return (
    <div>
      <table className="hidden w-full border-collapse text-sm md:table">
        {caption ? <caption className="mb-2 text-left text-sm text-muted">{caption}</caption> : null}
        <thead>
          <tr className="border-b border-line">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`px-3 py-2 font-semibold text-muted ${c.align === "right" ? "text-right" : "text-left"}`}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-line">
              {columns.map((c) => (
                <td key={c.key} className={`px-3 py-2 text-ink ${c.align === "right" ? "num text-right" : ""}`}>
                  {row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="space-y-2 md:hidden" aria-label={caption}>
        {rows.map((row, i) => (
          <li key={i} className="rounded-lg border border-line bg-bg p-3">
            {first ? <div className="font-semibold text-ink">{row[first.key]}</div> : null}
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              {rest.map((c) => (
                <div key={c.key} className="contents">
                  <dt className="text-muted">{c.label}</dt>
                  <dd className={`text-ink ${c.align === "right" ? "num text-right" : ""}`}>{row[c.key]}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
