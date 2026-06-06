'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { seedProjects, TEMPLATES, makePart } from './data';
import { translate } from './i18n';
import { uid } from './utils';
import type { Lang, Project, Part, Settings, UserInfo, NotificationItem } from './types';

interface AppState {
  lang: Lang;
  user: UserInfo | null;
  settings: Settings;
  projects: Project[];
  currentProjectId: string | null;
  notifications: NotificationItem[];
  versions: Record<string, { ts: number; snapshot: Project }[]>;

  // i18n
  setLang: (l: Lang) => void;
  // session
  login: (email: string, name?: string) => void;
  setSession: (user: UserInfo) => void;
  logout: () => void;
  // server sync
  replaceProjects: (projects: Project[]) => void;
  // settings
  updateSettings: (patch: Partial<Settings>) => void;
  // projects
  setCurrentProject: (id: string) => void;
  createProject: (data: { name?: string; type?: Project['type']; parts?: Partial<Part>[] }) => Project;
  fromTemplate: (templateId: string, name?: string) => Project | null;
  duplicateProject: (id: string) => void;
  deleteProject: (id: string) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  advanceStage: (id: string) => void;
  // parts
  addPart: (projectId: string, part: Partial<Part>) => void;
  updatePart: (projectId: string, partId: string, patch: Partial<Part>) => void;
  deletePart: (projectId: string, partId: string) => void;
  // notifications
  markNotificationsRead: () => void;
  pushNotification: (text: string) => void;
  // backup
  resetAll: () => void;
}

const defaultSettings: Settings = {
  currency: 'USD', units: 'mm', company: 'Mendoza Industrial Furniture',
  laborRate: 0.45, overheadRate: 0.12, transportRate: 0.06, taxRate: 0.16, margin: 35,
  versioning: true,
};

const initialNotifications = (): NotificationItem[] => [
  { id: uid('n'), text: 'Proyecto "Sofá 3 plazas" pasó a Tapizado', read: false, ts: Date.now() - 3600000 },
  { id: uid('n'), text: 'Backup automático completado', read: false, ts: Date.now() - 7200000 },
  { id: uid('n'), text: 'Nuevo material agregado: Roble', read: true, ts: Date.now() - 86400000 },
];

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      lang: 'es',
      user: null,
      settings: defaultSettings,
      projects: seedProjects(),
      currentProjectId: null,
      notifications: initialNotifications(),
      versions: {},

      setLang: (l) => set({ lang: l }),

      login: (email, name) => set({
        user: {
          id: uid('usr'), email, name: name || email.split('@')[0],
          role: 'admin', avatar: (name || email)[0].toUpperCase(),
        },
      }),
      setSession: (user) => set({ user }),
      logout: () => set({ user: null }),

      replaceProjects: (projects) => set((s) => ({
        projects,
        currentProjectId: projects.find((p) => p.id === s.currentProjectId) ? s.currentProjectId : (projects[0]?.id || null),
      })),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

      setCurrentProject: (id) => set({ currentProjectId: id }),

      createProject: (data) => {
        const now = Date.now();
        const proj: Project = {
          id: uid('prj'), name: data.name || 'Nuevo proyecto', type: data.type || 'custom',
          status: 'active', stage: 0, createdAt: now, updatedAt: now,
          currency: get().settings.currency, margin: get().settings.margin,
          parts: (data.parts || []).map((p) => makePart(p)), shapes2d: [], boxes3d: [],
        };
        set((s) => ({ projects: [proj, ...s.projects], currentProjectId: proj.id }));
        return proj;
      },
      fromTemplate: (templateId, name) => {
        const tpl = TEMPLATES.find((t) => t.id === templateId);
        if (!tpl) return null;
        return get().createProject({ name: name || tpl.name, type: tpl.type, parts: tpl.build() });
      },
      duplicateProject: (id) => set((s) => {
        const src = s.projects.find((p) => p.id === id);
        if (!src) return s;
        const copy: Project = JSON.parse(JSON.stringify(src));
        copy.id = uid('prj'); copy.name = src.name + ' (copia)';
        copy.createdAt = Date.now(); copy.updatedAt = Date.now();
        copy.parts = copy.parts.map((p) => ({ ...p, id: uid('prt') }));
        return { projects: [copy, ...s.projects] };
      }),
      deleteProject: (id) => set((s) => {
        const projects = s.projects.filter((p) => p.id !== id);
        return { projects, currentProjectId: s.currentProjectId === id ? (projects[0]?.id || null) : s.currentProjectId };
      }),
      updateProject: (id, patch) => set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)),
      })),
      advanceStage: (id) => set((s) => ({
        projects: s.projects.map((p) => (p.id === id ? { ...p, stage: Math.min(5, p.stage + 1), updatedAt: Date.now() } : p)),
      })),

      addPart: (projectId, part) => set((s) => ({
        projects: s.projects.map((p) => (p.id === projectId ? { ...p, parts: [...p.parts, makePart(part)], updatedAt: Date.now() } : p)),
      })),
      updatePart: (projectId, partId, patch) => set((s) => ({
        projects: s.projects.map((p) => (p.id === projectId
          ? { ...p, parts: p.parts.map((x) => (x.id === partId ? { ...x, ...patch } : x)), updatedAt: Date.now() }
          : p)),
      })),
      deletePart: (projectId, partId) => set((s) => ({
        projects: s.projects.map((p) => (p.id === projectId
          ? { ...p, parts: p.parts.filter((x) => x.id !== partId), updatedAt: Date.now() }
          : p)),
      })),

      markNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
      pushNotification: (text) => set((s) => ({ notifications: [{ id: uid('n'), text, read: false, ts: Date.now() }, ...s.notifications] })),

      resetAll: () => set({
        projects: seedProjects(), currentProjectId: null, settings: defaultSettings,
        notifications: initialNotifications(), versions: {},
      }),
    }),
    { name: 'fsdp_next_state_v1' }
  )
);

// Helpers / selectors
export const useT = () => {
  const lang = useStore((s) => s.lang);
  return (key: string) => translate(lang, key);
};

export const useCurrentProject = (): Project | null => {
  const projects = useStore((s) => s.projects);
  const id = useStore((s) => s.currentProjectId);
  return projects.find((p) => p.id === id) || projects[0] || null;
};
