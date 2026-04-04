import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '1B롱 — 일비롱 디자인 스튜디오',
  description: '일비롱체로 나만의 디자인을 만들어보세요',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  )
}
