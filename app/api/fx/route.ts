import saved from "@/data/fx_fallback.json";
import type { FxPayload, FxRates } from "@/components/FxTile";
import { kst } from "@/lib/format";

// 환율 레이더 — 서버가 받아 60초 동안 같은 응답을 다시 쓴다. 못 받으면 저장본(data/fx_fallback.json).
export const revalidate = 60;

const ENDPOINT = "https://api.frankfurter.dev/v2/rates?base=USD&quotes=KRW,EUR,JPY,CNY";
const PROVIDER = "api.frankfurter.dev";
const QUOTES = ["KRW", "EUR", "JPY", "CNY"] as const;

type Row = { date: string; base: string; quote: string; rate: number };

/** 네 통화가 모두 있고 rate가 0보다 큰 수면 { date, rates }, 하나라도 어긋나면 null */
function pick(rows: unknown): { date: string; rates: FxRates } | null {
  if (!Array.isArray(rows)) return null;
  const rates = {} as FxRates;
  let date = "";
  for (const q of QUOTES) {
    const r = rows.find((x: Partial<Row>) => x?.base === "USD" && x?.quote === q) as Partial<Row> | undefined;
    if (!r || typeof r.rate !== "number" || !Number.isFinite(r.rate) || r.rate <= 0) return null;
    if (typeof r.date !== "string") return null;
    rates[q] = r.rate;
    if (q === "KRW") date = r.date;
  }
  return { date, rates };
}

async function fromApi() {
  const res = await fetch(ENDPOINT, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) return null;
  return pick(await res.json());
}

export async function GET() {
  const now = new Date();
  const stamp = { fetchedAt: now.toISOString(), fetchedAtKst: kst(now, true) };

  if (process.env.FX_FORCE_FALLBACK !== "1") {
    const live = await fromApi().catch(() => null);
    if (live) {
      const body: FxPayload = { ...live, base: "USD", ...stamp, provider: PROVIDER, fallback: false };
      return Response.json(body);
    }
  }

  const backup = pick(saved.latest);
  if (!backup) return Response.json({ error: "환율 저장본을 읽지 못했습니다" }, { status: 500 });
  const body: FxPayload = {
    ...backup,
    base: "USD",
    ...stamp,
    provider: saved.provider,
    fallback: true,
    savedAt: saved.savedAt,
    savedAtKst: kst(saved.savedAt),
  };
  return Response.json(body);
}
