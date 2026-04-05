'use client'

import { useState, useEffect } from 'react'

// 유효한 입장 코드 (추후 변경 가능)
const VALID_CODES = ['1004', '2026', '7777', '1234']

const STICKER_BASE = '/1brong/stickers'
// 배경에 떠다니는 손그림들
const FLOATING = [
  { name: '구름', x: 8, y: 10, size: 70, delay: 0 },
  { name: '큰구름', x: 75, y: 5, size: 90, delay: 2 },
  { name: '별1', x: 15, y: 25, size: 40, delay: 1 },
  { name: '별2', x: 85, y: 30, size: 35, delay: 3 },
  { name: '별3', x: 50, y: 8, size: 30, delay: 0.5 },
  { name: '꽃1', x: 5, y: 70, size: 55, delay: 1.5 },
  { name: '꽃2', x: 90, y: 75, size: 50, delay: 2.5 },
  { name: '나비2', x: 20, y: 55, size: 45, delay: 0.8 },
  { name: '노랑나비', x: 78, y: 55, size: 40, delay: 1.8 },
  { name: '무지개', x: 50, y: 2, size: 100, delay: 0 },
  { name: '새싹', x: 30, y: 85, size: 40, delay: 2 },
  { name: '하트', x: 65, y: 18, size: 35, delay: 1.2 },
  { name: '스마일', x: 40, y: 80, size: 45, delay: 0.3 },
  { name: '음표', x: 70, y: 85, size: 35, delay: 1.7 },
  { name: '병아리', x: 12, y: 42, size: 50, delay: 2.2 },
  { name: '토끼', x: 88, y: 48, size: 50, delay: 0.6 },
]

