import { t } from '../i18n.js';
import { getState, currentProject, setShapes2d } from '../store.js';
import { icon } from '../ui/icons.js';
import { pageHeader, toast } from '../ui/ui.js';
import { canvasToImage } from '../utils/export.js';
import { esc, clamp } from '../utils/helpers.js';

export function render(root) {
  const proj = currentProject();
  if (!proj) { root.innerHTML = `<p class="text-zinc-500">${t('select_project')}</p>`; return; }

  root.innerHTML = `
    ${pageHeader(t('nav_design2d'), esc(proj.name))}
    <div class="flex flex-col lg:flex-row gap-4">
      <!-- toolbar -->
      <div class="glass neon-border rounded-2xl p-3 flex lg:flex-col gap-2 flex-wrap lg:w-16 justify-center">
        ${tool('select', 'eye', 'tool_select')}
        ${tool('line', 'pen', 'tool_line')}
        ${tool('rect', 'grid', 'tool_rect')}
        ${tool('poly', 'design', 'tool_poly')}
        ${tool('measure', 'ruler', 'tool_measure')}
        <div class="h-px lg:w-full w-px bg-red-900/40 my-1"></div>
        <button class="btn-tool p-2 rounded-lg" id="zin" title="${t('zoom_in')}">${icon('plus', 18)}</button>
        <button class="btn-tool p-2 rounded-lg" id="zout" title="${t('zoom_out')}">${icon('chevron', 18)}</button>
        <button class="btn-tool p-2 rounded-lg" id="t-grid" title="${t('grid')}">${icon('grid', 18)}</button>
        <button class="btn-tool p-2 rounded-lg" id="t-snap" title="${t('snap')}">${icon('bolt', 18)}</button>
        <button class="btn-tool p-2 rounded-lg" id="clear" title="${t('clear')}">${icon('trash', 18)}</button>
      </div>

      <!-- stage -->
      <div class="flex-1 glass neon-border rounded-2xl p-3 relative">
        <div class="absolute top-4 right-4 z-10 flex gap-2">
          <button class="btn btn-ghost text-xs" id="exp-png">${icon('download', 14)} PNG</button>
          <button class="btn btn-ghost text-xs" id="exp-svg">${icon('download', 14)} SVG</button>
        </div>
        <div class="absolute top-4 left-4 z-10 text-[11px] glass-soft px-2 py-1 rounded-lg" id="hud">—</div>
        <canvas id="c2d" class="stage w-full rounded-lg cursor-crosshair" style="height:62vh;touch-action:none"></canvas>
        <div class="absolute bottom-4 left-4 text-[10px] text-zinc-500" id="status2d"></div>
      </div>

      <!-- properties -->
      <div class="glass neon-border rounded-2xl p-4 lg:w-64" id="props2d">
        <h3 class="font-display font-bold mb-2 text-sm">${t('properties')}</h3>
        <p class="text-xs text-zinc-500">${t('tool_select')}…</p>
      </div>
    </div>`;

  initCanvas(root, proj);

  function tool(id, ic, label) {
    return `<button class="btn-tool p-2 rounded-lg ${id === 'select' ? 'active' : ''}" data-tool="${id}" title="${t(label)}">${icon(ic, 18)}</button>`;
  }
}

