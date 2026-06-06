import { t, setLang, getLang, LANGS } from '../i18n.js';
import { getState, updateSettings, exportBackup, importBackup, resetAll, getVersions, currentProject } from '../store.js';
import { icon } from '../ui/icons.js';
import { pageHeader, toast, confirmDialog } from '../ui/ui.js';
import { download, esc, relTime } from '../utils/helpers.js';

const ROLES = [
  { key: 'role_admin', perms: ['*'] },
  { key: 'role_designer', perms: ['design', 'bom', 'library'] },
  { key: 'role_production', perms: ['production', 'reports'] },
  { key: 'role_viewer', perms: ['view'] },
];

export function render(root) {
  const st = getState();
  const s = st.settings;
  const proj = currentProject();
  const versions = proj ? getVersions(proj.id) : [];

  root.innerHTML = `
    ${pageHeader(t('nav_settings'), t('set_general'))}
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- general -->
      <div class="glass neon-border rounded-2xl p-5">
        <h3 class="font-display font-bold mb-4 flex items-center gap-2">${icon('settings', 18)} ${t('set_general')}</h3>
        <div class="space-y-3">
          <div><label class="lbl">${t('set_company')}</label><input id="set-company" class="fld mt-1" value="${esc(s.company)}"/></div>
          <div class="grid grid-cols-2 gap-3">
            <div><label class="lbl">${t('set_currency')}</label>
              <select id="set-currency" class="fld mt-1">${['USD','EUR','BRL','MXN','COP'].map((c) => `<option ${s.currency === c ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
            <div><label class="lbl">${t('set_units')}</label>
              <select id="set-units" class="fld mt-1">${['mm','cm','in'].map((u) => `<option ${s.units === u ? 'selected' : ''}>${u}</option>`).join('')}</select></div>
          </div>
          <div><label class="lbl">${t('language')}</label>
            <select id="set-lang" class="fld mt-1">${LANGS.map((l) => `<option value="${l.code}" ${getLang() === l.code ? 'selected' : ''}>${l.flag} ${l.label}</option>`).join('')}</select></div>
          <label class="flex items-center gap-2 text-sm mt-2"><input type="checkbox" id="set-ver" ${s.versioning ? 'checked' : ''} class="accent-red-600"/> ${t('versioning')}</label>
          <button id="save-set" class="btn btn-primary w-full justify-center mt-2">${icon('check', 16)} ${t('set_save')}</button>
        </div>
      </div>

      <!-- roles -->
      <div class="glass neon-border rounded-2xl p-5">
        <h3 class="font-display font-bold mb-4 flex items-center gap-2">${icon('shield', 18)} ${t('set_roles')}</h3>
        <div class="space-y-2">
          ${ROLES.map((r) => `<div class="glass-soft rounded-xl p-3 flex items-center justify-between">
            <div><div class="font-semibold text-sm">${t(r.key)}</div>
            <div class="text-[10px] text-zinc-400">${r.perms.map((p) => `<span class="badge mr-1" style="background:rgba(255,0,0,0.12);color:#fca">${p}</span>`).join('')}</div></div>
            <span class="badge" style="background:rgba(40,209,124,0.12);color:#5ef0a0">${icon('check', 12)}</span>
          </div>`).join('')}
        </div>
      </div>

      <!-- backup -->
      <div class="glass neon-border rounded-2xl p-5">
        <h3 class="font-display font-bold mb-4 flex items-center gap-2">${icon('download', 18)} ${t('set_backup')}</h3>
        <div class="flex flex-wrap gap-2">
          <button id="bk-now" class="btn btn-ghost">${icon('download', 16)} ${t('backup_now')}</button>
          <label class="btn btn-ghost cursor-pointer">${icon('copy', 16)} ${t('restore')}<input id="bk-restore" type="file" accept="application/json" class="hidden"/></label>
          <button id="reset" class="btn btn-ghost text-red-300">${icon('trash', 16)} Reset</button>
        </div>
        <p class="text-[11px] text-zinc-500 mt-3">${t('versioning')}: ${s.versioning ? '✓' : '✕'} · localStorage</p>
      </div>

      <!-- versions -->
      <div class="glass neon-border rounded-2xl p-5">
        <h3 class="font-display font-bold mb-4 flex items-center gap-2">${icon('layers', 18)} ${t('versioning')}</h3>
        <p class="text-xs text-zinc-400 mb-2">${esc(proj?.name || '')}</p>
        <div class="space-y-1 max-h-48 overflow-y-auto custom-scroll">
          ${versions.length ? versions.map((v, i) => `<div class="glass-soft rounded-lg px-3 py-2 text-xs flex justify-between"><span>v${versions.length - i} · ${v.snapshot.parts.length} ${t('pieces')}</span><span class="text-zinc-500">${relTime(v.ts)}</span></div>`).join('') : `<p class="text-xs text-zinc-500">${t('none')}</p>`}
        </div>
      </div>
    </div>

    <div class="text-center mt-8 text-xs tracking-[0.3em] text-red-400/70">
      ${t('developed_by')}: <span class="font-bold grad-text">LERWINSON MENDOZA</span>
    </div>`;

  root.querySelector('#save-set').addEventListener('click', () => {
    updateSettings({
      company: root.querySelector('#set-company').value,
      currency: root.querySelector('#set-currency').value,
      units: root.querySelector('#set-units').value,
      versioning: root.querySelector('#set-ver').checked,
    });
    const lang = root.querySelector('#set-lang').value;
    if (lang !== getLang()) setLang(lang);
    toast(t('saved_ok'));
  });
  root.querySelector('#bk-now').addEventListener('click', () => { download('fsdp_backup.json', exportBackup(), 'application/json'); toast(t('exported_ok')); });
  root.querySelector('#bk-restore').addEventListener('change', (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { importBackup(reader.result) ? toast(t('saved_ok')) : toast('Error', 'err'); };
    reader.readAsText(file);
  });
  root.querySelector('#reset').addEventListener('click', () => confirmDialog(t('confirm_delete'), () => { resetAll(); location.reload(); }));
}
