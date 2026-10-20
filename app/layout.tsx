import type { Metadata } from "next";
import "./globals.css";
import "./readability.css";
import "./compact.css";

export const metadata: Metadata = {
  title: "DDL Radar · 会议投稿看板",
  description: "把握下一次投稿。CCF A 会与视觉、机器人精选 B 会的截止倒计时和重要时间节点。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
