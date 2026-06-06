// App bootstrap: auth gate, layout, hash router, language wiring
import { t, getLang, setLang, onLangChange, LANGS } from './i18n.js';
import { getState, subscribe, login, logout, currentProject, setCurrentProject,
         markNotificationsRead, createProject } from './store.js';
import { icon } from './ui/icons.js';
import { toast, openModal, closeModal } from './ui/ui.js';
import { esc, relTime } from './utils/helpers.js';

const NAV = [
  { section: 'sec_main', items: [
    { id: 'home', label: 'nav_home', icon: 'home' },
    { id: 'projects', label: 'nav_projects', icon: 'folder' },
    { id: 'designs', label: 'nav_designs', icon: 'design' },
  ]},
  { section: 'sec_catalog', items: [
    { id: 'sofas', label: 'nav_sofas', icon: 'sofa' },
    { id: 'beds', label: 'nav_beds', icon: 'bed' },
    { id: 'mattress', label: 'nav_mattress', icon: 'mattress' },
    { id: 'furniture', label: 'nav_furniture', icon: 'furniture' },
    { id: 'library', label: 'nav_library', icon: 'library' },
  ]},
  { section: 'sec_design', items: [
    { id: 'design2d', label: 'nav_design2d', icon: 'pen' },
    { id: 'design3d', label: 'nav_design3d', icon: 'cube' },
    { id: 'exploded', label: 'nav_exploded', icon: 'explode' },
  ]},
  { section: 'sec_manufacturing', items: [
    { id: 'bom', label: 'nav_bom', icon: 'list' },
    { id: 'costs', label: 'nav_costs', icon: 'money' },
    { id: 'production', label: 'nav_production', icon: 'factory' },
    { id: 'reports', label: 'nav_reports', icon: 'report' },
  ]},
  { section: 'sec_system', items: [
    { id: 'ai', label: 'nav_ai', icon: 'ai' },
    { id: 'settings', label: 'nav_settings', icon: 'settings' },
  ]},
];

const ROUTES = {
  home: () => import('./modules/dashboard.js'),
  projects: () => import('./modules/projects.js'),
  designs: () => import('./modules/projects.js'),
  sofas: () => import('./modules/catalog.js'),
  beds: () => import('./modules/catalog.js'),
  mattress: () => import('./modules/catalog.js'),
  furniture: () => import('./modules/catalog.js'),
  library: () => import('./modules/library.js'),
  design2d: () => import('./modules/designer2d.js'),
  design3d: () => import('./modules/designer3d.js'),
  exploded: () => import('./modules/designer3d.js'),
  bom: () => import('./modules/bom.js'),
  costs: () => import('./modules/costs.js'),
  production: () => import('./modules/production.js'),
  reports: () => import('./modules/reports.js'),
  ai: () => import('./modules/ai.js'),
  settings: () => import('./modules/settings.js'),
};

let sidebarCollapsed = false;

function currentRoute() { return (location.hash.replace('#/', '') || 'home').split('?')[0]; }

