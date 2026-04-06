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
  // 기본 도형
  { label: '사각형', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" fill="{{COLOR}}"/></svg>` },
  { label: '둥근사각', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="5" y="5" width="90" height="90" rx="16" fill="{{COLOR}}"/></svg>` },
  { label: '원', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="{{COLOR}}"/></svg>` },
  { label: '삼각형', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 95,95 5,95" fill="{{COLOR}}"/></svg>` },
  { label: '다이아', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 95,50 50,95 5,50" fill="{{COLOR}}"/></svg>` },
  { label: '오각형', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 97,36 79,91 21,91 3,36" fill="{{COLOR}}"/></svg>` },
  { label: '육각형', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,3 93,27 93,73 50,97 7,73 7,27" fill="{{COLOR}}"/></svg>` },
  // 별
  { label: '오각별', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 63,35 95,35 71,57 80,90 50,70 20,90 29,57 5,35 37,35" fill="{{COLOR}}"/></svg>` },
  { label: '육각별', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><polygon points="50,5 62,30 90,15 75,42 100,50 75,58 90,85 62,70 50,95 38,70 10,85 25,58 0,50 25,42 10,15 38,30" fill="{{COLOR}}"/></svg>` },
  // 화살표
  { label: '→', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><polygon points="0,20 60,20 60,0 100,35 60,70 60,50 0,50" fill="{{COLOR}}"/></svg>` },
  { label: '←', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><polygon points="100,20 40,20 40,0 0,35 40,70 40,50 100,50" fill="{{COLOR}}"/></svg>` },
  { label: '↑', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100"><polygon points="20,100 20,40 0,40 35,0 70,40 50,40 50,100" fill="{{COLOR}}"/></svg>` },
  { label: '↓', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 100"><polygon points="20,0 20,60 0,60 35,100 70,60 50,60 50,0" fill="{{COLOR}}"/></svg>` },
  // 특수
  { label: '하트', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M50 88 C25 65 2 45 2 28 2 14 12 2 26 2 36 2 46 10 50 18 54 10 64 2 74 2 88 2 98 14 98 28 98 45 75 65 50 88Z" fill="{{COLOR}}"/></svg>` },
  { label: '십자', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M35,0 H65 V35 H100 V65 H65 V100 H35 V65 H0 V35 H35Z" fill="{{COLOR}}"/></svg>` },
  { label: '말풍선', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 90"><rect x="0" y="0" width="100" height="70" rx="14" fill="{{COLOR}}"/><polygon points="20,70 35,90 45,70" fill="{{COLOR}}"/></svg>` },
]
const SHAPE_DEFAULT_COLOR = '#FF6B6B'

// ── 표 테마 (귀여운 스타일) ────────────────────────────────
const TABLE_THEMES = [
  { id: 'cherry', label: '🌸 벚꽃', headerBg: '#FFB3C6', cellBg: '#FFF5F8', cellBgAlt: '#FFF0F5', border: '#F9C5D1', text: '#8B4060', radius: 10 },
  { id: 'mint', label: '🌿 새싹', headerBg: '#A8E6CF', cellBg: '#F5FFF8', cellBgAlt: '#EEFFF4', border: '#B0DDCA', text: '#2D6A4F', radius: 10 },
  { id: 'lavender', label: '💜 라벤더', headerBg: '#D4B3E8', cellBg: '#FAF5FF', cellBgAlt: '#F3ECFF', border: '#D0BFE0', text: '#5A3075', radius: 10 },
  { id: 'sky', label: '☁️ 하늘', headerBg: '#A8D4E6', cellBg: '#F5FAFF', cellBgAlt: '#ECF5FF', border: '#B0D0E0', text: '#2D5A75', radius: 10 },
  { id: 'sun', label: '🌻 해바라기', headerBg: '#FFE4A0', cellBg: '#FFFDF5', cellBgAlt: '#FFF8E8', border: '#F0D890', text: '#6B5A20', radius: 10 },
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

// ── 프레임 (clipPath 모양) ─────────────────────────────────
const FRAMES = [
  { label: '원형', icon: '⭕', makePath: (s: number) => new fabric.Circle({ radius: s / 2, left: 0, top: 0, originX: 'center', originY: 'center' }) },
  { label: '둥근 사각', icon: '⬜', makePath: (s: number) => new fabric.Rect({ width: s, height: s, rx: s * 0.15, ry: s * 0.15, left: 0, top: 0, originX: 'center', originY: 'center' }) },
  { label: '하트', icon: '💗', makeSvg: () => `<svg viewBox="0 0 100 100"><path d="M50 88 C25 65 2 45 2 28 2 14 12 2 26 2 36 2 46 10 50 18 54 10 64 2 74 2 88 2 98 14 98 28 98 45 75 65 50 88Z"/></svg>` },
  { label: '별', icon: '⭐', makeSvg: () => `<svg viewBox="0 0 100 100"><polygon points="50,2 63,35 98,35 70,57 80,92 50,72 20,92 30,57 2,35 37,35"/></svg>` },
  { label: '다이아', icon: '💎', makePath: (s: number) => new fabric.Polygon([{ x: s/2, y: 0 }, { x: s, y: s/2 }, { x: s/2, y: s }, { x: 0, y: s/2 }], { left: 0, top: 0, originX: 'center', originY: 'center' }) },
  { label: '꽃', icon: '🌸', makeSvg: () => `<svg viewBox="0 0 100 100"><ellipse cx="50" cy="22" rx="14" ry="22"/><ellipse cx="50" cy="22" rx="14" ry="22" transform="rotate(72,50,50)"/><ellipse cx="50" cy="22" rx="14" ry="22" transform="rotate(144,50,50)"/><ellipse cx="50" cy="22" rx="14" ry="22" transform="rotate(216,50,50)"/><ellipse cx="50" cy="22" rx="14" ry="22" transform="rotate(288,50,50)"/><circle cx="50" cy="50" r="18"/></svg>` },
  { label: '육각형', icon: '⬡', makePath: (s: number) => new fabric.Polygon(Array.from({length:6},(_,i)=>({x:s/2+s/2*Math.cos(Math.PI/3*i-Math.PI/6),y:s/2+s/2*Math.sin(Math.PI/3*i-Math.PI/6)})), { left: 0, top: 0, originX: 'center', originY: 'center' }) },
  { label: '물방울', icon: '💧', makeSvg: () => `<svg viewBox="0 0 100 120"><path d="M50 5 C50 5 10 55 10 75 10 97 28 115 50 115 72 115 90 97 90 75 90 55 50 5 50 5Z"/></svg>` },
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
type PanelType = '텍스트' | '요소' | '프레임' | '배경' | '사진' | '캔버스'
const SIDEBAR_MENUS: { id: PanelType; icon: string; label: string }[] = [
  { id: '텍스트', icon: 'T', label: '텍스트' },
  { id: '요소', icon: '★', label: '요소' },
  { id: '프레임', icon: '🖼', label: '프레임' },
  { id: '배경', icon: '🎨', label: '배경' },
  { id: '사진', icon: '📷', label: '사진' },
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
  const [elemTab, setElemTab] = useState<'ilbirong'|'shape'|'table'>('ilbirong')
  const [shapeColor, setShapeColor] = useState('#FF6B6B')
  const [imgBrightness, setImgBrightness] = useState(0)
  const [imgContrast, setImgContrast] = useState(0)
  const [imgSaturation, setImgSaturation] = useState(0)
  const [imgHue, setImgHue] = useState(0)

  // 표 설정
  const [tableThemeIdx, setTableThemeIdx] = useState(0)
  const [tblRows, setTblRows] = useState('3')
  const [tblCols, setTblCols] = useState('3')


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
      backgroundColor: '#FFFFFF',
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
        if (obj) {
          if (obj.type === 'activeselection') {
            (obj as fabric.ActiveSelection).forEachObject(o => canvas.remove(o))
            canvas.discardActiveObject()
          } else { canvas.remove(obj) }
          canvas.renderAll(); setSelected(null)
        }
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

  // ── 표 생성 (Group — 이동/크기조절 한 번에) ────────────────
  const createTable = (rows: number, cols: number, themeIdx: number, existingTexts?: string[][], pos?: {left:number;top:number}) => {
    const canvas = canvasRef.current; if (!canvas) return
    const theme = TABLE_THEMES[themeIdx] ?? TABLE_THEMES[0]
    const cellW = 90, cellH = 38
    const objs: fabric.FabricObject[] = []
    // 셀 배경
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isHeader = r === 0
        objs.push(new fabric.Rect({
          left: c * cellW, top: r * cellH, width: cellW, height: cellH,
          fill: isHeader ? theme.headerBg : (r % 2 === 0 ? theme.cellBgAlt : theme.cellBg),
          stroke: theme.border, strokeWidth: 0.8,
        }))
      }
    }
    // 셀 텍스트
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const txt = existingTexts?.[r]?.[c] ?? ''
        objs.push(new fabric.Textbox(txt, {
          left: c * cellW + 3, top: r * cellH + 2,
          width: cellW - 6, fontSize: 13,
          fontFamily: FONTS[0].value,
          fontWeight: r === 0 ? 'bold' : 'normal',
          textAlign: 'center', fill: theme.text,
          splitByGrapheme: true,
        }))
      }
    }
    const group = new fabric.Group(objs, {
      left: pos?.left ?? canvasPreset.w / 2, top: pos?.top ?? canvasPreset.h / 2,
      originX: 'center', originY: 'center',
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = group as any; g._tRows = rows; g._tCols = cols; g._tTheme = themeIdx
    canvas.add(group); canvas.setActiveObject(group); canvas.renderAll()
  }

  // ── 표 셀 텍스트 업데이트 (패널 입력 → Group 내부 Textbox 반영) ──
  const updateTableCell = (r: number, c: number, text: string) => {
    const canvas = canvasRef.current; if (!canvas || !selected) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = selected as any; if (!g._tRows) return
    const cols = g._tCols as number
    const textboxes = (selected as fabric.Group).getObjects().filter(o => o.type === 'textbox') as fabric.Textbox[]
    const target = textboxes[r * cols + c]
    if (target) { target.set({ text }); canvas.renderAll() }
  }

  // ── 표 텍스트 읽기 ─────────────────────────────────────────
  const getTableTexts = (): string[][] => {
    if (!selected) return []
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = selected as any; if (!g._tRows) return []
    const rows = g._tRows as number, cols = g._tCols as number
    const textboxes = (selected as fabric.Group).getObjects().filter(o => o.type === 'textbox') as fabric.Textbox[]
    const texts: string[][] = []
    for (let r = 0; r < rows; r++) { texts[r] = []; for (let c = 0; c < cols; c++) texts[r][c] = textboxes[r * cols + c]?.text ?? '' }
    return texts
  }

  // ── 표 행/열 추가·삭제 ──────────────────────────────────────
  const modifyTable = (dRow: number, dCol: number) => {
    const c = canvasRef.current; if (!c || !selected) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = selected as any; if (!g._tRows) return
    const oldR = g._tRows as number, oldC = g._tCols as number, themeIdx = g._tTheme as number
    const newR = Math.max(1, oldR + dRow), newC = Math.max(1, oldC + dCol)
    const texts = getTableTexts()
    const pos = { left: selected.left ?? canvasPreset.w / 2, top: selected.top ?? canvasPreset.h / 2 }
    c.remove(selected); setSelected(null)
    createTable(newR, newC, themeIdx, texts, pos)
  }

  // 선택된 표 감지
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const selectedTableMeta = selected && (selected as any)._tRows
    ? { rows: (selected as any)._tRows as number, cols: (selected as any)._tCols as number, theme: (selected as any)._tTheme as number }
    : null

  // ── 스티커(SVG) 추가 ──────────────────────────────────────
  const addSticker = async (svgStr: string, color?: string) => {
    const canvas = canvasRef.current; if (!canvas) return
    const finalSvg = svgStr.replace(/\{\{COLOR\}\}/g, color || SHAPE_DEFAULT_COLOR)
    // loadSVGFromString으로 파싱 → Group으로 묶어 캔버스 중앙에 배치
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { objects } = await (fabric as any).loadSVGFromString(finalSvg)
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

  // ── 프레임 추가 (clipPath로 사진 클리핑) ───────────────────
  const frameFileRef = useRef<HTMLInputElement>(null)
  const pendingFrameRef = useRef<typeof FRAMES[0] | null>(null)

  const onFrameSelect = (frame: typeof FRAMES[0]) => {
    pendingFrameRef.current = frame
    frameFileRef.current?.click()
  }

  const onFramePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const frame = pendingFrameRef.current; if (!frame) return
    const canvas = canvasRef.current; if (!canvas) return
    const url = URL.createObjectURL(file)
    const img = await fabric.FabricImage.fromURL(url)
    const size = Math.min(canvasPreset.w, canvasPreset.h) * 0.45

    // clipPath 생성
    let clip: fabric.FabricObject
    if (frame.makePath) {
      clip = frame.makePath(size)
    } else if (frame.makeSvg) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { objects } = await (fabric as any).loadSVGFromString(frame.makeSvg())
      const filtered = (objects as fabric.FabricObject[]).filter(Boolean)
      const group = new fabric.Group(filtered)
      group.scaleToWidth(size)
      clip = group
      clip.set({ originX: 'center', originY: 'center', left: 0, top: 0 })
    } else return

    // 이미지를 프레임 크기에 맞게 cover 스케일
    const imgW = img.width ?? 1, imgH = img.height ?? 1
    const sc = Math.max(size / imgW, size / imgH)
    img.set({
      scaleX: sc, scaleY: sc,
      left: canvasPreset.w / 2, top: canvasPreset.h / 2,
      originX: 'center', originY: 'center',
      clipPath: clip,
    })
    canvas.add(img); canvas.setActiveObject(img); canvas.renderAll()
    e.target.value = ''
    pendingFrameRef.current = null
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

  // ── 삭제 (다중 선택 포함) ──────────────────────────────────
  const deleteSelected = () => {
    const c = canvasRef.current; if (!c) return
    const obj = c.getActiveObject(); if (!obj) return
    if (obj.type === 'activeselection') {
      (obj as fabric.ActiveSelection).forEachObject(o => c.remove(o))
      c.discardActiveObject()
    } else {
      c.remove(obj)
    }
    c.renderAll(); setSelected(null)
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

  // ── 이미지 필터 (밝기/대비/채도/색조) ──────────────────────
  const applyImageFilters = (brightness: number, contrast: number, saturation: number, hue: number) => {
    const c = canvasRef.current; if (!c || !selected || selected.type !== 'image') return
    const img = selected as fabric.FabricImage
    img.filters = [
      new fabric.filters.Brightness({ brightness }),
      new fabric.filters.Contrast({ contrast }),
      new fabric.filters.Saturation({ saturation }),
      new fabric.filters.HueRotation({ rotation: hue }),
    ]
    img.applyFilters()
    c.renderAll()
  }

  // ── 정렬 (캔버스 기준) ───────────────────────────────────
  const alignObj = (pos: string) => {
    const c = canvasRef.current; const o = c?.getActiveObject(); if (!c || !o) return
    const w = canvasPreset.w, h = canvasPreset.h
    const ow = (o.width ?? 0) * (o.scaleX ?? 1), oh = (o.height ?? 0) * (o.scaleY ?? 1)
    if (pos === 'left') o.set({ left: ow / 2, originX: 'center' })
    if (pos === 'centerH') o.set({ left: w / 2, originX: 'center' })
    if (pos === 'right') o.set({ left: w - ow / 2, originX: 'center' })
    if (pos === 'top') o.set({ top: oh / 2, originY: 'center' })
    if (pos === 'centerV') o.set({ top: h / 2, originY: 'center' })
    if (pos === 'bottom') o.set({ top: h - oh / 2, originY: 'center' })
    o.setCoords(); c.renderAll(); saveHistory()
  }

  // ── 레이어 (맨앞/맨뒤) ─────────────────────────────────
  const bringToFront = () => { const c = canvasRef.current; const o = c?.getActiveObject(); if (c && o) { c.bringObjectToFront(o); c.renderAll() } }
  const sendToBack = () => { const c = canvasRef.current; const o = c?.getActiveObject(); if (c && o) { c.sendObjectToBack(o); c.renderAll() } }

  // ── 선택된 도형 색상 변경 ────────────────────────────────
  const changeSelectedColor = (color: string) => {
    const c = canvasRef.current; if (!c || !selected) return
    if (selected.type === 'group') {
      (selected as fabric.Group).getObjects().forEach(o => o.set({ fill: color }))
    } else {
      selected.set({ fill: color })
    }
    c.renderAll()
  }

  const isText = selected?.type === 'textbox'
  const isImage = selected?.type === 'image'

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

            {/* 선택된 오브젝트 편집 패널 (최상단 — 도형+이미지 공용) */}
            {selected && !isText && (
              <div className="p-4 border-b-2 border-purple-100 shrink-0 overflow-y-auto" style={{ background: '#F5F0FF', maxHeight: '50vh' }}>
                <p className="text-xs font-bold text-purple-500 mb-3 uppercase tracking-wide">
                  {selected.type === 'image' ? '이미지 편집' : '도형 편집'}
                </p>
                {/* 정렬 */}
                <label className="text-xs text-gray-500 block mb-1">정렬</label>
                <div className="grid grid-cols-6 gap-1 mb-3">
                  <button onClick={() => alignObj('left')} title="왼쪽 정렬" className="border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">◁</button>
                  <button onClick={() => alignObj('centerH')} title="가로 가운데" className="border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">⫼</button>
                  <button onClick={() => alignObj('right')} title="오른쪽 정렬" className="border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">▷</button>
                  <button onClick={() => alignObj('top')} title="위쪽 정렬" className="border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">△</button>
                  <button onClick={() => alignObj('centerV')} title="세로 가운데" className="border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">⊞</button>
                  <button onClick={() => alignObj('bottom')} title="아래쪽 정렬" className="border border-gray-200 text-gray-500 text-xs py-1.5 rounded-lg hover:bg-gray-50">▽</button>
                </div>
                {/* 색상 (도형만) */}
                {selected.type !== 'image' && (
                  <>
                    <label className="text-xs text-gray-500 block mb-1">색상</label>
                    <div className="flex gap-1.5 mb-2 flex-wrap">
                      {['#FF6B6B','#FF6B9D','#FFB3C6','#FFD166','#FFB347','#74B9FF','#A29BFE','#6C5CE7','#00B894','#2ECC71','#333333','#FFFFFF'].map(c => (
                        <button key={c} onClick={() => changeSelectedColor(c)}
                          className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                          style={{ backgroundColor: c, borderColor: c === '#FFFFFF' ? '#ddd' : 'transparent' }} />
                      ))}
                      <input type="color" onChange={e => changeSelectedColor(e.target.value)}
                        className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0" title="자유 색상" />
                    </div>
                  </>
                )}
                {/* 이미지 보정 (이미지만) */}
                {isImage && (
                  <>
                    <label className="text-xs text-gray-500 block mb-1">이미지 보정</label>
                    <div className="space-y-1.5 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-8">밝기</span>
                        <input type="range" min={-100} max={100} value={imgBrightness}
                          onChange={e => { const v = +e.target.value; setImgBrightness(v); applyImageFilters(v/100, imgContrast/100, imgSaturation/100, imgHue/360) }}
                          className="flex-1 accent-purple-500" />
                        <span className="text-[10px] text-gray-400 w-6 text-right">{imgBrightness}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-8">대비</span>
                        <input type="range" min={-100} max={100} value={imgContrast}
                          onChange={e => { const v = +e.target.value; setImgContrast(v); applyImageFilters(imgBrightness/100, v/100, imgSaturation/100, imgHue/360) }}
                          className="flex-1 accent-purple-500" />
                        <span className="text-[10px] text-gray-400 w-6 text-right">{imgContrast}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-8">채도</span>
                        <input type="range" min={-100} max={100} value={imgSaturation}
                          onChange={e => { const v = +e.target.value; setImgSaturation(v); applyImageFilters(imgBrightness/100, imgContrast/100, v/100, imgHue/360) }}
                          className="flex-1 accent-purple-500" />
                        <span className="text-[10px] text-gray-400 w-6 text-right">{imgSaturation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 w-8">색조</span>
                        <input type="range" min={-180} max={180} value={imgHue}
                          onChange={e => { const v = +e.target.value; setImgHue(v); applyImageFilters(imgBrightness/100, imgContrast/100, imgSaturation/100, v/360) }}
                          className="flex-1 accent-purple-500" />
                        <span className="text-[10px] text-gray-400 w-6 text-right">{imgHue}</span>
                      </div>
                    </div>
                    <button onClick={() => { setImgBrightness(0); setImgContrast(0); setImgSaturation(0); setImgHue(0); applyImageFilters(0,0,0,0) }}
                      className="w-full text-xs text-gray-400 py-1 mb-2 hover:text-purple-500 transition">초기화</button>
                  </>
                )}
                {/* 투명도 */}
                <label className="text-xs text-gray-500 block mb-1">투명도</label>
                <input type="range" min={0} max={100} defaultValue={Math.round((selected.opacity ?? 1) * 100)}
                  onChange={e => { if (selected && canvasRef.current) { selected.set({ opacity: +e.target.value / 100 }); canvasRef.current.renderAll() } }}
                  className="w-full accent-purple-500 mb-3" />
                {/* 레이어 */}
                <label className="text-xs text-gray-500 block mb-1">레이어</label>
                <div className="grid grid-cols-4 gap-1 mb-3">
                  <button onClick={sendToBack} className="border border-gray-200 text-gray-500 text-[10px] py-1.5 rounded-lg hover:bg-gray-50">맨 뒤</button>
                  <button onClick={sendBwd} className="border border-gray-200 text-gray-500 text-[10px] py-1.5 rounded-lg hover:bg-gray-50">뒤로</button>
                  <button onClick={bringFwd} className="border border-gray-200 text-gray-500 text-[10px] py-1.5 rounded-lg hover:bg-gray-50">앞으로</button>
                  <button onClick={bringToFront} className="border border-gray-200 text-gray-500 text-[10px] py-1.5 rounded-lg hover:bg-gray-50">맨 앞</button>
                </div>
                {/* 삭제 */}
                <button onClick={deleteSelected} className="w-full border border-red-200 text-red-400 text-xs py-1.5 rounded-lg hover:bg-red-50 transition font-medium">🗑 삭제</button>
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
                  {([['ilbirong', '손그림'], ['shape', '도형'], ['table', '표']] as const).map(([key, label]) => (
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
                    <div>
                      {/* 색상 선택 */}
                      <p className="text-xs text-gray-400 mb-1.5 font-medium">도형 색상</p>
                      <div className="flex gap-1.5 mb-3 flex-wrap">
                        {['#FF6B6B','#FF6B9D','#FFB3C6','#FFD166','#FFB347','#74B9FF','#A29BFE','#6C5CE7','#00B894','#2ECC71','#333333','#FFFFFF'].map(c => (
                          <button key={c} onClick={() => setShapeColor(c)}
                            className="w-7 h-7 rounded-lg border-2 transition-all"
                            style={{ backgroundColor: c, borderColor: shapeColor === c ? '#333' : c === '#FFFFFF' ? '#ddd' : 'transparent' }} />
                        ))}
                        <input type="color" value={shapeColor} onChange={e => setShapeColor(e.target.value)}
                          className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0" title="자유 색상" />
                      </div>
                      {/* 선택된 도형 색상 변경 */}
                      {selected && !isText && (
                        <div className="mb-3 flex items-center gap-2">
                          <span className="text-xs text-gray-400">선택된 도형 색상:</span>
                          <input type="color" defaultValue="#FF6B6B"
                            onChange={e => changeSelectedColor(e.target.value)}
                            className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0" />
                        </div>
                      )}
                      {/* 도형 그리드 */}
                      <div className="grid grid-cols-4 gap-2">
                        {SHAPES.map(s => (
                          <button key={s.label} onClick={() => addSticker(s.svg, shapeColor)}
                            className="aspect-square rounded-xl border border-gray-100 hover:border-pink-300 hover:shadow-sm transition flex flex-col items-center justify-center gap-1 p-2 bg-gray-50 hover:bg-pink-50">
                            <div className="w-8 h-8 flex items-center justify-center"
                              dangerouslySetInnerHTML={{ __html: s.svg.replace(/\{\{COLOR\}\}/g, shapeColor) }} />
                            <span className="text-gray-400" style={{ fontSize: 8 }}>{s.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  {elemTab === 'table' && (
                    <div>
                      {/* 테마 선택 */}
                      <p className="text-xs text-gray-400 mb-2 font-medium">테마</p>
                      <div className="flex gap-1.5 mb-4">
                        {TABLE_THEMES.map((t, i) => (
                          <button key={t.id} onClick={() => setTableThemeIdx(i)}
                            className="flex-1 py-2 rounded-lg text-center transition border-2"
                            style={{
                              background: t.headerBg,
                              borderColor: tableThemeIdx === i ? t.text : 'transparent',
                              opacity: tableThemeIdx === i ? 1 : 0.6,
                            }}>
                            <span style={{ fontSize: 16 }}>{t.label.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                      {/* 미리보기 */}
                      <div className="rounded-xl overflow-hidden mb-4 border" style={{ borderColor: TABLE_THEMES[tableThemeIdx].border }}>
                        <div className="h-6" style={{ background: TABLE_THEMES[tableThemeIdx].headerBg }} />
                        <div className="h-5" style={{ background: TABLE_THEMES[tableThemeIdx].cellBg }} />
                        <div className="h-5" style={{ background: TABLE_THEMES[tableThemeIdx].cellBgAlt }} />
                        <div className="h-5" style={{ background: TABLE_THEMES[tableThemeIdx].cellBg }} />
                      </div>
                      {/* 크기 입력 */}
                      <p className="text-xs text-gray-400 mb-2 font-medium">크기 (행 × 열)</p>
                      <div className="flex gap-2 items-center mb-3">
                        <input type="number" min={1} max={20} value={tblRows} onChange={e => setTblRows(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-pink-300" />
                        <span className="text-gray-400 text-xs font-bold">×</span>
                        <input type="number" min={1} max={20} value={tblCols} onChange={e => setTblCols(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:ring-2 focus:ring-pink-300" />
                      </div>
                      <button onClick={() => createTable(Math.max(1, +tblRows || 3), Math.max(1, +tblCols || 3), tableThemeIdx)}
                        className="w-full py-2.5 rounded-xl text-xs font-bold text-white transition mb-4"
                        style={{ background: 'linear-gradient(135deg,#FF6B9D,#C77DFF)' }}>
                        표 만들기
                      </button>
                      {/* 선택된 표 편집 */}
                      {/* 표 선택 시: 패널 입력 + 행/열 조절 */}
                      {selectedTableMeta && (() => {
                        const tt = getTableTexts()
                        return (
                          <div className="border-t border-gray-100 pt-3">
                            <p className="text-xs font-bold text-pink-400 mb-2">표 편집 ({selectedTableMeta.rows}×{selectedTableMeta.cols})</p>
                            <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
                              {tt.map((row, r) => (
                                <div key={r} className="flex gap-0.5">
                                  {row.map((cell, c) => (
                                    <input key={`${r}-${c}`} defaultValue={cell}
                                      placeholder={r === 0 ? `항목${c+1}` : ''}
                                      onChange={e => updateTableCell(r, c, e.target.value)}
                                      className="flex-1 min-w-0 border rounded px-1 py-1 text-center focus:outline-none focus:ring-1 focus:ring-pink-300"
                                      style={{ fontSize: 10, background: r === 0 ? TABLE_THEMES[selectedTableMeta.theme].headerBg + '40' : '#fafafa' }} />
                                  ))}
                                </div>
                              ))}
                            </div>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button onClick={() => modifyTable(1, 0)} className="border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-pink-50 font-medium">+ 행 추가</button>
                              <button onClick={() => modifyTable(-1, 0)} className="border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-pink-50 font-medium">− 행 삭제</button>
                              <button onClick={() => modifyTable(0, 1)} className="border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-pink-50 font-medium">+ 열 추가</button>
                              <button onClick={() => modifyTable(0, -1)} className="border border-gray-200 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-pink-50 font-medium">− 열 삭제</button>
                            </div>
                          </div>
                        )
                      })()}
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

            {/* ── 프레임 패널 ── */}
            {activePanel === '프레임' && (
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">프레임</p>
                <p className="text-gray-400 mb-3" style={{ fontSize: 10 }}>모양을 선택하면 사진을 업로드할 수 있어요</p>
                <div className="grid grid-cols-4 gap-2">
                  {FRAMES.map(f => (
                    <button key={f.label} onClick={() => onFrameSelect(f)}
                      className="aspect-square rounded-xl border border-gray-100 hover:border-pink-300 hover:shadow-sm transition flex flex-col items-center justify-center gap-1 p-2 bg-gray-50 hover:bg-pink-50">
                      <span className="text-xl">{f.icon}</span>
                      <span className="text-gray-400" style={{ fontSize: 9 }}>{f.label}</span>
                    </button>
                  ))}
                </div>
                <input ref={frameFileRef} type="file" accept="image/*" className="hidden" onChange={onFramePhoto} />
                {selected && !isText && (
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
                {/* 직접 입력 (cm) */}
                <div className="border-t border-gray-100 mt-4 pt-4">
                  <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">직접 입력 (cm)</p>
                  <div className="flex gap-2 items-center">
                    <input type="number" placeholder="가로 cm" min={1} max={100} step={0.1} value={customW}
                      onChange={e => setCustomW(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-pink-300" />
                    <span className="text-gray-400 text-xs">×</span>
                    <input type="number" placeholder="세로 cm" min={1} max={100} step={0.1} value={customH}
                      onChange={e => setCustomH(e.target.value)}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-2 text-xs text-center focus:outline-none focus:ring-2 focus:ring-pink-300" />
                  </div>
                  <p className="text-gray-300 mt-1" style={{ fontSize: 9 }}>300DPI 인쇄 기준으로 변환됩니다</p>
                  <button
                    onClick={() => {
                      const cmToPx = (cm: number) => Math.round(cm * (300 / 2.54))
                      const w = cmToPx(Math.max(1, Math.min(100, parseFloat(customW) || 10)))
                      const h = cmToPx(Math.max(1, Math.min(100, parseFloat(customH) || 10)))
                      const wCm = parseFloat(customW) || 10
                      const hCm = parseFloat(customH) || 10
                      setCanvasPreset({ label: `${wCm}×${hCm}cm`, icon: '📐', w, h })
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
