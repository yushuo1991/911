import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '宇硕涨停板跟踪系统',
  description: '跟踪涨停股票后续5个交易日表现，按板位排序展示',
  keywords: '股票,涨停板,跟踪,板位,投资,分析',
  authors: [{ name: 'Stock Tracker Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  openGraph: {
    title: '宇硕涨停板跟踪系统',
    description: '跟踪涨停股票后续5个交易日表现，按板位排序展示',
    type: 'website',
    locale: 'zh_CN',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <main>{children}</main>
      </body>
    </html>
  );
}