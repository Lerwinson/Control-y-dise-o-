import { t } from '../i18n.js';
import { getState } from '../store.js';
import { computeCosts, computeBOM } from '../calc.js';
import { icon } from '../ui/icons.js';
import { barChart, lineChart, donutChart, legend } from '../ui/charts.js';
import { pageHeader, toast } from '../ui/ui.js';
import { fmtMoney, fmtNum } from '../utils/helpers.js';
import { exportCsvGeneric } from '../utils/export.js';

let tab = 'production';
const TABS = [
  { id: 'production', label: 'rep_production', icon: 'factory' },
  { id: 'costs', label: 'rep_costs', icon: 'money' },
  { id: 'material', label: 'rep_material', icon: 'cube' },
  { id: 'profit', label: 'profitability', icon: 'bolt' },
];

// deterministic pseudo-series for demo charts
function series(n, base, varc) { const out = []; let v = base; for (let i = 0; i < n; i++) { v = Math.max(2, v + (Math.sin(i * 1.7) * varc)); out.push(Math.round(v)); } return out; }

export function render(root) {
  const draw = () => {
    const st = getState();
    root.innerHTML = `
      ${pageHeader(t('nav_reports'), t('generate_report'),
        `<button id="exp-rep" class="btn btn-ghost">${icon('download',16)} CSV</button>`)}
      <div class="flex flex-wrap gap-2 mb-5">
        ${TABS.map((x) => `<button class="btn ${tab === x.id ? 'btn-primary' : 'btn-tool'}" data-tab="${x.id}">${icon(x.icon, 14)} ${t(x.label)}</button>`).join('')}
      </div>
      <div id="rep-body"></div>`;
    root.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', () => { tab = b.dataset.tab; draw(); }));
    root.querySelector('#exp-rep').addEventListener('click', () => { exportTab(st); toast(t('exported_ok')); });
    body(root.querySelector('#rep-body'), st);
  };
  draw();
}

