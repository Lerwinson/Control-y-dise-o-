'use client';
import { useRouter } from 'next/navigation';
import { Plus, Folder } from 'lucide-react';
import { useStore, useT } from '@/lib/store';
import { TEMPLATES } from '@/lib/data';
import { computeBOM, computeCosts } from '@/lib/calc';
import { fmtMoney } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ProjectType } from '@/lib/types';

const CFG: Record<string, { type: ProjectType; title: string; cats: string[] }> = {
  sofas: { type: 'sofa', title: 'nav_sofas', cats: ['sofas'] },
  beds: { type: 'bed', title: 'nav_beds', cats: ['beds', 'bases'] },
  mattress: { type: 'mattress', title: 'nav_mattress', cats: ['mattress'] },
  furniture: { type: 'furniture', title: 'nav_furniture', cats: ['tables', 'chairs', 'closets', 'wardrobes', 'custom'] },
};

export function CatalogView({ kind }: { kind: keyof typeof CFG }) {
  const t = useT();
  const router = useRouter();
  const cfg = CFG[kind];
  const projects = useStore((s) => s.projects).filter((p) => p.type === cfg.type);
  const settings = useStore((s) => s.settings);
  const fromTemplate = useStore((s) => s.fromTemplate);
  const setCurrentProject = useStore((s) => s.setCurrentProject);
  const templates = TEMPLATES.filter((tp) => cfg.cats.includes(tp.cat));

  return (
    <div>
      <PageHeader title={t(cfg.title)} subtitle={`${t('templates')} & ${t('nav_projects')}`} />

      <h3 className="font-display font-bold mb-3 text-red-300">{t('templates')}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        {templates.map((tp) => {
          const parts = tp.build();
          return (
            <Card key={tp.id} className="p-4 glow-hover">
              <div className="aspect-video stage rounded-lg mb-3 flex items-center justify-center text-red-500/40 font-display text-3xl">3D</div>
              <div className="font-semibold text-sm">{tp.name}</div>
              <div className="text-[11px] text-zinc-400 mb-3">{parts.length} {t('pieces')}</div>
              <Button className="w-full" size="sm" onClick={() => { fromTemplate(tp.id); router.push('/bom'); }}><Plus size={14} /> {t('use_template')}</Button>
            </Card>
          );
        })}
        {templates.length === 0 && <p className="text-zinc-500 text-sm col-span-full">{t('none')}</p>}
      </div>

      <h3 className="font-display font-bold mb-3 text-red-300 flex items-center gap-2"><Folder size={18} /> {t('nav_projects')}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => {
          const b = computeBOM(p), c = computeCosts(p, settings);
          return (
            <div key={p.id} onClick={() => { setCurrentProject(p.id); router.push('/bom'); }} className="glass-soft rounded-xl p-4 glow-hover cursor-pointer">
              <div className="font-semibold text-sm truncate">{p.name}</div>
              <div className="text-[11px] text-zinc-400 mt-1">{b.partsCount} {t('pieces')} · {fmtMoney(c.finalPrice, p.currency)}</div>
            </div>
          );
        })}
        {projects.length === 0 && <p className="text-zinc-500 text-sm col-span-full">{t('none')}</p>}
      </div>
    </div>
  );
}
