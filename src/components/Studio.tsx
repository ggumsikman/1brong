'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric'

// ── 폰트 ──────────────────────────────────────────────────
const FONTS = [
  { label: '일비롱체', value: 'Nanum Pen Script' },      // → 추후 IlbilrongHand 로 교체
  { label: '귀여운체', value: 'Nanum Brush Script' },
  { label: '고딕', value: 'Noto Sans KR' },
  { label: '명조', value: 'Noto Serif KR' },
]

// ── 텍스트 프리셋 ─────────────────────────────────────────
const TEXT_PRESETS = [
  { label: '큰 제목', size: 90, weight: 'bold', color: '#C2185B', sample: '큰 제목' },
  { label: '중간 제목', size: 60, weight: 'bold', color: '#6A1B9A', sample: '중간 제목' },
  { label: '부제목', size: 40, weight: 'normal', color: '#2E7D32', sample: '부제목을 입력하세요' },
  { label: '본문', size: 28, weight: 'normal', color: '#333333', sample: '본문 내용을 입력하세요' },
  { label: '작은 글씨', size: 20, weight: 'normal', color: '#888888', sample: '작은 글씨' },
]

// ── SVG 스티커 ────────────────────────────────────────────
const STICKERS = [
  { emoji: '❤️', label: '하트', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 85 L15 50 C5 38 10 18 25 18 C35 18 45 26 50 35 C55 26 65 18 75 18 C90 18 95 38 85 50 Z" fill="#FF6B9D"/></svg>` },
  { emoji: '⭐', label: '별', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 63,35 95,35 71,57 80,90 50,70 20,90 29,57 5,35 37,35" fill="#FFD166"/></svg>` },
  { emoji: '☁️', label: '구름', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><ellipse cx="60" cy="55" rx="45" ry="22" fill="white" stroke="#ddd" stroke-width="2"/><circle cx="35" cy="45" r="20" fill="white" stroke="#ddd" stroke-width="2"/><circle cx="60" cy="35" r="25" fill="white" stroke="#ddd" stroke-width="2"/><circle cx="85" cy="45" r="18" fill="white" stroke="#ddd" stroke-width="2"/></svg>` },
  { emoji: '☀️', label: '태양', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="22" fill="#FFD166"/>${Array.from({length:8},(_,i)=>{const a=i*45*Math.PI/180;const x1=50+32*Math.cos(a);const y1=50+32*Math.sin(a);const x2=50+42*Math.cos(a);const y2=50+42*Math.sin(a);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#FFD166" stroke-width="5" stroke-linecap="round"/>`;}).join('')}</svg>` },
  { emoji: '🌸', label: '꽃', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${Array.from({length:5},(_,i)=>{const a=i*72*Math.PI/180;const cx=50+22*Math.cos(a-Math.PI/2);const cy=50+22*Math.sin(a-Math.PI/2);return `<ellipse cx="${cx}" cy="${cy}" rx="12" ry="18" fill="#FFB3C6" transform="rotate(${i*72},${cx},${cy})"/>`;}).join('')}<circle cx="50" cy="50" r="14" fill="#FFE066"/></svg>` },
  { emoji: '🌈', label: '무지개', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60"><path d="M5 55 Q5 5 50 5 Q95 5 95 55" fill="none" stroke="#FF6B6B" stroke-width="6" stroke-linecap="round"/><path d="M13 55 Q13 15 50 15 Q87 15 87 55" fill="none" stroke="#FFD166" stroke-width="6" stroke-linecap="round"/><path d="M21 55 Q21 25 50 25 Q79 25 79 55" fill="none" stroke="#7BC67E" stroke-width="6" stroke-linecap="round"/><path d="M29 55 Q29 33 50 33 Q71 33 71 55" fill="none" stroke="#74B9FF" stroke-width="6" stroke-linecap="round"/></svg>` },
  { emoji: '🎀', label: '리본', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 80"><path d="M60 40 L20 10 C10 5 5 20 15 28 L55 42 Z" fill="#FF6B9D"/><path d="M60 40 L100 10 C110 5 115 20 105 28 L65 42 Z" fill="#FF6B9D"/><path d="M60 40 L20 70 C10 75 5 60 15 52 L55 38 Z" fill="#FF8FA3"/><path d="M60 40 L100 70 C110 75 115 60 105 52 L65 38 Z" fill="#FF8FA3"/><circle cx="60" cy="40" r="10" fill="#FF4081"/></svg>` },
  { emoji: '💫', label: '반짝', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 10 L54 42 L86 38 L58 52 L80 76 L50 58 L20 76 L42 52 L14 38 L46 42 Z" fill="#FFD166"/></svg>` },
  { emoji: '🟥', label: '사각형', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" rx="12" fill="#FF6B6B"/></svg>` },
  { emoji: '🔵', label: '원', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#74B9FF"/></svg>` },
  { emoji: '🔶', label: '다이아', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 95,50 50,95 5,50" fill="#FFD166"/></svg>` },
  { emoji: '⭐', label: '오각별', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 63,35 95,35 71,57 80,90 50,70 20,90 29,57 5,35 37,35" fill="#A29BFE"/></svg>` },
]

// ── 배경 팔레트 (일비롱 스타일) ───────────────────────────
const BG_SOLIDS = [
  '#FFFFFF', '#FFF8F0', '#FFE8D6', '#FFDDE1', '#FFE8F5',
  '#E8F5E9', '#E3F2FD', '#F3E5F5', '#FFFDE7', '#F5F5F5',
  '#2D3436', '#6C5CE7', '#E17055', '#00B894', '#0984E3',
]
const BG_GRADIENTS = [
  { label: '살구빛', stops: ['#FFE8D6', '#FFDDE1'] },
  { label: '핑크드림', stops: ['#FFDDE1', '#E8D5F5'] },
  { label: '민트하늘', stops: ['#D4EFDF', '#D6EAF8'] },
  { label: '노을', stops: ['#FFE8D6', '#FFD3B4'] },
  { label: '라벤더', stops: ['#E8D5F5', '#D0E8FF'] },
  { label: '레몬', stops: ['#FFFDE7', '#FFF9C4'] },
  { label: '산호', stops: ['#FF8C7A', '#FF6B9D'] },
  { label: '밤하늘', stops: ['#2D3436', '#6C5CE7'] },
]

// ── 캔버스 프리셋 ─────────────────────────────────────────
const CANVAS_PRESETS = [
  { label: '정사각형', icon: '⬛', w: 600, h: 600 },
  { label: '가로형', icon: '▬', w: 900, h: 600 },
  { label: '세로형', icon: '▮', w: 600, h: 900 },
  { label: '현수막', icon: '━', w: 1200, h: 400 },
  { label: '명찰', icon: '🏷', w: 400, h: 560 },
  { label: '머그컵', icon: '☕', w: 600, h: 440 },
]

// ── 사이드바 메뉴 ─────────────────────────────────────────
type PanelType = '텍스트' | '요소' | '배경' | '사진' | '크기'
const SIDEBAR_MENUS: { id: PanelType; icon: string; label: string }[] = [
  { id: '텍스트', icon: 'T', label: '텍스트' },
  { id: '요소', icon: '★', label: '요소' },
  { id: '배경', icon: '🎨', label: '배경' },
  { id: '사진', icon: '🖼', label: '사진' },
  { id: '크기', icon: '⊞', label: '크기' },
]

export default function Studio() {
  const canvasEl = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<fabric.Canvas | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const bgFileRef = useRef<HTMLInputElement>(null)
  const photoFileRef = useRef<HTMLInputElement>(null)

  const [activePanel, setActivePanel] = useState<PanelType | null>('텍스트')
  const [canvasPreset, setCanvasPreset] = useState(CANVAS_PRESETS[0])
  const [scale, setScale] = useState(1)

  // 선택된 오브젝트
  const [selected, setSelected] = useState<fabric.FabricObject | null>(null)

  // 텍스트 속성 (선택 시 사용)
  const [selFont, setSelFont] = useState(FONTS[0].value)
  const [selSize, setSelSize] = useState(60)
  const [selColor, setSelColor] = useState('#333333')
  const [selBold, setSelBold] = useState(false)
  const [selAlign, setSelAlign] = useState<'left'|'center'|'right'>('center')

  // 배경 탭
  const [bgTab, setBgTab] = useState<'solid'|'gradient'|'image'>('solid')

  // ── 구글 폰트 로드 ───────────────────────────────────────
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&family=Nanum+Brush+Script&family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+KR:wght@400;700&display=swap'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  // ── 캔버스 초기화 ─────────────────────────────────────────
  useEffect(() => {
    if (!canvasEl.current) return
    const canvas = new fabric.Canvas(canvasEl.current, {
      width: canvasPreset.w,
      height: canvasPreset.h,
      backgroundColor: '#FFF8F0',
      preserveObjectStacking: true,
    })
    canvasRef.current = canvas

    canvas.on('selection:created', (e) => syncSelected(e.selected?.[0] ?? null))
    canvas.on('selection:updated', (e) => syncSelected(e.selected?.[0] ?? null))
    canvas.on('selection:cleared', () => setSelected(null))
    canvas.on('object:modified', () => {
      const obj = canvas.getActiveObject()
      if (obj) syncSelected(obj)
    })

    // 키보드 Delete
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        const obj = canvas.getActiveObject()
        if (obj) { canvas.remove(obj); canvas.renderAll(); setSelected(null) }
      }
    }
    window.addEventListener('keydown', onKey)
    recalcScale()
    window.addEventListener('resize', recalcScale)

    return () => {
      canvas.dispose()
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', recalcScale)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasPreset])

  // ── 스케일 계산 ───────────────────────────────────────────
  const recalcScale = useCallback(() => {
    if (!wrapRef.current) return
    const pad = 48
    const availW = wrapRef.current.clientWidth - pad
    const availH = wrapRef.current.clientHeight - pad
    const s = Math.min(availW / canvasPreset.w, availH / canvasPreset.h, 1)
    setScale(s)
  }, [canvasPreset])

  // ── 선택 오브젝트 동기화 ──────────────────────────────────
  function syncSelected(obj: fabric.FabricObject | null) {
    setSelected(obj)
    if (obj?.type === 'textbox') {
      const t = obj as fabric.Textbox
      setSelFont((t.fontFamily as string) ?? FONTS[0].value)
      setSelSize(t.fontSize ?? 60)
      setSelColor((t.fill as string) ?? '#333333')
      setSelBold(t.fontWeight === 'bold')
      setSelAlign((t.textAlign as 'left'|'center'|'right') ?? 'center')
    }
  }

  // ── 텍스트 추가 ───────────────────────────────────────────
  const addText = (sample: string, size: number, weight: string, color: string) => {
    const canvas = canvasRef.current; if (!canvas) return
    const t = new fabric.Textbox(sample, {
      left: canvasPreset.w / 2,
      top: canvasPreset.h / 2,
      originX: 'center', originY: 'center',
      fontSize: size,
      fontFamily: FONTS[0].value,
      fill: color,
      fontWeight: weight,
      width: canvasPreset.w * 0.75,
      textAlign: 'center',
      editable: true,
    })
    canvas.add(t)
    canvas.setActiveObject(t)
    canvas.renderAll()
  }

  // ── 선택 텍스트 속성 업데이트 ─────────────────────────────
  const updateText = (props: Partial<fabric.TextboxProps>) => {
    const canvas = canvasRef.current
    const obj = canvas?.getActiveObject()
    if (!obj || obj.type !== 'textbox') return
    obj.set(props as never)
    canvas?.renderAll()
  }

  // ── 스티커(SVG) 추가 ──────────────────────────────────────
  const addSticker = async (svgStr: string) => {
    const canvas = canvasRef.current; if (!canvas) return
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`
    const img = await fabric.FabricImage.fromURL(dataUrl)
    img.set({
      left: canvasPreset.w / 2,
      top: canvasPreset.h / 2,
      originX: 'center', originY: 'center',
      scaleX: 1.2, scaleY: 1.2,
    })
    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.renderAll()
  }

  // ── 사진 추가 ─────────────────────────────────────────────
  const addPhoto = async (e: React.ChangeEvent<HTMLInputElement>, circle = false) => {
    const file = e.target.files?.[0]; if (!file) return
    const url = URL.createObjectURL(file)
    const canvas = canvasRef.current; if (!canvas) return
    const img = await fabric.FabricImage.fromURL(url)
    const maxW = canvasPreset.w * 0.5
    if (img.width! > maxW) img.scaleToWidth(maxW)
    img.set({ left: canvasPreset.w / 2, top: canvasPreset.h / 2, originX: 'center', originY: 'center' })
    if (circle) {
      const r = Math.min(img.getScaledWidth(), img.getScaledHeight()) / 2
      img.clipPath = new fabric.Circle({ radius: r, originX: 'center', originY: 'center' })
    }
    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.renderAll()
    e.target.value = ''
  }

  // ── 배경: 단색 ────────────────────────────────────────────
  const setBgSolid = (color: string) => {
    const c = canvasRef.current; if (!c) return
    c.set('backgroundColor', color)
    c.backgroundImage = undefined
    c.renderAll()
  }
  // ── 배경: 그라디언트 ──────────────────────────────────────
  const setBgGrad = (stops: string[]) => {
    const c = canvasRef.current; if (!c) return
    c.set('backgroundColor', new fabric.Gradient({
      type: 'linear', gradientUnits: 'pixels',
      coords: { x1: 0, y1: 0, x2: 0, y2: canvasPreset.h },
      colorStops: [{ offset: 0, color: stops[0] }, { offset: 1, color: stops[1] }],
    }) as never)
    c.backgroundImage = undefined
    c.renderAll()
  }
  // ── 배경: 이미지 ──────────────────────────────────────────
  const setBgImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const c = canvasRef.current; if (!c) return
    const url = URL.createObjectURL(file)
    const img = await fabric.FabricImage.fromURL(url)
    img.scaleToWidth(canvasPreset.w)
    c.backgroundImage = img
    c.renderAll()
    e.target.value = ''
  }

  // ── 삭제 ─────────────────────────────────────────────────
  const deleteSelected = () => {
    const c = canvasRef.current; if (!c) return
    const obj = c.getActiveObject(); if (!obj) return
    c.remove(obj); c.renderAll(); setSelected(null)
  }

  // ── 레이어 순서 ───────────────────────────────────────────
  const bringFwd = () => { const c = canvasRef.current; const o = c?.getActiveObject(); if (c && o) { c.bringObjectForward(o); c.renderAll() } }
  const sendBwd = () => { const c = canvasRef.current; const o = c?.getActiveObject(); if (c && o) { c.sendObjectBackwards(o); c.renderAll() } }

  // ── 다운로드 ─────────────────────────────────────────────
  const download = () => {
    const c = canvasRef.current; if (!c) return
    c.discardActiveObject(); c.renderAll()
    const url = c.toDataURL({ format: 'png', multiplier: 2 })
    const a = document.createElement('a')
    a.href = url; a.download = `1brong-${Date.now()}.png`; a.click()
  }

  // ── 패널 토글 ─────────────────────────────────────────────
  const togglePanel = (id: PanelType) => {
    setActivePanel(p => p === id ? null : id)
  }

  const isText = selected?.type === 'textbox'

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FFF8F0', fontFamily: 'Noto Sans KR, sans-serif' }}>
      {/* ══ 헤더 ════════════════════════════════════════════ */}
      <header style={{ background: 'linear-gradient(135deg, #FF6B9D, #C77DFF)', boxShadow: '0 2px 12px rgba(199,125,255,0.3)' }}
        className="px-5 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-xl px-3 py-1.5 shadow-sm">
            <span className="font-black text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(135deg,#FF6B9D,#C77DFF)', fontSize: 18 }}>1B롱</span>
          </div>
          <span className="text-white/80 text-xs hidden sm:block">일비롱 디자인 스튜디오</span>
        </div>
        <div className="flex items-center gap-2">
          {/* 실행 취소/재실행은 추후 추가 */}
          <button onClick={download}
            className="bg-white text-pink-600 font-bold text-sm px-5 py-2 rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-1.5">
            <span>⬇</span> 다운로드
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ══ 아이콘 사이드바 ══════════════════════════════ */}
        <nav className="w-16 bg-white border-r border-gray-100 flex flex-col items-center py-3 gap-1 z-20 shrink-0"
          style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>
          {SIDEBAR_MENUS.map(m => (
            <button key={m.id} onClick={() => togglePanel(m.id)}
              className="w-12 h-14 rounded-xl flex flex-col items-center justify-center gap-0.5 transition text-xs font-medium"
              style={{
                background: activePanel === m.id ? 'linear-gradient(135deg,#FFE0EF,#EDE0FF)' : 'transparent',
                color: activePanel === m.id ? '#C77DFF' : '#666',
              }}>
              <span className="text-base leading-none">{m.icon}</span>
              <span style={{ fontSize: 10 }}>{m.label}</span>
            </button>
          ))}
        </nav>

        {/* ══ 좌측 패널 ═══════════════════════════════════ */}
        {activePanel && (
          <aside className="w-64 bg-white border-r border-gray-100 overflow-y-auto shrink-0"
            style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>

            {/* 선택된 텍스트 편집 패널 (최상단) */}
            {isText && (
              <div className="p-4 border-b-2 border-pink-100" style={{ background: '#FFF0F8' }}>
                <p className="text-xs font-bold text-pink-500 mb-3 uppercase tracking-wide">텍스트 편집</p>
                {/* 폰트 */}
                <label className="text-xs text-gray-500 block mb-1">폰트</label>
                <select value={selFont}
                  onChange={e => { setSelFont(e.target.value); updateText({ fontFamily: e.target.value }) }}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-pink-300">
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                {/* 크기 */}
                <label className="text-xs text-gray-500 block mb-1">크기 {selSize}px</label>
                <input type="range" min={10} max={300} value={selSize}
                  onChange={e => { const v = +e.target.value; setSelSize(v); updateText({ fontSize: v }) }}
                  className="w-full accent-pink-500 mb-2" />
                {/* 색상 + 굵기 + 정렬 */}
                <div className="flex items-center gap-2 mb-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">색상</label>
                    <input type="color" value={selColor}
                      onChange={e => { setSelColor(e.target.value); updateText({ fill: e.target.value }) }}
                      className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                  </div>
                  <button onClick={() => { const nb = !selBold; setSelBold(nb); updateText({ fontWeight: nb ? 'bold' : 'normal' }) }}
                    className={`px-2.5 py-1.5 rounded-lg text-sm font-black border transition mt-4 ${selBold ? 'bg-gray-800 text-white' : 'border-gray-200 text-gray-500'}`}>B</button>
                  {(['left','center','right'] as const).map(a => (
                    <button key={a} onClick={() => { setSelAlign(a); updateText({ textAlign: a }) }}
                      className={`px-2 py-1.5 rounded-lg text-xs border transition mt-4 ${selAlign === a ? 'bg-purple-500 text-white' : 'border-gray-200 text-gray-500'}`}>
                      {a === 'left' ? '◀' : a === 'center' ? '▬' : '▶'}
                    </button>
                  ))}
                </div>
                {/* 레이어 + 삭제 */}
                <div className="flex gap-1.5">
                  <button onClick={sendBwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition">↓ 뒤로</button>
                  <button onClick={bringFwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50 transition">↑ 앞으로</button>
                  <button onClick={deleteSelected} className="flex-1 border border-red-200 text-red-400 text-xs py-1.5 rounded-lg hover:bg-red-50 transition">🗑</button>
                </div>
              </div>
            )}

            {/* ── 텍스트 패널 ── */}
            {activePanel === '텍스트' && (
              <div className="p-4">
                <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">텍스트 추가</p>
                <div className="space-y-2">
                  {TEXT_PRESETS.map(p => (
                    <button key={p.label} onClick={() => addText(p.sample, p.size, p.weight, p.color)}
                      className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50 transition group">
                      <span className="block font-medium text-xs text-gray-400 mb-0.5 group-hover:text-pink-400">{p.label}</span>
                      <span style={{ fontFamily: FONTS[0].value, fontSize: Math.min(p.size * 0.3, 22), color: p.color, fontWeight: p.weight }}>
                        {p.sample}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── 요소 패널 ── */}
            {activePanel === '요소' && (
              <div className="p-4">
                <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">스티커 & 도형</p>
                <div className="grid grid-cols-3 gap-2">
                  {STICKERS.map(s => (
                    <button key={s.label} onClick={() => addSticker(s.svg)}
                      className="aspect-square rounded-xl border border-gray-100 hover:border-pink-300 hover:shadow-sm transition flex flex-col items-center justify-center gap-1 p-2 bg-gray-50 hover:bg-pink-50">
                      <div className="w-10 h-10 flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: s.svg.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="100%"') }} />
                      <span className="text-xs text-gray-400" style={{ fontSize: 10 }}>{s.label}</span>
                    </button>
                  ))}
                </div>
                {/* 이미지 선택 시 레이어/삭제 */}
                {selected && !isText && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-bold text-gray-400 mb-2">요소 편집</p>
                    <div className="flex gap-1.5">
                      <button onClick={sendBwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">↓ 뒤로</button>
                      <button onClick={bringFwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">↑ 앞으로</button>
                      <button onClick={deleteSelected} className="flex-1 border border-red-200 text-red-400 text-xs py-1.5 rounded-lg hover:bg-red-50">🗑</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 배경 패널 ── */}
            {activePanel === '배경' && (
              <div className="p-4">
                <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">배경</p>
                <div className="flex gap-1 mb-3">
                  {(['solid','gradient','image'] as const).map(t => (
                    <button key={t} onClick={() => setBgTab(t)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${bgTab===t ? 'text-white' : 'bg-gray-100 text-gray-500'}`}
                      style={bgTab===t ? { background:'linear-gradient(135deg,#FF6B9D,#C77DFF)' } : {}}>
                      {t==='solid'?'단색':t==='gradient'?'그라디언트':'이미지'}
                    </button>
                  ))}
                </div>
                {bgTab === 'solid' && (
                  <div className="grid grid-cols-5 gap-1.5">
                    {BG_SOLIDS.map(c => (
                      <button key={c} onClick={() => setBgSolid(c)}
                        className="aspect-square rounded-lg border-2 border-gray-200 hover:border-pink-400 transition"
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}
                {bgTab === 'gradient' && (
                  <div className="grid grid-cols-2 gap-2">
                    {BG_GRADIENTS.map(g => (
                      <button key={g.label} onClick={() => setBgGrad(g.stops)}
                        className="h-12 rounded-xl text-xs font-bold border-2 border-transparent hover:border-pink-300 transition"
                        style={{ background: `linear-gradient(135deg,${g.stops[0]},${g.stops[1]})`, color: '#555' }}>
                        {g.label}
                      </button>
                    ))}
                  </div>
                )}
                {bgTab === 'image' && (
                  <label className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 text-gray-400 text-xs text-center cursor-pointer hover:border-pink-300 hover:text-pink-400 transition flex items-center justify-center">
                    + 배경 이미지 업로드
                    <input type="file" accept="image/*" className="hidden" onChange={setBgImage} />
                  </label>
                )}
              </div>
            )}

            {/* ── 사진 패널 ── */}
            {activePanel === '사진' && (
              <div className="p-4">
                <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">사진 추가</p>
                <div className="space-y-2">
                  <label className="w-full border-2 border-dashed border-pink-200 rounded-xl py-5 text-pink-400 text-xs text-center cursor-pointer hover:bg-pink-50 transition flex flex-col items-center gap-1">
                    <span className="text-2xl">🖼</span>
                    <span className="font-medium">사진 업로드</span>
                    <span className="text-gray-400" style={{ fontSize: 10 }}>일반 사각형</span>
                    <input ref={photoFileRef} type="file" accept="image/*" className="hidden"
                      onChange={e => addPhoto(e, false)} />
                  </label>
                  <label className="w-full border-2 border-dashed border-purple-200 rounded-xl py-5 text-purple-400 text-xs text-center cursor-pointer hover:bg-purple-50 transition flex flex-col items-center gap-1">
                    <span className="text-2xl">👤</span>
                    <span className="font-medium">원형 사진 업로드</span>
                    <span className="text-gray-400" style={{ fontSize: 10 }}>캔바 원형 프레임 스타일</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => addPhoto(e, true)} />
                  </label>
                </div>
                {selected && !isText && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-1.5">
                      <button onClick={sendBwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">↓ 뒤로</button>
                      <button onClick={bringFwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">↑ 앞으로</button>
                      <button onClick={deleteSelected} className="flex-1 border border-red-200 text-red-400 text-xs py-1.5 rounded-lg hover:bg-red-50">🗑</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 크기 패널 ── */}
            {activePanel === '크기' && (
              <div className="p-4">
                <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">캔버스 크기</p>
                <div className="space-y-1.5">
                  {CANVAS_PRESETS.map(p => (
                    <button key={p.label} onClick={() => setCanvasPreset(p)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition text-left"
                      style={{
                        borderColor: canvasPreset.label === p.label ? '#FF6B9D' : '#eee',
                        background: canvasPreset.label === p.label ? '#FFF0F8' : 'white',
                        color: canvasPreset.label === p.label ? '#C2185B' : '#555',
                      }}>
                      <span className="text-lg">{p.icon}</span>
                      <div>
                        <p className="text-xs font-bold">{p.label}</p>
                        <p className="text-gray-400" style={{ fontSize: 10 }}>{p.w} × {p.h}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        )}

        {/* ══ 캔버스 영역 ══════════════════════════════════ */}
        <main className="flex-1 flex items-center justify-center overflow-auto p-6 relative"
          ref={wrapRef}
          style={{ background: 'radial-gradient(circle at center, #F5EEF8 0%, #FFF0F8 100%)' }}>
          {/* 도움말 */}
          <div className="absolute top-4 right-4 text-xs text-gray-400 bg-white rounded-xl px-3 py-1.5 shadow-sm">
            더블클릭: 텍스트 편집 · Del: 삭제
          </div>
          <div style={{
            transform: `scale(${scale})`,
            transformOrigin: 'center center',
            width: canvasPreset.w,
            height: canvasPreset.h,
            boxShadow: '0 12px 48px rgba(199,125,255,0.2), 0 4px 16px rgba(0,0,0,0.1)',
            borderRadius: 12,
            overflow: 'hidden',
            flexShrink: 0,
          }}>
            <canvas ref={canvasEl} />
          </div>
        </main>
      </div>

      {/* ══ 하단 바 ════════════════════════════════════════ */}
      <footer style={{ background: 'white', borderTop: '1px solid #f0e0ff' }}
        className="px-5 py-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          {canvasPreset.label} · {canvasPreset.w}×{canvasPreset.h}px
        </span>
        <span className="text-xs font-bold" style={{ color: '#C77DFF' }}>
          Made with 1B롱 ✨
        </span>
      </footer>
    </div>
  )
}