function body(el, st) {
  if (tab === 'production') {
    const daily = ['L','M','X','J','V','S','D'].map((d, i) => ({ label: d, value: series(7, 6, 4)[i] }));
    const weekly = Array.from({ length: 8 }, (_, i) => ({ label: 'S' + (i + 1), value: series(8, 22, 9)[i] }));
    const monthly = ['Ene','Feb','Mar','Abr','May','Jun'].map((m, i) => ({ label: m, value: series(6, 80, 25)[i] }));
    el.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        ${panel(t('daily'), barChart(daily, { height: 200 }))}
        ${panel(t('weekly'), lineChart(weekly, { height: 200 }))}
        ${panel(t('monthly'), barChart(monthly, { height: 200 }))}
        ${panel(t('production_status'), stageDonut(st))}
      </div>`;
  } else if (tab === 'costs') {
    const data = st.projects.map((p) => ({ label: p.name.slice(0, 8), value: Math.round(computeCosts(p, st.settings).cost) }));
    el.innerHTML = `<div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      ${panel(t('cost_breakdown'), barChart(data, { height: 230 }))}
      ${panel(t('cost_distribution'), aggDonut(st))}
    </div>`;
  } else if (tab === 'material') {
    let wood = 0, foam = 0, fabric = 0, hw = 0, weight = 0;
    st.projects.forEach((p) => { const b = computeBOM(p); wood += b.woodM3; foam += b.foamM3; fabric += b.fabricM2; hw += b.hardware; weight += b.weight; });
    const cards = [
      [t('wood_consumption'), fmtNum(wood, 3) + ' m³', 'cube'],
      [t('foam_consumption'), fmtNum(foam, 3) + ' m³', 'layers'],
      [t('fabric_consumption'), fmtNum(fabric, 2) + ' m²', 'design'],
      [t('hardware_count'), hw, 'settings'],
      [t('total_weight'), fmtNum(weight, 1) + ' kg', 'bolt'],
    ];
    el.innerHTML = `<div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
      ${cards.map((c) => `<div class="kpi glass neon-border rounded-xl p-4"><div class="text-red-300">${icon(c[2], 20)}</div><div class="text-xl font-display font-black grad-text mt-2">${c[1]}</div><div class="text-[10px] text-zinc-400">${c[0]}</div></div>`).join('')}
    </div>
    ${panel(t('rep_material') + ' / ' + t('nav_projects'), barChart(st.projects.map((p) => ({ label: p.name.slice(0, 8), value: Math.round(computeBOM(p).weight) })), { height: 230 }))}`;
  } else if (tab === 'profit') {
    const data = st.projects.map((p) => { const c = computeCosts(p, st.settings); return { label: p.name.slice(0, 8), value: Math.round(c.profit), display: fmtMoney(c.profit, p.currency) }; });
    const totalProfit = st.projects.reduce((s, p) => s + computeCosts(p, st.settings).profit, 0);
    const totalRev = st.projects.reduce((s, p) => s + computeCosts(p, st.settings).finalPrice, 0);
    el.innerHTML = `
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <div class="kpi glass neon-border rounded-xl p-4"><div class="text-[10px] text-zinc-400">${t('final_price')}</div><div class="text-xl font-display font-black grad-text">${fmtMoney(totalRev, st.settings.currency)}</div></div>
        <div class="kpi glass neon-border rounded-xl p-4"><div class="text-[10px] text-zinc-400">${t('margin')}</div><div class="text-xl font-display font-black text-yellow-300">${fmtMoney(totalProfit, st.settings.currency)}</div></div>
        <div class="kpi glass neon-border rounded-xl p-4"><div class="text-[10px] text-zinc-400">${t('profitability')}</div><div class="text-xl font-display font-black text-green-300">${fmtNum(totalRev ? (totalProfit / totalRev) * 100 : 0, 1)}%</div></div>
      </div>
      ${panel(t('profitability') + ' / ' + t('nav_projects'), barChart(data, { height: 230 }))}`;
  }
}

function panel(title, inner) { return `<div class="glass neon-border rounded-2xl p-5"><h3 class="font-display font-bold mb-3">${title}</h3>${inner}</div>`; }
function stageDonut(st) {
  const { STAGES } = { STAGES: ['st_design','st_cut','st_assembly','st_upholstery','st_finish','st_done'] };
  const colors = ['#ff0000','#ff5a5a','#b30000','#8b0000','#ff8a3a','#ffd23a'];
  const data = STAGES.map((s, i) => ({ value: st.projects.filter((p) => p.stage === i).length || 0.001, color: colors[i] }));
  return `<div class="flex justify-center">${donutChart(data, { centerLabel: st.projects.length, centerSub: t('nav_projects') })}</div>
    ${legend(STAGES.map((s, i) => ({ label: t(s), color: colors[i] })))}`;
}
function aggDonut(st) {
  let agg = {};
  st.projects.forEach((p) => { const c = computeCosts(p, st.settings); c.breakdown.forEach((b) => { agg[b.key] = (agg[b.key] || 0) + b.value; }); });
  const colors = { raw_material: '#ff0000', labor: '#ff5a5a', transport: '#b30000', overhead: '#8b0000', taxes: '#ff8a3a', margin: '#ffd23a' };
  const data = Object.entries(agg).map(([k, v]) => ({ value: v, color: colors[k] }));
  return `<div class="flex justify-center">${donutChart(data, { size: 200 })}</div>${legend(Object.entries(agg).map(([k]) => ({ label: t(k), color: colors[k] })))}`;
}

function exportTab(st) {
  const rows = [['Proyecto', 'Costo', 'Precio final', 'Margen', 'Peso(kg)', 'Etapa']];
  const STAGES = ['st_design','st_cut','st_assembly','st_upholstery','st_finish','st_done'];
  st.projects.forEach((p) => { const c = computeCosts(p, st.settings); const b = computeBOM(p); rows.push([`"${p.name}"`, c.cost.toFixed(2), c.finalPrice.toFixed(2), p.margin + '%', b.weight.toFixed(1), t(STAGES[p.stage])]); });
  exportCsvGeneric(`reporte_${tab}.csv`, rows);
}
