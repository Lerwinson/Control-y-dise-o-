'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { MousePointer2, Pen, Square, Spline, Ruler, Plus, Minus, Grid3x3, Magnet, Trash2, Download } from 'lucide-react';
import { useT, useCurrentProject } from '@/lib/store';
import { useStore } from '@/lib/store';
import { clamp } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';

type Tool = 'select' | 'line' | 'rect' | 'poly' | 'measure';
interface Shape { id: string; type: Tool; [k: string]: any; }
const GRID_MM = 100;
const rid = () => 'sh_' + Math.random().toString(36).slice(2, 8);

export default function Design2DPage() {
  const t = useT();
  const proj = useCurrentProject();
  const updateProject = useStore((s) => s.updateProject);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    shapes: [] as Shape[], tool: 'select' as Tool, showGrid: true, snap: true,
    scale: 0.18, pan: { x: 60, y: 60 }, drawing: null as Shape | null,
    dragging: null as any, selected: null as Shape | null,
  });
  const [tool, setTool] = useState<Tool>('select');
  const [showGrid, setShowGrid] = useState(true);
  const [snap, setSnap] = useState(true);
  const [hud, setHud] = useState('—');

  // sync simple toggles to ref
  useEffect(() => { stateRef.current.tool = tool; }, [tool]);
  useEffect(() => { stateRef.current.showGrid = showGrid; redraw(); }, [showGrid]); // eslint-disable-line
  useEffect(() => { stateRef.current.snap = snap; }, [snap]);

  const projId = proj?.id;

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr, h = canvas.height / dpr;
    const S = stateRef.current;
    const toPX = (mx: number, my: number) => ({ x: mx * S.scale + S.pan.x, y: my * S.scale + S.pan.y });
    ctx.clearRect(0, 0, w, h);
    if (S.showGrid) {
      const step = GRID_MM * S.scale;
      ctx.strokeStyle = 'rgba(255,0,0,0.08)'; ctx.lineWidth = 1;
      for (let x = S.pan.x % step; x < w; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = S.pan.y % step; y < h; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(255,0,0,0.25)';
      ctx.beginPath(); ctx.moveTo(S.pan.x, 0); ctx.lineTo(S.pan.x, h); ctx.moveTo(0, S.pan.y); ctx.lineTo(w, S.pan.y); ctx.stroke();
    }
    const drawShape = (s: Shape, sel: boolean, preview = false) => {
      ctx.lineWidth = sel ? 3 : 2;
      ctx.strokeStyle = sel ? '#ffd23a' : preview ? 'rgba(255,90,90,0.8)' : '#ff3b3b';
      ctx.fillStyle = 'rgba(255,0,0,0.10)'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = sel ? 14 : 8;
      if (s.type === 'line' || s.type === 'measure') {
        const a = toPX(s.x1, s.y1), b = toPX(s.x2, s.y2);
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.shadowBlur = 0;
        const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
        label(`${Math.round(len)} mm`, (a.x + b.x) / 2, (a.y + b.y) / 2, s.type === 'measure' ? '#ffd23a' : '#fca');
      } else if (s.type === 'rect') {
        const a = toPX(s.x, s.y), wpx = s.w * S.scale, hpx = s.h * S.scale;
        ctx.beginPath(); ctx.rect(a.x, a.y, wpx, hpx); ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
        label(`${Math.round(Math.abs(s.w))} mm`, a.x + wpx / 2, a.y - 4, '#fca');
        label(`${Math.round(Math.abs(s.h))} mm`, a.x - 6, a.y + hpx / 2, '#fca', true);
      } else if (s.type === 'poly') {
        ctx.beginPath();
        s.pts.forEach((p: any, i: number) => { const q = toPX(p.x, p.y); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
        if (s.closed) ctx.closePath();
        ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      }
      ctx.shadowBlur = 0;
    };
    const label = (txt: string, x: number, y: number, color = '#fca', vertical = false) => {
      ctx.save(); ctx.fillStyle = color; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (vertical) { ctx.translate(x, y); ctx.rotate(-Math.PI / 2); ctx.fillText(txt, 0, 0); } else ctx.fillText(txt, x, y - 8);
      ctx.restore();
    };
    S.shapes.forEach((s) => drawShape(s, s === S.selected));
    if (S.drawing) drawShape(S.drawing, false, true);
  }, []);

  const redraw = useCallback(() => requestAnimationFrame(draw), [draw]);

  const persist = useCallback(() => { if (projId) updateProject(projId, { shapes2d: stateRef.current.shapes as any }); }, [projId, updateProject]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    stateRef.current.shapes = JSON.parse(JSON.stringify(proj?.shapes2d || []));
    const ctx = canvas.getContext('2d')!;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); draw();
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas);

    const evtMM = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const S = stateRef.current;
      return { x: (e.clientX - r.left - S.pan.x) / S.scale, y: (e.clientY - r.top - S.pan.y) / S.scale };
    };
    const snapV = (v: number) => (stateRef.current.snap ? Math.round(v / GRID_MM) * GRID_MM : Math.round(v));

    const onDown = (e: PointerEvent) => {
      const S = stateRef.current; const m = evtMM(e); const mx = snapV(m.x), my = snapV(m.y);
      if (S.tool === 'select') {
        const hit = hitTest(S.shapes, m.x, m.y); S.selected = hit;
        if (hit && hit.type === 'rect') S.dragging = { s: hit, ox: m.x - hit.x, oy: m.y - hit.y };
        else if (hit && (hit.type === 'line' || hit.type === 'measure')) S.dragging = { s: hit, lx: m.x, ly: m.y };
        draw(); return;
      }
      if (S.tool === 'rect') S.drawing = { id: rid(), type: 'rect', x: mx, y: my, w: 0, h: 0 };
      else if (S.tool === 'line' || S.tool === 'measure') S.drawing = { id: rid(), type: S.tool, x1: mx, y1: my, x2: mx, y2: my };
      else if (S.tool === 'poly') {
        if (!S.drawing) S.drawing = { id: rid(), type: 'poly', pts: [{ x: mx, y: my }], closed: false };
        else S.drawing.pts.push({ x: mx, y: my });
      }
      draw();
    };
    const onMove = (e: PointerEvent) => {
      const S = stateRef.current; const m = evtMM(e); const mx = snapV(m.x), my = snapV(m.y);
      setHud(`X: ${Math.round(m.x)} · Y: ${Math.round(m.y)} mm`);
      if (S.dragging) {
        if (S.dragging.s.type === 'rect') { S.dragging.s.x = snapV(m.x - S.dragging.ox); S.dragging.s.y = snapV(m.y - S.dragging.oy); }
        else { const dx = m.x - S.dragging.lx, dy = m.y - S.dragging.ly; S.dragging.s.x1 += dx; S.dragging.s.y1 += dy; S.dragging.s.x2 += dx; S.dragging.s.y2 += dy; S.dragging.lx = m.x; S.dragging.ly = m.y; }
        draw(); return;
      }
      if (!S.drawing) return;
      if (S.drawing.type === 'rect') { S.drawing.w = mx - S.drawing.x; S.drawing.h = my - S.drawing.y; }
      else if (S.drawing.type === 'line' || S.drawing.type === 'measure') { S.drawing.x2 = mx; S.drawing.y2 = my; }
      draw();
    };
    const onUp = () => {
      const S = stateRef.current; S.dragging = null;
      if (!S.drawing) { persist(); return; }
      if (S.drawing.type === 'poly') { draw(); return; }
      const d = S.drawing;
      if ((d.type === 'rect' && Math.abs(d.w) > 5 && Math.abs(d.h) > 5) ||
          ((d.type === 'line' || d.type === 'measure') && Math.hypot(d.x2 - d.x1, d.y2 - d.y1) > 5)) {
        S.shapes.push(d); S.selected = d;
      }
      S.drawing = null; persist(); draw();
    };
    const onDbl = () => {
      const S = stateRef.current;
      if (S.drawing && S.drawing.type === 'poly' && S.drawing.pts.length >= 3) { S.drawing.closed = true; S.shapes.push(S.drawing); S.drawing = null; persist(); draw(); }
    };
    const onWheel = (e: WheelEvent) => { e.preventDefault(); const S = stateRef.current; S.scale = clamp(S.scale * (e.deltaY < 0 ? 1.1 : 0.9), 0.03, 3); draw(); };

    canvas.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    canvas.addEventListener('dblclick', onDbl);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    setTimeout(resize, 30);
    return () => {
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('dblclick', onDbl);
      canvas.removeEventListener('wheel', onWheel);
    };
  }, [proj?.id, draw, persist]); // eslint-disable-line

  const zoom = (f: number) => { stateRef.current.scale = clamp(stateRef.current.scale * f, 0.03, 3); draw(); };
  const clearAll = () => { stateRef.current.shapes = []; stateRef.current.selected = null; persist(); draw(); };
  const exportPng = () => { const c = canvasRef.current; if (!c) return; c.toBlob((b) => { if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${proj?.name || 'design'}_2D.png`; a.click(); }); };

  if (!proj) return <p className="text-zinc-500">{t('select_project')}</p>;

  const ToolBtn = ({ id, Icon }: { id: Tool; Icon: any }) => (
    <button onClick={() => setTool(id)} data-active={tool === id} className="bg-black/50 border border-red-500/20 text-orange-200 p-2 rounded-lg hover:bg-red-600/20 data-[active=true]:bg-red-600/30 data-[active=true]:text-white">
      <Icon size={18} />
    </button>
  );

  return (
    <div>
      <PageHeader title={t('nav_design2d')} subtitle={proj.name} />
      <div className="flex flex-col lg:flex-row gap-4">
        <Card className="p-3 flex lg:flex-col gap-2 flex-wrap lg:w-16 justify-center">
          <ToolBtn id="select" Icon={MousePointer2} />
          <ToolBtn id="line" Icon={Pen} />
          <ToolBtn id="rect" Icon={Square} />
          <ToolBtn id="poly" Icon={Spline} />
          <ToolBtn id="measure" Icon={Ruler} />
          <div className="h-px lg:w-full w-px bg-red-900/40 my-1" />
          <button onClick={() => zoom(1.25)} className="bg-black/50 border border-red-500/20 text-orange-200 p-2 rounded-lg hover:bg-red-600/20"><Plus size={18} /></button>
          <button onClick={() => zoom(0.8)} className="bg-black/50 border border-red-500/20 text-orange-200 p-2 rounded-lg hover:bg-red-600/20"><Minus size={18} /></button>
          <button onClick={() => setShowGrid((v) => !v)} data-active={showGrid} className="bg-black/50 border border-red-500/20 text-orange-200 p-2 rounded-lg hover:bg-red-600/20 data-[active=true]:bg-red-600/30"><Grid3x3 size={18} /></button>
          <button onClick={() => setSnap((v) => !v)} data-active={snap} className="bg-black/50 border border-red-500/20 text-orange-200 p-2 rounded-lg hover:bg-red-600/20 data-[active=true]:bg-red-600/30"><Magnet size={18} /></button>
          <button onClick={clearAll} className="bg-black/50 border border-red-500/20 text-orange-200 p-2 rounded-lg hover:bg-red-600/20"><Trash2 size={18} /></button>
        </Card>

        <Card className="flex-1 p-3 relative">
          <button onClick={exportPng} className="absolute top-4 right-4 z-10 bg-red-600/10 border border-red-500/30 text-red-100 px-3 py-1.5 rounded-lg text-xs flex items-center gap-1"><Download size={14} /> PNG</button>
          <div className="absolute top-4 left-4 z-10 text-[11px] glass-soft px-2 py-1 rounded-lg">{hud}</div>
          <canvas ref={canvasRef} className="stage w-full rounded-lg cursor-crosshair" style={{ height: '62vh', touchAction: 'none' }} />
        </Card>
      </div>
    </div>
  );
}

function hitTest(shapes: Shape[], mx: number, my: number): Shape | null {
  for (let i = shapes.length - 1; i >= 0; i--) {
    const s = shapes[i];
    if (s.type === 'rect') {
      const x0 = Math.min(s.x, s.x + s.w), x1 = Math.max(s.x, s.x + s.w), y0 = Math.min(s.y, s.y + s.h), y1 = Math.max(s.y, s.y + s.h);
      if (mx >= x0 && mx <= x1 && my >= y0 && my <= y1) return s;
    } else if (s.type === 'line' || s.type === 'measure') {
      if (distToSeg(mx, my, s.x1, s.y1, s.x2, s.y2) < 80) return s;
    }
  }
  return null;
}
function distToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
  let t = ((px - x1) * dx + (py - y1) * dy) / l2; t = Math.min(1, Math.max(0, t));
  return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
}
