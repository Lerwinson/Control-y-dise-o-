import { t, getLang } from '../i18n.js';
import { getState, currentProject, createProject } from '../store.js';
import { makePart, MATERIALS } from '../data.js';
import { computeBOM, partTotals } from '../calc.js';
import { icon } from '../ui/icons.js';
import { pageHeader, toast } from '../ui/ui.js';
import { esc } from '../utils/helpers.js';

let history = [];

export function render(root) {
  if (!history.length) history = [{ role: 'ai', text: t('ai_intro') }];
  root.innerHTML = `
    ${pageHeader(t('ai_title'), 'AI Engine')}
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div class="lg:col-span-3 glass neon-border rounded-2xl flex flex-col" style="height:64vh">
        <div id="chat" class="flex-1 overflow-y-auto custom-scroll p-4 space-y-3"></div>
        <div class="p-3 border-t border-red-900/40 flex gap-2">
          <input id="ai-input" class="fld" placeholder="${t('ai_ph')}"/>
          <button id="ai-send" class="btn btn-primary">${icon('spark', 16)} ${t('ai_send')}</button>
        </div>
      </div>
      <div class="glass neon-border rounded-2xl p-4 space-y-2">
        <h3 class="font-display font-bold text-sm mb-2">${t('quick_actions')}</h3>
        <button class="btn btn-ghost w-full justify-start text-xs" data-q="generate">${icon('cube',14)} ${t('ai_generate')}</button>
        <button class="btn btn-ghost w-full justify-start text-xs" data-q="recommend">${icon('library',14)} ${t('ai_recommend')}</button>
        <button class="btn btn-ghost w-full justify-start text-xs" data-q="detect">${icon('shield',14)} ${t('ai_detect')}</button>
        <button class="btn btn-ghost w-full justify-start text-xs" data-q="optimize">${icon('bolt',14)} ${t('ai_optimize')}</button>
        <div class="text-[10px] text-zinc-500 border-t border-red-900/30 pt-2 mt-2">
          ${getLang() === 'pt' ? 'Ex: "gerar cama 1600x2000"' : 'Ej: "generar cama 1600x2000"'}
        </div>
      </div>
    </div>`;

  const chat = root.querySelector('#chat');
  const input = root.querySelector('#ai-input');
  const paint = () => {
    chat.innerHTML = history.map((m) => bubble(m)).join('');
    chat.scrollTop = chat.scrollHeight;
  };
  paint();

  const send = (text) => {
    if (!text.trim()) return;
    history.push({ role: 'user', text }); paint(); input.value = '';
    history.push({ role: 'ai', text: t('ai_thinking'), pending: true }); paint();
    setTimeout(() => {
      history.pop();
      const res = respond(text);
      history.push({ role: 'ai', text: res.text, html: res.html });
      paint();
      if (res.after) res.after();
    }, 550);
  };
  root.querySelector('#ai-send').addEventListener('click', () => send(input.value));
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(input.value); });
  root.querySelectorAll('[data-q]').forEach((b) => b.addEventListener('click', () => {
    const map = { generate: getLang() === 'pt' ? 'gerar cama 1600x2000' : 'generar cama 1600x2000', recommend: 'recomendar materiales', detect: 'detectar errores', optimize: 'optimizar material' };
    send(map[b.dataset.q]);
  }));
}

function bubble(m) {
  const mine = m.role === 'user';
  return `<div class="flex ${mine ? 'justify-end' : 'justify-start'}">
    <div class="max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${mine ? 'bg-gradient-to-br from-blood to-darkblood text-white' : 'glass-soft'} ${m.pending ? 'animate-pulse' : ''}">
      ${!mine ? `<div class="text-[10px] text-red-400 mb-1 flex items-center gap-1">${icon('ai', 12)} IA</div>` : ''}
      ${m.html || esc(m.text)}
    </div></div>`;
}

