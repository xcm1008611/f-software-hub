import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'F · 出海工具库 — 为跨境电商和外贸找到合适的软件', template: '%s · F 出海工具库' },
  description: '面向跨境电商与外贸的软件选型目录。按工作场景发现软件，了解功能、适用人群、收费方式与使用限制。',
  robots: { index: false, follow: false },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
