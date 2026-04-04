'use client'

import dynamic from 'next/dynamic'

const Studio = dynamic(() => import('@/components/Studio'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-screen bg-[#f8f4f0]">
      <div className="text-center">
        <div className="text-4xl mb-3">✍️</div>
        <p className="text-gray-500 text-sm">스튜디오 불러오는 중...</p>
      </div>
    </div>
  ),
})

export default function Page() {
  return <Studio />
}