function initCanvas(root, proj) {
  const canvas = root.querySelector('#c2d');
  const ctx = canvas.getContext('2d');
  const hud = root.querySelector('#hud');
  const status = root.querySelector('#status2d');
  const propsEl = root.querySelector('#props2d');

  let dpr = window.devicePixelRatio || 1;
  let shapes = JSON.parse(JSON.stringify(proj.shapes2d || []));
  let tool = 'select';
  let showGrid = true, snap = true;
  let scale = 0.18; // px per mm (zoom)
  let pan = { x: 60, y: 60 };
  let drawing = null; // in-progress shape
  let selected = null;
  let dragging = null; // {sid, ox, oy}
  const GRID_MM = 100;

  function resize() {
    const r = canvas.getBoundingClientRect();
    canvas.width = r.width * dpr; canvas.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  const ro = new ResizeObserver(resize); ro.observe(canvas);

  const toMM = (px, py) => ({ x: (px - pan.x) / scale, y: (py - pan.y) / scale });
  const toPX = (mx, my) => ({ x: mx * scale + pan.x, y: my * scale + pan.y });
  const snapMM = (v) => (snap ? Math.round(v / GRID_MM) * GRID_MM : Math.round(v));

  function evtPos(e) {
    const r = canvas.getBoundingClientRect();
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    return { px: cx, py: cy };
  }

  function draw() {
    const w = canvas.width / dpr, h = canvas.height / dpr;
    ctx.clearRect(0, 0, w, h);
    // grid
    if (showGrid) {
      ctx.lineWidth = 1;
      const stepPx = GRID_MM * scale;
      const startX = pan.x % stepPx, startY = pan.y % stepPx;
      ctx.strokeStyle = 'rgba(255,0,0,0.08)';
      for (let x = startX; x < w; x += stepPx) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = startY; y < h; y += stepPx) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
      // axis
      ctx.strokeStyle = 'rgba(255,0,0,0.25)';
      ctx.beginPath(); ctx.moveTo(pan.x, 0); ctx.lineTo(pan.x, h); ctx.moveTo(0, pan.y); ctx.lineTo(w, pan.y); ctx.stroke();
    }
    shapes.forEach((s) => drawShape(s, s === selected));
    if (drawing) drawShape(drawing, false, true);
  }

  function drawShape(s, isSel, preview = false) {
    ctx.lineWidth = isSel ? 3 : 2;
    ctx.strokeStyle = isSel ? '#ffd23a' : (preview ? 'rgba(255,90,90,0.8)' : '#ff3b3b');
    ctx.fillStyle = 'rgba(255,0,0,0.10)';
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = isSel ? 14 : 8;
    if (s.type === 'line' || s.type === 'measure') {
      const a = toPX(s.x1, s.y1), b = toPX(s.x2, s.y2);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      ctx.shadowBlur = 0;
      const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
      label(`${Math.round(len)} mm`, (a.x + b.x) / 2, (a.y + b.y) / 2, s.type === 'measure' ? '#ffd23a' : '#fca');
      if (s.type === 'measure') { tick(a, b); }
    } else if (s.type === 'rect') {
      const a = toPX(s.x, s.y); const wpx = s.w * scale, hpx = s.h * scale;
      ctx.beginPath(); ctx.rect(a.x, a.y, wpx, hpx); ctx.fill(); ctx.stroke();
      ctx.shadowBlur = 0;
      label(`${Math.round(Math.abs(s.w))} mm`, a.x + wpx / 2, a.y - 4, '#fca');
      label(`${Math.round(Math.abs(s.h))} mm`, a.x - 6, a.y + hpx / 2, '#fca', true);
    } else if (s.type === 'poly') {
      ctx.beginPath();
      s.pts.forEach((p, i) => { const q = toPX(p.x, p.y); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
      if (s.closed) ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.shadowBlur = 0;
      s.pts.forEach((p) => { const q = toPX(p.x, p.y); ctx.fillStyle = '#ffd23a'; ctx.beginPath(); ctx.arc(q.x, q.y, 3, 0, 7); ctx.fill(); });
    }
    ctx.shadowBlur = 0;
  }
  function label(txt, x, y, color = '#fca', vertical = false) {
    ctx.save(); ctx.fillStyle = color; ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (vertical) { ctx.translate(x, y); ctx.rotate(-Math.PI / 2); ctx.fillText(txt, 0, 0); }
    else ctx.fillText(txt, x, y - 8);
    ctx.restore();
  }
  function tick(a, b) {
    const ang = Math.atan2(b.y - a.y, b.x - a.x) + Math.PI / 2; const d = 6;
    [a, b].forEach((p) => { ctx.beginPath(); ctx.moveTo(p.x - Math.cos(ang) * d, p.y - Math.sin(ang) * d); ctx.lineTo(p.x + Math.cos(ang) * d, p.y + Math.sin(ang) * d); ctx.strokeStyle = '#ffd23a'; ctx.stroke(); });
  }

  function hitTest(mx, my) {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const s = shapes[i];
      if (s.type === 'rect') {
        const x0 = Math.min(s.x, s.x + s.w), x1 = Math.max(s.x, s.x + s.w);
        const y0 = Math.min(s.y, s.y + s.h), y1 = Math.max(s.y, s.y + s.h);
        if (mx >= x0 && mx <= x1 && my >= y0 && my <= y1) return s;
      } else if (s.type === 'line' || s.type === 'measure') {
        const d = distToSeg(mx, my, s.x1, s.y1, s.x2, s.y2); if (d < 80) return s;
      } else if (s.type === 'poly') {
        for (const p of s.pts) if (Math.hypot(p.x - mx, p.y - my) < 120) return s;
      }
    }
    return null;
  }
  function distToSeg(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1, dy = y2 - y1; const l2 = dx * dx + dy * dy || 1;
    let t2 = ((px - x1) * dx + (py - y1) * dy) / l2; t2 = clamp(t2, 0, 1);
    return Math.hypot(px - (x1 + t2 * dx), py - (y1 + t2 * dy));
  }

  // ---- interaction ----
  let polyPts = [];
  function onDown(e) {
    e.preventDefault();
    const { px, py } = evtPos(e); const m = toMM(px, py);
    const mx = snapMM(m.x), my = snapMM(m.y);
    if (tool === 'select') {
      const hit = hitTest(m.x, m.y); selected = hit; renderProps();
      if (hit && hit.type === 'rect') dragging = { s: hit, ox: m.x - hit.x, oy: m.y - hit.y };
      else if (hit && (hit.type === 'line' || hit.type === 'measure')) dragging = { s: hit, lx: m.x, ly: m.y };
      draw(); return;
    }
    if (tool === 'rect') drawing = { id: rid(), type: 'rect', x: mx, y: my, w: 0, h: 0 };
    else if (tool === 'line' || tool === 'measure') drawing = { id: rid(), type: tool, x1: mx, y1: my, x2: mx, y2: my };
    else if (tool === 'poly') {
      if (!drawing) drawing = { id: rid(), type: 'poly', pts: [{ x: mx, y: my }], closed: false };
      else drawing.pts.push({ x: mx, y: my });
      polyPts = drawing.pts; draw();
    }
  }
  function onMove(e) {
    const { px, py } = evtPos(e); const m = toMM(px, py);
    hud.textContent = `X: ${Math.round(m.x)} · Y: ${Math.round(m.y)} mm · ${Math.round(scale * 1000) / 10}px/cm`;
    const mx = snapMM(m.x), my = snapMM(m.y);
    if (dragging) {
      if (dragging.s.type === 'rect') { dragging.s.x = snapMM(m.x - dragging.ox); dragging.s.y = snapMM(m.y - dragging.oy); }
      else { const dx = m.x - dragging.lx, dy = m.y - dragging.ly; dragging.s.x1 += dx; dragging.s.y1 += dy; dragging.s.x2 += dx; dragging.s.y2 += dy; dragging.lx = m.x; dragging.ly = m.y; }
      renderProps(); draw(); return;
    }
    if (!drawing) return;
    if (drawing.type === 'rect') { drawing.w = mx - drawing.x; drawing.h = my - drawing.y; }
    else if (drawing.type === 'line' || drawing.type === 'measure') { drawing.x2 = mx; drawing.y2 = my; }
    else if (drawing.type === 'poly' && drawing.pts.length) { /* preview last */ }
    draw();
  }
  function onUp() {
    dragging = null;
    if (!drawing) { persist(); return; }
    if (drawing.type === 'poly') { draw(); return; } // poly continues until dblclick
    if ((drawing.type === 'rect' && Math.abs(drawing.w) > 5 && Math.abs(drawing.h) > 5) ||
        ((drawing.type === 'line' || drawing.type === 'measure') && Math.hypot(drawing.x2 - drawing.x1, drawing.y2 - drawing.y1) > 5)) {
      shapes.push(drawing); selected = drawing; renderProps();
    }
    drawing = null; persist(); draw();
  }
  function onDbl() {
    if (drawing && drawing.type === 'poly' && drawing.pts.length >= 3) {
      drawing.closed = true; shapes.push(drawing); drawing = null; polyPts = []; persist(); draw();
    }
  }
  function persist() { setShapes2d(proj.id, shapes); status.textContent = `${shapes.length} ${t('layers')}`; }

  function renderProps() {
    if (!selected) { propsEl.innerHTML = `<h3 class="font-display font-bold mb-2 text-sm">${t('properties')}</h3><p class="text-xs text-zinc-500">${t('tool_select')}…</p>`; return; }
    const s = selected;
    let fields = '';
    if (s.type === 'rect') fields = `
      ${num('x', s.x, 'X')} ${num('y', s.y, 'Y')} ${num('w', s.w, t('width'))} ${num('h', s.h, t('length'))}`;
    else if (s.type === 'line' || s.type === 'measure') fields = `
      ${num('x1', s.x1, 'X1')} ${num('y1', s.y1, 'Y1')} ${num('x2', s.x2, 'X2')} ${num('y2', s.y2, 'Y2')}`;
    else fields = `<p class="text-xs text-zinc-400">${s.pts.length} ${t('pieces')}</p>`;
    propsEl.innerHTML = `<h3 class="font-display font-bold mb-2 text-sm">${t('properties')}</h3>
      <div class="text-[10px] uppercase text-red-400 mb-2">${s.type}</div>
      <div class="grid grid-cols-2 gap-2">${fields}</div>
      <button id="del-shape" class="btn btn-ghost w-full justify-center mt-3 text-xs">${icon('trash', 14)} ${t('delete')}</button>`;
    propsEl.querySelectorAll('[data-prop]').forEach((inp) => inp.addEventListener('input', () => {
      s[inp.dataset.prop] = +inp.value || 0; persist(); draw();
    }));
    propsEl.querySelector('#del-shape').addEventListener('click', () => {
      shapes = shapes.filter((x) => x !== s); selected = null; persist(); draw(); renderProps();
    });
  }
  function num(prop, val, label) {
    return `<div><label class="lbl text-[9px]">${label}</label><input type="number" data-prop="${prop}" value="${Math.round(val)}" class="fld py-1 px-2 mt-0.5 text-xs"/></div>`;
  }

  // wire tools
  root.querySelectorAll('[data-tool]').forEach((b) => b.addEventListener('click', () => {
    tool = b.dataset.tool; drawing = null; polyPts = [];
    root.querySelectorAll('[data-tool]').forEach((x) => x.classList.toggle('active', x === b));
    canvas.style.cursor = tool === 'select' ? 'default' : 'crosshair';
  }));
  root.querySelector('#zin').addEventListener('click', () => { scale = clamp(scale * 1.25, 0.03, 3); draw(); });
  root.querySelector('#zout').addEventListener('click', () => { scale = clamp(scale / 1.25, 0.03, 3); draw(); });
  root.querySelector('#t-grid').addEventListener('click', (e) => { showGrid = !showGrid; e.currentTarget.classList.toggle('active', showGrid); draw(); });
  root.querySelector('#t-snap').addEventListener('click', (e) => { snap = !snap; e.currentTarget.classList.toggle('active', snap); });
  root.querySelector('#t-snap').classList.add('active');
  root.querySelector('#t-grid').classList.add('active');
  root.querySelector('#clear').addEventListener('click', () => { shapes = []; selected = null; drawing = null; persist(); draw(); renderProps(); toast(t('clear')); });
  root.querySelector('#exp-png').addEventListener('click', () => { canvasToImage(canvas, `${proj.name}_2D.png`); toast(t('exported_ok')); });
  root.querySelector('#exp-svg').addEventListener('click', () => { exportSVG(shapes, proj); toast(t('exported_ok')); });

  // wheel zoom
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); const f = e.deltaY < 0 ? 1.1 : 0.9; scale = clamp(scale * f, 0.03, 3); draw(); }, { passive: false });
  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('dblclick', onDbl);
  canvas.addEventListener('touchstart', onDown, { passive: false });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp);

  setTimeout(resize, 30);
  status.textContent = `${shapes.length} ${t('layers')}`;
}

function rid() { return 'sh_' + Math.random().toString(36).slice(2, 8); }

function exportSVG(shapes, proj) {
  let body = '';
  shapes.forEach((s) => {
    if (s.type === 'rect') body += `<rect x="${Math.min(s.x, s.x + s.w)}" y="${Math.min(s.y, s.y + s.h)}" width="${Math.abs(s.w)}" height="${Math.abs(s.h)}" fill="none" stroke="#ff0000" stroke-width="6"/>`;
    else if (s.type === 'line' || s.type === 'measure') body += `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" stroke="#ff0000" stroke-width="6"/>`;
    else if (s.type === 'poly') body += `<polygon points="${s.pts.map((p) => p.x + ',' + p.y).join(' ')}" fill="none" stroke="#ff0000" stroke-width="6"/>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 4000 3000" style="background:#000"><g>${body}</g><text x="0" y="2950" fill="#8B0000" font-size="60">LERWINSON MENDOZA</text></svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `${proj.name}_2D.svg`; a.click();
}
