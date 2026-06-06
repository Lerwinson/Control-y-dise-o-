'use client';
import { useState } from 'react';
import { useStore, useT } from '@/lib/store';
import { computeCosts, computeBOM, STAGES } from '@/lib/calc';
import { fmtMoney, fmtNum } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart, LineChart, DonutChart, Legend } from '@/components/charts';

const TABS = [
  { id: 'production', label: 'rep_production' },
  { id: 'costs', label: 'rep_costs' },
  { id: 'material', label: 'rep_material' },
  { id: 'profit', label: 'profitability' },
];
const series = (n: number, base: number, varc: number) => {
  const out: number[] = []; let v = base;
  for (let i = 0; i < n; i++) { v = Math.max(2, v + Math.sin(i * 1.7) * varc); out.push(Math.round(v)); }
  return out;
};

export default function ReportsPage() {
  const t = useT();
  const projects = useStore((s) => s.projects);
  const settings = useStore((s) => s.settings);
  const [tab, setTab] = useState('production');

  const Panel = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card className="p-5"><h3 className="font-display font-bold mb-3">{title}</h3>{children}</Card>
  );

  let body: React.ReactNode = null;
  if (tab === 'production') {
    const daily = ['L', 'M', 'X', 'J', 'V', 'S', 'D'].map((d, i) => ({ label: d, value: series(7, 6, 4)[i] }));
    const weekly = Array.from({ length: 8 }, (_, i) => ({ label: `S${i + 1}`, value: series(8, 22, 9)[i] }));
    const monthly = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'].map((m, i) => ({ label: m, value: series(6, 80, 25)[i] }));
    const colors = ['#ff0000', '#ff5a5a', '#b30000', '#8b0000', '#ff8a3a', '#ffd23a'];
    body = (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Panel title={t('daily')}><BarChart data={daily} /></Panel>
        <Panel title={t('weekly')}><LineChart data={weekly} /></Panel>
        <Panel title={t('monthly')}><BarChart data={monthly} /></Panel>
        <Panel title={t('production_status')}>
          <div className="flex justify-center"><DonutChart data={STAGES.map((s, i) => ({ value: projects.filter((p) => p.stage === i).length || 0.001, color: colors[i] }))} centerLabel={String(projects.length)} centerSub={t('nav_projects')} /></div>
          <Legend items={STAGES.map((s, i) => ({ label: t(s), color: colors[i] }))} />
        </Panel>
      </div>
    );
  } else if (tab === 'costs') {
    const data = projects.map((p) => ({ label: p.name.slice(0, 8), value: Math.round(computeCosts(p, settings).cost) }));
    body = <Panel title={t('cost_breakdown')}><BarChart data={data} height={240} /></Panel>;
  } else if (tab === 'material') {
    let wood = 0, foam = 0, fabric = 0, hw = 0, weight = 0;
    projects.forEach((p) => { const b = computeBOM(p); wood += b.woodM3; foam += b.foamM3; fabric += b.fabricM2; hw += b.hardware; weight += b.weight; });
    const cards = [
      [t('wood_consumption'), `${fmtNum(wood, 3)} m³`], [t('foam_consumption'), `${fmtNum(foam, 3)} m³`],
      [t('fabric_consumption'), `${fmtNum(fabric, 2)} m²`], [t('hardware_count'), String(hw)], [t('total_weight'), `${fmtNum(weight, 1)} kg`],
    ];
    body = (<>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-5">
        {cards.map((c, i) => <Card key={i} className="p-4"><div className="text-xl font-display font-black grad-text">{c[1]}</div><div className="text-[10px] text-zinc-400">{c[0]}</div></Card>)}
      </div>
      <Panel title={`${t('rep_material')} / ${t('nav_projects')}`}><BarChart data={projects.map((p) => ({ label: p.name.slice(0, 8), value: Math.round(computeBOM(p).weight) }))} height={240} /></Panel>
    </>);
  } else {
    const data = projects.map((p) => { const c = computeCosts(p, settings); return { label: p.name.slice(0, 8), value: Math.round(c.profit), display: fmtMoney(c.profit, p.currency) }; });
    const totalProfit = projects.reduce((s, p) => s + computeCosts(p, settings).profit, 0);
    const totalRev = projects.reduce((s, p) => s + computeCosts(p, settings).finalPrice, 0);
    body = (<>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <Card className="p-4"><div className="text-[10px] text-zinc-400">{t('final_price')}</div><div className="text-xl font-display font-black grad-text">{fmtMoney(totalRev, settings.currency)}</div></Card>
        <Card className="p-4"><div className="text-[10px] text-zinc-400">{t('margin')}</div><div className="text-xl font-display font-black text-yellow-300">{fmtMoney(totalProfit, settings.currency)}</div></Card>
        <Card className="p-4"><div className="text-[10px] text-zinc-400">{t('profitability')}</div><div className="text-xl font-display font-black text-green-300">{fmtNum(totalRev ? (totalProfit / totalRev) * 100 : 0, 1)}%</div></Card>
      </div>
      <Panel title={`${t('profitability')} / ${t('nav_projects')}`}><BarChart data={data} height={240} /></Panel>
    </>);
  }

  return (
    <div>
      <PageHeader title={t('nav_reports')} subtitle={t('generate_report')} />
      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((x) => <Button key={x.id} variant={tab === x.id ? 'primary' : 'tool'} size="sm" onClick={() => setTab(x.id)}>{t(x.label)}</Button>)}
      </div>
      {body}
    </div>
  );
}
