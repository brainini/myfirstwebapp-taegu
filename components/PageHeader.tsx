// 쪽 맨 위: 제목 · 기준(데이터 날짜) · 한 줄 설명.
export default function PageHeader({ title, asof, line }: { title: string; asof?: string; line?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-ink">{title}</h1>
      {asof ? <p className="mt-1 text-sm text-muted">기준: {asof}</p> : null}
      {line ? <p className="mt-2 text-ink">{line}</p> : null}
    </div>
  );
}