// ---- rule-based engine ----
function respond(qRaw) {
  const q = qRaw.toLowerCase();
  const pt = getLang() === 'pt';

  // GENERATE: detect furniture type + dimensions
  if (/gener|gerar|crea|criar|dise|design/.test(q) && /(cama|bed|sof|mesa|table|colch|closet)/.test(q)) {
    const dims = q.match(/(\d{2,4})\s*[x×]\s*(\d{2,4})/);
    const W = dims ? +dims[1] : 1600, L = dims ? +dims[2] : 2000;
    let type = 'furniture', parts = [];
    if (/cama|bed/.test(q)) { type = 'bed'; parts = genBed(W, L); }
    else if (/sof/.test(q)) { type = 'sofa'; parts = genSofa(W || 2000, L || 850); }
    else if (/mesa|table/.test(q)) { type = 'furniture'; parts = genTable(W || 1600, L || 900); }
    else parts = genBed(W, L);
    const name = (pt ? 'IA — ' : 'IA — ') + (type === 'bed' ? (pt ? 'Cama' : 'Cama') : type === 'sofa' ? 'Sofá' : 'Mesa') + ` ${W}×${L}`;
    return {
      text: 'generated',
      html: `<div>${pt ? 'Estrutura gerada' : 'Estructura generada'}: <b>${esc(name)}</b><br>${parts.length} ${t('pieces')}. ${pt ? 'Criando projeto…' : 'Creando proyecto…'}</div>`,
      after: () => { createProject({ name, type, parts }); toast(t('created_ok')); setTimeout(() => (location.hash = '#/design3d'), 400); },
    };
  }

  // RECOMMEND materials
  if (/recomend|recommend|material/.test(q)) {
    const list = MATERIALS.filter((m) => m.type === 'wood').sort((a, b) => a.pricePerM3 - b.pricePerM3);
    return { text: 'rec', html: `<div>${pt ? 'Recomendações de materiais (custo/resistência):' : 'Recomendaciones de materiales (costo/resistencia):'}<ul class="mt-2 space-y-1 text-xs">
      <li>• <b>${list[0].name}</b> — ${pt ? 'econômico, bom para estrutura interna' : 'económico, bueno para estructura interna'}</li>
      <li>• <b>Roble</b> — ${pt ? 'alta resistência, ideal para pés e travessas' : 'alta resistencia, ideal para patas y travesaños'}</li>
      <li>• <b>Contrachapado</b> — ${pt ? 'painéis e reforços' : 'paneles y refuerzos'}</li>
      <li>• <b>Espuma D28</b> — ${pt ? 'assentos de alta densidade' : 'asientos de alta densidad'}</li>
    </ul></div>` };
  }

  // DETECT errors in current project
  if (/detect|error|erro|valida|revis/.test(q)) {
    const proj = currentProject(); if (!proj) return { text: t('select_project') };
    const issues = [];
    proj.parts.forEach((p) => {
      if (p.thickness < 12 && p.category !== 'fabric') issues.push(`${p.code}: ${pt ? 'espessura baixa' : 'espesor bajo'} (${p.thickness}mm)`);
      if (p.length > 2200) issues.push(`${p.code}: ${pt ? 'comprimento excede padrão de corte' : 'largo excede estándar de corte'} (${p.length}mm)`);
      if (p.qty <= 0) issues.push(`${p.code}: ${pt ? 'quantidade inválida' : 'cantidad inválida'}`);
    });
    const structural = proj.parts.filter((p) => ['frame', 'support', 'leg'].includes(p.category)).length;
    if (structural < 2) issues.push(pt ? 'Poucos elementos estruturais (reforce a base)' : 'Pocos elementos estructurales (refuerza la base)');
    return { text: 'detect', html: issues.length ? `<div>${pt ? 'Problemas detectados:' : 'Errores detectados:'}<ul class="mt-2 space-y-1 text-xs text-amber-300">${issues.map((i) => `<li>⚠ ${esc(i)}</li>`).join('')}</ul></div>` : `<div class="text-green-300">✓ ${pt ? 'Nenhum erro crítico detectado.' : 'No se detectaron errores críticos.'}</div>` };
  }

  // OPTIMIZE material
  if (/optimiz|otimiz|consum|ahorr|econom/.test(q)) {
    const proj = currentProject(); if (!proj) return { text: t('select_project') };
    const bom = computeBOM(proj);
    const saving = bom.materialCost * 0.12;
    return { text: 'opt', html: `<div>${pt ? 'Otimização de material:' : 'Optimización de material:'}<ul class="mt-2 space-y-1 text-xs">
      <li>• ${pt ? 'Agrupar cortes do mesmo material reduz desperdício ~8%' : 'Agrupar cortes del mismo material reduce desperdicio ~8%'}</li>
      <li>• ${pt ? 'Nesting otimizado em painéis MDF' : 'Nesting optimizado en paneles MDF'}</li>
      <li>• ${pt ? 'Economia estimada' : 'Ahorro estimado'}: <b class="grad-text">${(saving).toFixed(2)} ${proj.currency}</b></li>
    </ul></div>` };
  }

  return { text: 'fallback', html: `<div>${pt ? 'Posso: gerar estruturas, recomendar materiais, detectar erros e otimizar. Tente: "gerar sofá 2000x850".' : 'Puedo: generar estructuras, recomendar materiales, detectar errores y optimizar. Prueba: "generar sofá 2000x850".'}</div>` };
}

