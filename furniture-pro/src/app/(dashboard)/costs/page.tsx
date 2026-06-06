'use client';
import { useStore, useT, useCurrentProject } from '@/lib/store';
import { computeCosts } from '@/lib/calc';
import { fmtMoney } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { DonutChart, BarChart, Legend } from '@/components/charts';
import type { Settings } from '@/lib/types';

const RATES: { label: string; field: keyof Settings }[] = [
  { label: 'labor', field: 'laborRate' },
  { label: 'overhead', field: 'overheadRate' },
  { label: 'transport', field: 'transportRate' },
  { label: 'taxes', field: 'taxRate' },
];

export default function CostsPage() {
  const t = useT();
  const proj = useCurrentProject();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const updateProject = useStore((s) => s.updateProject);
  if (!proj) return <p className="text-zinc-500">{t('select_project')}</p>;
  const c = computeCosts(proj, settings);

  const Kpi = ({ label, value, kind }: { label: string; value: number; kind?: string }) => (
    <div className="glass-soft rounded-xl p-3">
      <div className="text-[10px] text-zinc-400">{label}</div>
      <div className={`text-lg font-display font-bold ${kind === 'grad' ? 'grad-text' : kind === 'yellow' ? 'text-yellow-300' : 'text-white'}`}>{fmtMoney(value, proj.currency)}</div>
    </div>
  );

  return (
    <div>
      <PageHeader title={t('nav_costs')} subtitle={proj.name} />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <Card className="p-5">
          <h3 className="font-display font-bold mb-3">{t('cost_breakdown')}</h3>
          <div className="flex justify-center">
            <DonutChart size={200} data={c.breakdown.map((b) => ({ value: b.value, color: b.color }))}
              centerLabel={fmtMoney(c.finalPrice, proj.currency)} centerSub={t('final_price')} />
          </div>
          <Legend items={c.breakdown.map((b) => ({ label: t(b.key), color: b.color, value: fmtMoney(b.value, proj.currency) }))} />
        </Card>

        <Card className="xl:col-span-2 p-5">
          <h3 className="font-display font-bold mb-3">{t('cost_distribution')}</h3>
          <BarChart data={c.breakdown.map((b) => ({ label: t(b.key), value: Math.round(b.value), display: fmtMoney(b.value, proj.currency) }))} height={220} />
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold mb-4">{t('apply')} (%)</h3>
          <div className="space-y-4">
            {RATES.map((r) => (
              <div key={r.field}>
                <div className="flex justify-between text-xs mb-1"><span className="text-zinc-300">{t(r.label)}</span><span className="text-red-300 font-bold">{Math.round((settings[r.field] as number) * 100)}%</span></div>
                <input type="range" min={0} max={100} value={Math.round((settings[r.field] as number) * 100)}
                  onChange={(e) => updateSettings({ [r.field]: +e.target.value / 100 } as Partial<Settings>)} className="w-full accent-red-600" />
              </div>
            ))}
            <div>
              <div className="flex justify-between text-xs mb-1"><span className="text-zinc-300">{t('margin')}</span><span className="text-yellow-300 font-bold">{proj.margin}%</span></div>
              <input type="range" min={0} max={120} value={proj.margin} onChange={(e) => updateProject(proj.id, { margin: +e.target.value })} className="w-full accent-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-2 p-5">
          <h3 className="font-display font-bold mb-4">{t('final_price')}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <Kpi label={t('raw_material')} value={c.raw} />
            <Kpi label={t('labor')} value={c.labor} />
            <Kpi label={`${t('overhead')} + ${t('transport')}`} value={c.overhead + c.transport} />
            <Kpi label={t('taxes')} value={c.taxes} />
            <Kpi label={`${t('margin')} (${Math.round(c.marginPct)}%)`} value={c.profit} kind="yellow" />
            <Kpi label={t('final_price')} value={c.finalPrice} kind="grad" />
          </div>
          <div className="mt-4 glass-soft rounded-xl p-4 flex items-center justify-between">
            <span className="text-sm text-zinc-300">{t('unit_price')} ({c.bom.partsCount} {t('pieces')})</span>
            <span className="text-2xl font-display font-black grad-text">{fmtMoney(c.finalPrice, proj.currency)}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
