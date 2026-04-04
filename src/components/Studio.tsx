'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric'

// ── 폰트 목록 ──────────────────────────────────────────────
// 실제 일비롱체 woff2 파일을 /public/fonts/ilbirong.woff2 로 넣으면
// FONTS 배열 첫 번째 항목 fontFamily를 'IlbilrongHand' 로 변경하세요.
const FONTS = [
  { label: '일비롱체 (준비중)', value: 'Nanum Pen Script' },
  { label: '나눔손글씨', value: 'Nanum Pen Script' },
  { label: '고딕체', value: 'Noto Sans KR' },
  { label: '명조체', value: 'Noto Serif KR' },
]

// ── 배경 옵션 ──────────────────────────────────────────────
const BG_COLORS = [
  '#ffffff', '#f8f4f0', '#fef3c7', '#fce7f3', '#ede9fe',
  '#d1fae5', '#dbeafe', '#fee2e2', '#1a1a2e', '#0f172a',
]

const BG_GRADIENTS = [
  { label: '핑크', stops: ['#fce7f3', '#ede9fe'] },
  { label: '하늘', stops: ['#dbeafe', '#e0f2fe'] },
  { label: '민트', stops: ['#d1fae5', '#ecfdf5'] },
  { label: '노을', stops: ['#fef3c7', '#fce7f3'] },
  { label: '라벤더', stops: ['#ede9fe', '#ddd6fe'] },
  { label: '블랙', stops: ['#1a1a2e', '#16213e'] },
]

// ── 캔버스 크기 프리셋 ──────────────────────────────────────
const CANVAS_SIZES = [
  { label: '정사각형', w: 600, h: 600 },
  { label: '가로형 (3:2)', w: 900, h: 600 },
  { label: '세로형 (2:3)', w: 600, h: 900 },
  { label: '현수막', w: 1200, h: 400 },
]