// ---------------- AUTH ----------------
function renderAuth(mode = 'login') {
  const el = document.getElementById('auth-screen');
  el.innerHTML = `
    <div class="glass neon-border iridescent rounded-3xl w-full max-w-md p-8 fade-in relative">
      <div class="text-center mb-7">
        <div class="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blood to-darkblood flex items-center justify-center shadow-neon mb-4">
          ${icon('cube', 34)}
        </div>
        <h1 class="font-display font-black text-2xl grad-text neon-text">FURNITURE STRUCTURE</h1>
        <p class="font-display tracking-[0.3em] text-red-400 text-sm">DESIGNER&nbsp;PRO</p>
        <p class="text-xs text-zinc-400 mt-2">${t('tagline')}</p>
      </div>
      <form id="auth-form" class="space-y-4">
        ${mode === 'register' ? `<div><label class="lbl">${t('name')}</label><input class="fld mt-1" name="name" required placeholder="Lerwinson Mendoza"/></div>` : ''}
        <div><label class="lbl">${t('email')}</label><input class="fld mt-1" name="email" type="email" required placeholder="correo@empresa.com"/></div>
        <div><label class="lbl">${t('password')}</label><input class="fld mt-1" name="password" type="password" required placeholder="••••••••"/></div>
        <button class="btn btn-primary w-full justify-center text-base py-3">${mode === 'register' ? t('register') : t('enter')}</button>
      </form>
      <div class="text-center text-xs text-zinc-400 mt-5 space-y-1">
        <button id="auth-toggle" class="text-red-300 hover:text-white underline-offset-2 hover:underline">
          ${mode === 'register' ? t('have_account') + ' ' + t('login') : t('no_account') + ' ' + t('register')}
        </button>
        <p class="text-zinc-600">${t('demo_hint')}</p>
      </div>
      <div class="absolute -bottom-9 left-0 right-0 text-center text-[10px] tracking-widest text-red-400/70">
        ${t('developed_by')}: <span class="font-bold text-red-300">LERWINSON MENDOZA</span>
      </div>
    </div>`;
  el.querySelector('#auth-toggle').addEventListener('click', () => renderAuth(mode === 'register' ? 'login' : 'register'));
  el.querySelector('#auth-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    login(f.get('email'), f.get('name'));
    toast(t('welcome') + ', ' + getState().user.name);
    boot();
  });
}

