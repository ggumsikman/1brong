'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as fabric from 'fabric'
import { removeBackground } from '@imgly/background-removal'
import { jsPDF } from 'jspdf'
import pptxgen from 'pptxgenjs'

// ── 폰트 ──────────────────────────────────────────────────
const FONTS = [
  { label: '일비롱체', value: 'Nanum Pen Script' },      // → 추후 IlbilrongHand 로 교체
  { label: '귀여운체', value: 'Nanum Brush Script' },
  { label: '고딕', value: 'Noto Sans KR' },
  { label: '명조', value: 'Noto Serif KR' },
  // ── 온글잎 무료폰트 (CDN: jsdelivr via noonnu.cc) ──
  { label: '온글잎 콘콘체', value: 'OngleipKonkon' },
  { label: '온글잎 박다현체', value: 'Ownglyph_ParkDaHyun' },
  { label: '온글잎 은별체', value: 'OngleipEunbyeol' },
  { label: '온글잎 류뚱체', value: 'OngleipRyudung' },
  { label: '온글잎 떼롬체', value: 'OngleipTterom' },
  { label: '온글잎 김콩해체', value: 'OngleipKimkonghae' },
  { label: '온글잎 누카체', value: 'OngleipNuka' },
  { label: '온글잎 글목록체', value: 'OngleipWFontList' },
  { label: '온글잎 의연체', value: 'OngleipEoyeonce' },
  { label: '온글잎 윤우체', value: 'Yoonwoo' },
  { label: '온글잎 민혜체', value: 'Minhye' },
]

// ── 온글잎 @font-face CSS ─────────────────────────────────
const OWNGLYPH_CSS = `
@font-face{font-family:'OngleipKonkon';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2412-1@1.0/Ownglyph_corncorn-Rg.woff2') format('woff2');font-display:swap}
@font-face{font-family:'Ownglyph_ParkDaHyun';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2411-3@1.0/Ownglyph_ParkDaHyun.woff2') format('woff2');font-display:swap}
@font-face{font-family:'OngleipEunbyeol';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2405-2@1.0/Ownglyph_eunbyul21-Rg.woff2') format('woff2');font-display:swap}
@font-face{font-family:'OngleipRyudung';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2405-2@1.0/Ownglyph_ryuttung-Rg.woff2') format('woff2');font-display:swap}
@font-face{font-family:'OngleipTterom';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408-4@1.0/Ownglyph_ttaerom-Rg.woff2') format('woff2');font-display:swap}
@font-face{font-family:'OngleipKimkonghae';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2408@1.0/Ownglyph_kimkonghae.woff2') format('woff2');font-display:swap}
@font-face{font-family:'OngleipNuka';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2405-2@1.0/Ownglyph_noocar-Rg.woff2') format('woff2');font-display:swap}
@font-face{font-family:'OngleipWFontList';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/2501-1@1.1/Ownglyph_wiseelist-Rg.woff2') format('woff2');font-display:swap}
@font-face{font-family:'OngleipEoyeonce';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2105@1.1/Uiyeun.woff') format('woff');font-display:swap}
@font-face{font-family:'Yoonwoo';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2105@1.1/Yoonwoo.woff') format('woff');font-display:swap}
@font-face{font-family:'Minhye';src:url('https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2105_2@1.0/Minhye.woff') format('woff');font-display:swap}
`

// ── 텍스트 프리셋 ─────────────────────────────────────────
const TEXT_PRESETS = [
  { label: '큰 제목', size: 90, weight: 'bold', color: '#C2185B', sample: '큰 제목' },
  { label: '중간 제목', size: 60, weight: 'bold', color: '#6A1B9A', sample: '중간 제목' },
  { label: '부제목', size: 40, weight: 'normal', color: '#2E7D32', sample: '부제목을 입력하세요' },
  { label: '본문', size: 28, weight: 'normal', color: '#333333', sample: '본문 내용을 입력하세요' },
  { label: '작은 글씨', size: 20, weight: 'normal', color: '#888888', sample: '작은 글씨' },
]

