'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

const S = '/stickers'
const img = (n: string) => `${S}/${encodeURIComponent(n)}.png`
const VALID_CODES = ['1004', '2026', '7777', '1234']
const CODE_LEN = 4

// ── 장식 타입 ────────────────────────────────────────────
type Deco = { s: string; x: number; y: number; sz: number; d: number; anim?: string }
type ThemeDef = {
  name: string; sub: string; bg: string
  decos: Deco[]
  keys: string[]       // 키패드 버튼용 스티커 이름 (순환)
  keyText: string       // 키패드 숫자 색상
  keyShadow: string     // 키패드 글로우
  successText: string
}

// ── 10가지 테마 정의 ──────────────────────────────────────
const THEMES: ThemeDef[] = [
  // 1. 두근두근 첫 입학식
  {
    name: '두근두근 첫 입학식', sub: '새로운 모험이 시작돼요!',
    bg: 'linear-gradient(180deg, #E3F2FD 0%, #FFF0F8 50%, #FFF8E1 100%)',
    decos: [
      { s: '가랜드', x: 50, y: 2, sz: 160, d: 0 },
      { s: '학교', x: 50, y: 25, sz: 130, d: 0, anim: 'none' },
      { s: '유치원버스', x: 15, y: 78, sz: 90, d: 1.5 },
      { s: '입학남자아이', x: 80, y: 72, sz: 80, d: 0.8 },
      { s: '입학여자아이', x: 20, y: 70, sz: 80, d: 1.2 },
      { s: '입학모자', x: 72, y: 5, sz: 50, d: 2 },
      { s: '구름', x: 85, y: 8, sz: 70, d: 0.5 },
      { s: '큰구름', x: 8, y: 12, sz: 80, d: 1 },
    ],
    keys: ['노란풍선', '풍선2', '노란풍선', '풍선 3', '노란풍선', '풍선2', '풍선 3', '노란풍선', '풍선2', '풍선 3'],
    keyText: '#C2185B', keyShadow: '#FF6B9D',
    successText: '입학을 축하해요!',
  },
  // 2. 곰돌이와 토끼의 봄 소풍
  {
    name: '봄 소풍 가는 날', sub: '곰돌이와 토끼가 기다리고 있어요',
    bg: 'linear-gradient(180deg, #B3E5FC 0%, #C8E6C9 60%, #A5D6A7 100%)',
    decos: [
      { s: '해', x: 82, y: 5, sz: 80, d: 0 },
      { s: '구름', x: 20, y: 8, sz: 65, d: 1 },
      { s: '무지개', x: 50, y: 3, sz: 120, d: 0 },
      { s: '언덕', x: 50, y: 82, sz: 200, d: 0, anim: 'none' },
      { s: '곰', x: 25, y: 68, sz: 85, d: 0.5 },
      { s: '토끼', x: 75, y: 70, sz: 75, d: 1 },
      { s: '나비2', x: 60, y: 20, sz: 40, d: 1.5 },
      { s: '꿀벌', x: 35, y: 18, sz: 35, d: 2 },
    ],
    keys: ['데이지', '노란꽃', '꽃1', '꽃2', '데이지', '노란꽃', '꽃3', '꽃4', '데이지', '노란꽃'],
    keyText: '#2E7D32', keyShadow: '#66BB6A',
    successText: '소풍 출발!',
  },
  // 3. 별 헤는 신비로운 밤
  {
    name: '별 헤는 밤', sub: '반짝반짝 별들이 속삭여요',
    bg: 'linear-gradient(180deg, #1A1A3E 0%, #2D2B55 50%, #3B2E6E 100%)',
    decos: [
      { s: '큰구름', x: 15, y: 70, sz: 100, d: 0 },
      { s: '스마일', x: 80, y: 8, sz: 70, d: 0.5 },
      { s: '별', x: 10, y: 15, sz: 35, d: 1 },
      { s: '별1', x: 30, y: 5, sz: 30, d: 1.5 },
      { s: '별2', x: 55, y: 10, sz: 25, d: 2 },
      { s: '별3', x: 90, y: 25, sz: 30, d: 0.8 },
      { s: '민트별', x: 5, y: 40, sz: 25, d: 1.2 },
      { s: '보라별', x: 92, y: 50, sz: 28, d: 1.8 },
      { s: '분홍별', x: 45, y: 2, sz: 22, d: 2.5 },
    ],
    keys: ['별1', '민트별', '보라별', '분홍별', '별2', '별3', '민트별', '보라별', '분홍별', '별1'],
    keyText: '#FFFFFF', keyShadow: '#FFD54F',
    successText: '별빛 모험 시작!',
  },
  // 4. 흩날리는 벚꽃 피크닉
  {
    name: '벚꽃 피크닉', sub: '꽃잎이 살랑살랑 내려와요',
    bg: 'linear-gradient(180deg, #FCE4EC 0%, #F8BBD0 40%, #FFEBEE 100%)',
    decos: [
      { s: '나무', x: 15, y: 55, sz: 120, d: 0 },
      { s: '나무2', x: 85, y: 58, sz: 110, d: 0.5 },
      { s: '벚꽃', x: 30, y: 10, sz: 60, d: 1 },
      { s: '벚꽃2', x: 70, y: 8, sz: 55, d: 1.5 },
      { s: '벚꽃잎', x: 20, y: 30, sz: 30, d: 0, anim: 'fall' },
      { s: '벚꽃잎3', x: 50, y: 20, sz: 25, d: 1, anim: 'fall' },
      { s: '벚꽃잎', x: 75, y: 25, sz: 28, d: 2, anim: 'fall' },
      { s: '벚꽃잎3', x: 40, y: 35, sz: 22, d: 3, anim: 'fall' },
    ],
    keys: ['벚꽃', '벚꽃2', '벚꽃', '벚꽃2', '벚꽃', '벚꽃2', '벚꽃', '벚꽃2', '벚꽃', '벚꽃2'],
    keyText: '#AD1457', keyShadow: '#F48FB1',
    successText: '꽃비 속으로!',
  },
  // 5. 요술 책상 위 학용품 친구들
  {
    name: '학용품 친구들', sub: '책상 위 친구들이 놀자고 해요',
    bg: 'linear-gradient(180deg, #FFFDE7 0%, #FFF9C4 50%, #FFF8E1 100%)',
    decos: [
      { s: '책펼친것 흰색', x: 50, y: 75, sz: 160, d: 0, anim: 'none' },
      { s: '노트', x: 80, y: 15, sz: 70, d: 0.5 },
      { s: '연필', x: 12, y: 25, sz: 55, d: 1 },
      { s: '자', x: 88, y: 55, sz: 50, d: 1.5 },
      { s: '전구', x: 50, y: 5, sz: 50, d: 0.3 },
      { s: '책', x: 15, y: 70, sz: 60, d: 2 },
      { s: '책2', x: 85, y: 72, sz: 55, d: 1.8 },
    ],
    keys: ['클립1', '클립2', '클립3', '클립1', '클립2', '클립3', '클립1', '클립2', '클립3', '클립1'],
    keyText: '#E65100', keyShadow: '#FFB74D',
    successText: '공부 시작!',
  },
  // 6. 꿀벌과 나비의 정원
  {
    name: '비밀의 정원', sub: '나비와 꿀벌이 춤추고 있어요',
    bg: 'linear-gradient(180deg, #E8F5E9 0%, #C8E6C9 50%, #A5D6A7 100%)',
    decos: [
      { s: '튤립1', x: 10, y: 80, sz: 65, d: 0 },
      { s: '튤립3', x: 30, y: 82, sz: 60, d: 0.3 },
      { s: '노랑튤립', x: 55, y: 78, sz: 65, d: 0.6 },
      { s: '보라튤립', x: 78, y: 80, sz: 60, d: 0.9 },
      { s: '벌', x: 25, y: 20, sz: 45, d: 1 },
      { s: '나비2', x: 70, y: 15, sz: 45, d: 1.5 },
      { s: '노랑나비', x: 50, y: 10, sz: 40, d: 2 },
      { s: '해', x: 85, y: 5, sz: 60, d: 0 },
    ],
    keys: ['잎1', '새싹', '나뭇잎', '잎2', '잎3', '새싹', '나뭇잎', '잎1', '잎2', '새싹'],
    keyText: '#1B5E20', keyShadow: '#81C784',
    successText: '정원 탐험!',
  },
  // 7. 춤추는 스마일 멜로디
  {
    name: '스마일 멜로디', sub: '신나는 음악에 모두 춤춰요',
    bg: 'linear-gradient(180deg, #F3E5F5 0%, #E1BEE7 40%, #FCE4EC 100%)',
    decos: [
      { s: '컴페니1', x: 20, y: 75, sz: 100, d: 0 },
      { s: '컴페니2', x: 70, y: 78, sz: 90, d: 0.5 },
      { s: '음표', x: 15, y: 15, sz: 40, d: 1 },
      { s: '음표2', x: 45, y: 8, sz: 35, d: 1.5 },
      { s: '음표3', x: 80, y: 12, sz: 38, d: 2 },
      { s: '스마일', x: 10, y: 45, sz: 50, d: 0.8 },
      { s: '스마일2', x: 88, y: 40, sz: 45, d: 1.2 },
      { s: '하트', x: 50, y: 3, sz: 35, d: 1.8 },
    ],
    keys: ['스마일', '스마일2', '스마일', '스마일2', '스마일', '스마일2', '스마일', '스마일2', '스마일', '스마일2'],
    keyText: '#6A1B9A', keyShadow: '#CE93D8',
    successText: '음악 시작!',
  },
  // 8. 배아롱 선생님의 미술 교실
  {
    name: '미술 교실', sub: '상상력을 마음껏 펼쳐봐요',
    bg: 'linear-gradient(180deg, #EFEBE9 0%, #D7CCC8 50%, #BCAAA4 100%)',
    decos: [
      { s: '칠판', x: 50, y: 30, sz: 180, d: 0, anim: 'none' },
      { s: '전구', x: 50, y: 3, sz: 50, d: 0.5 },
      { s: '남학생', x: 15, y: 70, sz: 80, d: 1 },
      { s: '여학생', x: 85, y: 72, sz: 75, d: 1.5 },
      { s: '연필', x: 8, y: 35, sz: 45, d: 2 },
      { s: '책4', x: 90, y: 30, sz: 50, d: 1.8 },
    ],
    keys: ['구름', '큰구름', '구름', '큰구름', '구름', '큰구름', '구름', '큰구름', '구름', '큰구름'],
    keyText: '#FFFFFF', keyShadow: '#90A4AE',
    successText: '그림 그리자!',
  },
  // 9. 병아리의 작은 화분 가꾸기
  {
    name: '새싹 키우기', sub: '병아리와 함께 새싹을 심어요',
    bg: 'linear-gradient(180deg, #FFF8E1 0%, #F0F4C3 50%, #DCEDC8 100%)',
    decos: [
      { s: '화분', x: 50, y: 75, sz: 90, d: 0 },
      { s: '나뭇가지', x: 20, y: 20, sz: 70, d: 0.5 },
      { s: '리본', x: 75, y: 15, sz: 50, d: 1 },
      { s: '병아리', x: 30, y: 65, sz: 60, d: 0.8 },
      { s: '해', x: 85, y: 5, sz: 55, d: 1.5 },
      { s: '구름', x: 15, y: 8, sz: 60, d: 2 },
      { s: '새싹', x: 50, y: 68, sz: 35, d: 0 },
      { s: '나뭇잎', x: 88, y: 50, sz: 35, d: 1.2 },
    ],
    keys: ['꽃스마일', '꽃1', '꽃2', '꽃3', '꽃4', '꽃스마일', '꽃1', '꽃2', '꽃3', '꽃4'],
    keyText: '#33691E', keyShadow: '#AED581',
    successText: '새싹이 자란다!',
  },
  // 10. 우리들의 행복한 파티
  {
    name: '행복 파티', sub: '고깔모자 쓰고 축하해요!',
    bg: 'linear-gradient(180deg, #FCE4EC 0%, #F8BBD0 30%, #E1BEE7 70%, #D1C4E9 100%)',
    decos: [
      { s: '가랜드', x: 50, y: 2, sz: 170, d: 0 },
      { s: '고깔모자', x: 20, y: 12, sz: 55, d: 0.5 },
      { s: '고깔모자2', x: 78, y: 10, sz: 50, d: 1 },
      { s: '리본', x: 10, y: 40, sz: 45, d: 1.5 },
      { s: '리본2', x: 88, y: 35, sz: 40, d: 2 },
      { s: '남자입학1', x: 22, y: 70, sz: 90, d: 0.8 },
      { s: '여자입학1', x: 78, y: 72, sz: 85, d: 1.2 },
      { s: '하트', x: 50, y: 8, sz: 30, d: 1.8 },
    ],
    keys: ['풍선2', '노란풍선', '풍선 3', '풍선2', '노란풍선', '풍선 3', '풍선2', '노란풍선', '풍선 3', '풍선2'],
    keyText: '#C2185B', keyShadow: '#F48FB1',
    successText: '파티 시작!',
  },
]

