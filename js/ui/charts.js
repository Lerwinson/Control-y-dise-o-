// Lightweight dependency-free SVG charts
import { esc } from '../utils/helpers.js';

export function donutChart(data, { size = 180, thickness = 28, centerLabel = '', centerSub = '' } = {}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  let offset = 0;
  const segs = data.map((d) => {
    const frac = d.value / total;
    const dash = `${frac * C} ${C}`;
    const circle = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${d.color}" stroke-width="${thickness}" stroke-dasharray="${dash}" stroke-dashoffset="${-offset * C}" transform="rotate(-90 ${cx} ${cy})" style="filter:drop-shadow(0 0 4px ${d.color})"/>`;
    offset += frac; return circle;
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="${thickness}"/>
    ${segs}
    ${centerLabel ? `<text x="${cx}" y="${cy - 2}" text-anchor="middle" fill="#fff" font-size="18" font-weight="700">${esc(centerLabel)}</text>` : ''}
    ${centerSub ? `<text x="${cx}" y="${cy + 16}" text-anchor="middle" fill="#f99" font-size="10">${esc(centerSub)}</text>` : ''}
  </svg>`;
}

export function barChart(data, { width = 520, height = 200, color = '#ff0000' } = {}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const pad = 30, bw = (width - pad * 2) / data.length;
  const bars = data.map((d, i) => {
    const h = ((d.value / max) * (height - pad * 2));
    const x = pad + i * bw + bw * 0.18, y = height - pad - h, w = bw * 0.64;
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="url(#barg)" style="filter:drop-shadow(0 0 6px ${color})"/>
      <text x="${x + w / 2}" y="${height - pad + 14}" text-anchor="middle" fill="#f99" font-size="10">${esc(d.label)}</text>
      <text x="${x + w / 2}" y="${y - 5}" text-anchor="middle" fill="#fff" font-size="10" font-weight="600">${d.display ?? d.value}</text>`;
  }).join('');
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}">
    <defs><linearGradient id="barg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff5a5a"/><stop offset="1" stop-color="#8b0000"/></linearGradient></defs>
    <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="rgba(255,0,0,0.3)"/>
    ${bars}
  </svg>`;
}

export function lineChart(data, { width = 520, height = 200, color = '#ff3b3b' } = {}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const pad = 30, step = (width - pad * 2) / (data.length - 1 || 1);
  const pts = data.map((d, i) => [pad + i * step, height - pad - (d.value / max) * (height - pad * 2)]);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${pts[pts.length - 1][0]},${height - pad} L${pad},${height - pad} Z`;
  const dots = pts.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="3.5" fill="#fff" stroke="${color}" stroke-width="2"/>`).join('');
  const labels = data.map((d, i) => `<text x="${pad + i * step}" y="${height - pad + 14}" text-anchor="middle" fill="#f99" font-size="10">${esc(d.label)}</text>`).join('');
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,0,0,0.4)"/><stop offset="1" stop-color="rgba(255,0,0,0)"/></linearGradient></defs>
    <path d="${area}" fill="url(#lg)"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" style="filter:drop-shadow(0 0 6px ${color})"/>
    ${dots}${labels}
  </svg>`;
}

export function legend(items) {
  return `<div class="flex flex-wrap gap-3 mt-3">${items.map((i) =>
    `<div class="flex items-center gap-2 text-xs"><span class="w-3 h-3 rounded-sm" style="background:${i.color};box-shadow:0 0 6px ${i.color}"></span><span class="text-zinc-300">${esc(i.label)}</span>${i.value != null ? `<span class="text-zinc-500">${esc(i.value)}</span>` : ''}</div>`).join('')}</div>`;
}
