# NOTICE — 쓰인 오픈소스 · 데이터

이 저장소의 코드는 MIT 라이선스입니다(`LICENSE`). 아래 패키지는 `npm ci` 때 각자의 라이선스로 설치됩니다(저장소에 들어 있지 않음).

| 패키지 | 판 | 라이선스 |
|---|---|---|
| next | 16.4.2 | MIT |
| react · react-dom | 19.3.1 | MIT |
| @prisma/client · @prisma/adapter-pg · prisma | 7.10.1 | Apache-2.0 |
| pg | 8.23.1 | MIT |
| typescript | 5.9.3 | Apache-2.0 |
| tailwindcss · @tailwindcss/postcss | 4.3.3 | MIT |
| tsx | 4.23.15 | MIT |
| dotenv | 16.6.1 | BSD-2-Clause |
| @types/node · @types/react · @types/react-dom · @types/pg | 24.19.2 · 19.3.0 · 19.3.0 · 8.23.1 | MIT |

`AGENTS.md`의 표시 구역(`BEGIN:nextjs-agent-rules` … `END`)은 Next.js(MIT)가 만드는 안내문을 그대로 옮긴 것입니다.

## 데이터
- `data/buyers.json` · `buyers.csv` · `tone_matrix.csv` · `dunning_templates.md` — 교육용으로 만든 (가상) 합성 데이터입니다. 실제 회사 · 사람 · 거래 · 이메일이 아닙니다.
- `data/fx_fallback.json` — Frankfurter API(api.frankfurter.dev, 키 없음)의 응답을 저장한 참고값입니다. 결제 · 회계 기준으로 쓰지 않습니다.
