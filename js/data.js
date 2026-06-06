// Sample data, materials catalog and library templates
import { uid } from './utils/helpers.js';

export const MATERIALS = [
  { key: 'pine',     name: 'Pino',           density: 510, type: 'wood',     pricePerM3: 320 },
  { key: 'oak',      name: 'Roble',          density: 750, type: 'wood',     pricePerM3: 980 },
  { key: 'mdf',      name: 'MDF',            density: 700, type: 'wood',     pricePerM3: 260 },
  { key: 'plywood',  name: 'Contrachapado',  density: 600, type: 'wood',     pricePerM3: 410 },
  { key: 'chipboard',name: 'Aglomerado',     density: 650, type: 'wood',     pricePerM3: 190 },
  { key: 'foam_d18', name: 'Espuma D18',     density: 18,  type: 'foam',     pricePerM3: 95 },
  { key: 'foam_d28', name: 'Espuma D28',     density: 28,  type: 'foam',     pricePerM3: 140 },
  { key: 'fabric',   name: 'Tela tapicería', density: 0.4, type: 'fabric',   pricePerM2: 14 },
  { key: 'leather',  name: 'Cuero sintético',density: 0.5, type: 'fabric',   pricePerM2: 26 },
  { key: 'steel',    name: 'Acero (herraje)',density: 7850,type: 'hardware', pricePerKg: 3.2 },
];

export function materialByKey(k) { return MATERIALS.find((m) => m.key === k) || MATERIALS[0]; }

// Part factory. Dimensions in millimeters; qty integer.
export function makePart(p = {}) {
  return {
    id: uid('prt'),
    code: p.code || 'P-000',
    name: p.name || 'Pieza',
    category: p.category || 'frame', // frame|reinforcement|crossbar|panel|support|foam|fabric|hardware|leg
    material: p.material || 'pine',
    length: p.length ?? 1000,
    width: p.width ?? 50,
    thickness: p.thickness ?? 25,
    qty: p.qty ?? 1,
    weightOverride: p.weightOverride ?? null,
    costOverride: p.costOverride ?? null,
    notes: p.notes || '',
    color: p.color || '#c98a4b',
    // optional 3D placement (mm)
    pos: p.pos || null,
  };
}

// Bed-frame template parts (mimicking an industrial exploded bed plan)
function bedFrameParts() {
  return [
    makePart({ code: 'BF-01', name: 'Cabecero',          category: 'panel',         material: 'mdf',     length: 1450, width: 600, thickness: 30, qty: 1, color:'#b9743a', pos:{x:0,y:300,z:-980} }),
    makePart({ code: 'BF-02', name: 'Piecero',           category: 'panel',         material: 'mdf',     length: 1450, width: 350, thickness: 30, qty: 1, color:'#b9743a', pos:{x:0,y:175,z:980} }),
    makePart({ code: 'BF-03', name: 'Larguero izquierdo',category: 'frame',         material: 'pine',    length: 1950, width: 200, thickness: 30, qty: 1, color:'#c98a4b', pos:{x:-710,y:120,z:0} }),
    makePart({ code: 'BF-04', name: 'Larguero derecho',  category: 'frame',         material: 'pine',    length: 1950, width: 200, thickness: 30, qty: 1, color:'#c98a4b', pos:{x:710,y:120,z:0} }),
    makePart({ code: 'BF-05', name: 'Travesaño central', category: 'crossbar',      material: 'pine',    length: 1390, width: 90,  thickness: 30, qty: 1, color:'#d89b5a', pos:{x:0,y:60,z:0} }),
    makePart({ code: 'BF-06', name: 'Listón somier',     category: 'crossbar',      material: 'pine',    length: 1390, width: 70,  thickness: 18, qty: 13, color:'#e0a766', pos:{x:0,y:150,z:0} }),
    makePart({ code: 'BF-07', name: 'Soporte central',   category: 'support',       material: 'pine',    length: 200,  width: 70,  thickness: 70, qty: 2, color:'#a86a33', pos:{x:0,y:55,z:0} }),
    makePart({ code: 'BF-08', name: 'Pata',              category: 'leg',           material: 'oak',     length: 120,  width: 70,  thickness: 70, qty: 4, color:'#8a5a2b', pos:{x:0,y:55,z:0} }),
    makePart({ code: 'BF-09', name: 'Refuerzo esquina',  category: 'reinforcement', material: 'plywood', length: 150,  width: 150, thickness: 18, qty: 4, color:'#caa06a', pos:{x:0,y:120,z:0} }),
    makePart({ code: 'BF-10', name: 'Tornillería',       category: 'hardware',      material: 'steel',   length: 80,   width: 8,   thickness: 8,  qty: 48, color:'#9aa', pos:null }),
  ];
}

