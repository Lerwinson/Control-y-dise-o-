// Convert between the API/Prisma shape and the frontend domain types.
import { makePart } from './data';
import type { Part, Project, ProjectType } from './types';

interface ApiPart {
  id: string; code: string; name: string; category: string; material: string;
  length: number; width: number; thickness: number; qty: number;
  weight?: number | null; costOverride?: number | null; notes?: string | null; color?: string;
  posX?: number | null; posY?: number | null; posZ?: number | null;
}

interface ApiProject {
  id: string; name: string; type: ProjectType; status?: string; stage?: number;
  currency?: string; margin?: number; shapes2d?: unknown; parts?: ApiPart[];
  createdAt?: string; updatedAt?: string;
}

export function apiPartToPart(p: ApiPart): Part {
  return makePart({
    id: p.id, code: p.code, name: p.name, category: p.category as Part['category'],
    material: p.material, length: p.length, width: p.width, thickness: p.thickness, qty: p.qty,
    weightOverride: p.weight ?? null, costOverride: p.costOverride ?? null,
    notes: p.notes || '', color: p.color || '#c98a4b',
    pos: p.posX != null && p.posY != null && p.posZ != null ? { x: p.posX, y: p.posY, z: p.posZ } : null,
  });
}

export function apiToProject(p: ApiProject): Project {
  return {
    id: p.id, name: p.name, type: p.type || 'custom',
    status: (p.status as Project['status']) || 'active', stage: p.stage ?? 0,
    createdAt: p.createdAt ? Date.parse(p.createdAt) : Date.now(),
    updatedAt: p.updatedAt ? Date.parse(p.updatedAt) : Date.now(),
    currency: p.currency || 'USD', margin: p.margin ?? 35,
    parts: (p.parts || []).map(apiPartToPart),
    shapes2d: Array.isArray(p.shapes2d) ? (p.shapes2d as Project['shapes2d']) : [],
    boxes3d: [],
  };
}

export function partToApiPayload(p: Part) {
  return {
    code: p.code, name: p.name, category: p.category, material: p.material,
    length: p.length, width: p.width, thickness: p.thickness, qty: p.qty,
    weight: p.weightOverride ?? null, costOverride: p.costOverride ?? null,
    notes: p.notes || '', color: p.color,
    posX: p.pos?.x ?? null, posY: p.pos?.y ?? null, posZ: p.pos?.z ?? null,
  };
}

export function projectToApiPayload(p: Project) {
  return { name: p.name, type: p.type, status: p.status, stage: p.stage, currency: p.currency, margin: p.margin, shapes2d: p.shapes2d };
}