export default function Studio() {
  const canvasEl = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<fabric.Canvas | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 텍스트 입력 상태
  const [inputText, setInputText] = useState('')
  const [fontSize, setFontSize] = useState(72)
  const [fontFamily, setFontFamily] = useState(FONTS[0].value)
  const [textColor, setTextColor] = useState('#1a1a2e')
  const [bold, setBold] = useState(false)

  // 선택된 오브젝트 상태
  const [selected, setSelected] = useState<fabric.FabricObject | null>(null)
  const [selFontSize, setSelFontSize] = useState(72)
  const [selColor, setSelColor] = useState('#1a1a2e')
  const [selBold, setSelBold] = useState(false)
  const [selFontFamily, setSelFontFamily] = useState(FONTS[0].value)

  // 캔버스 설정
  const [canvasSize, setCanvasSize] = useState(CANVAS_SIZES[0])
  const [bgTab, setBgTab] = useState<'solid' | 'gradient' | 'image'>('solid')
  const [scale, setScale] = useState(1)

  // ── Google Fonts 로드 ──────────────────────────────────────
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+KR:wght@400;700&display=swap'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  // ── Fabric 캔버스 초기화 ──────────────────────────────────
  useEffect(() => {
    if (!canvasEl.current) return
    const canvas = new fabric.Canvas(canvasEl.current, {
      width: canvasSize.w,
      height: canvasSize.h,
      backgroundColor: '#ffffff',
      preserveObjectStacking: true,
    })
    canvasRef.current = canvas

    canvas.on('selection:created', (e) => handleSelect(e.selected?.[0] ?? null))
    canvas.on('selection:updated', (e) => handleSelect(e.selected?.[0] ?? null))
    canvas.on('selection:cleared', () => setSelected(null))

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => {
      canvas.dispose()
      window.removeEventListener('resize', updateScale)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasSize])

  // ── 캔버스 스케일 (반응형) ───────────────────────────────
  const updateScale = useCallback(() => {
    if (!wrapRef.current) return
    const availW = wrapRef.current.clientWidth - 32
    const ratio = Math.min(availW / canvasSize.w, 1)
    setScale(ratio)
  }, [canvasSize])

  // ── 선택 오브젝트 속성 읽기 ──────────────────────────────
  function handleSelect(obj: fabric.FabricObject | null) {
    setSelected(obj)
    if (obj && obj.type === 'textbox') {
      const t = obj as fabric.Textbox
      setSelFontSize(t.fontSize ?? 72)
      setSelColor((t.fill as string) ?? '#1a1a2e')
      setSelBold(t.fontWeight === 'bold')
      setSelFontFamily((t.fontFamily as string) ?? FONTS[0].value)
    }
  }

  // ── 텍스트 추가 ──────────────────────────────────────────
  const addText = () => {
    const canvas = canvasRef.current
    if (!canvas || !inputText.trim()) return
    const text = new fabric.Textbox(inputText, {
      left: canvasSize.w / 2,
      top: canvasSize.h / 2,
      originX: 'center',
      originY: 'center',
      fontSize,
      fontFamily,
      fill: textColor,
      fontWeight: bold ? 'bold' : 'normal',
      width: canvasSize.w * 0.8,
      textAlign: 'center',
      editable: true,
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    setInputText('')
  }

  // ── 선택 텍스트 속성 변경 ────────────────────────────────
  const updateSelected = (props: Partial<fabric.TextboxProps>) => {
    const canvas = canvasRef.current
    const obj = canvas?.getActiveObject()
    if (!obj || obj.type !== 'textbox') return
    obj.set(props as never)
    canvas?.renderAll()
  }

  // ── 선택 오브젝트 삭제 ───────────────────────────────────
  const deleteSelected = () => {
    const canvas = canvasRef.current
    const obj = canvas?.getActiveObject()
    if (!obj) return
    canvas?.remove(obj)
    canvas?.renderAll()
    setSelected(null)
  }

  // ── 배경: 단색 ───────────────────────────────────────────
  const setBgSolid = (color: string) => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.set('backgroundColor', color)
    canvas.backgroundImage = undefined
    canvas.renderAll()
  }

  // ── 배경: 그라디언트 ─────────────────────────────────────
  const setBgGradient = (stops: string[]) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const grad = new fabric.Gradient({
      type: 'linear',
      gradientUnits: 'pixels',
      coords: { x1: 0, y1: 0, x2: 0, y2: canvasSize.h },
      colorStops: [
        { offset: 0, color: stops[0] },
        { offset: 1, color: stops[1] },
      ],
    })
    canvas.set('backgroundColor', grad as never)
    canvas.backgroundImage = undefined
    canvas.renderAll()
  }

  // ── 배경: 이미지 업로드 ──────────────────────────────────
  const setBgImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const canvas = canvasRef.current
    if (!canvas) return
    fabric.FabricImage.fromURL(url).then((img) => {
      img.scaleToWidth(canvasSize.w)
      img.scaleToHeight(canvasSize.h)
      canvas.backgroundImage = img
      canvas.renderAll()
    })
  }

  // ── 다운로드 ─────────────────────────────────────────────
  const download = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.discardActiveObject()
    canvas.renderAll()
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `1brong-design-${Date.now()}.png`
    a.click()
  }

  // ── 캔버스 크기 변경 ─────────────────────────────────────
  const changeSize = (size: typeof CANVAS_SIZES[number]) => {
    setCanvasSize(size)
    // 캔버스가 재생성되므로 콘텐츠는 초기화됨
  }

  const isTextSelected = selected?.type === 'textbox'

  return (
    <div className="min-h-screen bg-[#f8f4f0] flex flex-col">
      {/* ── 헤더 ── */}
      <header className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="font-black text-xl text-gray-900 tracking-tight">1B롱</h1>
          <p className="text-xs text-gray-400">일비롱 디자인 스튜디오</p>
        </div>
        <button
          onClick={download}
          className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold px-5 py-2 rounded-xl hover:opacity-90 transition"
        >
          ⬇ 다운로드
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── 좌측 패널 ── */}
        <aside className="w-72 bg-white border-r border-gray-100 overflow-y-auto flex-shrink-0 flex flex-col gap-0">

          {/* 텍스트 추가 */}
          <section className="p-4 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">텍스트 추가</h2>
            <textarea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addText() } }}
              placeholder="입력 후 Enter ↵"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 mb-2"
              style={{ fontFamily }}
            />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div>
                <label className="text-xs text-gray-500 block mb-1">폰트</label>
                <select
                  value={fontFamily}
                  onChange={e => setFontFamily(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
                >
                  {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">크기 {fontSize}px</label>
                <input
                  type="range" min={12} max={300} value={fontSize}
                  onChange={e => setFontSize(Number(e.target.value))}
                  className="w-full accent-pink-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">색상</label>
                <input
                  type="color" value={textColor}
                  onChange={e => setTextColor(e.target.value)}
                  className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
              </div>
              <button
                onClick={() => setBold(b => !b)}
                className={`px-3 py-2 rounded-lg text-sm font-bold border transition mt-4 ${bold ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600'}`}
              >
                B
              </button>
            </div>
            <button
              onClick={addText}
              disabled={!inputText.trim()}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-bold py-2.5 rounded-xl hover:opacity-90 transition disabled:opacity-40"
            >
              + 텍스트 추가
            </button>
          </section>

          {/* 선택된 오브젝트 편집 */}
          {isTextSelected && (
            <section className="p-4 border-b border-gray-100 bg-pink-50">
              <h2 className="text-xs font-bold text-pink-600 uppercase tracking-wider mb-3">선택된 텍스트 편집</h2>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">폰트</label>
                  <select
                    value={selFontFamily}
                    onChange={e => { setSelFontFamily(e.target.value); updateSelected({ fontFamily: e.target.value }) }}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-pink-300"
                  >
                    {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">크기 {selFontSize}px</label>
                  <input
                    type="range" min={12} max={300} value={selFontSize}
                    onChange={e => { const v = Number(e.target.value); setSelFontSize(v); updateSelected({ fontSize: v }) }}
                    className="w-full accent-pink-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">색상</label>
                    <input
                      type="color" value={selColor}
                      onChange={e => { setSelColor(e.target.value); updateSelected({ fill: e.target.value }) }}
                      className="w-9 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                    />
                  </div>
                  <button
                    onClick={() => { const nb = !selBold; setSelBold(nb); updateSelected({ fontWeight: nb ? 'bold' : 'normal' }) }}
                    className={`px-3 py-2 rounded-lg text-sm font-bold border transition mt-4 ${selBold ? 'bg-gray-800 text-white border-gray-800' : 'border-gray-200 text-gray-600'}`}
                  >
                    B
                  </button>
                </div>
                <button
                  onClick={deleteSelected}
                  className="w-full border border-red-200 text-red-500 text-xs font-medium py-2 rounded-xl hover:bg-red-50 transition"
                >
                  🗑 삭제
                </button>
              </div>
            </section>
          )}

          {/* 배경 설정 */}
          <section className="p-4 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">배경</h2>
            <div className="flex gap-1 mb-3">
              {(['solid', 'gradient', 'image'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setBgTab(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition ${bgTab === tab ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                >
                  {tab === 'solid' ? '단색' : tab === 'gradient' ? '그라디언트' : '이미지'}
                </button>
              ))}
            </div>

            {bgTab === 'solid' && (
              <div className="grid grid-cols-5 gap-1.5">
                {BG_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setBgSolid(c)}
                    className="w-full aspect-square rounded-lg border-2 border-gray-200 hover:border-pink-400 transition"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}

            {bgTab === 'gradient' && (
              <div className="grid grid-cols-3 gap-1.5">
                {BG_GRADIENTS.map(g => (
                  <button
                    key={g.label}
                    onClick={() => setBgGradient(g.stops)}
                    className="rounded-lg h-10 text-xs font-medium border-2 border-transparent hover:border-pink-400 transition flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${g.stops[0]}, ${g.stops[1]})` }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            )}

            {bgTab === 'image' && (
              <label className="w-full border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-400 text-xs text-center cursor-pointer hover:border-pink-300 hover:text-pink-400 transition flex items-center justify-center">
                + 이미지 업로드
                <input type="file" accept="image/*" className="hidden" onChange={setBgImage} />
              </label>
            )}
          </section>

          {/* 캔버스 크기 */}
          <section className="p-4">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">캔버스 크기</h2>
            <div className="grid grid-cols-2 gap-1.5">
              {CANVAS_SIZES.map(s => (
                <button
                  key={s.label}
                  onClick={() => changeSize(s)}
                  className={`py-2 rounded-xl text-xs font-medium border transition ${canvasSize.label === s.label ? 'bg-pink-500 text-white border-pink-500' : 'border-gray-200 text-gray-600 hover:border-pink-300'}`}
                >
                  {s.label}
                  <span className="block text-[10px] opacity-60">{s.w}×{s.h}</span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* ── 캔버스 영역 ── */}
        <main className="flex-1 flex items-start justify-center p-6 overflow-auto" ref={wrapRef}>
          <div
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: canvasSize.w,
              height: canvasSize.h,
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
              borderRadius: 8,
              overflow: 'hidden',
              flexShrink: 0,
            }}
          >
            <canvas ref={canvasEl} />
          </div>
        </main>
      </div>

      {/* ── 하단 힌트 ── */}
      <footer className="bg-white border-t border-gray-100 px-5 py-2 text-center text-xs text-gray-400">
        텍스트를 더블클릭하면 내용을 수정할 수 있어요 · 드래그로 위치 이동 · 모서리 핸들로 크기 조정
      </footer>
    </div>
  )
}
