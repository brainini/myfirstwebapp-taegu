import Link from "next/link";

export default function NotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-ink">찾는 쪽이 없습니다</h1>
      <p className="text-muted">주소를 다시 확인해 주세요. 아직 만들지 않은 쪽일 수도 있습니다.</p>
      <Link href="/" className="inline-flex min-h-11 items-center rounded-md border border-line px-4 text-accent">
        홈으로
      </Link>
    </div>
  );
}
