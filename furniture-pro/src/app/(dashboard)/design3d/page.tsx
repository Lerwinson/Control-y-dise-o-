'use client';
import dynamic from 'next/dynamic';
import { useT, useCurrentProject } from '@/lib/store';
import { PageHeader } from '@/components/layout/PageHeader';

const Designer3D = dynamic(() => import('@/components/three/Designer3D').then((m) => m.Designer3D), {
  ssr: false,
  loading: () => <div className="h-[64vh] flex items-center justify-center"><div className="loader" /></div>,
});

export default function Design3DPage() {
  const t = useT();
  const proj = useCurrentProject();
  if (!proj) return <p className="text-zinc-500">{t('select_project')}</p>;
  return (
    <div>
      <PageHeader title={t('nav_design3d')} subtitle={proj.name} />
      <Designer3D startExploded={false} />
    </div>
  );
}
