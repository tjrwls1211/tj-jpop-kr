import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TJ J-POP 차트 TOP 100',
  description: 'TJ 노래방 J-POP 인기 차트 - 한글 제목으로 쉽게 찾기',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