// ── CSS 애니메이션 ────────────────────────────────────────
const ANIM_CSS = `
@keyframes float{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-12px) rotate(2deg)}}
@keyframes fall{0%{transform:translateY(0) rotate(0deg);opacity:0.8}100%{transform:translateY(120vh) rotate(360deg);opacity:0}}
@keyframes sparkle{0%,100%{opacity:0.5;transform:scale(0.95)}50%{opacity:1;transform:scale(1.08)}}
@keyframes pop{0%{transform:scale(1)}30%{transform:scale(0.85)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-10px)}40%,80%{transform:translateX(10px)}}
@keyframes celebrate{0%{transform:translateY(0) scale(1)}40%{transform:translateY(-30px) scale(1.15)}60%{transform:translateY(-20px) scale(1.05)}100%{transform:translateY(-25px) scale(1.1) rotate(5deg)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes confetti{0%{transform:translateY(0) rotate(0);opacity:1}100%{transform:translateY(-60px) rotate(720deg);opacity:0}}
@keyframes doorOpen{0%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1.5)}}
.anim-float{animation:float 3.5s ease-in-out infinite}
.anim-fall{animation:fall 6s linear infinite}
.anim-sparkle{animation:sparkle 2.5s ease-in-out infinite}
.anim-pop{animation:pop 0.35s ease-out}
.anim-shake{animation:shake 0.4s ease-in-out}
.anim-celebrate{animation:celebrate 0.6s ease-out forwards}
.anim-fadeIn{animation:fadeIn 0.6s ease-out forwards}
.anim-door{animation:doorOpen 1s ease-in forwards}
`

