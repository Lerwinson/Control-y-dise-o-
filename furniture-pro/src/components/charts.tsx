'use client';
import React from 'react';

interface Datum { value: number; color: string; }
interface LabeledDatum { label: string; value: number; display?: string; }

export function DonutChart({ data, size = 180, thickness = 28, centerLabel = '', centerSub = '' }:
  { data: Datum[]; size?: number; thickness?: number; centerLabel?: string; centerSub?: string }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2, cx = size / 2, cy = size / 2, C = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={thickness} />
      {data.map((d, i) => {
        const frac = d.value / total;
        const el = (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={thickness}
            strokeDasharray={`${frac * C} ${C}`} strokeDashoffset={-offset * C}
            transform={`rotate(-90 ${cx} ${cy})`} style={{ filter: `drop-shadow(0 0 4px ${d.color})` }} />
        );
        offset += frac; return el;
      })}
      {centerLabel && <text x={cx} y={cy - 2} textAnchor="middle" fill="#fff" fontSize="18" fontWeight="700">{centerLabel}</text>}
      {centerSub && <text x={cx} y={cy + 16} textAnchor="middle" fill="#f99" fontSize="10">{centerSub}</text>}
    </svg>
  );
}

export function BarChart({ data, height = 200 }: { data: LabeledDatum[]; height?: number }) {
  const width = 520, pad = 30;
  const max = Math.max(...data.map((d) => d.value), 1);
  const bw = (width - pad * 2) / (data.length || 1);
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <defs><linearGradient id="barg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff5a5a" /><stop offset="1" stopColor="#8b0000" /></linearGradient></defs>
      <line x1={pad} y1={height - pad} x2={width - pad} y2={height - pad} stroke="rgba(255,0,0,0.3)" />
      {data.map((d, i) => {
        const h = (d.value / max) * (height - pad * 2);
        const x = pad + i * bw + bw * 0.18, y = height - pad - h, w = bw * 0.64;
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} rx={4} fill="url(#barg)" style={{ filter: 'drop-shadow(0 0 6px #ff0000)' }} />
            <text x={x + w / 2} y={height - pad + 14} textAnchor="middle" fill="#f99" fontSize="10">{d.label}</text>
            <text x={x + w / 2} y={y - 5} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">{d.display ?? d.value}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function LineChart({ data, height = 200, color = '#ff3b3b' }: { data: LabeledDatum[]; height?: number; color?: string }) {
  const width = 520, pad = 30;
  const max = Math.max(...data.map((d) => d.value), 1);
  const step = (width - pad * 2) / (data.length - 1 || 1);
  const pts = data.map((d, i) => [pad + i * step, height - pad - (d.value / max) * (height - pad * 2)] as const);
  const path = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(' ');
  const area = `${path} L${pts[pts.length - 1][0]},${height - pad} L${pad},${height - pad} Z`;
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="rgba(255,0,0,0.4)" /><stop offset="1" stopColor="rgba(255,0,0,0)" /></linearGradient></defs>
      <path d={area} fill="url(#lg)" />
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} style={{ filter: `drop-shadow(0 0 6px ${color})` }} />
      {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill="#fff" stroke={color} strokeWidth={2} />)}
      {data.map((d, i) => <text key={i} x={pad + i * step} y={height - pad + 14} textAnchor="middle" fill="#f99" fontSize="10">{d.label}</text>)}
    </svg>
  );
}

export function Legend({ items }: { items: { label: string; color: string; value?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-3 mt-3">
      {items.map((i, k) => (
        <div key={k} className="flex items-center gap-2 text-xs">
          <span className="w-3 h-3 rounded-sm" style={{ background: i.color, boxShadow: `0 0 6px ${i.color}` }} />
          <span className="text-zinc-300">{i.label}</span>
          {i.value != null && <span className="text-zinc-500">{i.value}</span>}
        </div>
      ))}
    </div>
  );
}
