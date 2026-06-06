import { t } from '../i18n.js';
import { getState, advanceStage, pushNotification } from '../store.js';
import { STAGES, stageProgress } from '../calc.js';
import { icon } from '../ui/icons.js';
import { pageHeader, toast } from '../ui/ui.js';
import { esc, relTime } from '../utils/helpers.js';

const STAGE_ICON = ['design', 'ruler', 'cube', 'sofa', 'spark', 'check'];

export function render(root) {
  draw(root);
}

function draw(root) {
  const st = getState();
  const active = st.projects.filter((p) => p.stage < 5);
  const done = st.projects.filter((p) => p.stage >= 5);

  root.innerHTML = `
    ${pageHeader(t('nav_production'), t('production_status'))}

    <!-- pipeline overview -->
    <div class="glass neon-border rounded-2xl p-5 mb-6 overflow-x-auto custom-scroll">
      <div class="flex items-center gap-2 min-w-[700px]">
        ${STAGES.map((s, i) => `
          <div class="flex-1">
            <div class="glass-soft rounded-xl p-3 text-center relative">
              <div class="text-red-400 flex justify-center">${icon(STAGE_ICON[i], 22)}</div>
              <div class="text-xs font-semibold mt-1">${t(s)}</div>
              <div class="text-2xl font-display font-black grad-text">${st.projects.filter((p) => p.stage === i).length}</div>
            </div>
            ${i < STAGES.length - 1 ? `<div class="text-red-500/40 text-center -my-1">${icon('chevron', 16)}</div>` : ''}
          </div>`).join('')}
      </div>
    </div>

    <h3 class="font-display font-bold mb-3 text-red-300">${t('active_projects')}</h3>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
      ${active.map((p) => prodCard(p)).join('') || `<div class="text-zinc-500 text-sm">${t('none')}</div>`}
    </div>

    ${done.length ? `<h3 class="font-display font-bold mb-3 text-green-300">${t('st_done')}</h3>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">${done.map((p) => prodCard(p)).join('')}</div>` : ''}`;

  root.querySelectorAll('[data-adv]').forEach((b) => b.addEventListener('click', () => {
    const id = b.dataset.adv;
    const p = st.projects.find((x) => x.id === id);
    advanceStage(id);
    const np = getState().projects.find((x) => x.id === id);
    pushNotification(`"${p.name}" → ${t(STAGES[np.stage])}`);
    toast(t('saved_ok'));
    draw(root);
  }));
}

function prodCard(p) {
  const prog = stageProgress(p.stage);
  const isDone = p.stage >= 5;
  return `<div class="glass neon-border rounded-2xl p-4">
    <div class="flex items-center justify-between mb-3">
      <div class="font-semibold truncate">${esc(p.name)}</div>
      <span class="badge" style="background:${isDone ? 'rgba(40,209,124,0.15)' : 'rgba(255,0,0,0.15)'};color:${isDone ? '#5ef0a0' : '#fca'}">${t(STAGES[p.stage])}</span>
    </div>
    <div class="flex items-center gap-1 mb-2">
      ${STAGES.map((s, i) => `<div class="flex-1 h-2 rounded-full ${i <= p.stage ? 'bg-gradient-to-r from-blood to-darkblood' : 'bg-white/10'}" title="${t(s)}"></div>`).join('')}
    </div>
    <div class="flex items-center justify-between mt-3">
      <span class="text-sm text-zinc-400">${t('progress')}: <b class="grad-text">${prog}%</b></span>
      <span class="text-[10px] text-zinc-500">${relTime(p.updatedAt)}</span>
      ${!isDone ? `<button class="btn btn-primary text-xs" data-adv="${p.id}">${icon('chevron', 14)} ${t('advance_stage')}</button>` : `<span class="text-green-400">${icon('check', 18)}</span>`}
    </div>
  </div>`;
}
