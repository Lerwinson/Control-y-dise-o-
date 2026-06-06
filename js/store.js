// Central reactive store with localStorage persistence + versioning
import { seedProjects, TEMPLATES, makePart } from './data.js';
import { uid } from './utils/helpers.js';

const KEY = 'fsdp_state_v1';
const listeners = new Set();

const defaultState = () => ({
  user: null,
  settings: {
    currency: 'USD', units: 'mm', company: 'Mendoza Industrial Furniture',
    laborRate: 0.45, overheadRate: 0.12, transportRate: 0.06, taxRate: 0.16, margin: 35,
    versioning: true,
  },
  projects: seedProjects(),
  currentProjectId: null,
  notifications: [
    { id: uid('n'), text: 'Proyecto "Sofá 3 plazas" pasó a Tapizado', read: false, ts: Date.now() - 3600_000 },
    { id: uid('n'), text: 'Backup automático completado', read: false, ts: Date.now() - 7200_000 },
    { id: uid('n'), text: 'Nuevo material agregado: Roble', read: true, ts: Date.now() - 86400_000 },
  ],
  versions: {}, // projectId -> [{ts, snapshot}]
});

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    return { ...defaultState(), ...parsed, settings: { ...defaultState().settings, ...(parsed.settings || {}) } };
  } catch { return defaultState(); }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.warn('persist failed', e); }
}

export function getState() { return state; }
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }
function emit() { persist(); listeners.forEach((fn) => fn(state)); }

// ---- session ----
export function login(email, name) {
  state.user = { id: uid('usr'), email, name: name || email.split('@')[0], role: 'admin', avatar: (name || email)[0].toUpperCase() };
  emit();
}
export function logout() { state.user = null; emit(); }

// ---- settings ----
export function updateSettings(patch) { state.settings = { ...state.settings, ...patch }; emit(); }

// ---- projects ----
export function currentProject() {
  return state.projects.find((p) => p.id === state.currentProjectId) || state.projects[0] || null;
}
export function setCurrentProject(id) { state.currentProjectId = id; emit(); }

export function createProject(data) {
  const now = Date.now();
  const proj = {
    id: uid('prj'), name: data.name || 'Nuevo proyecto', type: data.type || 'custom',
    status: 'active', stage: 0, createdAt: now, updatedAt: now,
    currency: state.settings.currency, margin: state.settings.margin,
    parts: (data.parts || []).map((p) => makePart(p)), shapes2d: [], boxes3d: [],
  };
  state.projects.unshift(proj);
  state.currentProjectId = proj.id;
  emit();
  return proj;
}
export function fromTemplate(templateId, name) {
  const tpl = TEMPLATES.find((t) => t.id === templateId);
  if (!tpl) return null;
  return createProject({ name: name || tpl.name, type: tpl.type, parts: tpl.build() });
}
export function duplicateProject(id) {
  const src = state.projects.find((p) => p.id === id); if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = uid('prj'); copy.name = src.name + ' (copia)';
  copy.createdAt = Date.now(); copy.updatedAt = Date.now();
  copy.parts = copy.parts.map((p) => ({ ...p, id: uid('prt') }));
  state.projects.unshift(copy); emit(); return copy;
}
export function deleteProject(id) {
  state.projects = state.projects.filter((p) => p.id !== id);
  if (state.currentProjectId === id) state.currentProjectId = state.projects[0]?.id || null;
  emit();
}
export function updateProject(id, patch) {
  const p = state.projects.find((x) => x.id === id); if (!p) return;
  if (state.settings.versioning) snapshot(id);
  Object.assign(p, patch, { updatedAt: Date.now() });
  emit();
}
export function advanceStage(id) {
  const p = state.projects.find((x) => x.id === id); if (!p) return;
  p.stage = Math.min(5, (p.stage || 0) + 1); p.updatedAt = Date.now(); emit();
}

// ---- parts ----
export function addPart(projectId, part) {
  const p = state.projects.find((x) => x.id === projectId); if (!p) return;
  p.parts.push(makePart(part)); p.updatedAt = Date.now(); emit();
}
export function updatePart(projectId, partId, patch) {
  const p = state.projects.find((x) => x.id === projectId); if (!p) return;
  const part = p.parts.find((x) => x.id === partId); if (!part) return;
  Object.assign(part, patch); p.updatedAt = Date.now(); emit();
}
export function deletePart(projectId, partId) {
  const p = state.projects.find((x) => x.id === projectId); if (!p) return;
  p.parts = p.parts.filter((x) => x.id !== partId); p.updatedAt = Date.now(); emit();
}

// ---- 2D / 3D persistence ----
export function setShapes2d(projectId, shapes) {
  const p = state.projects.find((x) => x.id === projectId); if (!p) return;
  p.shapes2d = shapes; p.updatedAt = Date.now(); emit();
}

// ---- notifications ----
export function markNotificationsRead() { state.notifications.forEach((n) => (n.read = true)); emit(); }
export function pushNotification(text) {
  state.notifications.unshift({ id: uid('n'), text, read: false, ts: Date.now() }); emit();
}

// ---- versioning / backup ----
export function snapshot(projectId) {
  const p = state.projects.find((x) => x.id === projectId); if (!p) return;
  state.versions[projectId] = state.versions[projectId] || [];
  state.versions[projectId].unshift({ ts: Date.now(), snapshot: JSON.parse(JSON.stringify(p)) });
  state.versions[projectId] = state.versions[projectId].slice(0, 20);
}
export function getVersions(projectId) { return state.versions[projectId] || []; }
export function exportBackup() { return JSON.stringify(state, null, 2); }
export function importBackup(json) {
  try { state = { ...defaultState(), ...JSON.parse(json) }; emit(); return true; } catch { return false; }
}
export function resetAll() { state = defaultState(); emit(); }
