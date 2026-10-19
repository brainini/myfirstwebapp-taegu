#!/usr/bin/env node
// npm run env:init — .env.example을 .env로 복사한다(이미 있으면 건드리지 않는다). 값은 사람이 직접 붙여 넣는다.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const example = path.join(ROOT, ".env.example");
const target = path.join(ROOT, ".env");

if (fs.existsSync(target)) {
  console.log("– .env가 이미 있습니다 — 덮어쓰지 않습니다.");
  console.log("  Ctrl+P → .env 를 열어 값을 확인하세요(값을 채팅 · 화면 캡처에 올리지 않기).");
  process.exit(0);
}
if (!fs.existsSync(example)) {
  console.log("✗ .env.example이 없습니다 — 되살리기: git checkout HEAD -- .env.example → 다시 npm run env:init");
  console.log("  그래도 없으면(지운 것을 커밋함): npm run guide:update -- --check → git checkout starter/main -- .env.example · 막히면 강사에게");
  process.exit(1);
}
fs.copyFileSync(example, target);
console.log("✓ .env를 만들었습니다(.env.example 복사 — .env는 커밋되지 않습니다).");
console.log("  Ctrl+P → .env 를 열어 값을 붙여 넣으세요 → 저장(Ctrl+S) → npm run doctor:db");
