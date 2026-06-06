// Thin client for the Express + Prisma backend.
// The UI works fully offline via the zustand store; wire these calls in
// to persist to PostgreSQL through the API when the backend is running.
const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, opts: RequestInit = {}, token?: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...authHeaders(token), ...(opts.headers || {}) },
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  health: () => request<{ ok: boolean }>('/health'),
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: { email: string; name: string; password: string }) =>
    request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: (token: string) => request<{ user: any }>('/auth/me', {}, token),
  listProjects: (token: string) => request<any[]>('/projects', {}, token),
  getProject: (id: string, token: string) => request<any>(`/projects/${id}`, {}, token),
  createProject: (data: any, token: string) => request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }, token),
  updateProject: (id: string, data: any, token: string) => request<any>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }, token),
  deleteProject: (id: string, token: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }, token),
  addPart: (projectId: string, data: any, token: string) => request<any>(`/projects/${projectId}/parts`, { method: 'POST', body: JSON.stringify(data) }, token),
};
