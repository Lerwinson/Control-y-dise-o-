import { t } from '../i18n.js';
import { getState, currentProject, addPart, updatePart, deletePart } from '../store.js';
import { MATERIALS } from '../data.js';
import { computeBOM, partTotals } from '../calc.js';
import { icon } from '../ui/icons.js';
import { pageHeader, openModal, closeModal, confirmDialog, toast } from '../ui/ui.js';
import { fmtMoney, fmtNum, esc } from '../utils/helpers.js';
import { exportBOMCsv, printBOM } from '../utils/export.js';

const CATS = ['frame', 'reinforcement', 'crossbar', 'panel', 'support', 'foam', 'fabric', 'hardware', 'leg'];
const catLabel = (c) => t('cat_' + c);

export function render(root) {
  const proj = currentProject();
  if (!proj) { root.innerHTML = `<p class="text-zinc-500">${t('select_project')}</p>`; return; }
  draw(root, proj);
}

function draw(root, proj) {
  const bom = computeBOM(proj);
  const st = getState();
  const summary = [
    { label: t('parts_count'), value: bom.pieces, icon: 'list' },
    { label: t('wood_consumption'), value: fmtNum(bom.woodM3, 3) + ' m³', icon: 'cube' },
    { label: t('foam_consumption'), value: fmtNum(bom.foamM3, 3) + ' m³', icon: 'layers' },
    { label: t('fabric_consumption'), value: fmtNum(bom.fabricM2, 2) + ' m²', icon: 'design' },
    { label: t('hardware_count'), value: bom.hardware, icon: 'settings' },
    { label: t('total_weight'), value: fmtNum(bom.weight, 1) + ' kg', icon: 'bolt' },
  ];

  root.innerHTML = `
    ${pageHeader(t('bom_title'), `${esc(proj.name)} · ${t('auto_calc')}`,
      `<button id="add-part" class="btn btn-primary">${icon('plus', 16)} ${t('add')}</button>
       <button id="exp-csv" class="btn btn-ghost">${icon('download', 16)} CSV</button>
       <button id="print-bom" class="btn btn-ghost">${icon('report', 16)} PDF</button>`)}

    <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
      ${summary.map((s) => `<div class="kpi glass neon-border rounded-xl p-3">
        <div class="text-red-300">${icon(s.icon, 18)}</div>
        <div class="text-lg font-display font-bold grad-text mt-1">${s.value}</div>
        <div class="text-[10px] text-zinc-400">${s.label}</div>
      </div>`).join('')}
    </div>

    <div class="glass neon-border rounded-2xl overflow-hidden">
      <div class="overflow-x-auto custom-scroll max-h-[55vh]">
        <table class="tech">
          <thead><tr>
            <th>#</th><th>${t('code')}</th><th>${t('name_lbl')}</th><th>${t('category')}</th><th>${t('material')}</th>
            <th>${t('length')}</th><th>${t('width')}</th><th>${t('thickness')}</th><th>${t('quantity')}</th>
            <th>${t('weight')}</th><th>${t('cost')}</th><th>${t('notes')}</th><th></th>
          </tr></thead>
          <tbody>
            ${bom.rows.map((r) => row(r)).join('') || `<tr><td colspan="13" class="text-center text-zinc-500 py-8">${t('none')}</td></tr>`}
          </tbody>
          <tfoot><tr class="font-bold">
            <td colspan="9" class="text-right text-red-300 uppercase text-xs">${t('total')}</td>
            <td>${fmtNum(bom.weight, 1)} kg</td>
            <td class="grad-text">${fmtMoney(bom.materialCost, proj.currency)}</td>
            <td colspan="2"></td>
          </tr></tfoot>
        </table>
      </div>
    </div>`;

  root.querySelector('#add-part').addEventListener('click', () => partModal(proj));
  root.querySelector('#exp-csv').addEventListener('click', () => { exportBOMCsv(proj, bom); toast(t('exported_ok')); });
  root.querySelector('#print-bom').addEventListener('click', () => printBOM(proj, bom, st.settings));
  root.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => partModal(proj, proj.parts.find((p) => p.id === b.dataset.edit))));
  root.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', () => confirmDialog(t('confirm_delete'), () => { deletePart(proj.id, b.dataset.del); toast(t('deleted_ok')); rerender(root); })));
  // inline qty edit
  root.querySelectorAll('[data-qty]').forEach((inp) => inp.addEventListener('change', () => {
    updatePart(proj.id, inp.dataset.qty, { qty: Math.max(1, parseInt(inp.value) || 1) }); rerender(root);
  }));
}

function rerender(root) { draw(root, currentProject()); }

