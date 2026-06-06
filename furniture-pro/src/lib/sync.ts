// Two-way sync helpers between the Zustand store and the Express/Prisma API.
import { api } from './api';
import { apiToProject, partToApiPayload, projectToApiPayload } from './mappers';
import { useStore } from './store';
import type { Project } from './types';

export const isServerId = (id: string) => !/^prj_|^prt_/.test(id);

// Pull all projects for the logged-in user and replace the local list.
export async function pullProjects(token: string): Promise<number> {
  const list = await api.listProjects(token);
  const projects = list.map(apiToProject);
  if (projects.length) useStore.getState().replaceProjects(projects);
  return projects.length;
}

// Push a single project (create or update) + its parts, reconciling IDs locally.
export async function saveProjectToServer(project: Project, token: string): Promise<Project> {
  let serverId = project.id;

  if (isServerId(project.id)) {
    await api.updateProject(project.id, projectToApiPayload(project), token);
  } else {
    const created = await api.createProject(projectToApiPayload(project), token);
    serverId = created.id;
  }

  // Push parts. This covers the common "first save" path (project created locally,
  // then persisted). Editing already-persisted parts goes through the part endpoints.
  for (const part of project.parts) {
    await api.addPart(serverId, partToApiPayload(part), token);
  }

  const refreshed = await api.getProject(serverId, token);
  const mapped = apiToProject(refreshed);

  // Reconcile: swap the local (temp) project for the server-backed one.
  const state = useStore.getState();
  const projects = state.projects.map((p) => (p.id === project.id ? mapped : p));
  useStore.getState().replaceProjects(projects);
  if (state.currentProjectId === project.id) useStore.getState().setCurrentProject(mapped.id);
  return mapped;
}
