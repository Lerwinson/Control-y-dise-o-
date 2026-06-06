import { t } from '../i18n.js';
import { getState, createProject, duplicateProject, deleteProject, setCurrentProject, updateProject } from '../store.js';
import { TEMPLATES } from '../data.js';
import { computeBOM, computeCosts, STAGES, stageProgress } from '../calc.js';
import { icon } from '../ui/icons.js';
import { pageHeader, openModal, closeModal, confirmDialog, toast } from '../ui/ui.js';
import { fmtMoney, esc, relTime } from '../utils/helpers.js';

export function openNewProject() {
  const body = openModal(t('new_project'), `
    <form id="np-form" class="space-y-4">
      <div><label class="lbl">${t('name_lbl')}</label><input name="name" class="fld mt-1" required placeholder="Cama Queen — Cliente"/></div>
      <div><label class="lbl">${t('type')}</label>
        <select name="type" class="fld mt-1">
          <option value="bed">${t('nav_beds')}</option>
          <option value="sofa">${t('nav_sofas')}</option>
          <option value="mattress">${t('nav_mattress')}</option>
          <option value="furniture">${t('nav_furniture')}</option>
          <option value="custom">${t('lc_custom')}</option>
        </select>
      </div>
      <div><label class="lbl">${t('templates')}</label>
        <select name="template" class="fld mt-1">
          <option value="">— ${t('none')} —</option>
          ${TEMPLATES.map((tp) => `<option value="${tp.id}">${esc(tp.name)}</option>`).join('')}
        </select>
      </div>
      <div class="flex justify-end gap-2 pt-2">
        <button type="button" class="btn btn-ghost" data-close>${t('cancel')}</button>
        <button class="btn btn-primary">${t('create')}</button>
      </div>
    </form>`);
  body.querySelector('[data-close]').addEventListener('click', closeModal);
  body.querySelector('#np-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const tplId = f.get('template');
    const parts = tplId ? (TEMPLATES.find((x) => x.id === tplId)?.build() || []) : [];
    createProject({ name: f.get('name'), type: f.get('type'), parts });
    closeModal(); toast(t('created_ok'));
    location.hash = '#/bom';
  });
}

export function render(root) {
  const st = getState();
  root.innerHTML = `
    ${pageHeader(t('nav_projects'), t('overview'),
      `<button id="new-proj" class="btn btn-primary">${icon('plus', 16)} ${t('new_project')}</button>`)}
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" id="proj-grid">
      ${st.projects.map((p) => card(p, st)).join('') || empty()}
    </div>`;

  root.querySelector('#new-proj').addEventListener('click', openNewProject);
  bindCards(root);
}

function empty() { return `<div class="glass rounded-2xl p-10 text-center text-zinc-500 col-span-full">${t('none')}</div>`; }

function card(p, st) {
  const b = computeBOM(p); const c = computeCosts(p, st.settings);
  return `<div class="glass neon-border rounded-2xl p-5 glow-hover relative" data-card="${p.id}">
    <div class="flex items-start justify-between">
      <span class="w-11 h-11 rounded-xl bg-gradient-to-br from-blood to-darkblood flex items-center justify-center">${icon(typeIcon(p.type), 22)}</span>
      <div class="flex gap-1">
        <button class="btn-tool p-1.5 rounded-lg" data-act="open" data-id="${p.id}" title="${t('open')}">${icon('eye', 16)}</button>
        <button class="btn-tool p-1.5 rounded-lg" data-act="dup" data-id="${p.id}" title="${t('duplicate')}">${icon('copy', 16)}</button>
        <button class="btn-tool p-1.5 rounded-lg" data-act="del" data-id="${p.id}" title="${t('delete')}">${icon('trash', 16)}</button>
      </div>
    </div>
    <h3 class="font-semibold mt-3 truncate">${esc(p.name)}</h3>
    <div class="text-xs text-zinc-400 capitalize">${esc(p.type)} · ${b.partsCount} ${t('pieces')}</div>
    <div class="grid grid-cols-2 gap-2 mt-3 text-sm">
      <div class="glass-soft rounded-lg p-2"><div class="text-[10px] text-zinc-400">${t('final_price')}</div><div class="font-bold grad-text">${fmtMoney(c.finalPrice, p.currency)}</div></div>
      <div class="glass-soft rounded-lg p-2"><div class="text-[10px] text-zinc-400">${t('total_weight')}</div><div class="font-bold">${b.weight.toFixed(1)} kg</div></div>
    </div>
    <div class="mt-3">
      <div class="flex justify-between text-[10px] text-zinc-400 mb-1"><span>${t(STAGES[p.stage])}</span><span>${stageProgress(p.stage)}%</span></div>
      <div class="bar"><i style="width:${stageProgress(p.stage)}%"></i></div>
    </div>
    <div class="text-[10px] text-zinc-500 mt-2">${t('updated')}: ${relTime(p.updatedAt)}</div>
  </div>`;
}

function bindCards(root) {
  root.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', (e) => {
    e.stopPropagation();
    const id = b.dataset.id;
    if (b.dataset.act === 'open') { setCurrentProject(id); location.hash = '#/design3d'; }
    if (b.dataset.act === 'dup') { duplicateProject(id); toast(t('created_ok')); }
    if (b.dataset.act === 'del') confirmDialog(t('confirm_delete'), () => { deleteProject(id); toast(t('deleted_ok')); });
  }));
  root.querySelectorAll('[data-card]').forEach((c) => c.addEventListener('click', () => { setCurrentProject(c.dataset.card); location.hash = '#/bom'; }));
}

function typeIcon(type) { return ({ bed: 'bed', sofa: 'sofa', mattress: 'mattress', furniture: 'furniture' }[type]) || 'cube'; }