// ── 일비롱 손그림 PNG 목록 ────────────────────────────────
const ILBIRONG_STICKERS = [
  '가랜드','가방','개나리','검','고깔모자','고깔모자2','곰','구름',
  '꽃1','꽃2','꽃3','꽃4','꽃스마일','꿀벌',
  '나무','나무2','나뭇가지','나뭇잎','나비2',
  '남아오티합성','남자입학1','남자입학3','남학생',
  '노란꽃','노란꽃4','노란풍선','노랑나비','노랑튤립','노트',
  '데이지','리본','리본2','무무개','무지개','민트별',
  '벌','벚꽃','벚꽃2','벚꽃잎','벚꽃잎3',
  '별','별1','별2','별3','병아리','보라별','보라튤립','분홍별',
  '새싹','스마일','스마일2','슾',
  '언덕','언덕1','언덕2',
  '여자입학1','여학생','연보라 나비','연필',
  '오티여아합성','요','유치원','유치원버스','은계','을',
  '음표','음표2','음표3','입',
  '입학남아','입학남자 합성','입학남자아이','입학모자','입학여어','입학여자아이',
  '잎','잎1','잎2','잎3','자','전구',
  '책','책2','책4','책펼친것 흰색','축','칠판','칠판2',
  '컴페니 4','컴페니1','컴페니2','컴페니3','큰구름','클립1','클립2','클립3',
  '토끼','툴립2','튤ㄹ힙','튤립1','튤립22','튤립3',
  '풍선 3','풍선2','풍선끈',
  '하','하느2','하얀꽃ㄹ','하트','학','학교','해 (2)','해','화분',
]
const STICKER_BASE = '/1brong/stickers'

