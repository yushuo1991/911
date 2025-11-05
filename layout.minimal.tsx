import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '宇硕板块节奏',
  description: '专业的股票板块涨停分析工具',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}