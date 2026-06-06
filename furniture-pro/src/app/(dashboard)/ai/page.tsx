'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Bot } from 'lucide-react';
import { useStore, useT, useCurrentProject } from '@/lib/store';
import { makePart } from '@/lib/data';
import { computeBOM } from '@/lib/calc';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Part } from '@/lib/types';

interface Msg { role: 'user' | 'ai'; text: string; html?: string; }

export default function AiPage() {
  const t = useT();
  const router = useRouter();
  const lang = useStore((s) => s.lang);
  const createProject = useStore((s) => s.createProject);
  const proj = useCurrentProject();
  const [history, setHistory] = useState<Msg[]>([{ role: 'ai', text: t('ai_intro') }]);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight; }, [history]);

  const pt = lang === 'pt';

  const respond = (qRaw: string): { html: string; after?: () => void } => {
    const q = qRaw.toLowerCase();
    if (/gener|gerar|crea|criar|dise|design/.test(q) && /(cama|bed|sof|mesa|table|colch|closet)/.test(q)) {
      const dims = q.match(/(\d{2,4})\s*[x×]\s*(\d{2,4})/);
      const W = dims ? +dims[1] : 1600, L = dims ? +dims[2] : 2000;
      let type: Part['category'] | string = 'furniture'; let parts: Partial<Part>[] = [];
      if (/cama|bed/.test(q)) { type = 'bed'; parts = genBed(W, L); }
      else if (/sof/.test(q)) { type = 'sofa'; parts = genSofa(W || 2000, L || 850); }
      else if (/mesa|table/.test(q)) { type = 'furniture'; parts = genTable(W || 1600, L || 900); }
      else parts = genBed(W, L);
      const name = `IA — ${type === 'bed' ? 'Cama' : type === 'sofa' ? 'Sofá' : 'Mesa'} ${W}×${L}`;
      return {
        html: `${pt ? 'Estrutura gerada' : 'Estructura generada'}: <b>${name}</b><br>${parts.length} ${t('pieces')}. ${pt ? 'Criando projeto…' : 'Creando proyecto…'}`,
        after: () => { createProject({ name, type: type as any, parts }); setTimeout(() => router.push('/design3d'), 400); },
      };
    }
    if (/recomend|recommend|material/.test(q)) {
      return { html: `${pt ? 'Recomendações:' : 'Recomendaciones:'}<ul class="mt-2 space-y-1 text-xs"><li>• <b>Pino</b> — ${pt ? 'econômico' : 'económico'}</li><li>• <b>Roble</b> — ${pt ? 'alta resistência (pés)' : 'alta resistencia (patas)'}</li><li>• <b>Contrachapado</b> — ${pt ? 'painéis' : 'paneles'}</li><li>• <b>Espuma D28</b> — ${pt ? 'assentos' : 'asientos'}</li></ul>` };
    }
    if (/detect|error|erro|valida|revis/.test(q)) {
      if (!proj) return { html: t('select_project') };
      const issues: string[] = [];
      proj.parts.forEach((p) => {
        if (p.thickness < 12 && p.category !== 'fabric') issues.push(`${p.code}: ${pt ? 'espessura baixa' : 'espesor bajo'} (${p.thickness}mm)`);
        if (p.length > 2200) issues.push(`${p.code}: ${pt ? 'comprimento excede corte' : 'largo excede corte'} (${p.length}mm)`);
      });
      if (proj.parts.filter((p) => ['frame', 'support', 'leg'].includes(p.category)).length < 2) issues.push(pt ? 'Poucos elementos estruturais' : 'Pocos elementos estructurales');
      return { html: issues.length ? `${pt ? 'Problemas:' : 'Errores:'}<ul class="mt-2 space-y-1 text-xs text-amber-300">${issues.map((i) => `<li>⚠ ${i}</li>`).join('')}</ul>` : `<span class="text-green-300">✓ ${pt ? 'Nenhum erro crítico.' : 'Sin errores críticos.'}</span>` };
    }
    if (/optimiz|otimiz|consum|ahorr|econom/.test(q)) {
      if (!proj) return { html: t('select_project') };
      const saving = computeBOM(proj).materialCost * 0.12;
      return { html: `${pt ? 'Otimização:' : 'Optimización:'}<ul class="mt-2 space-y-1 text-xs"><li>• ${pt ? 'Agrupar cortes (~8%)' : 'Agrupar cortes (~8%)'}</li><li>• Nesting MDF</li><li>• ${pt ? 'Economia' : 'Ahorro'}: <b class="grad-text">${saving.toFixed(2)} ${proj.currency}</b></li></ul>` };
    }
    return { html: pt ? 'Posso gerar estruturas, recomendar materiais, detectar erros e otimizar. Tente: "gerar sofá 2000x850".' : 'Puedo generar estructuras, recomendar materiales, detectar errores y optimizar. Prueba: "generar sofá 2000x850".' };
  };

  const send = (text: string) => {
    if (!text.trim()) return;
    setHistory((h) => [...h, { role: 'user', text }, { role: 'ai', text: t('ai_thinking') }]);
    setInput('');
    setTimeout(() => {
      const res = respond(text);
      setHistory((h) => [...h.slice(0, -1), { role: 'ai', text: '', html: res.html }]);
      res.after?.();
    }, 550);
  };

  const quick: Record<string, string> = {
    generate: pt ? 'gerar cama 1600x2000' : 'generar cama 1600x2000',
    recommend: 'recomendar materiales', detect: 'detectar errores', optimize: 'optimizar material',
  };

  return (
    <div>
      <PageHeader title={t('ai_title')} subtitle="AI Engine" />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-3 flex flex-col" style={{ height: '64vh' }}>
          <div ref={chatRef} className="flex-1 overflow-y-auto custom-scroll p-4 space-y-3">
            {history.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.role === 'user' ? 'bg-gradient-to-br from-blood to-darkblood text-white' : 'glass-soft'}`}>
                  {m.role === 'ai' && <div className="text-[10px] text-red-400 mb-1 flex items-center gap-1"><Bot size={12} /> IA</div>}
                  {m.html ? <div dangerouslySetInnerHTML={{ __html: m.html }} /> : m.text}
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-red-900/40 flex gap-2">
            <input className="fld" placeholder={t('ai_ph')} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(input); }} />
            <Button onClick={() => send(input)}><Sparkles size={16} /> {t('ai_send')}</Button>
          </div>
        </Card>
        <Card className="p-4 space-y-2">
          <h3 className="font-display font-bold text-sm mb-2">{t('quick_actions')}</h3>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => send(quick.generate)}>{t('ai_generate')}</Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => send(quick.recommend)}>{t('ai_recommend')}</Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => send(quick.detect)}>{t('ai_detect')}</Button>
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => send(quick.optimize)}>{t('ai_optimize')}</Button>
        </Card>
      </div>
    </div>
  );
}

function genBed(W: number, L: number): Partial<Part>[] {
  return [
    makePart({ code: 'BF-01', name: 'Cabecero', category: 'panel', material: 'mdf', length: W + 50, width: 600, thickness: 30, qty: 1, color: '#b9743a', pos: { x: 0, y: 300, z: -(L / 2) } }),
    makePart({ code: 'BF-02', name: 'Piecero', category: 'panel', material: 'mdf', length: W + 50, width: 350, thickness: 30, qty: 1, color: '#b9743a', pos: { x: 0, y: 175, z: L / 2 } }),
    makePart({ code: 'BF-03', name: 'Larguero', category: 'frame', material: 'pine', length: L, width: 200, thickness: 30, qty: 2, color: '#c98a4b', pos: { x: W / 2, y: 120, z: 0 } }),
    makePart({ code: 'BF-04', name: 'Travesaño central', category: 'crossbar', material: 'pine', length: W - 60, width: 90, thickness: 30, qty: 1, color: '#d89b5a', pos: { x: 0, y: 60, z: 0 } }),
    makePart({ code: 'BF-05', name: 'Listón somier', category: 'crossbar', material: 'pine', length: W - 60, width: 70, thickness: 18, qty: Math.round(L / 150), color: '#e0a766', pos: { x: 0, y: 150, z: 0 } }),
    makePart({ code: 'BF-06', name: 'Pata', category: 'leg', material: 'oak', length: 120, width: 70, thickness: 70, qty: 4, color: '#8a5a2b', pos: { x: 0, y: 55, z: 0 } }),
    makePart({ code: 'BF-07', name: 'Tornillería', category: 'hardware', material: 'steel', length: 80, width: 8, thickness: 8, qty: 48 }),
  ];
}
function genSofa(W: number, D: number): Partial<Part>[] {
  return [
    makePart({ code: 'SF-01', name: 'Base estructura', category: 'frame', material: 'pine', length: W, width: D, thickness: 30, qty: 1, color: '#c98a4b' }),
    makePart({ code: 'SF-02', name: 'Respaldo', category: 'panel', material: 'plywood', length: W, width: 600, thickness: 18, qty: 1, color: '#b9743a' }),
    makePart({ code: 'SF-03', name: 'Brazo', category: 'panel', material: 'plywood', length: D, width: 600, thickness: 18, qty: 2, color: '#b9743a' }),
    makePart({ code: 'SF-04', name: 'Espuma asiento', category: 'foam', material: 'foam_d28', length: W - 100, width: D - 150, thickness: 120, qty: 1, color: '#f0d27a' }),
    makePart({ code: 'SF-05', name: 'Tela', category: 'fabric', material: 'fabric', length: W * 3, width: 1400, thickness: 1, qty: 1, color: '#7a2a2a' }),
    makePart({ code: 'SF-06', name: 'Pata', category: 'leg', material: 'oak', length: 150, width: 60, thickness: 60, qty: 4, color: '#8a5a2b' }),
  ];
}
function genTable(W: number, D: number): Partial<Part>[] {
  return [
    makePart({ code: 'TB-01', name: 'Tablero', category: 'panel', material: 'oak', length: W, width: D, thickness: 30, qty: 1, color: '#b9743a' }),
    makePart({ code: 'TB-02', name: 'Pata', category: 'leg', material: 'oak', length: 740, width: 80, thickness: 80, qty: 4, color: '#8a5a2b' }),
    makePart({ code: 'TB-03', name: 'Travesaño', category: 'crossbar', material: 'pine', length: W - 200, width: 90, thickness: 30, qty: 2, color: '#d89b5a' }),
  ];
}
