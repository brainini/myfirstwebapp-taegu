// 화면에 숫자 · 시각을 쓸 때는 이 함수들만 쓴다(한 줄 · 같은 모양).
// 값이 없으면(null · undefined · NaN) "—"를 돌려준다. 계산은 하지 않는다 — 계산은 lib/의 다른 파일에서.

type Num = number | null | undefined;

const EMPTY = "—";
const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function ok(v: Num): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

/** 달러 금액: 1234567 → "$1,234,567" (정수로 반올림) */
export function usd(v: Num): string {
  if (!ok(v)) return EMPTY;
  const s = whole.format(Math.abs(Math.round(v)));
  return v < 0 ? `-$${s}` : `$${s}`;
}

/** 원화 금액: 1234567890 → "1,234,567,890원" (원 단위로 반올림) */
export function krw(v: Num): string {
  if (!ok(v)) return EMPTY;
  return `${whole.format(Math.round(v))}원`;
}

/** 비율 → 백분율: 0.5 → "50.0%" (digits = 소수 자리, 기본 1) */
export function pct(ratio: Num, digits = 1): string {
  if (!ok(ratio)) return EMPTY;
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** 정수에 쉼표: 1500 → "1,500" */
export function int(v: Num): string {
  if (!ok(v)) return EMPTY;
  return whole.format(Math.round(v));
}

/** 한국 시각(Asia/Seoul): → "2026-10-19 15:03" · seconds=true면 "2026-10-19 15:03:07". 서버에서 부른다. */
export function kst(date: Date | string | number, seconds = false): string {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return EMPTY;
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const p = (t: Intl.DateTimeFormatPartTypes) => parts.find((x) => x.type === t)?.value ?? "";
  const hm = `${p("hour")}:${p("minute")}`;
  return `${p("year")}-${p("month")}-${p("day")} ${seconds ? `${hm}:${p("second")}` : hm}`;
}
