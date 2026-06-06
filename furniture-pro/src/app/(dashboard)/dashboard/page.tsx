'use client';
import { useRouter } from 'next/navigation';
import { Folder, List, DollarSign, Zap, Pen, Box, Bot } from 'lucide-react';
import { useStore, useT, useCurrentProject } from '@/lib/store';
import { computeBOM, computeCosts, STAGES, stageProgress } from '@/lib/calc';
import { fmtMoney, fmtNum, relTime } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DonutChart, BarChart, Legend } from '@/components/charts';
import Link from 'next/link';

export default function DashboardPage() {
  const t = useT();
  const router = useRouter();
  const projects = useStore((s) => s.projects);
  const settings = useStore((s) => s.settings);
  const user = useStore((s) => s.user);
  const setCurrentProject = useStore((s) => s.setCurrentProject);
  const proj = useCurrentProject();

  const totalParts = projects.reduce((s, p) => s + computeBOM(p).pieces, 0);
  const totalMaterial = projects.reduce((s, p) => s + computeBOM(p).materialCost, 0);
  const avgMargin = projects.length ? projects.reduce((s, p) => s + p.margin, 0) / projects.length : 0;
  const costs = proj ? computeCosts(proj, settings) : null;

  const kpis = [
    { label: t('active_projects'), value: String(projects.filter((p) => p.status === 'active').length), icon: Folder },
    { label: t('total_parts'), value: fmtNum(totalParts, 0), icon: List },
    { label: t('material_cost'), value: fmtMoney(totalMaterial, settings.currency), icon: DollarSign },
    { label: t('avg_margin'), value: `${fmtNum(avgMargin, 0)}%`, icon: Zap },
  ];
  const stageCounts = STAGES.map((s) => ({ label: t(s), value: projects.filter((p) => p.stage === STAGES.indexOf(s)).length }));

  return (
    <div>
      <PageHeader title={`${t('welcome')}, ${user?.name || ''}`} subtitle={t('overview')}
        actions={<Link href="/projects"><Button>{t('new_project')}</Button></Link>} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <Card key={i} className="p-4 relative overflow-hidden glow-hover">
              <Icon className="absolute -right-3 -top-3 text-red-600/10" size={90} />
              <Icon className="text-red-300" size={22} />
              <div className="text-2xl md:text-3xl font-display font-black mt-2 grad-text">{k.value}</div>
              <div className="text-xs text-zinc-400 mt-1">{k.label}</div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="xl:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">{t('recent_projects')}</h3>
            <Link href="/projects" className="text-xs text-red-300 hover:text-white">{t('view')} →</Link>
          </div>
          <div className="space-y-3">
            {projects.slice(0, 5).map((p) => {
              const b = computeBOM(p);
              return (
                <div key={p.id} onClick={() => { setCurrentProject(p.id); router.push('/bom'); }}
                  className="glass-soft rounded-xl p-3 flex items-center gap-3 glow-hover cursor-pointer">
                  <span className="w-10 h-10 rounded-lg bg-gradient-to-br from-blood to-darkblood flex items-center justify-center"><Box size={20} /></span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">{p.name}</div>
                    <div className="text-[11px] text-zinc-400">{b.partsCount} {t('pieces')} · {fmtMoney(computeCosts(p, settings).finalPrice, p.currency)}</div>
                  </div>
                  <div className="w-28">
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1"><span>{t(STAGES[p.stage])}</span><span>{stageProgress(p.stage)}%</span></div>
                    <div className="bar"><i style={{ width: `${stageProgress(p.stage)}%` }} /></div>
                  </div>
                  <span className="text-[10px] text-zinc-500">{relTime(p.updatedAt)}</span>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-2">{t('cost_distribution')}</h3>
          <p className="text-xs text-zinc-400 mb-3">{proj?.name}</p>
          {costs && (
            <>
              <div className="flex justify-center">
                <DonutChart data={costs.breakdown.map((b) => ({ value: b.value, color: b.color }))}
                  centerLabel={fmtMoney(costs.finalPrice, proj!.currency)} centerSub={t('final_price')} />
              </div>
              <Legend items={costs.breakdown.map((b) => ({ label: t(b.key), color: b.color, value: fmtMoney(b.value, proj!.currency) }))} />
            </>
          )}
        </Card>

        <Card className="xl:col-span-2 p-5">
          <h3 className="font-display font-bold text-lg mb-3">{t('production_status')}</h3>
          <BarChart data={stageCounts.map((s) => ({ ...s, display: String(s.value) }))} />
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold text-lg mb-3">{t('quick_actions')}</h3>
          <div className="grid gap-2">
            <Link href="/design2d"><Button variant="ghost" className="w-full justify-start"><Pen size={16} /> {t('open_2d')}</Button></Link>
            <Link href="/design3d"><Button variant="ghost" className="w-full justify-start"><Box size={16} /> {t('open_3d')}</Button></Link>
            <Link href="/bom"><Button variant="ghost" className="w-full justify-start"><List size={16} /> {t('gen_bom')}</Button></Link>
            <Link href="/ai"><Button variant="ghost" className="w-full justify-start"><Bot size={16} /> {t('nav_ai')}</Button></Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
