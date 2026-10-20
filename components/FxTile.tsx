"use client";

import { useEffect, useState } from "react";
import { fx, int, krw, usd } from "@/lib/format";

// 환율 타일 — /api/fx를 처음 한 번, 그 뒤 60초마다 받는다. 달러 합은 서버가 계산해 props로 준다.
export type FxRates = { KRW: number; EUR: number; JPY: number; CNY: number };

export type FxPayload = {
  date: string;
  base: "USD";
  rates: FxRates;
  fetchedAt: string;
  fetchedAtKst: string;
  provider: string;
  fallback: boolean;
  savedAt?: string;
  savedAtKst?: string;
};

type Props = {
  cArUsd: number;
  overdueUsd: number;
  overdueCount: number;
  base: { date: string; krw: number };
};

const toKrw = (usdAmount: number, rate: number) => Math.round(usdAmount * rate);

/** 차이에 부호: 1234 → "+1,234원", -1234 → "-1,234원" */
const signed = (v: number) => (v > 0 ? `+${krw(v)}` : krw(v));

export default function FxTile({ cArUsd, overdueUsd, overdueCount, base }: Props) {
  const [data, setData] = useState<FxPayload | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/fx")
        .then((r) => (r.ok ? (r.json() as Promise<FxPayload>) : Promise.reject(new Error(String(r.status)))))
        .then((d) => {
          if (!alive) return;
          setData(d);
          setFailed(false);
        })
        .catch(() => alive && setFailed(true));
    load();
    const timer = setInterval(load, 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const today = data?.rates.KRW;
  const cToday = today ? toKrw(cArUsd, today) : null;
  const cBase = toKrw(cArUsd, base.krw);
  const fetchedTime = data?.fetchedAtKst.split(" ")[1] ?? "";

  return (
    <section aria-labelledby="fx-tile" className="space-y-2 rounded-lg border border-line bg-surface p-4">
      <h2 id="fx-tile" className="text-sm text-muted">
        지금 환율로 본 원화
      </h2>

      {!data ? (
        <p className="text-ink">{failed ? "환율을 받지 못했습니다 — 잠시 뒤 다시 받습니다" : "환율 받는 중…"}</p>
      ) : (
        <>
          <div>
            <p className="num text-2xl font-bold text-ink">{krw(cToday)}</p>
            <p className="text-sm text-muted">
              C등급 <span className="num">{usd(cArUsd)}</span> × 오늘 환율
            </p>
          </div>

          <p className="text-sm text-ink">
            <span className="num">1 USD = {fx(today)}원</span> · <span className="num">{data.date}</span> · {data.provider}{" "}
            · 받은 시각 <span className="num">{fetchedTime}</span>
          </p>

          <p className="text-sm text-ink">
            <span className="num">9/30 기준 {fx(base.krw)}원</span> → C등급 <span className="num">{usd(cArUsd)}</span> ={" "}
            <span className="num">{krw(cBase)}</span> · 오늘 − 9/30{" "}
            <span className="num">{cToday === null ? "—" : signed(cToday - cBase)}</span>
          </p>

          <p className="text-sm text-ink">
            연체 <span className="num">{int(overdueCount)}곳</span> <span className="num">{usd(overdueUsd)}</span> ={" "}
            <span className="num">{today ? krw(toKrw(overdueUsd, today)) : "—"}</span>(오늘 환율)
          </p>

          {data.fallback ? (
            <p>
              <span className="inline-flex items-center rounded border border-warn px-1.5 text-sm font-semibold text-warn">
                대체 값 · 저장 시각 <span className="num ml-1">{data.savedAtKst}</span>
              </span>
            </p>
          ) : null}

          {failed ? <p className="text-sm text-warn">새 환율을 받지 못해 앞서 받은 값을 보여 줍니다</p> : null}
        </>
      )}

      <p className="text-xs text-muted">환율은 참고값입니다 — 결제 · 회계 기준이 아닙니다</p>
    </section>
  );
}
