'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Eye, Copy, Trash2, Box } from 'lucide-react';
import { useStore, useT } from '@/lib/store';
import { TEMPLATES } from '@/lib/data';
import { computeBOM, computeCosts, STAGES, stageProgress } from '@/lib/calc';
import { fmtMoney, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProjectType } from '@/lib/types';

export default function ProjectsPage() {
  const t = useT();
  const router = useRouter();
  const projects = useStore((s) => s.projects);
  const settings = useStore((s) => s.settings);
  const createProject = useStore((s) => s.createProject);
  const fromTemplate = useStore((s) => s.fromTemplate);
  const duplicateProject = useStore((s) => s.duplicateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const setCurrentProject = useStore((s) => s.setCurrentProject);
  const [showNew, setShowNew] = useState(false);

  return (
    <div>
      <PageHeader title={t('nav_projects')} subtitle={t('overview')}
        actions={<Button onClick={() => setShowNew(true)}><Plus size={16} /> {t('new_project')}</Button>} />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.length === 0 && <Card className="p-10 text-center text-zinc-500 col-span-full">{t('none')}</Card>}
        {projects.map((p) => {
          const b = computeBOM(p), c = computeCosts(p, settings);
          return (
            <Card key={p.id} className="p-5 glow-hover">
              <div className="flex items-start justify-between">
                <span className="w-11 h-11 rounded-xl bg-gradient-to-br from-blood to-darkblood flex items-center justify-center"><Box size={22} /></span>
                <div className="flex gap-1">
                  <button onClick={() => { setCurrentProject(p.id); router.push('/design3d'); }} className="bg-black/50 border border-red-500/20 p-1.5 rounded-lg hover:bg-red-600/20"><Eye size={16} /></button>
                  <button onClick={() => duplicateProject(p.id)} className="bg-black/50 border border-red-500/20 p-1.5 rounded-lg hover:bg-red-600/20"><Copy size={16} /></button>
                  <button onClick={() => deleteProject(p.id)} className="bg-black/50 border border-red-500/20 p-1.5 rounded-lg hover:bg-red-600/20"><Trash2 size={16} /></button>
                </div>
              </div>
              <h3 className="font-semibold mt-3 truncate cursor-pointer" onClick={() => { setCurrentProject(p.id); router.push('/bom'); }}>{p.name}</h3>
              <div className="text-xs text-zinc-400 capitalize">{p.type} · {b.partsCount} {t('pieces')}</div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                <div className="glass-soft rounded-lg p-2"><div className="text-[10px] text-zinc-400">{t('final_price')}</div><div className="font-bold grad-text">{fmtMoney(c.finalPrice, p.currency)}</div></div>
                <div className="glass-soft rounded-lg p-2"><div className="text-[10px] text-zinc-400">{t('total_weight')}</div><div className="font-bold">{b.weight.toFixed(1)} kg</div></div>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-[10px] text-zinc-400 mb-1"><span>{t(STAGES[p.stage])}</span><span>{stageProgress(p.stage)}%</span></div>
                <div className="bar"><i style={{ width: `${stageProgress(p.stage)}%` }} /></div>
              </div>
              <div className="text-[10px] text-zinc-500 mt-2">{t('updated')}: {relTime(p.updatedAt)}</div>
            </Card>
          );
        })}
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowNew(false)} />
          <div className="glass neon-border rounded-2xl w-full max-w-lg relative animate-fadeIn">
            <div className="flex items-center justify-between px-5 py-4 border-b border-red-900/40">
              <h3 className="font-display font-bold text-lg grad-text">{t('new_project')}</h3>
              <button onClick={() => setShowNew(false)} className="text-red-300 hover:text-white">✕</button>
            </div>
            <form className="space-y-4 p-5" onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const tpl = String(f.get('template'));
              if (tpl) fromTemplate(tpl, String(f.get('name')) || undefined);
              else createProject({ name: String(f.get('name')), type: f.get('type') as ProjectType });
              setShowNew(false); router.push('/bom');
            }}>
              <div><label className="lbl">{t('name_lbl')}</label><input name="name" required className="fld mt-1" placeholder="Cama Queen — Cliente" /></div>
              <div><label className="lbl">{t('type')}</label>
                <select name="type" className="fld mt-1">
                  <option value="bed">{t('nav_beds')}</option><option value="sofa">{t('nav_sofas')}</option>
                  <option value="mattress">{t('nav_mattress')}</option><option value="furniture">{t('nav_furniture')}</option>
                  <option value="custom">{t('lc_custom')}</option>
                </select></div>
              <div><label className="lbl">{t('templates')}</label>
                <select name="template" className="fld mt-1">
                  <option value="">— {t('none')} —</option>
                  {TEMPLATES.map((tp) => <option key={tp.id} value={tp.id}>{tp.name}</option>)}
                </select></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowNew(false)}>{t('cancel')}</Button>
                <Button type="submit">{t('create')}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
