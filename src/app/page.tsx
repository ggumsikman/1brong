'use client'

import { useEffect, useState, useCallback } from 'react'
import Gate from '@/components/Gate'
import Studio from '@/components/Studio'

const Loading = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FFF8F0' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>✍️</div>
      <p style={{ color: '#999', fontSize: 14 }}>스튜디오 불러오는 중...</p>
    </div>
  </div>
)

export default function Page() {
  const [mounted, setMounted] = useState(false)
  const [authed, setAuthed] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleEnter = useCallback(() => { setAuthed(true) }, [])

  if (!mounted) return <Loading />
  if (!authed) return <Gate onEnter={handleEnter} />
  return <Studio />
}
