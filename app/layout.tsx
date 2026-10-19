import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "한빛정밀 웹 작업대", template: "%s · 한빛정밀 웹 작업대" },
  description: "(가상) 한빛정밀(주)의 합성 데이터로 만드는 사내 웹앱 — 4–6일차 실습",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="flex min-h-dvh flex-col bg-bg font-sans text-ink antialiased">
        <SiteNav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">{children}</main>
        <footer className="border-t border-line">
          <p className="mx-auto w-full max-w-5xl px-4 py-4 text-sm text-muted sm:px-6">
            (가상) 한빛정밀(주) · 합성 데이터 · 결정은 사람이 합니다
          </p>
        </footer>
      </body>
    </html>
  );
}