// ---------------- LAYOUT ----------------
function renderTopbar() {
  const st = getState(); const proj = currentProject();
  const unread = st.notifications.filter((n) => !n.read).length;
  const tb = document.getElementById('topbar');
  tb.className = 'glass border-b border-red-900/40 px-3 md:px-5 h-16 flex items-center gap-3 shrink-0 z-30';
  tb.innerHTML = `
    <button id="toggle-sb" class="btn-tool p-2 rounded-lg">${icon('menu', 20)}</button>
    <div class="hidden md:flex items-center gap-2 font-display font-black text-lg grad-text">
      <span class="text-blood">${icon('cube', 22)}</span> FSD<span class="text-red-300">PRO</span>
    </div>
    <div class="flex-1 max-w-xl relative">
      <span class="absolute left-3 top-1/2 -translate-y-1/2 text-red-400">${icon('search', 18)}</span>
      <input id="global-search" class="fld pl-10" placeholder="${t('search_ph')}"/>
      <div id="search-results" class="hidden absolute mt-2 w-full glass neon-border rounded-xl p-2 z-40 max-h-72 overflow-y-auto custom-scroll"></div>
    </div>
    <div class="flex items-center gap-1.5 ml-auto">
      <div class="hidden sm:flex items-center gap-1.5 glass-soft px-3 py-1.5 rounded-full text-xs">
        <span class="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
        <span class="text-green-300">${t('online')}</span>
      </div>
      <div class="relative">
        <button id="lang-btn" class="btn-tool p-2 rounded-lg" title="${t('language')}">${icon('globe', 20)}</button>
        <div id="lang-menu" class="hidden absolute right-0 mt-2 glass neon-border rounded-xl p-1 z-40 w-40">
          ${LANGS.map((l) => `<button data-lang="${l.code}" class="w-full text-left px-3 py-2 rounded-lg hover:bg-red-600/20 text-sm flex items-center gap-2 ${getLang() === l.code ? 'text-red-300' : 'text-zinc-300'}">${l.flag} ${l.label}</button>`).join('')}
        </div>
      </div>
      <div class="relative">
        <button id="notif-btn" class="btn-tool p-2 rounded-lg relative">${icon('bell', 20)}
          ${unread ? `<span class="absolute -top-1 -right-1 bg-blood text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-neon">${unread}</span>` : ''}
        </button>
        <div id="notif-menu" class="hidden absolute right-0 mt-2 glass neon-border rounded-xl p-2 z-40 w-80 max-h-96 overflow-y-auto custom-scroll">
          <div class="px-2 py-1 text-xs font-bold text-red-300 uppercase">${t('notifications')}</div>
          ${st.notifications.map((n) => `<div class="px-2 py-2 rounded-lg ${n.read ? 'opacity-60' : 'bg-red-600/10'} text-sm">${esc(n.text)}<div class="text-[10px] text-zinc-500 mt-0.5">${relTime(n.ts)}</div></div>`).join('') || `<div class="p-3 text-xs text-zinc-500">—</div>`}
        </div>
      </div>
      <div class="relative">
        <button id="profile-btn" class="flex items-center gap-2 btn-tool pl-1 pr-3 py-1 rounded-full">
          <span class="w-8 h-8 rounded-full bg-gradient-to-br from-blood to-darkblood flex items-center justify-center font-bold text-sm">${esc(st.user?.avatar || 'U')}</span>
          <span class="hidden md:block text-sm">${esc(st.user?.name || 'User')}</span>
        </button>
        <div id="profile-menu" class="hidden absolute right-0 mt-2 glass neon-border rounded-xl p-2 z-40 w-56">
          <div class="px-3 py-2 border-b border-red-900/40">
            <div class="font-semibold text-sm">${esc(st.user?.name)}</div>
            <div class="text-xs text-zinc-400">${esc(st.user?.email)}</div>
            <span class="badge mt-1" style="background:rgba(255,0,0,0.15);color:#fca">${t('role_admin')}</span>
          </div>
          <button data-go="settings" class="w-full text-left px-3 py-2 rounded-lg hover:bg-red-600/20 text-sm flex items-center gap-2">${icon('settings', 16)} ${t('nav_settings')}</button>
          <button id="logout-btn" class="w-full text-left px-3 py-2 rounded-lg hover:bg-red-600/20 text-sm flex items-center gap-2 text-red-300">${icon('x', 16)} ${t('logout')}</button>
        </div>
      </div>
    </div>`;

  // wire topbar
  tb.querySelector('#toggle-sb').addEventListener('click', () => {
    sidebarCollapsed = !sidebarCollapsed;
    document.getElementById('sidebar').classList.toggle('collapsed', sidebarCollapsed);
  });
  const menus = [['#lang-btn', '#lang-menu'], ['#notif-btn', '#notif-menu'], ['#profile-btn', '#profile-menu']];
  menus.forEach(([b, m]) => {
    tb.querySelector(b).addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = tb.querySelector(m);
      tb.querySelectorAll('#lang-menu,#notif-menu,#profile-menu').forEach((x) => { if (x !== menu) x.classList.add('hidden'); });
      menu.classList.toggle('hidden');
      if (m === '#notif-menu') markNotificationsRead();
    });
  });
  tb.querySelectorAll('[data-lang]').forEach((b) => b.addEventListener('click', () => { setLang(b.dataset.lang); }));
  tb.querySelector('#logout-btn').addEventListener('click', () => { logout(); document.getElementById('app').classList.add('hidden'); document.getElementById('auth-screen').classList.remove('hidden'); renderAuth(); });
  tb.querySelector('[data-go="settings"]').addEventListener('click', () => { location.hash = '#/settings'; });
  document.addEventListener('click', () => tb.querySelectorAll('#lang-menu,#notif-menu,#profile-menu').forEach((x) => x.classList.add('hidden')), { once: true });

  // global search
  const search = tb.querySelector('#global-search');
  const results = tb.querySelector('#search-results');
  search.addEventListener('input', () => {
    const q = search.value.toLowerCase().trim();
    if (!q) { results.classList.add('hidden'); return; }
    const hits = [];
    getState().projects.forEach((p) => {
      if (p.name.toLowerCase().includes(q)) hits.push({ type: t('project'), label: p.name, action: () => { setCurrentProject(p.id); location.hash = '#/bom'; } });
      p.parts.forEach((pt) => { if (pt.name.toLowerCase().includes(q) || pt.code.toLowerCase().includes(q)) hits.push({ type: t('material'), label: `${pt.code} · ${pt.name} (${p.name})`, action: () => { setCurrentProject(p.id); location.hash = '#/bom'; } }); });
    });
    results.innerHTML = hits.length ? hits.slice(0, 12).map((h, i) => `<button data-i="${i}" class="w-full text-left px-3 py-2 rounded-lg hover:bg-red-600/20 text-sm"><span class="text-[10px] text-red-400 uppercase mr-2">${h.type}</span>${esc(h.label)}</button>`).join('') : `<div class="p-3 text-xs text-zinc-500">${t('no_results')}</div>`;
    results.classList.remove('hidden');
    results.querySelectorAll('[data-i]').forEach((b) => b.addEventListener('click', () => { hits[+b.dataset.i].action(); results.classList.add('hidden'); search.value = ''; }));
  });
}

