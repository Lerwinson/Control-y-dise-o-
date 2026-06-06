import { t } from '../i18n.js';
import { getState, currentProject, updateProject, updateSettings } from '../store.js';
import { computeCosts } from '../calc.js';
import { icon } from '../ui/icons.js';
import { donutChart, barChart, legend } from '../ui/charts.js';
import { pageHeader, toast } from '../ui/ui.js';
import { fmtMoney, esc } from '../utils/helpers.js';

export function render(root) {
  const proj = currentProject();
  if (!proj) { root.innerHTML = `<p class="text-zinc-500">${t('select_project')}</p>`; return; }
  draw(root, proj);
}

function draw(root, proj) {
  const st = getState();
  const c = computeCosts(proj, st.settings);
  const rates = [
    { key: 'labor', label: 'labor', field: 'laborRate' },
    { key: 'overhead', label: 'overhead', field: 'overheadRate' },
    { key: 'transport', label: 'transport', field: 'transportRate' },
    { key: 'taxes', label: 'taxes', field: 'taxRate' },
  ];

  root.innerHTML = `
    ${pageHeader(t('nav_costs'), esc(proj.name))}
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5">
      <div class="glass neon-border rounded-2xl p-5">
        <h3 class="font-display font-bold mb-3">${t('cost_breakdown')}</h3>
        <div class="flex justify-center">${donutChart(c.breakdown.map((b) => ({ value: b.value, color: b.color })), { size: 200, centerLabel: fmtMoney(c.finalPrice, proj.currency), centerSub: t('final_price') })}</div>
        ${legend(c.breakdown.map((b) => ({ label: t(b.key), color: b.color, value: fmtMoney(b.value, proj.currency) })))}
      </div>

      <div class="xl:col-span-2 glass neon-border rounded-2xl p-5">
        <h3 class="font-display font-bold mb-3">${t('cost_distribution')}</h3>
        ${barChart(c.breakdown.map((b) => ({ label: t(b.key), value: Math.round(b.value), display: fmtMoney(b.value, proj.currency) })), { height: 220 })}
      </div>

      <div class="glass neon-border rounded-2xl p-5">
        <h3 class="font-display font-bold mb-4">${t('apply')} (%)</h3>
        <div class="space-y-4" id="rate-controls">
          ${rates.map((r) => `<div>
            <div class="flex justify-between text-xs mb-1"><span class="text-zinc-300">${t(r.label)}</span><span class="text-red-300 font-bold" id="lbl-${r.field}">${Math.round((st.settings[r.field] || 0) * 100)}%</span></div>
            <input type="range" min="0" max="100" value="${Math.round((st.settings[r.field] || 0) * 100)}" data-rate="${r.field}" class="w-full accent-red-600"/>
          </div>`).join('')}
          <div>
            <div class="flex justify-between text-xs mb-1"><span class="text-zinc-300">${t('margin')}</span><span class="text-yellow-300 font-bold" id="lbl-margin">${proj.margin}%</span></div>
            <input type="range" min="0" max="120" value="${proj.margin}" data-margin class="w-full accent-yellow-500"/>
          </div>
        </div>
      </div>

      <div class="xl:col-span-2 glass neon-border rounded-2xl p-5">
        <h3 class="font-display font-bold mb-4">${t('final_price')}</h3>
        <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
          ${kpi(t('raw_material'), c.raw, proj.currency)}
          ${kpi(t('labor'), c.labor, proj.currency)}
          ${kpi(t('overhead') + ' + ' + t('transport'), c.overhead + c.transport, proj.currency)}
          ${kpi(t('taxes'), c.taxes, proj.currency)}
          ${kpi(t('margin') + ' (' + Math.round(c.marginPct) + '%)', c.profit, proj.currency, 'yellow')}
          ${kpi(t('final_price'), c.finalPrice, proj.currency, 'grad')}
        </div>
        <div class="mt-4 glass-soft rounded-xl p-4 flex items-center justify-between">
          <span class="text-sm text-zinc-300">${t('unit_price')} (${c.bom.partsCount} ${t('pieces')})</span>
          <span class="text-2xl font-display font-black grad-text">${fmtMoney(c.finalPrice, proj.currency)}</span>
        </div>
      </div>
    </div>`;

  root.querySelectorAll('[data-rate]').forEach((s) => s.addEventListener('input', () => {
    document.getElementById('lbl-' + s.dataset.rate).textContent = s.value + '%';
    updateSettings({ [s.dataset.rate]: +s.value / 100 });
    draw(root, currentProject());
  }));
  const mg = root.querySelector('[data-margin]');
  mg.addEventListener('input', () => {
    document.getElementById('lbl-margin').textContent = mg.value + '%';
    updateProject(proj.id, { margin: +mg.value });
    draw(root, currentProject());
  });
}

function kpi(label, value, cur, kind = '') {
  const cls = kind === 'grad' ? 'grad-text' : kind === 'yellow' ? 'text-yellow-300' : 'text-white';
  return `<div class="glass-soft rounded-xl p-3">
    <div class="text-[10px] text-zinc-400">${esc(label)}</div>
    <div class="text-lg font-display font-bold ${cls}">${fmtMoney(value, cur)}</div>
  </div>`;
}
