import { materialByKey } from './data';
import type { Part, Project, Settings, BOM, CostResult } from './types';

const volumeM3 = (p: Part) => (p.length / 1000) * (p.width / 1000) * (p.thickness / 1000);
const areaM2 = (p: Part) => (p.length / 1000) * (p.width / 1000);

export function partUnitWeight(p: Part): number {
  if (p.weightOverride != null) return p.weightOverride;
  const m = materialByKey(p.material);
  if (m.type === 'fabric') return areaM2(p) * 0.45;
  return volumeM3(p) * m.density;
}

export function partUnitCost(p: Part): number {
  if (p.costOverride != null) return p.costOverride;
  const m = materialByKey(p.material);
  if (m.type === 'fabric') return areaM2(p) * (m.pricePerM2 || 0);
  if (m.type === 'hardware') return partUnitWeight(p) * (m.pricePerKg || 0);
  return volumeM3(p) * (m.pricePerM3 || 0);
}

export function partTotals(p: Part) {
  const uw = partUnitWeight(p), uc = partUnitCost(p);
  return { unitWeight: uw, unitCost: uc, weight: uw * p.qty, cost: uc * p.qty };
}

export function computeBOM(project: Project | null): BOM {
  const parts = project?.parts || [];
  let woodM3 = 0, foamM3 = 0, fabricM2 = 0, hardware = 0, weight = 0, material = 0, pieces = 0;
  const rows = parts.map((p, i) => {
    const m = materialByKey(p.material);
    const tot = partTotals(p);
    weight += tot.weight; material += tot.cost; pieces += p.qty;
    if (m.type === 'wood') woodM3 += volumeM3(p) * p.qty;
    else if (m.type === 'foam') foamM3 += volumeM3(p) * p.qty;
    else if (m.type === 'fabric') fabricM2 += areaM2(p) * p.qty;
    else if (m.type === 'hardware') hardware += p.qty;
    return { idx: i + 1, ...p, materialName: m.name, ...tot };
  });
  return { rows, woodM3, foamM3, fabricM2, hardware, weight, materialCost: material, pieces, partsCount: parts.length };
}

export function computeCosts(project: Project, settings: Partial<Settings> = {}): CostResult {
  const bom = computeBOM(project);
  const raw = bom.materialCost;
  const laborRate = settings.laborRate ?? 0.45;
  const overheadRate = settings.overheadRate ?? 0.12;
  const transportRate = settings.transportRate ?? 0.06;
  const taxRate = settings.taxRate ?? 0.16;
  const margin = (project.margin ?? settings.margin ?? 35) / 100;

  const labor = raw * laborRate;
  const overhead = raw * overheadRate;
  const transport = raw * transportRate;
  const subtotal = raw + labor + overhead + transport;
  const taxes = subtotal * taxRate;
  const cost = subtotal + taxes;
  const profit = cost * margin;
  const finalPrice = cost + profit;

  return {
    bom, raw, labor, overhead, transport, taxes, subtotal, cost, profit, finalPrice,
    marginPct: margin * 100,
    breakdown: [
      { key: 'raw_material', value: raw, color: '#ff0000' },
      { key: 'labor', value: labor, color: '#ff5a5a' },
      { key: 'transport', value: transport, color: '#b30000' },
      { key: 'overhead', value: overhead, color: '#8b0000' },
      { key: 'taxes', value: taxes, color: '#ff8a3a' },
      { key: 'margin', value: profit, color: '#ffd23a' },
    ],
  };
}

export const STAGES = ['st_design', 'st_cut', 'st_assembly', 'st_upholstery', 'st_finish', 'st_done'] as const;
export const stageProgress = (stage: number) => Math.round((stage / (STAGES.length - 1)) * 100);
