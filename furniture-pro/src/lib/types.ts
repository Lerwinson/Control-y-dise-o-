// Shared domain types
export type Lang = 'es' | 'pt';

export type MaterialType = 'wood' | 'foam' | 'fabric' | 'hardware';

export interface Material {
  key: string;
  name: string;
  density: number;
  type: MaterialType;
  pricePerM3?: number;
  pricePerM2?: number;
  pricePerKg?: number;
}

export type PartCategory =
  | 'frame' | 'reinforcement' | 'crossbar' | 'panel'
  | 'support' | 'foam' | 'fabric' | 'hardware' | 'leg';

export interface Vec3 { x: number; y: number; z: number; }

export interface Part {
  id: string;
  code: string;
  name: string;
  category: PartCategory;
  material: string;
  length: number;   // mm
  width: number;    // mm
  thickness: number;// mm
  qty: number;
  weightOverride?: number | null;
  costOverride?: number | null;
  notes?: string;
  color: string;
  pos?: Vec3 | null;
}

export type ProjectType = 'bed' | 'sofa' | 'mattress' | 'furniture' | 'custom';

export interface Shape2D {
  id: string;
  type: 'line' | 'rect' | 'poly' | 'measure';
  [k: string]: unknown;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  status: 'active' | 'archived';
  stage: number; // 0..5
  createdAt: number;
  updatedAt: number;
  currency: string;
  margin: number;
  parts: Part[];
  shapes2d: Shape2D[];
  boxes3d: unknown[];
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'designer' | 'production' | 'viewer';
  avatar: string;
  token?: string;
}

export interface Settings {
  currency: string;
  units: 'mm' | 'cm' | 'in';
  company: string;
  laborRate: number;
  overheadRate: number;
  transportRate: number;
  taxRate: number;
  margin: number;
  versioning: boolean;
}

export interface NotificationItem {
  id: string;
  text: string;
  read: boolean;
  ts: number;
}

export interface Template {
  id: string;
  name: string;
  cat: string;
  type: ProjectType;
  build: () => Part[];
}

export interface CostBreakdownItem { key: string; value: number; color: string; }

export interface BOMRow extends Part {
  idx: number;
  materialName: string;
  unitWeight: number;
  unitCost: number;
  weight: number;
  cost: number;
}

export interface BOM {
  rows: BOMRow[];
  woodM3: number;
  foamM3: number;
  fabricM2: number;
  hardware: number;
  weight: number;
  materialCost: number;
  pieces: number;
  partsCount: number;
}

export interface CostResult {
  bom: BOM;
  raw: number; labor: number; overhead: number; transport: number;
  taxes: number; subtotal: number; cost: number; profit: number;
  finalPrice: number; marginPct: number;
  breakdown: CostBreakdownItem[];
}
