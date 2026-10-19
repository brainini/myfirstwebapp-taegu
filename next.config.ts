import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Codespaces에서는 내 웹앱 주소가 https://<이름>-3000.app.github.dev 입니다. Next 16은 localhost가 아닌 주소에서 오는
// 개발 서버 요청(고치면 바로 바뀌는 화면)과 서버 액션(양식 저장)을 막으므로, Codespaces 안에서만 그 주소를 허용합니다.
// 내 PC · Vercel 배포에서는 아무것도 바뀌지 않습니다. 이 블록은 지우지 않습니다.
// (Codespaces에서 npm run dev 첫 화면의 'Experiments (use with caution): · serverActions' 한 줄은 이 설정 때문 — 정상)
if (process.env.CODESPACES === "true") {
  const host = `*.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN || "app.github.dev"}`;
  nextConfig.allowedDevOrigins = [...(nextConfig.allowedDevOrigins ?? []), host];
  nextConfig.experimental = {
    ...nextConfig.experimental,
    serverActions: {
      ...nextConfig.experimental?.serverActions,
      allowedOrigins: [...(nextConfig.experimental?.serverActions?.allowedOrigins ?? []), host],
    },
  };
}

export default nextConfig;