function sofaParts() {
  return [
    makePart({ code: 'SF-01', name: 'Base estructura',   category: 'frame',    material: 'pine',    length: 2000, width: 850, thickness: 30, qty: 1, color:'#c98a4b' }),
    makePart({ code: 'SF-02', name: 'Respaldo',          category: 'panel',    material: 'plywood', length: 2000, width: 600, thickness: 18, qty: 1, color:'#b9743a' }),
    makePart({ code: 'SF-03', name: 'Brazo lateral',     category: 'panel',    material: 'plywood', length: 850,  width: 600, thickness: 18, qty: 2, color:'#b9743a' }),
    makePart({ code: 'SF-04', name: 'Travesaño frontal', category: 'crossbar', material: 'pine',    length: 1940, width: 80,  thickness: 30, qty: 2, color:'#d89b5a' }),
    makePart({ code: 'SF-05', name: 'Espuma asiento',    category: 'foam',     material: 'foam_d28',length: 1900, width: 700, thickness: 120,qty: 1, color:'#f0d27a' }),
    makePart({ code: 'SF-06', name: 'Espuma respaldo',   category: 'foam',     material: 'foam_d18',length: 1900, width: 550, thickness: 100,qty: 1, color:'#f0d27a' }),
    makePart({ code: 'SF-07', name: 'Tapizado tela',     category: 'fabric',   material: 'fabric',  length: 6000, width: 1400,thickness: 1,  qty: 1, color:'#7a2a2a' }),
    makePart({ code: 'SF-08', name: 'Pata madera',       category: 'leg',      material: 'oak',     length: 150,  width: 60,  thickness: 60, qty: 4, color:'#8a5a2b' }),
  ];
}

function tableParts() {
  return [
    makePart({ code: 'TB-01', name: 'Tablero superior', category: 'panel', material: 'oak',  length: 1600, width: 900, thickness: 30, qty: 1, color:'#b9743a' }),
    makePart({ code: 'TB-02', name: 'Pata',             category: 'leg',   material: 'oak',  length: 740,  width: 80,  thickness: 80, qty: 4, color:'#8a5a2b' }),
    makePart({ code: 'TB-03', name: 'Travesaño largo',  category: 'crossbar', material: 'pine', length: 1400, width: 90, thickness: 30, qty: 2, color:'#d89b5a' }),
    makePart({ code: 'TB-04', name: 'Travesaño corto',  category: 'crossbar', material: 'pine', length: 700,  width: 90, thickness: 30, qty: 2, color:'#d89b5a' }),
  ];
}

export const TEMPLATES = [
  { id: 't-bed',    name: 'Cama Queen estándar',    cat: 'beds',     type: 'bed',      build: bedFrameParts },
  { id: 't-bed2',   name: 'Base de cama reforzada',  cat: 'bases',    type: 'bed',      build: bedFrameParts },
  { id: 't-sofa',   name: 'Sofá 3 plazas',           cat: 'sofas',    type: 'sofa',     build: sofaParts },
  { id: 't-sofa2',  name: 'Sofá modular L',          cat: 'sofas',    type: 'sofa',     build: sofaParts },
  { id: 't-table',  name: 'Mesa comedor 6p',         cat: 'tables',   type: 'furniture',build: tableParts },
  { id: 't-mattress',name:'Colchón híbrido',         cat: 'mattress', type: 'mattress', build: () => [
      makePart({ code:'MT-01', name:'Núcleo espuma', category:'foam', material:'foam_d28', length:1900, width:1500, thickness:180, qty:1, color:'#f0d27a' }),
      makePart({ code:'MT-02', name:'Funda tela',    category:'fabric', material:'fabric', length:4200, width:2000, thickness:2, qty:1, color:'#7a2a2a' }),
  ]},
  { id: 't-closet', name: 'Closet 2 puertas',        cat: 'closets',  type: 'furniture',build: () => [
      makePart({ code:'CL-01', name:'Lateral',   category:'panel', material:'mdf', length:2000, width:580, thickness:18, qty:2, color:'#b9743a' }),
      makePart({ code:'CL-02', name:'Techo/Base', category:'panel', material:'mdf', length:1200, width:580, thickness:18, qty:2, color:'#b9743a' }),
      makePart({ code:'CL-03', name:'Puerta',    category:'panel', material:'mdf', length:1980, width:590, thickness:18, qty:2, color:'#caa06a' }),
      makePart({ code:'CL-04', name:'Estante',   category:'panel', material:'mdf', length:1164, width:560, thickness:18, qty:3, color:'#caa06a' }),
      makePart({ code:'CL-05', name:'Bisagra',   category:'hardware', material:'steel', length:60, width:40, thickness:3, qty:8, color:'#9aa' }),
  ]},
];

export function seedProjects() {
  const now = Date.now();
  return [
    { id: uid('prj'), name: 'Cama Queen — Cliente A', type: 'bed', status: 'active', stage: 1,
      createdAt: now - 86400000 * 9, updatedAt: now - 3600_000 * 5, currency: 'USD',
      margin: 35, parts: bedFrameParts(), shapes2d: [], boxes3d: [] },
    { id: uid('prj'), name: 'Sofá 3 plazas — Showroom', type: 'sofa', status: 'active', stage: 3,
      createdAt: now - 86400000 * 5, updatedAt: now - 3600_000 * 30, currency: 'USD',
      margin: 42, parts: sofaParts(), shapes2d: [], boxes3d: [] },
    { id: uid('prj'), name: 'Mesa comedor — Lote 12', type: 'furniture', status: 'active', stage: 5,
      createdAt: now - 86400000 * 2, updatedAt: now - 3600_000 * 2, currency: 'USD',
      margin: 28, parts: tableParts(), shapes2d: [], boxes3d: [] },
  ];
}
