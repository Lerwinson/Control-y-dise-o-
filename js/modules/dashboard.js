import { t } from '../i18n.js';
import { getState, currentProject, setCurrentProject } from '../store.js';
import { computeCosts, computeBOM, STAGES, stageProgress } from '../calc.js';
import { icon } from '../ui/icons.js';
import { donutChart, barChart, legend } from '../ui/charts.js';
import { pageHeader } from '../ui/ui.js';
import { fmtMoney, fmtNum, esc, relTime } from '../utils/helpers.js';
import { openNewProject } from './projects.js';

export function render(root) {
  const st = getState();
  const projects = st.projects;
  const totalParts = projects.reduce((s, p) => s + computeBOM(p).pieces, 0);
  const totalMaterial = projects.reduce((s, p) => s + computeBOM(p).materialCost, 0);
  const avgMargin = projects.length ? projects.reduce((s, p) => s + (p.margin || 0), 0) / projects.length : 0;
  const proj = currentProject();
  const costs = proj ? computeCosts(proj, st.settings) : null;

  const kpis = [
    { label: t('active_projects'), value: projects.filter((p) => p.status === 'active').length, icon: 'folder', sub: '+2 ' + t('weekly') },
    { label: t('total_parts'), value: fmtNum(totalParts, 0), icon: 'list', sub: t('parts_count') },
    { label: t('material_cost'), value: fmtMoney(totalMaterial, st.settings.currency), icon: 'money', sub: t('raw_material') },
    { label: t('avg_margin'), value: fmtNum(avgMargin, 0) + '%', icon: 'bolt', sub: t('profitability') },
  ];

  // production distribution
  const stageCounts = STAGES.map((s, i) => ({ label: t(s), value: projects.filter((p) => p.stage === i).length, display: projects.filter((p) => p.stage === i).length }));

  root.innerHTML = `
    ${pageHeader(`${t('welcome')}, ${esc(st.user?.name || '')}`, t('overview'),
      `<button id="qa-new" class="btn btn-primary">${icon('plus', 16)} ${t('new_project')}</button>`)}

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      ${kpis.map((k) => `
        <div class="kpi glass neon-border rounded-2xl p-4 relative overflow-hidden">
          <div class="absolute -right-4 -top-4 text-red-600/10">${icon(k.icon, 90)}</div>
          <div class="text-red-300">${icon(k.icon, 22)}</div>
          <div class="text-2xl md:text-3xl font-display font-black mt-2 grad-text">${k.value}</div>
          <div class="text-xs text-zinc-400 mt-1">${k.label}</div>
          <div class="text-[10px] text-green-400 mt-1">${k.sub}</div>
        </div>`).join('')}
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <!-- recent projects -->
      <div class="xl:col-span-2 glass neon-border rounded-2xl p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-display font-bold text-lg">${t('recent_projects')}</h3>
          <a href="#/projects" class="text-xs text-red-300 hover:text-white">${t('view')} →</a>
        </div>
        <div class="space-y-3">
          ${projects.slice(0, 5).map((p) => {
            const b = computeBOM(p);
            return `<div class="glass-soft rounded-xl p-3 flex items-center gap-3 glow-hover cursor-pointer" data-proj="${p.id}">
              <span class="w-10 h-10 rounded-lg bg-gradient-to-br from-blood to-darkblood flex items-center justify-center">${icon(typeIcon(p.type), 20)}</span>
              <div class="flex-1 min-w-0">
                <div class="font-semibold text-sm truncate">${esc(p.name)}</div>
                <div class="text-[11px] text-zinc-400">${b.partsCount} ${t('pieces')} · ${fmtMoney(computeCosts(p, st.settings).finalPrice, p.currency)}</div>
              </div>
              <div class="w-28">
                <div class="flex justify-between text-[10px] text-zinc-400 mb-1"><span>${t(STAGES[p.stage])}</span><span>${stageProgress(p.stage)}%</span></div>
                <div class="bar"><i style="width:${stageProgress(p.stage)}%"></i></div>
              </div>
              <span class="text-[10px] text-zinc-500">${relTime(p.updatedAt)}</span>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- cost distribution -->
      <div class="glass neon-border rounded-2xl p-5">
        <h3 class="font-display font-bold text-lg mb-2">${t('cost_distribution')}</h3>
        <p class="text-xs text-zinc-400 mb-3">${esc(proj?.name || '')}</p>
        ${costs ? `<div class="flex justify-center">${donutChart(costs.breakdown.map((b) => ({ value: b.value, color: b.color })), { centerLabel: fmtMoney(costs.finalPrice, proj.currency), centerSub: t('final_price') })}</div>
        ${legend(costs.breakdown.map((b) => ({ label: t(b.key), color: b.color, value: fmtMoney(b.value, proj.currency) })))}` : `<p class="text-sm text-zinc-500">${t('select_project')}</p>`}
      </div>

      <!-- production status -->
      <div class="xl:col-span-2 glass neon-border rounded-2xl p-5">
        <h3 class="font-display font-bold text-lg mb-3">${t('production_status')}</h3>
        ${barChart(stageCounts, { height: 200 })}
      </div>

      <!-- quick actions -->
      <div class="glass neon-border rounded-2xl p-5">
        <h3 class="font-display font-bold text-lg mb-3">${t('quick_actions')}</h3>
        <div class="grid grid-cols-1 gap-2">
          <a href="#/design2d" class="btn btn-ghost justify-start">${icon('pen', 16)} ${t('open_2d')}</a>
          <a href="#/design3d" class="btn btn-ghost justify-start">${icon('cube', 16)} ${t('open_3d')}</a>
          <a href="#/bom" class="btn btn-ghost justify-start">${icon('list', 16)} ${t('gen_bom')}</a>
          <a href="#/ai" class="btn btn-ghost justify-start">${icon('ai', 16)} ${t('nav_ai')}</a>
        </div>
      </div>
    </div>`;

  root.querySelector('#qa-new').addEventListener('click', () => openNewProject());
  root.querySelectorAll('[data-proj]').forEach((el) => el.addEventListener('click', () => { setCurrentProject(el.dataset.proj); location.hash = '#/bom'; }));
}

function typeIcon(type) { return ({ bed: 'bed', sofa: 'sofa', mattress: 'mattress', furniture: 'furniture' }[type]) || 'cube'; }
