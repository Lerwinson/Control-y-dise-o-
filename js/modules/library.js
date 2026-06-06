import { t } from '../i18n.js';
import { fromTemplate } from '../store.js';
import { TEMPLATES } from '../data.js';
import { icon } from '../ui/icons.js';
import { pageHeader, toast } from '../ui/ui.js';
import { esc } from '../utils/helpers.js';

const CATS = [
  { key: 'sofas', label: 'lc_sofas', icon: 'sofa' },
  { key: 'beds', label: 'lc_beds', icon: 'bed' },
  { key: 'bases', label: 'lc_bases', icon: 'bed' },
  { key: 'mattress', label: 'lc_mattress', icon: 'mattress' },
  { key: 'tables', label: 'lc_tables', icon: 'furniture' },
  { key: 'chairs', label: 'lc_chairs', icon: 'furniture' },
  { key: 'closets', label: 'lc_closets', icon: 'furniture' },
  { key: 'wardrobes', label: 'lc_wardrobes', icon: 'furniture' },
  { key: 'custom', label: 'lc_custom', icon: 'cube' },
];

let activeCat = 'all';

export function render(root) {
  const draw = () => {
    const list = activeCat === 'all' ? TEMPLATES : TEMPLATES.filter((tp) => tp.cat === activeCat);
    root.innerHTML = `
      ${pageHeader(t('nav_library'), t('templates'))}
      <div class="flex flex-wrap gap-2 mb-5">
        <button class="btn ${activeCat === 'all' ? 'btn-primary' : 'btn-tool'}" data-cat="all">${t('total')}</button>
        ${CATS.map((c) => `<button class="btn ${activeCat === c.key ? 'btn-primary' : 'btn-tool'}" data-cat="${c.key}">${icon(c.icon, 14)} ${t(c.label)}</button>`).join('')}
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        ${list.map((tp) => {
          const parts = tp.build();
          const cat = CATS.find((c) => c.key === tp.cat) || CATS[CATS.length - 1];
          return `<div class="glass neon-border rounded-2xl p-4 glow-hover">
            <div class="aspect-square stage rounded-lg mb-3 flex items-center justify-center text-red-500/40 relative">
              ${icon(cat.icon, 64)}
              <span class="badge absolute top-2 left-2" style="background:rgba(255,0,0,0.15);color:#fca">${t(cat.label)}</span>
            </div>
            <div class="font-semibold text-sm truncate">${esc(tp.name)}</div>
            <div class="text-[11px] text-zinc-400 mb-3">${parts.length} ${t('pieces')}</div>
            <button class="btn btn-primary w-full justify-center text-xs" data-tpl="${tp.id}">${icon('plus', 14)} ${t('use_template')}</button>
          </div>`;
        }).join('')}
      </div>`;
    root.querySelectorAll('[data-cat]').forEach((b) => b.addEventListener('click', () => { activeCat = b.dataset.cat; draw(); }));
    root.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => { fromTemplate(b.dataset.tpl); toast(t('created_ok')); location.hash = '#/bom'; }));
  };
  draw();
}
