import { t } from '../i18n.js';
import { getState, fromTemplate, setCurrentProject } from '../store.js';
import { TEMPLATES } from '../data.js';
import { computeBOM, computeCosts } from '../calc.js';
import { icon } from '../ui/icons.js';
import { pageHeader, toast } from '../ui/ui.js';
import { fmtMoney, esc } from '../utils/helpers.js';

const ROUTE_MAP = {
  sofas:    { type: 'sofa',      title: 'nav_sofas',     icon: 'sofa',      cats: ['sofas'] },
  beds:     { type: 'bed',       title: 'nav_beds',      icon: 'bed',       cats: ['beds', 'bases'] },
  mattress: { type: 'mattress',  title: 'nav_mattress',  icon: 'mattress',  cats: ['mattress'] },
  furniture:{ type: 'furniture', title: 'nav_furniture', icon: 'furniture', cats: ['tables', 'chairs', 'closets', 'wardrobes', 'custom'] },
};

export function render(root, { route }) {
  const cfg = ROUTE_MAP[route] || ROUTE_MAP.furniture;
  const st = getState();
  const projects = st.projects.filter((p) => p.type === cfg.type);
  const templates = TEMPLATES.filter((tp) => cfg.cats.includes(tp.cat));

  root.innerHTML = `
    ${pageHeader(t(cfg.title), t('templates') + ' & ' + t('nav_projects'))}

    <h3 class="font-display font-bold mb-3 flex items-center gap-2 text-red-300">${icon('library', 18)} ${t('templates')}</h3>
    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
      ${templates.map((tp) => {
        const parts = tp.build();
        return `<div class="glass neon-border rounded-2xl p-4 glow-hover">
          <div class="aspect-video stage rounded-lg mb-3 flex items-center justify-center text-red-500/40">${icon(cfg.icon, 56)}</div>
          <div class="font-semibold text-sm">${esc(tp.name)}</div>
          <div class="text-[11px] text-zinc-400 mb-3">${parts.length} ${t('pieces')}</div>
          <button class="btn btn-primary w-full justify-center text-xs" data-tpl="${tp.id}">${icon('plus', 14)} ${t('use_template')}</button>
        </div>`;
      }).join('') || `<div class="text-zinc-500 text-sm col-span-full">${t('none')}</div>`}
    </div>

    <h3 class="font-display font-bold mb-3 flex items-center gap-2 text-red-300">${icon('folder', 18)} ${t('nav_projects')}</h3>
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      ${projects.map((p) => {
        const b = computeBOM(p), c = computeCosts(p, st.settings);
        return `<div class="glass-soft rounded-xl p-4 glow-hover cursor-pointer" data-proj="${p.id}">
          <div class="flex items-center gap-2"><span class="text-red-400">${icon(cfg.icon, 20)}</span><span class="font-semibold text-sm truncate">${esc(p.name)}</span></div>
          <div class="text-[11px] text-zinc-400 mt-1">${b.partsCount} ${t('pieces')} · ${fmtMoney(c.finalPrice, p.currency)}</div>
        </div>`;
      }).join('') || `<div class="text-zinc-500 text-sm col-span-full">${t('none')}</div>`}
    </div>`;

  root.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => {
    fromTemplate(b.dataset.tpl); toast(t('created_ok')); location.hash = '#/bom';
  }));
  root.querySelectorAll('[data-proj]').forEach((b) => b.addEventListener('click', () => { setCurrentProject(b.dataset.proj); location.hash = '#/bom'; }));
}