function row(r) {
  const colorDot = `<span class="inline-block w-3 h-3 rounded-sm mr-2 align-middle" style="background:${r.color};box-shadow:0 0 5px ${r.color}"></span>`;
  return `<tr>
    <td class="text-red-400 font-bold">${r.idx}</td>
    <td class="font-mono text-xs">${esc(r.code)}</td>
    <td>${colorDot}${esc(r.name)}</td>
    <td><span class="badge" style="background:rgba(255,0,0,0.12);color:#fca">${catLabel(r.category)}</span></td>
    <td class="text-zinc-300">${esc(r.materialName)}</td>
    <td>${r.length}</td><td>${r.width}</td><td>${r.thickness}</td>
    <td><input type="number" min="1" value="${r.qty}" data-qty="${r.id}" class="fld py-1 px-2 w-16 text-center"/></td>
    <td>${fmtNum(r.weight, 2)} kg</td>
    <td class="grad-text font-semibold">${fmtMoney(r.cost, currentProject().currency)}</td>
    <td class="text-xs text-zinc-500 max-w-[120px] truncate">${esc(r.notes)}</td>
    <td><div class="flex gap-1">
      <button class="btn-tool p-1.5 rounded-lg" data-edit="${r.id}">${icon('pen', 14)}</button>
      <button class="btn-tool p-1.5 rounded-lg" data-del="${r.id}">${icon('trash', 14)}</button>
    </div></td>
  </tr>`;
}

function partModal(proj, part = null) {
  const p = part || {};
  const body = openModal(part ? t('edit') + ' · ' + t('material') : t('add') + ' ' + t('material'), `
    <form id="part-form" class="grid grid-cols-2 gap-4">
      <div><label class="lbl">${t('code')}</label><input name="code" class="fld mt-1" value="${esc(p.code || '')}" placeholder="BF-01"/></div>
      <div><label class="lbl">${t('name_lbl')}</label><input name="name" class="fld mt-1" value="${esc(p.name || '')}" required/></div>
      <div><label class="lbl">${t('category')}</label><select name="category" class="fld mt-1">${CATS.map((c) => `<option value="${c}" ${p.category === c ? 'selected' : ''}>${catLabel(c)}</option>`).join('')}</select></div>
      <div><label class="lbl">${t('material')}</label><select name="material" class="fld mt-1">${MATERIALS.map((m) => `<option value="${m.key}" ${p.material === m.key ? 'selected' : ''}>${esc(m.name)}</option>`).join('')}</select></div>
      <div><label class="lbl">${t('length')} (mm)</label><input name="length" type="number" class="fld mt-1" value="${p.length ?? 1000}"/></div>
      <div><label class="lbl">${t('width')} (mm)</label><input name="width" type="number" class="fld mt-1" value="${p.width ?? 50}"/></div>
      <div><label class="lbl">${t('thickness')} (mm)</label><input name="thickness" type="number" class="fld mt-1" value="${p.thickness ?? 25}"/></div>
      <div><label class="lbl">${t('quantity')}</label><input name="qty" type="number" min="1" class="fld mt-1" value="${p.qty ?? 1}"/></div>
      <div><label class="lbl">Color</label><input name="color" type="color" class="fld mt-1 h-10" value="${p.color || '#c98a4b'}"/></div>
      <div><label class="lbl">${t('weight')} (kg, auto)</label><input name="weightOverride" type="number" step="0.01" class="fld mt-1" value="${p.weightOverride ?? ''}" placeholder="auto"/></div>
      <div class="col-span-2"><label class="lbl">${t('notes')}</label><textarea name="notes" class="fld mt-1" rows="2">${esc(p.notes || '')}</textarea></div>
      <div class="col-span-2 flex justify-end gap-2 pt-1">
        <button type="button" class="btn btn-ghost" data-close>${t('cancel')}</button>
        <button class="btn btn-primary">${t('save')}</button>
      </div>
    </form>`, { wide: true });
  body.querySelector('[data-close]').addEventListener('click', closeModal);
  body.querySelector('#part-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const data = {
      code: f.get('code'), name: f.get('name'), category: f.get('category'), material: f.get('material'),
      length: +f.get('length'), width: +f.get('width'), thickness: +f.get('thickness'), qty: Math.max(1, +f.get('qty')),
      color: f.get('color'), notes: f.get('notes'),
      weightOverride: f.get('weightOverride') ? +f.get('weightOverride') : null,
    };
    if (part) updatePart(proj.id, part.id, data); else addPart(proj.id, data);
    closeModal(); toast(t('saved_ok'));
    draw(document.querySelector('#view > div'), currentProject());
  });
}