function renderSidebar() {
  const sb = document.getElementById('sidebar');
  const route = currentRoute();
  sb.className = 'glass border-r border-red-900/40 w-64 shrink-0 overflow-y-auto custom-scroll transition-all duration-300 z-20' + (sidebarCollapsed ? ' collapsed' : '');
  const proj = currentProject();
  sb.innerHTML = `
    <div class="p-3">
      <div class="glass-soft rounded-xl p-3 mb-3">
        <div class="text-[10px] uppercase tracking-wide text-red-400 mb-1">${t('project')}</div>
        <select id="proj-select" class="fld text-sm">
          ${getState().projects.map((p) => `<option value="${p.id}" ${proj && p.id === proj.id ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
        </select>
      </div>
      ${NAV.map((grp) => `
        <div class="mb-2">
          <div class="px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-red-500/70 font-bold">${t(grp.section)}</div>
          ${grp.items.map((it) => `
            <a href="#/${it.id}" class="nav-item flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm ${route === it.id ? 'active' : 'text-zinc-300'}">
              <span class="nav-ico text-red-400">${icon(it.icon, 19)}</span>
              <span class="nav-label">${t(it.label)}</span>
            </a>`).join('')}
        </div>`).join('')}
    </div>`;
  sb.querySelector('#proj-select').addEventListener('change', (e) => { setCurrentProject(e.target.value); });
}

function renderBrandbar() {
  const bb = document.getElementById('brandbar');
  bb.className = 'glass border-t border-red-900/40 px-4 py-1.5 flex items-center justify-between text-[11px] shrink-0';
  bb.innerHTML = `
    <span class="text-zinc-500">© ${new Date().getFullYear()} Furniture Structure Designer Pro</span>
    <span class="tracking-[0.25em] text-red-400/80">${t('developed_by')}: <span class="font-bold grad-text">LERWINSON MENDOZA</span></span>`;
}

// ---------------- ROUTER ----------------
let langUnsub = null;
async function renderRoute() {
  const route = currentRoute();
  renderSidebar(); // update active state
  const view = document.getElementById('view');
  view.innerHTML = `<div class="h-full flex items-center justify-center"><div class="loader"></div></div>`;
  const loader = ROUTES[route] || ROUTES.home;
  try {
    const mod = await loader();
    view.innerHTML = '';
    const container = document.createElement('div');
    container.className = 'p-4 md:p-6 fade-in';
    view.appendChild(container);
    mod.render(container, { route });
  } catch (err) {
    console.error(err);
    view.innerHTML = `<div class="p-8 text-center text-red-300">Error: ${esc(err.message)}</div>`;
  }
}

function boot() {
  const st = getState();
  if (!st.user) { document.getElementById('app').classList.add('hidden'); document.getElementById('auth-screen').classList.remove('hidden'); renderAuth(); return; }
  if (!st.currentProjectId && st.projects[0]) setCurrentProject(st.projects[0].id);
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
  document.getElementById('app').classList.add('flex');
  renderTopbar(); renderSidebar(); renderBrandbar();
  if (!location.hash) location.hash = '#/home';
  renderRoute();
}

// react to store + language changes
subscribe(() => { if (getState().user) { renderTopbar(); renderBrandbar(); renderSidebar(); } });
onLangChange(() => { if (getState().user) { renderTopbar(); renderSidebar(); renderBrandbar(); renderRoute(); } });
window.addEventListener('hashchange', renderRoute);

boot();