// ── SVG 도형 ──────────────────────────────────────────────
const SHAPES = [
  { label: '사각형', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" rx="12" fill="#FF6B6B"/></svg>` },
  { label: '원', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#74B9FF"/></svg>` },
  { label: '다이아', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 95,50 50,95 5,50" fill="#FFD166"/></svg>` },
  { label: '오각별', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 63,35 95,35 71,57 80,90 50,70 20,90 29,57 5,35 37,35" fill="#A29BFE"/></svg>` },
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
  { label: '티셔츠', icon: '👕', w: 500, h: 600 },
]

// ── 사이드바 메뉴 ─────────────────────────────────────────
type PanelType = '텍스트' | '요소' | '배경' | '사진' | '캔버스'
const SIDEBAR_MENUS: { id: PanelType; icon: string; label: string }[] = [
  { id: '텍스트', icon: 'T', label: '텍스트' },
  { id: '요소', icon: '★', label: '요소' },
  { id: '배경', icon: '🎨', label: '배경' },
  { id: '사진', icon: '🖼', label: '사진' },
  { id: '캔버스', icon: '⊞', label: '캔버스' },
]

export default function Studio() {
  const canvasEl = useRef<HTMLCanvasElement>(null)
  const canvasRef = useRef<fabric.Canvas | null>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const bgFileRef = useRef<HTMLInputElement>(null)
  const photoFileRef = useRef<HTMLInputElement>(null)

  const [activePanel, setActivePanel] = useState<PanelType | null>('캔버스')
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

  // 커스텀 폰트
  const [customFonts, setCustomFonts] = useState<{label: string; value: string}[]>([])

  // 다운로드 드롭다운
  const [showDlMenu, setShowDlMenu] = useState(false)

  // 커스텀 캔버스 크기
  const [customW, setCustomW] = useState('')
  const [customH, setCustomH] = useState('')

  // 요소 탭
  const [elemTab, setElemTab] = useState<'ilbirong'|'shape'>('ilbirong')

  // 클립보드 (내부 복사/붙여넣기)
  const clipboardRef = useRef<fabric.FabricObject | null>(null)

  // 드래그&드롭
  const [dragOver, setDragOver] = useState(false)

  // 격자 / 가이드라인
  const [showGrid, setShowGrid] = useState(false)
  const showGridRef = useRef(false)
  const [showGuides, setShowGuides] = useState(false)
  const showGuidesRef = useRef(false)

  // 히스토리 (Undo/Redo)
  const historyRef = useRef<string[]>([])
  const historyIdxRef = useRef(-1)
  const isHistoryOp = useRef(false)   // undo/redo 중 saveHistory 차단용
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const saveHistory = useCallback(() => {
    if (isHistoryOp.current) return   // undo/redo 중 이벤트 무시
    const c = canvasRef.current; if (!c) return
    const json = JSON.stringify(c.toJSON())
    historyRef.current = historyRef.current.slice(0, historyIdxRef.current + 1)
    historyRef.current.push(json)
    historyIdxRef.current = historyRef.current.length - 1
    setCanUndo(historyIdxRef.current > 0)
    setCanRedo(false)
  }, [])

  const undo = useCallback(async () => {
    if (historyIdxRef.current <= 0) return
    const c = canvasRef.current; if (!c) return
    isHistoryOp.current = true
    historyIdxRef.current -= 1
    await c.loadFromJSON(JSON.parse(historyRef.current[historyIdxRef.current]))
    c.renderAll()
    isHistoryOp.current = false
    setCanUndo(historyIdxRef.current > 0)
    setCanRedo(true)
    setSelected(null)
  }, [])

  const redo = useCallback(async () => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return
    const c = canvasRef.current; if (!c) return
    isHistoryOp.current = true
    historyIdxRef.current += 1
    await c.loadFromJSON(JSON.parse(historyRef.current[historyIdxRef.current]))
    c.renderAll()
    isHistoryOp.current = false
    setCanUndo(true)
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1)
    setSelected(null)
  }, [])

  // ── 구글 폰트 + 온글잎 폰트 로드 ─────────────────────────
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&family=Nanum+Brush+Script&family=Noto+Sans+KR:wght@400;700&family=Noto+Serif+KR:wght@400;700&display=swap'
    document.head.appendChild(link)
    const style = document.createElement('style')
    style.textContent = OWNGLYPH_CSS
    document.head.appendChild(style)
    return () => { document.head.removeChild(link); document.head.removeChild(style) }
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

    canvas.on('selection:cleared', () => setSelected(null))
    canvas.on('object:modified', () => {
      const obj = canvas.getActiveObject()
      if (obj) syncSelected(obj)
      saveHistory()
    })
    canvas.on('object:added', () => saveHistory())
    canvas.on('object:removed', () => saveHistory())

    // ── 선택 이벤트 (다중 선택 포함) ─────────────────────
    canvas.on('selection:created', () => {
      const obj = canvas.getActiveObject()
      syncSelected(obj ?? null)
    })
    canvas.on('selection:updated', () => {
      const obj = canvas.getActiveObject()
      syncSelected(obj ?? null)
    })

    // ── 격자 / 가이드라인 렌더 ────────────────────────────
    canvas.on('after:render', () => {
      const ctx = canvas.getContext()
      const zoom = canvas.getZoom()
      const w = canvasPreset.w, h = canvasPreset.h
      if (showGridRef.current) {
        const gs = 50
        ctx.save()
        ctx.strokeStyle = 'rgba(160,160,160,0.35)'
        ctx.lineWidth = 1 / zoom
        for (let x = 0; x <= w; x += gs) {
          ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke()
        }
        for (let y = 0; y <= h; y += gs) {
          ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
        }
        ctx.restore()
      }
      if (showGuidesRef.current) {
        const cx = w / 2, cy = h / 2
        ctx.save()
        ctx.strokeStyle = 'rgba(255,107,157,0.55)'
        ctx.lineWidth = 1 / zoom
        ctx.setLineDash([6 / zoom, 4 / zoom])
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke()
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke()
        ctx.restore()
      }
    })

    // 초기 히스토리 저장
    historyRef.current = []
    historyIdxRef.current = -1
    saveHistory()

    // 키보드 Delete + Ctrl+Z/Y/C
    const onKey = (e: KeyboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (!isInput && (e.key === 'Delete' || e.key === 'Backspace')) {
        const obj = canvas.getActiveObject()
        if (obj) { canvas.remove(obj); canvas.renderAll(); setSelected(null) }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undo() }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo() }
      // 내부 복사
      if (!isInput && (e.ctrlKey || e.metaKey) && e.key === 'c') {
        const obj = canvas.getActiveObject()
        if (obj) obj.clone().then((cloned: fabric.FabricObject) => { clipboardRef.current = cloned })
      }
    }
    window.addEventListener('keydown', onKey)

    // 붙여넣기: 외부 이미지 or 내부 복사 오브젝트
    const onPaste = async (e: ClipboardEvent) => {
      const isInput = e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement
      if (isInput) return
      const items = Array.from(e.clipboardData?.items ?? [])
      const imageItem = items.find(item => item.type.startsWith('image/'))
      if (imageItem) {
        // 외부 클립보드 이미지 붙여넣기
        const blob = imageItem.getAsFile(); if (!blob) return
        const url = URL.createObjectURL(blob)
        const img = await fabric.FabricImage.fromURL(url)
        const maxW = canvasPreset.w * 0.5
        if ((img.width ?? 0) > maxW) img.scaleToWidth(maxW)
        img.set({ left: canvasPreset.w / 2, top: canvasPreset.h / 2, originX: 'center', originY: 'center' })
        canvas.add(img); canvas.setActiveObject(img); canvas.renderAll()
      } else if (clipboardRef.current) {
        // 내부 오브젝트 붙여넣기 (20px 오프셋)
        const cloned = await clipboardRef.current.clone()
        cloned.set({ left: (cloned.left ?? 0) + 20, top: (cloned.top ?? 0) + 20 })
        canvas.add(cloned); canvas.setActiveObject(cloned); canvas.renderAll()
        clipboardRef.current = await cloned.clone()  // 다음 붙여넣기 위해 갱신
      }
    }
    document.addEventListener('paste', onPaste)

    recalcScale()
    window.addEventListener('resize', recalcScale)

    return () => {
      canvas.dispose()
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('paste', onPaste)
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
    // loadSVGFromString으로 파싱 → Group으로 묶어 캔버스 중앙에 배치
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { objects } = await (fabric as any).loadSVGFromString(svgStr)
    const filtered = (objects as fabric.FabricObject[]).filter(Boolean)
    if (filtered.length === 0) return
    const group = new fabric.Group(filtered, {
      left: canvasPreset.w / 2,
      top: canvasPreset.h / 2,
      originX: 'center',
      originY: 'center',
    })
    group.scaleToWidth(140)
    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.renderAll()
  }

  // ── 일비롱 손그림 PNG 추가 ────────────────────────────────
  const addIlbirong = async (name: string) => {
    const canvas = canvasRef.current; if (!canvas) return
    const url = `${STICKER_BASE}/${encodeURIComponent(name)}.png`
    const img = await fabric.FabricImage.fromURL(url, { crossOrigin: 'anonymous' })
    img.scaleToWidth(160)
    img.set({ left: canvasPreset.w / 2, top: canvasPreset.h / 2, originX: 'center', originY: 'center' })
    canvas.add(img)
    canvas.setActiveObject(img)
    canvas.renderAll()
  }

  // ── 사진 추가 ─────────────────────────────────────────────
  const addPhoto = async (e: React.ChangeEvent<HTMLInputElement>, circleMode = false) => {
    const file = e.target.files?.[0]; if (!file) return
    const url = URL.createObjectURL(file)
    const canvas = canvasRef.current; if (!canvas) return

    if (circleMode) {
      // HTMLImageElement로 직접 로드 → Pattern fill로 Circle 생성
      // → bounding box = 원 크기 (clipPath 방식의 bounding box 오버플로 문제 해결)
      const imgEl = new Image()
      await new Promise<void>((resolve) => { imgEl.onload = () => resolve(); imgEl.src = url })

      const targetSize = Math.min(canvasPreset.w, canvasPreset.h) * 0.42
      const r = targetSize / 2
      const nw = imgEl.naturalWidth || 1
      const nh = imgEl.naturalHeight || 1

      // cover 스케일: 짧은 변이 targetSize를 채우도록
      const scale = Math.max(targetSize / nw, targetSize / nh)
      const sw = nw * scale
      const sh = nh * scale
      const ox = -(sw - targetSize) / 2
      const oy = -(sh - targetSize) / 2

      const pattern = new fabric.Pattern({
        source: imgEl,
        repeat: 'no-repeat',
        patternTransform: [scale, 0, 0, scale, ox, oy] as never,
      })

      const circ = new fabric.Circle({
        radius: r,
        fill: pattern as never,
        left: canvasPreset.w / 2,
        top: canvasPreset.h / 2,
        originX: 'center',
        originY: 'center',
      })
      canvas.add(circ)
      canvas.setActiveObject(circ)
      canvas.renderAll()
      e.target.value = ''
      return
    }

    // 일반 사각형 사진
    const img = await fabric.FabricImage.fromURL(url)
    const maxW = canvasPreset.w * 0.5
    if ((img.width ?? 0) > maxW) img.scaleToWidth(maxW)
    img.set({ left: canvasPreset.w / 2, top: canvasPreset.h / 2, originX: 'center', originY: 'center' })
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
    // 캔버스 전체를 cover로 채우기 (비율 유지, 잘림 최소화)
    const scaleX = canvasPreset.w / (img.width ?? 1)
    const scaleY = canvasPreset.h / (img.height ?? 1)
    const scale = Math.max(scaleX, scaleY)
    const sw = (img.width ?? 1) * scale
    const sh = (img.height ?? 1) * scale
    img.set({
      scaleX: scale,
      scaleY: scale,
      left: (canvasPreset.w - sw) / 2,
      top: (canvasPreset.h - sh) / 2,
      originX: 'left',
      originY: 'top',
    })
    c.backgroundImage = img
    c.renderAll()
    e.target.value = ''
  }

  // ── 배경 제거 ─────────────────────────────────────────────
  const [removingBg, setRemovingBg] = useState(false)
  const removeBg = async () => {
    const c = canvasRef.current; if (!c) return
    const obj = c.getActiveObject()
    if (!obj || obj.type !== 'image') return
    const fabricImg = obj as fabric.FabricImage
    const imgEl = fabricImg.getElement() as HTMLImageElement
    try {
      setRemovingBg(true)
      const res = await fetch(imgEl.src)
      const blob = await res.blob()
      const resultBlob = await removeBackground(blob)
      const url = URL.createObjectURL(resultBlob)
      const newImg = await fabric.FabricImage.fromURL(url)
      newImg.set({
        left: fabricImg.left, top: fabricImg.top,
        scaleX: fabricImg.scaleX, scaleY: fabricImg.scaleY,
        angle: fabricImg.angle,
        originX: fabricImg.originX, originY: fabricImg.originY,
      })
      c.remove(fabricImg)
      c.add(newImg)
      c.setActiveObject(newImg)
      c.renderAll()
      setSelected(newImg)
    } catch (err) {
      console.error('배경 제거 실패', err)
      alert('배경 제거에 실패했습니다.')
    } finally {
      setRemovingBg(false)
    }
  }

  // ── 드래그&드롭 이미지 추가 ───────────────────────────────
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
    if (!file) return
    const canvas = canvasRef.current; if (!canvas) return
    const url = URL.createObjectURL(file)
    const img = await fabric.FabricImage.fromURL(url)
    const maxW = canvasPreset.w * 0.5
    if ((img.width ?? 0) > maxW) img.scaleToWidth(maxW)
    img.set({ left: canvasPreset.w / 2, top: canvasPreset.h / 2, originX: 'center', originY: 'center' })
    canvas.add(img); canvas.setActiveObject(img); canvas.renderAll()
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

  // ── 폰트 업로드 ──────────────────────────────────────────
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const fontName = file.name.replace(/\.[^.]+$/, '')
    const url = URL.createObjectURL(file)
    const font = new FontFace(fontName, `url(${url})`)
    await font.load()
    document.fonts.add(font)
    setCustomFonts(prev => [...prev, { label: fontName, value: fontName }])
    e.target.value = ''
  }

  // ── 다운로드 (형식별) ────────────────────────────────────
  const getDataUrl = (format: 'png' | 'jpeg') => {
    const c = canvasRef.current!
    c.discardActiveObject(); c.renderAll()
    return c.toDataURL({ format, multiplier: 2, ...(format === 'jpeg' ? { quality: 0.95 } : {}) })
  }
  const downloadAs = (ext: string, dataUrl: string) => {
    const a = document.createElement('a')
    a.href = dataUrl; a.download = `1brong-${Date.now()}.${ext}`; a.click()
  }
  const savePNG = () => { downloadAs('png', getDataUrl('png')); setShowDlMenu(false) }
  const saveJPEG = () => { downloadAs('jpg', getDataUrl('jpeg')); setShowDlMenu(false) }
  const savePDF = () => {
    const c = canvasRef.current; if (!c) return
    const dataUrl = getDataUrl('png')
    const w = canvasPreset.w, h = canvasPreset.h
    const pdf = new jsPDF({ orientation: w >= h ? 'landscape' : 'portrait', unit: 'px', format: [w, h] })
    pdf.addImage(dataUrl, 'PNG', 0, 0, w, h)
    pdf.save(`1brong-${Date.now()}.pdf`)
    setShowDlMenu(false)
  }
  const savePPT = async () => {
    const dataUrl = getDataUrl('png')
    const w = canvasPreset.w, h = canvasPreset.h
    const slideW = 10, slideH = (h / w) * 10
    const prs = new pptxgen()
    prs.defineLayout({ name: 'CUSTOM', width: slideW, height: slideH })
    prs.layout = 'CUSTOM'
    const slide = prs.addSlide()
    slide.addImage({ data: dataUrl, x: 0, y: 0, w: slideW, h: slideH })
    await prs.writeFile({ fileName: `1brong-${Date.now()}.pptx` })
    setShowDlMenu(false)
  }
  // 기존 download 함수 (인쇄용)
  const download = savePNG

  // ── 프린트 ───────────────────────────────────────────────
  const print = () => {
    const c = canvasRef.current; if (!c) return
    c.discardActiveObject(); c.renderAll()
    const url = c.toDataURL({ format: 'png', multiplier: 2 })
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`<!DOCTYPE html><html><head><title>1B롱 인쇄</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: white; }
      img { max-width: 100%; max-height: 100vh; object-fit: contain; }
      @media print { body { min-height: unset; } img { width: 100%; } }
    </style></head><body><img src="${url}" onload="window.print(); window.close();" /></body></html>`)
    w.document.close()
  }

  // ── 격자 / 가이드라인 토글 ─────────────────────────────────
  const toggleGrid = () => {
    const next = !showGrid
    showGridRef.current = next
    setShowGrid(next)
    canvasRef.current?.renderAll()
  }
  const toggleGuides = () => {
    const next = !showGuides
    showGuidesRef.current = next
    setShowGuides(next)
    canvasRef.current?.renderAll()
  }

  // ── 패널 토글 ─────────────────────────────────────────────
  const togglePanel = (id: PanelType) => {
    setActivePanel(p => p === id ? null : id)
  }

  const isText = selected?.type === 'textbox'

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#FFF8F0', fontFamily: 'Noto Sans KR, sans-serif' }}>
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
          {/* Undo / Redo */}
          <button onClick={undo} disabled={!canUndo} title="실행 취소 (Ctrl+Z)"
            className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-white/30 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7v6h6"/><path d="M3 13C5.5 6.5 15 4 21 10"/></svg>
            되돌리기
          </button>
          <button onClick={redo} disabled={!canRedo} title="다시 실행 (Ctrl+Y)"
            className="bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-white/30 transition disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 7v6h-6"/><path d="M21 13C18.5 6.5 9 4 3 10"/></svg>
            다시실행
          </button>
          <div className="w-px h-5 bg-white/30" />
          <button onClick={print}
            className="bg-white/20 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-white/30 transition flex items-center gap-1.5">
            🖨 인쇄
          </button>
          <div className="relative">
            <button onClick={() => setShowDlMenu(v => !v)}
              className="bg-white/20 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-white/30 transition flex items-center gap-1.5">
              ⬇ 저장
            </button>
            {showDlMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 w-36"
                onMouseLeave={() => setShowDlMenu(false)}>
                {[
                  { label: '🖼 PNG', action: savePNG },
                  { label: '📷 JPEG', action: saveJPEG },
                  { label: '📄 PDF', action: savePDF },
                  { label: '📊 PPT', action: savePPT },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-500 transition">
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
          <aside className="w-64 bg-white border-r border-gray-100 flex flex-col overflow-hidden shrink-0"
            style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.04)' }}>

            {/* 선택된 텍스트 편집 패널 (최상단) */}
            {isText && (
              <div className="p-4 border-b-2 border-pink-100 shrink-0" style={{ background: '#FFF0F8' }}>
                <p className="text-xs font-bold text-pink-500 mb-3 uppercase tracking-wide">텍스트 편집</p>
                {/* 폰트 */}
                <label className="text-xs text-gray-500 block mb-1">폰트</label>
                <select value={selFont}
                  onChange={e => { setSelFont(e.target.value); updateText({ fontFamily: e.target.value }) }}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs mb-2 focus:outline-none focus:ring-2 focus:ring-pink-300">
                  {[...FONTS, ...customFonts].map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
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
                  <button onClick={deleteSelected} className="flex-1 border border-red-200 text-red-400 text-xs py-1.5 rounded-lg hover:bg-red-50 transition font-medium">🗑 삭제</button>
                </div>
              </div>
            )}

            {/* ── 텍스트 패널 ── */}
            {activePanel === '텍스트' && (
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">텍스트 추가</p>
                <div className="space-y-2 mb-5">
                  {TEXT_PRESETS.map(p => (
                    <button key={p.label} onClick={() => addText(p.sample, p.size, p.weight, p.color)}
                      className="w-full text-left px-4 py-3 rounded-xl border border-gray-100 hover:border-pink-200 hover:bg-pink-50 transition group">
                      <span className="block font-medium text-xs text-gray-400 mb-0.5 group-hover:text-pink-400">{p.label}</span>
                      <span style={{ fontFamily: FONTS[0].value, fontSize: Math.max(Math.min(p.size * 0.38, 30), 18), color: p.color, fontWeight: p.weight }}>
                        {p.sample}
                      </span>
                    </button>
                  ))}
                </div>
                {/* 폰트 업로드 */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">폰트 업로드</p>
                  <label className="w-full border-2 border-dashed border-purple-200 rounded-xl py-3 text-purple-400 text-xs text-center cursor-pointer hover:bg-purple-50 transition flex flex-col items-center gap-1">
                    <span className="text-lg">🔤</span>
                    <span className="font-medium">폰트 파일 추가</span>
                    <span className="text-gray-400" style={{ fontSize: 10 }}>.ttf / .otf / .woff / .woff2</span>
                    <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />
                  </label>
                  {customFonts.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {customFonts.map(f => (
                        <div key={f.value} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-purple-50 text-xs">
                          <span style={{ fontFamily: f.value }} className="text-gray-700 truncate">{f.label}</span>
                          <span className="text-purple-400 ml-1 shrink-0">추가됨</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 요소 패널 ── */}
            {activePanel === '요소' && (
              <div className="flex flex-col h-full">
                {/* 탭 */}
                <div className="flex gap-1 p-3 pb-0 shrink-0">
                  {([['ilbirong', '일비롱 손그림'], ['shape', '도형']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setElemTab(key)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold transition"
                      style={elemTab === key
                        ? { background: 'linear-gradient(135deg,#FF6B9D,#C77DFF)', color: 'white' }
                        : { background: '#f3f4f6', color: '#888' }}>
                      {label}
                    </button>
                  ))}
                </div>
                {/* 콘텐츠 (스크롤) */}
                <div className="flex-1 overflow-y-auto p-3">
                  {elemTab === 'ilbirong' && (
                    <div className="grid grid-cols-3 gap-2">
                      {ILBIRONG_STICKERS.map(name => (
                        <button key={name} onClick={() => addIlbirong(name)}
                          className="aspect-square rounded-xl border border-gray-100 hover:border-pink-300 hover:shadow-sm transition flex flex-col items-center justify-center gap-1 p-1.5 bg-gray-50 hover:bg-pink-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={`${STICKER_BASE}/${encodeURIComponent(name)}.png`} alt={name}
                            className="w-9 h-9 object-contain" loading="lazy" />
                          <span className="text-gray-400 leading-tight text-center w-full truncate px-0.5" style={{ fontSize: 9 }}>{name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {elemTab === 'shape' && (
                    <div className="grid grid-cols-4 gap-2">
                      {SHAPES.map(s => (
                        <button key={s.label} onClick={() => addSticker(s.svg)}
                          className="aspect-square rounded-xl border border-gray-100 hover:border-purple-300 hover:shadow-sm transition flex flex-col items-center justify-center gap-1 p-2 bg-gray-50 hover:bg-purple-50">
                          <div className="w-8 h-8 flex items-center justify-center"
                            dangerouslySetInnerHTML={{ __html: s.svg }} />
                          <span className="text-gray-400" style={{ fontSize: 9 }}>{s.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {/* 선택 시 레이어/삭제 */}
                {selected && !isText && (
                  <div className="shrink-0 px-3 pb-3 pt-2 border-t border-gray-100">
                    <div className="flex gap-1.5">
                      <button onClick={sendBwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">↓ 뒤로</button>
                      <button onClick={bringFwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">↑ 앞으로</button>
                      <button onClick={deleteSelected} className="flex-1 border border-red-200 text-red-400 text-xs py-1.5 rounded-lg hover:bg-red-50 font-medium">🗑 삭제</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 배경 패널 ── */}
            {activePanel === '배경' && (
              <div className="p-4 overflow-y-auto flex-1">
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
              <div className="p-4 overflow-y-auto flex-1">
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
                    <span className="text-gray-400" style={{ fontSize: 10 }}>원형 프레임 스타일</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => addPhoto(e, true)} />
                  </label>
                </div>
                {selected && selected.type === 'image' && (
                  <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                    <button onClick={removeBg} disabled={removingBg}
                      className="w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ background: removingBg ? '#eee' : 'linear-gradient(135deg,#FF6B9D,#C77DFF)', color: removingBg ? '#999' : 'white' }}>
                      {removingBg ? (
                        <><span className="animate-spin">⏳</span> 배경 제거 중...</>
                      ) : (
                        <><span>✂️</span> 배경 제거 (AI)</>
                      )}
                    </button>
                    <div className="flex gap-1.5">
                      <button onClick={sendBwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">↓ 뒤로</button>
                      <button onClick={bringFwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">↑ 앞으로</button>
                      <button onClick={deleteSelected} className="flex-1 border border-red-200 text-red-400 text-xs py-1.5 rounded-lg hover:bg-red-50 font-medium">🗑 삭제</button>
                    </div>
                  </div>
                )}
                {selected && selected.type !== 'image' && !isText && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-1.5">
                      <button onClick={sendBwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">↓ 뒤로</button>
                      <button onClick={bringFwd} className="flex-1 border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">↑ 앞으로</button>
                      <button onClick={deleteSelected} className="flex-1 border border-red-200 text-red-400 text-xs py-1.5 rounded-lg hover:bg-red-50 font-medium">🗑 삭제</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── 캔버스 패널 ── */}
            {activePanel === '캔버스' && (
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wide">캔버스 크기 선택</p>
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
                {/* 직접 입력 */}
                <div className="border-t border-gray-100 mt-4 pt-4">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">직접 입력 (px)</p>
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="가로" min={100} max={4000} value={customW}
                      onChange={e => setCustomW(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-pink-300" />
                    <span className="text-gray-400 text-xs">×</span>
                    <input type="number" placeholder="세로" min={100} max={4000} value={customH}
                      onChange={e => setCustomH(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-pink-300" />
                  </div>
                  <button
                    onClick={() => {
                      const w = Math.max(100, Math.min(4000, parseInt(customW) || 600))
                      const h = Math.max(100, Math.min(4000, parseInt(customH) || 600))
                      setCanvasPreset({ label: `${w}×${h}`, icon: '📐', w, h })
                    }}
                    className="w-full mt-2 py-2 rounded-lg text-xs font-bold text-white transition"
                    style={{ background: 'linear-gradient(135deg,#FF6B9D,#C77DFF)' }}>
                    적용
                  </button>
                </div>
              </div>
            )}
          </aside>
        )}

        {/* ══ 캔버스 영역 ══════════════════════════════════ */}
        <main className="flex-1 flex items-center justify-center overflow-auto p-6 relative"
          ref={wrapRef}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false) }}
          onDrop={handleDrop}
          style={{ background: dragOver
            ? 'radial-gradient(circle at center, #FFD6EF 0%, #EDD6FF 100%)'
            : 'radial-gradient(circle at center, #F5EEF8 0%, #FFF0F8 100%)' }}>
          {/* 드래그 오버레이 */}
          {dragOver && (
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="bg-white/80 rounded-2xl px-8 py-6 text-center shadow-xl border-2 border-dashed border-pink-400">
                <div className="text-4xl mb-2">🖼</div>
                <p className="font-bold text-pink-500 text-sm">여기에 놓으면 캔버스에 추가됩니다</p>
              </div>
            </div>
          )}
          {/* 도움말 */}
          <div className="absolute top-4 right-4 text-xs text-gray-400 bg-white rounded-xl px-3 py-1.5 shadow-sm">
            더블클릭: 텍스트 편집 · Del: 삭제 · Shift+클릭: 다중 선택
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
        className="px-4 py-1.5 flex items-center justify-between gap-3 flex-wrap shrink-0">
        {/* 좌: 캔버스 정보 */}
        <span className="text-xs text-gray-400">
          {canvasPreset.label} · {canvasPreset.w}×{canvasPreset.h}px
        </span>
        {/* 중: 격자 + 가이드 */}
        <div className="flex items-center gap-1.5">
          <button onClick={toggleGrid}
            className="px-2 h-7 rounded-lg text-xs font-medium border transition"
            style={showGrid ? { background:'linear-gradient(135deg,#FF6B9D,#C77DFF)', color:'white', borderColor:'transparent' } : { borderColor:'#e5e7eb', color:'#888' }}>
            격자
          </button>
          <button onClick={toggleGuides}
            className="px-2 h-7 rounded-lg text-xs font-medium border transition"
            style={showGuides ? { background:'linear-gradient(135deg,#FF6B9D,#C77DFF)', color:'white', borderColor:'transparent' } : { borderColor:'#e5e7eb', color:'#888' }}>
            가이드
          </button>
        </div>
        {/* 우: 저작권 */}
        <span className="text-xs text-gray-400 text-center">
          © 2026 일비롱디자인 · All rights reserved.
          <span className="mx-2 text-gray-300">|</span>
          앱 제작 ·{' '}
          <span className="font-semibold" style={{ color: '#C77DFF' }}>꿈식판 꿈식맨</span>
        </span>
      </footer>
    </div>
  )
}
