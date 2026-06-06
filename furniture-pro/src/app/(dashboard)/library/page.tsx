'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { useStore, useT } from '@/lib/store';
import { TEMPLATES } from '@/lib/data';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const CATS = [
  { key: 'all', label: 'total' }, { key: 'sofas', label: 'lc_sofas' }, { key: 'beds', label: 'lc_beds' },
  { key: 'bases', label: 'lc_bases' }, { key: 'mattress', label: 'lc_mattress' }, { key: 'tables', label: 'lc_tables' },
  { key: 'chairs', label: 'lc_chairs' }, { key: 'closets', label: 'lc_closets' }, { key: 'wardrobes', label: 'lc_wardrobes' },
  { key: 'custom', label: 'lc_custom' },
];

export default function LibraryPage() {
  const t = useT();
  const router = useRouter();
  const fromTemplate = useStore((s) => s.fromTemplate);
  const [cat, setCat] = useState('all');
  const list = cat === 'all' ? TEMPLATES : TEMPLATES.filter((tp) => tp.cat === cat);

  return (
    <div>
      <PageHeader title={t('nav_library')} subtitle={t('templates')} />
      <div className="flex flex-wrap gap-2 mb-5">
        {CATS.map((c) => (
          <Button key={c.key} variant={cat === c.key ? 'primary' : 'tool'} size="sm" onClick={() => setCat(c.key)}>{t(c.label)}</Button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {list.map((tp) => {
          const parts = tp.build();
          return (
            <Card key={tp.id} className="p-4 glow-hover">
              <div className="aspect-square stage rounded-lg mb-3 flex items-center justify-center text-red-500/40 relative font-display text-4xl">
                3D<span className="badge absolute top-2 left-2" style={{ background: 'rgba(255,0,0,0.15)', color: '#fca' }}>{tp.cat}</span>
              </div>
              <div className="font-semibold text-sm truncate">{tp.name}</div>
              <div className="text-[11px] text-zinc-400 mb-3">{parts.length} {t('pieces')}</div>
              <Button className="w-full" size="sm" onClick={() => { fromTemplate(tp.id); router.push('/bom'); }}><Plus size={14} /> {t('use_template')}</Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
