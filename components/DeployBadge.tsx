"use client";

import { useEffect, useState } from "react";

// 배포 배지: /api/health를 불러 "어디서 도는지"를 보여 준다.
// Vercel → "production · a1b2c3d · icn1" · 내 PC → "내 PC · development"
type Health = { ok: boolean; env: string; commit: string | null; region: string; mode?: string };

export default function DeployBadge() {
  const [text, setText] = useState("배포 상태 확인 중…");
  const [live, setLive] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/health", { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Health>) : Promise.reject(new Error(String(r.status)))))
      .then((h) => {
        if (!alive) return;
        if (h.env === "local") {
          setText(`내 PC · ${h.mode ?? "development"}`);
        } else {
          setText([h.env, h.commit, h.region].filter(Boolean).join(" · "));
          setLive(true);
        }
      })
      .catch(() => alive && setText("배포 상태를 읽지 못했습니다(/api/health)"));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-sm text-ink">
      <span className={`text-xs font-semibold ${live ? "text-grade-s" : "text-muted"}`}>{live ? "배포" : "상태"}</span>
      <span className="num">{text}</span>
    </p>
  );
}
