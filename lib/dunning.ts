// 독촉 계산 — 순수 함수만(단계 · 말투 · 금액 글자). 초안 로봇(scripts/)과 화면이 같이 쓴다.
// 숫자 · 단계 · 말투는 코드가 정한다 — AI에게 맡기지 않는다.

export type Stage = "D+7" | "D+15" | "D+30";
export type Tone = "T1" | "T2" | "T3";
/** wait = 대기(1–6일, 초안을 쓰지 않음) · check = 확인 필요(0일) */
export type StageResult = Stage | "wait" | "check";

export const STAGES: Stage[] = ["D+7", "D+15", "D+30"];
export const TONES: Tone[] = ["T1", "T2", "T3"];

/** 가장 오래 밀린 인보이스가 기일을 넘긴 날 수 → 단계: 30 이상 D+30 · 15–29 D+15 · 7–14 D+7 · 1–6 대기 · 0 확인 필요 */
export function stageOf(oldestOpenDays: number): StageResult {
  if (!Number.isFinite(oldestOpenDays) || oldestOpenDays <= 0) return "check";
  if (oldestOpenDays >= 30) return "D+30";
  if (oldestOpenDays >= 15) return "D+15";
  if (oldestOpenDays >= 7) return "D+7";
  return "wait";
}

const usd2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 메일에 넣는 금액 글자: 12345 → "USD 12,345.00" */
export function amountText(usd: number): string {
  return `USD ${usd2.format(usd)}`;
}

export type ToneMatrix = Record<string, Record<string, string>>;

/** data/tone_matrix.csv(열 stage,S,A,B,C) → { "D+7": { S: "T1", … }, … } */
export function parseToneMatrix(csv: string): ToneMatrix {
  const lines = csv.replace(/^﻿/, "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const head = (lines[0] ?? "").split(",").map((s) => s.trim());
  if (head.join(",") !== "stage,S,A,B,C") throw new Error(`tone_matrix.csv의 열이 stage,S,A,B,C가 아닙니다: ${head.join(",")}`);
  const matrix: ToneMatrix = {};
  for (const line of lines.slice(1)) {
    const cells = line.split(",").map((s) => s.trim());
    matrix[cells[0]] = Object.fromEntries(head.slice(1).map((g, i) => [g, cells[i + 1]]));
  }
  return matrix;
}

/** 단계 × 등급(grade 칸 그대로) → 말투. 표에 없거나 T1–T3이 아니면 null */
export function toneOf(matrix: ToneMatrix, stage: Stage, grade: string): Tone | null {
  const t = matrix[stage]?.[grade];
  return TONES.find((x) => x === t) ?? null;
}

type Overdue = { id: string; overdueUsd: number; oldestOpenDays: number };

/** 독촉 순서: 연체 금액 큰 순, 같으면 번호 순 */
export function byOverdue(a: Overdue, b: Overdue): number {
  return b.overdueUsd - a.overdueUsd || a.id.localeCompare(b.id);
}

/** 대기 목록 순서: 밀린 날 적은 순, 같으면 번호 순 */
export function byWaitDays(a: Overdue, b: Overdue): number {
  return a.oldestOpenDays - b.oldestOpenDays || a.id.localeCompare(b.id);
}