export default function Gate({ onEnter }: { onEnter: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [opening, setOpening] = useState(false)
  const [shake, setShake] = useState(false)

  // 이미 인증된 경우 바로 진입
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionStorage.getItem('1brong-auth') === 'yes') {
      onEnter()
    }
  }, [onEnter])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (VALID_CODES.includes(code.trim())) {
      setError(false)
      setOpening(true)
      sessionStorage.setItem('1brong-auth', 'yes')
      setTimeout(() => onEnter(), 1500)
    } else {
      setError(true)
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #E8F4FD 0%, #FFF0F8 40%, #FFF8F0 100%)',
      position: 'relative', overflow: 'hidden',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Noto Sans KR, sans-serif',
    }}>
      {/* 구글 폰트 */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" />

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes float { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-15px) rotate(3deg); } }
        @keyframes floatSlow { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        @keyframes sparkle { 0%,100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes doorOpen { 0% { transform: perspective(800px) rotateY(0deg); } 100% { transform: perspective(800px) rotateY(-90deg); opacity: 0; } }
        @keyframes shake { 0%,100% { transform: translateX(0); } 20%,60% { transform: translateX(-8px); } 40%,80% { transform: translateX(8px); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        .float { animation: float 4s ease-in-out infinite; }
        .float-slow { animation: floatSlow 5s ease-in-out infinite; }
        .sparkle { animation: sparkle 2s ease-in-out infinite; }
        .door-open { animation: doorOpen 1.2s ease-in forwards; }
        .shake { animation: shake 0.4s ease-in-out; }
        .fade-up { animation: fadeUp 0.8s ease-out forwards; }
      `}</style>

      {/* 떠다니는 손그림들 */}
      {FLOATING.map((s, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={`${STICKER_BASE}/${encodeURIComponent(s.name)}.png`} alt=""
          className="float" draggable={false}
          style={{
            position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
            width: s.size, height: s.size, objectFit: 'contain',
            animationDelay: `${s.delay}s`, opacity: 0.5, pointerEvents: 'none',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))',
          }} />
      ))}

      {/* 메인 게이트 카드 */}
      <div className={`fade-up ${opening ? 'door-open' : ''}`}
        style={{
          background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(20px)',
          borderRadius: 32, padding: '48px 40px', textAlign: 'center',
          boxShadow: '0 20px 60px rgba(199,125,255,0.2), 0 8px 24px rgba(255,107,157,0.15)',
          border: '2px solid rgba(255,200,220,0.5)',
          maxWidth: 420, width: '90%', position: 'relative', zIndex: 10,
        }}>
        {/* 로고 */}
        <div style={{
          background: 'linear-gradient(135deg, #FF6B9D, #C77DFF)',
          borderRadius: 20, display: 'inline-block', padding: '12px 24px', marginBottom: 16,
          boxShadow: '0 4px 16px rgba(199,125,255,0.3)',
        }}>
          <span style={{ fontWeight: 900, fontSize: 28, color: 'white', letterSpacing: -1 }}>1B롱</span>
        </div>

        <h1 style={{
          fontSize: 22, fontWeight: 900, marginBottom: 8,
          background: 'linear-gradient(135deg, #FF6B9D, #C77DFF)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          일비롱 디자인 나라
        </h1>
        <p style={{ color: '#999', fontSize: 13, marginBottom: 32, lineHeight: 1.6 }}>
          모험을 떠날 준비가 되셨나요?<br />
          비밀의 문을 열 번호를 입력하세요!
        </p>

        {/* 문 장식 */}
        <div style={{
          width: 140, height: 180, margin: '0 auto 24px',
          background: 'linear-gradient(180deg, #FFE0EF, #EDE0FF)',
          borderRadius: '70px 70px 0 0', border: '3px solid #F0C0D8',
          position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'inset 0 -20px 40px rgba(199,125,255,0.1)',
        }}>
          {/* 문 손잡이 */}
          <div style={{
            position: 'absolute', right: 18, top: '55%',
            width: 16, height: 16, borderRadius: '50%',
            background: 'linear-gradient(135deg, #FFD700, #FFA500)',
            boxShadow: '0 2px 8px rgba(255,165,0,0.4)',
          }} />
          {/* 열쇠 구멍 */}
          <div className="sparkle" style={{
            width: 24, height: 32, borderRadius: '50% 50% 30% 30%',
            background: 'linear-gradient(180deg, #C77DFF, #FF6B9D)',
            boxShadow: '0 0 20px rgba(199,125,255,0.5)',
          }} />
          {/* 장식 손그림 */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${STICKER_BASE}/${encodeURIComponent('가랜드')}.png`} alt=""
            style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 120, opacity: 0.8 }} />
        </div>

        {/* 코드 입력 */}
        <form onSubmit={handleSubmit}>
          <div className={shake ? 'shake' : ''} style={{ marginBottom: 16 }}>
            <input
              type="text" inputMode="numeric" maxLength={6}
              value={code} onChange={e => { setCode(e.target.value); setError(false) }}
              placeholder="비밀 번호"
              style={{
                width: '100%', textAlign: 'center', fontSize: 24, fontWeight: 700,
                letterSpacing: 12, padding: '14px 20px',
                border: `2px solid ${error ? '#FF6B6B' : '#E8D0F0'}`,
                borderRadius: 16, outline: 'none', background: 'rgba(255,255,255,0.8)',
                color: '#6B3A8A', caretColor: '#C77DFF',
                transition: 'border-color 0.3s',
              }}
              onFocus={e => { if (!error) e.target.style.borderColor = '#C77DFF' }}
              onBlur={e => { if (!error) e.target.style.borderColor = '#E8D0F0' }}
            />
          </div>
          {error && (
            <p style={{ color: '#FF6B6B', fontSize: 12, marginBottom: 12, fontWeight: 700 }}>
              번호가 맞지 않아요. 다시 확인해 주세요!
            </p>
          )}
          <button type="submit" style={{
            width: '100%', padding: '14px 0',
            background: 'linear-gradient(135deg, #FF6B9D, #C77DFF)',
            color: 'white', fontWeight: 900, fontSize: 16,
            border: 'none', borderRadius: 16, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(199,125,255,0.3)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(199,125,255,0.4)' }}
            onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(199,125,255,0.3)' }}>
            문을 열어요!
          </button>
        </form>
      </div>

      {/* 바닥 잔디 */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
        background: 'linear-gradient(0deg, #C8E6C9 0%, transparent 100%)',
        opacity: 0.3,
      }} />
    </div>
  )
}