// ---- parametric generators ----
function genBed(W, L) {
  return [
    makePart({ code:'BF-01', name:'Cabecero', category:'panel', material:'mdf', length:W+50, width:600, thickness:30, qty:1, color:'#b9743a', pos:{x:0,y:300,z:-(L/2)} }),
    makePart({ code:'BF-02', name:'Piecero', category:'panel', material:'mdf', length:W+50, width:350, thickness:30, qty:1, color:'#b9743a', pos:{x:0,y:175,z:(L/2)} }),
    makePart({ code:'BF-03', name:'Larguero', category:'frame', material:'pine', length:L, width:200, thickness:30, qty:2, color:'#c98a4b', pos:{x:W/2,y:120,z:0} }),
    makePart({ code:'BF-04', name:'Travesaño central', category:'crossbar', material:'pine', length:W-60, width:90, thickness:30, qty:1, color:'#d89b5a', pos:{x:0,y:60,z:0} }),
    makePart({ code:'BF-05', name:'Listón somier', category:'crossbar', material:'pine', length:W-60, width:70, thickness:18, qty:Math.round(L/150), color:'#e0a766', pos:{x:0,y:150,z:0} }),
    makePart({ code:'BF-06', name:'Pata', category:'leg', material:'oak', length:120, width:70, thickness:70, qty:4, color:'#8a5a2b', pos:{x:0,y:55,z:0} }),
    makePart({ code:'BF-07', name:'Tornillería', category:'hardware', material:'steel', length:80, width:8, thickness:8, qty:48 }),
  ];
}
function genSofa(W, D) {
  return [
    makePart({ code:'SF-01', name:'Base estructura', category:'frame', material:'pine', length:W, width:D, thickness:30, qty:1, color:'#c98a4b' }),
    makePart({ code:'SF-02', name:'Respaldo', category:'panel', material:'plywood', length:W, width:600, thickness:18, qty:1, color:'#b9743a' }),
    makePart({ code:'SF-03', name:'Brazo', category:'panel', material:'plywood', length:D, width:600, thickness:18, qty:2, color:'#b9743a' }),
    makePart({ code:'SF-04', name:'Espuma asiento', category:'foam', material:'foam_d28', length:W-100, width:D-150, thickness:120, qty:1, color:'#f0d27a' }),
    makePart({ code:'SF-05', name:'Tela', category:'fabric', material:'fabric', length:W*3, width:1400, thickness:1, qty:1, color:'#7a2a2a' }),
    makePart({ code:'SF-06', name:'Pata', category:'leg', material:'oak', length:150, width:60, thickness:60, qty:4, color:'#8a5a2b' }),
  ];
}
function genTable(W, D) {
  return [
    makePart({ code:'TB-01', name:'Tablero', category:'panel', material:'oak', length:W, width:D, thickness:30, qty:1, color:'#b9743a' }),
    makePart({ code:'TB-02', name:'Pata', category:'leg', material:'oak', length:740, width:80, thickness:80, qty:4, color:'#8a5a2b' }),
    makePart({ code:'TB-03', name:'Travesaño', category:'crossbar', material:'pine', length:W-200, width:90, thickness:30, qty:2, color:'#d89b5a' }),
  ];
}