export default function Gate({ onEnter }: { onEnter: () => void }) {
  const [theme] = useState(() => THEMES[Math.floor(Math.random() * THEMES.length)])
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)
  const [success, setSuccess] = useState(false)
  const [pressedKey, setPressedKey] = useState<number | null>(null)
  const [loaded, setLoaded] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setLoaded(true) }, [])

  // 키보드 입력
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') pressKey(+e.key)
      if (e.key === 'Backspace') backspace()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  })

  // 키 입력
  const pressKey = useCallback((digit: number) => {
    if (success) return
    setError(false)
    setPressedKey(digit)
    setTimeout(() => setPressedKey(null), 350)

    setCode(prev => {
      const next = prev + digit
      if (next.length >= CODE_LEN) {
        // 자동 체크
        setTimeout(() => {
          if (VALID_CODES.includes(next)) {
            setSuccess(true)
            if (timerRef.current) clearTimeout(timerRef.current)
            timerRef.current = setTimeout(() => onEnter(), 2000)
          } else {
            setError(true)
            setTimeout(() => setCode(''), 500)
          }
        }, 100)
      }
      return next.length > CODE_LEN ? prev : next
    })
  }, [success, onEnter])

  const backspace = () => {
    if (success) return
    setCode(prev => prev.slice(0, -1))
    setError(false)
  }

  // 키패드 레이아웃: [1-9] + [지우기, 0, 빈칸]
  const keyLayout = [1, 2, 3, 4, 5, 6, 7, 8, 9, -1, 0, -2]

  return (
    <div style={{
      minHeight: '100vh', background: theme.bg,
      position: 'relative', overflow: 'hidden',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Noto Sans KR', sans-serif", padding: '20px 16px',
    }}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700;900&display=swap" />
      <style>{ANIM_CSS}</style>

      {/* ── 배경 장식 ── */}
      {theme.decos.map((d, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={i} src={img(d.s)} alt="" draggable={false}
          className={`${d.anim === 'none' ? '' : d.anim === 'fall' ? 'anim-fall' : 'anim-float'} ${success ? 'anim-celebrate' : ''} ${error ? 'anim-shake' : ''}`}
          style={{
            position: 'absolute',
            left: `${d.x}%`, top: `${d.y}%`,
            width: d.sz, height: d.sz, objectFit: 'contain',
            transform: 'translate(-50%, -50%)',
            animationDelay: `${d.d}s`,
            opacity: loaded ? 0.75 : 0,
            transition: 'opacity 0.5s',
            pointerEvents: 'none', zIndex: 1,
            filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.08))',
          }} />
      ))}

      {/* ── 메인 카드 ── */}
      <div className={`anim-fadeIn ${success ? 'anim-door' : ''}`}
        style={{
          position: 'relative', zIndex: 10,
          background: 'rgba(255,255,255,0.82)', backdropFilter: 'blur(16px)',
          borderRadius: 28, padding: '28px 24px 20px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.1), 0 4px 16px rgba(199,125,255,0.12)',
          border: '2px solid rgba(255,220,240,0.6)',
          maxWidth: 380, width: '100%', textAlign: 'center',
        }}>

        {/* 로고 */}
        <div style={{
          background: 'linear-gradient(135deg, #FF6B9D, #C77DFF)',
          borderRadius: 16, display: 'inline-block', padding: '8px 20px', marginBottom: 10,
          boxShadow: '0 4px 12px rgba(199,125,255,0.3)',
        }}>
          <span style={{ fontWeight: 900, fontSize: 22, color: 'white' }}>1B롱</span>
        </div>

        <h1 style={{
          fontSize: 18, fontWeight: 900, marginBottom: 4,
          background: 'linear-gradient(135deg, #FF6B9D, #C77DFF)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          {theme.name}
        </h1>
        <p style={{ color: '#999', fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>
          {theme.sub}
        </p>

        {/* 비밀번호 표시 (점/별) */}
        <div className={error ? 'anim-shake' : ''} style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 20 }}>
          {Array.from({ length: CODE_LEN }, (_, i) => (
            <div key={i} style={{
              width: 44, height: 44, borderRadius: '50%',
              border: `2.5px solid ${i < code.length ? theme.keyShadow : '#e0d0e8'}`,
              background: i < code.length ? `${theme.keyShadow}30` : 'rgba(255,255,255,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
              transform: i < code.length ? 'scale(1.1)' : 'scale(1)',
            }}>
              {i < code.length && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={img(theme.keys[0])} alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} />
              )}
            </div>
          ))}
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p style={{ color: '#FF5252', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>
            번호가 맞지 않아요. 다시 눌러보세요!
          </p>
        )}

        {/* 성공 메시지 */}
        {success && (
          <p className="anim-celebrate" style={{ color: theme.keyText === '#FFFFFF' ? '#C77DFF' : theme.keyText, fontSize: 16, fontWeight: 900, marginBottom: 8 }}>
            {theme.successText}
          </p>
        )}

        {/* ── 키패드 ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 8, maxWidth: 280, margin: '0 auto',
        }}>
          {keyLayout.map((k, i) => {
            if (k === -2) return <div key={i} /> // 빈칸
            if (k === -1) {
              // 지우기 버튼
              return (
                <button key={i} onClick={backspace}
                  style={{
                    width: '100%', aspectRatio: '1', borderRadius: 16,
                    border: '2px solid #e8d0f0', background: 'rgba(255,255,255,0.6)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, color: '#999', fontWeight: 700, transition: 'transform 0.15s',
                  }}
                  onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.9)' }}
                  onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}>
                  ←
                </button>
              )
            }
            const stickerName = theme.keys[k % theme.keys.length]
            const isPressed = pressedKey === k
            return (
              <button key={i} onClick={() => pressKey(k)}
                className={isPressed ? 'anim-pop' : ''}
                style={{
                  width: '100%', aspectRatio: '1', borderRadius: 16,
                  border: 'none', background: 'transparent',
                  cursor: 'pointer', position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'transform 0.1s',
                }}>
                {/* 스티커 이미지 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img(stickerName)} alt=""
                  style={{
                    position: 'absolute', inset: 4,
                    width: 'calc(100% - 8px)', height: 'calc(100% - 8px)',
                    objectFit: 'contain', opacity: 0.75,
                    filter: isPressed ? `drop-shadow(0 0 8px ${theme.keyShadow})` : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
                    transition: 'filter 0.2s, opacity 0.2s',
                  }} />
                {/* 숫자 */}
                <span style={{
                  position: 'relative', zIndex: 2,
                  fontSize: 22, fontWeight: 900,
                  color: theme.keyText,
                  textShadow: theme.keyText === '#FFFFFF'
                    ? '0 1px 4px rgba(0,0,0,0.5), 0 0 8px rgba(255,255,255,0.3)'
                    : `0 1px 3px rgba(255,255,255,0.8), 0 0 6px ${theme.keyShadow}40`,
                  lineHeight: 1,
                }}>
                  {k}
                </span>
              </button>
            )
          })}
        </div>

        {/* 하단 안내 */}
        <p style={{ color: '#bbb', fontSize: 10, marginTop: 16 }}>
          일비롱 디자인 나라
        </p>
      </div>
    </div>
  )
}
