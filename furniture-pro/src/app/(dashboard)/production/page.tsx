'use client';
import { ChevronRight, Check } from 'lucide-react';
import { useStore, useT } from '@/lib/store';
import { STAGES, stageProgress } from '@/lib/calc';
import { relTime } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Project } from '@/lib/types';

export default function ProductionPage() {
  const t = useT();
  const projects = useStore((s) => s.projects);
  const advanceStage = useStore((s) => s.advanceStage);
  const pushNotification = useStore((s) => s.pushNotification);

  const active = projects.filter((p) => p.stage < 5);
  const done = projects.filter((p) => p.stage >= 5);

  const ProdCard = ({ p }: { p: Project }) => {
    const prog = stageProgress(p.stage);
    const isDone = p.stage >= 5;
    return (
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold truncate">{p.name}</div>
          <span className="badge" style={{ background: isDone ? 'rgba(40,209,124,0.15)' : 'rgba(255,0,0,0.15)', color: isDone ? '#5ef0a0' : '#fca' }}>{t(STAGES[p.stage])}</span>
        </div>
        <div className="flex items-center gap-1 mb-3">
          {STAGES.map((s, i) => <div key={s} className={`flex-1 h-2 rounded-full ${i <= p.stage ? 'bg-gradient-to-r from-blood to-darkblood' : 'bg-white/10'}`} title={t(s)} />)}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">{t('progress')}: <b className="grad-text">{prog}%</b></span>
          <span className="text-[10px] text-zinc-500">{relTime(p.updatedAt)}</span>
          {!isDone
            ? <Button size="sm" onClick={() => { advanceStage(p.id); pushNotification(`"${p.name}" → ${t(STAGES[Math.min(5, p.stage + 1)])}`); }}><ChevronRight size={14} /> {t('advance_stage')}</Button>
            : <span className="text-green-400"><Check size={18} /></span>}
        </div>
      </Card>
    );
  };

  return (
    <div>
      <PageHeader title={t('nav_production')} subtitle={t('production_status')} />
      <Card className="p-5 mb-6 overflow-x-auto custom-scroll">
        <div className="flex items-center gap-2 min-w-[700px]">
          {STAGES.map((s, i) => (
            <div key={s} className="flex-1">
              <div className="glass-soft rounded-xl p-3 text-center">
                <div className="text-xs font-semibold">{t(s)}</div>
                <div className="text-2xl font-display font-black grad-text">{projects.filter((p) => p.stage === i).length}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <h3 className="font-display font-bold mb-3 text-red-300">{t('active_projects')}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        {active.length ? active.map((p) => <ProdCard key={p.id} p={p} />) : <p className="text-zinc-500 text-sm">{t('none')}</p>}
      </div>

      {done.length > 0 && (<>
        <h3 className="font-display font-bold mb-3 text-green-300">{t('st_done')}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">{done.map((p) => <ProdCard key={p.id} p={p} />)}</div>
      </>)}
    </div>
  );
}
