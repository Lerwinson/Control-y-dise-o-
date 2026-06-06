// Small shared helpers
export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

export const fmtMoney = (v, cur = 'USD') => {
  const sym = { USD: '$', EUR: '€', BRL: 'R$', MXN: '$', COP: '$' }[cur] || '$';
  return `${sym}${(Number(v) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fmtNum = (v, d = 1) => (Number(v) || 0).toLocaleString(undefined, { maximumFractionDigits: d });

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const debounce = (fn, ms = 250) => {
  let h; return (...a) => { clearTimeout(h); h = setTimeout(() => fn(...a), ms); };
};

export const download = (filename, content, mime = 'text/plain') => {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
};

export const relTime = (ts) => {
  const diff = Date.now() - ts, m = 60000, h = 3600000, d = 86400000;
  if (diff < m) return 'ahora'; if (diff < h) return `${Math.floor(diff / m)}m`;
  if (diff < d) return `${Math.floor(diff / h)}h`; return `${Math.floor(diff / d)}d`;
};
