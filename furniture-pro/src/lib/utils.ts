import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind class merge helper (ShadCN convention)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const uid = (p = 'id') =>
  `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const fmtMoney = (v: number, cur = 'USD') => {
  const sym: Record<string, string> = { USD: '$', EUR: '€', BRL: 'R$', MXN: '$', COP: '$' };
  return `${sym[cur] || '$'}${(Number(v) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const fmtNum = (v: number, d = 1) =>
  (Number(v) || 0).toLocaleString(undefined, { maximumFractionDigits: d });

export const relTime = (ts: number) => {
  const diff = Date.now() - ts;
  const m = 60000, h = 3600000, d = 86400000;
  if (diff < m) return 'now';
  if (diff < h) return `${Math.floor(diff / m)}m`;
  if (diff < d) return `${Math.floor(diff / h)}h`;
  return `${Math.floor(diff / d)}d`;
};

export const download = (filename: string, content: BlobPart, mime = 'text/plain') => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};
