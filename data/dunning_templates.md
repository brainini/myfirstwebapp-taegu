# 독촉 메일 틀 T1–T3 — (가상) 한빛정밀(주) 신용관리팀

5일차 실습 D의 '초안 로봇'이 읽는 틀입니다. AI는 이 틀의 말투와 구성을 따라 바이어마다 **초안만** 씁니다.
보내지 않습니다 — 승인 대기열에서 사람이 승인 · 반려하고, 승인해도 '발송 대기'일 뿐 실제 발송은 없습니다.

- 단계(D+7 · D+15 · D+30)와 말투(T1 · T2 · T3)는 코드가 정합니다 — `data/tone_matrix.csv`.
- `{{buyer_name}}` · `{{amount}}` 자리에는 코드가 데이터에서 꺼낸 값을 그대로 넣습니다. AI가 숫자를 새로 만들지 않습니다.
- 메일 본문은 영어(해외 바이어), 이 안내는 한국어입니다.

## 모든 틀에 공통 — 반드시
1. 금액은 `USD 24,530.00` 모양 — 통화 · 쉼표 · 소수 둘째 자리. 데이터의 연체 금액(`overdueUsd`) 그대로.
2. 바이어 이름(`name`)을 본문에 한 번 이상 쓴다.
3. 이 문장을 그대로 넣는다: `If you have already paid, please disregard this message.`
4. 서명은 아래 세 줄 그대로.
5. 본문은 180단어 이하.

## 넣지 않는 것
- 계좌 번호 · IBAN · SWIFT · 은행 이름 · 'new account' · 계좌 변경 안내 — 결제 정보는 이미 받은 인보이스의 것 그대로입니다(사기 메일과 헷갈리지 않게).
- 링크(URL), 서명 말고 다른 이메일 주소.
- 법적 위협과 그런 낱말: lawsuit · legal action · court · police · attorney · criminal (courtesy처럼 이 글자를 품은 낱말도 피한다).
- 데이터에 없는 숫자: 인보이스 번호 · 날짜 · 이자 · 수수료.

## 서명(고정)
```text
Credit Team
Hanbit Precision Co., Ltd. (fictional)
credit@hanbitprecision.example
```

## T1 — 상냥한 확인(friendly reminder)
```text
Subject: Friendly reminder: open balance of {{amount}}

Dear {{buyer_name}} team,

We hope all is well. Our records show a balance of {{amount}} on your account that has passed the agreed payment date.

It may simply have crossed with your payment run. Could you let us know when we can expect the payment?

If you have already paid, please disregard this message.

Thank you for your continued business.

Best regards,
Credit Team
Hanbit Precision Co., Ltd. (fictional)
credit@hanbitprecision.example
```

## T2 — 단호한 요청(firm, pay within 7 days)
```text
Subject: Payment request: {{amount}} now overdue

Dear {{buyer_name}} team,

Following our earlier reminder, the balance of {{amount}} on your account remains unpaid.

We kindly ask you to arrange payment within 7 days, using the payment details on the original invoice. If there is an issue with the invoice or the goods, please reply so we can resolve it together.

If you have already paid, please disregard this message.

Best regards,
Credit Team
Hanbit Precision Co., Ltd. (fictional)
credit@hanbitprecision.example
```

## T3 — 마지막 안내(final notice)
```text
Subject: Final notice: {{amount}} overdue

Dear {{buyer_name}} team,

Despite our previous messages, the balance of {{amount}} on your account is still outstanding.

Please settle this amount or contact us with a payment plan within 7 days. Without a response, we may need to hold further shipments, and the matter will be escalated to our management for review.

We value our relationship and would prefer to resolve this together.

If you have already paid, please disregard this message.

Best regards,
Credit Team
Hanbit Precision Co., Ltd. (fictional)
credit@hanbitprecision.example
```
