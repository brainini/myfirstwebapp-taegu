// 가드레일 G1–G7 — 코드가 초안을 채점한다(순수 함수 · 초안 로봇과 화면이 같이 쓴다).
// 견주기는 NFC로 맞춘 뒤 대소문자를 무시한다(G3의 IBAN · SWIFT · BIC만 대문자 그대로).

export const DISCLAIMER = "If you have already paid, please disregard this message.";
export const SIGNATURE_EMAIL = "credit@hanbitprecision.example";

export const GUARD_LABELS = {
  G1: "금액 정확",
  G2: "바이어 이름",
  G3: "계좌 없음",
  G4: "법적 표현 없음",
  G5: "이미 냈다면 무시",
  G6: "180단어 이하",
  G7: "링크 · 다른 메일 주소 없음",
} as const;

export type GuardId = keyof typeof GUARD_LABELS;
export type GuardCheck = { id: GuardId; label: string; ok: boolean; note: string };

export const MAX_WORDS = 180;

const norm = (s: string) => s.normalize("NFC").toLowerCase();

// 금액 표기: USD · US$ · $ + 숫자(쉼표 · 소수 포함)
const MONEY_RE = /(?:US\$|USD|\$)\s?\d[\d,]*(?:\.\d+)?/gi;
const ACCOUNT_RE = /\b(?:account number|bank account|bank details|new account|routing number|swift code)\b|\baccount no\.|계좌/gi;
const ACCOUNT_UPPER_RE = /\b(?:IBAN|SWIFT|BIC)\b/g;
const LEGAL_RE = /\b(?:lawsuit|legal action|court|police|attorney|criminal)\b/gi;
const LINK_RE = /https?:\/\/|www\./gi;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;

const found = (re: RegExp, text: string) => [...new Set(text.match(re) ?? [])];

export function runChecks(input: { subject: string; body: string; buyerName: string; amountText: string }): GuardCheck[] {
  const subject = input.subject.normalize("NFC");
  const body = input.body.normalize("NFC");
  const both = `${subject}\n${body}`;
  const amount = norm(input.amountText);

  const result = (id: GuardId, ok: boolean, note = ""): GuardCheck => ({ id, label: GUARD_LABELS[id], ok, note: ok ? "" : note });

  // G1 — 그 금액 글자가 있고, 다른 금액 표기가 없다(같은 금액이 여러 번은 괜찮다)
  const otherMoney = found(MONEY_RE, body).filter((m) => norm(m) !== amount);
  const hasAmount = norm(body).includes(amount);
  const g1 = result("G1", hasAmount && otherMoney.length === 0, [hasAmount ? "" : `${input.amountText} 없음`, ...otherMoney].filter(Boolean).join(" · "));

  // G2 — 바이어 이름 그대로
  const g2 = result("G2", norm(body).includes(norm(input.buyerName)), `${input.buyerName} 없음`);

  // G3 — 계좌 · 결제 정보 낱말
  const account = [...found(ACCOUNT_RE, both), ...found(ACCOUNT_UPPER_RE, both)];
  const g3 = result("G3", account.length === 0, account.join(" · "));

  // G4 — 법적 표현
  const legal = found(LEGAL_RE, both);
  const g4 = result("G4", legal.length === 0, legal.join(" · "));

  // G5 — 이미 냈다면 무시 문장 그대로
  const g5 = result("G5", norm(body).includes(norm(DISCLAIMER)), "문장 없음");

  // G6 — 낱말 수
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  const g6 = result("G6", words <= MAX_WORDS, `${words}단어`);

  // G7 — 링크 · 서명 말고 다른 메일 주소
  const links = found(LINK_RE, both);
  const emails = found(EMAIL_RE, both).filter((e) => norm(e) !== SIGNATURE_EMAIL);
  const g7 = result("G7", links.length === 0 && emails.length === 0, [...links, ...emails].join(" · "));

  return [g1, g2, g3, g4, g5, g6, g7];
}

/** 걸린 검사 번호: ["G1", "G5"] */
export function failedIds(checks: GuardCheck[]): GuardId[] {
  return checks.filter((c) => !c.ok).map((c) => c.id);
}
