'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV } from './nav';
import { useStore, useT } from '@/lib/store';
import { cn } from '@/lib/utils';

export function Sidebar({ open }: { open: boolean }) {
  const pathname = usePathname();
  const t = useT();
  const projects = useStore((s) => s.projects);
  const currentId = useStore((s) => s.currentProjectId) ?? projects[0]?.id;
  const setCurrentProject = useStore((s) => s.setCurrentProject);

  return (
    <aside
      className={cn(
        'glass border-r border-red-900/40 shrink-0 overflow-y-auto custom-scroll transition-all duration-300 z-20',
        open ? 'w-64' : 'w-0 overflow-hidden'
      )}
    >
      <div className="p-3 w-64">
        <div className="glass-soft rounded-xl p-3 mb-3">
          <div className="text-[10px] uppercase tracking-wide text-red-400 mb-1">{t('project')}</div>
          <select
            className="fld text-sm"
            value={currentId || ''}
            onChange={(e) => setCurrentProject(e.target.value)}
          >
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>

        {NAV.map((grp) => (
          <div key={grp.section} className="mb-2">
            <div className="px-3 py-1 text-[10px] uppercase tracking-[0.15em] text-red-500/70 font-bold">{t(grp.section)}</div>
            {grp.items.map((it) => {
              const Icon = it.icon;
              const active = pathname === it.href;
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={cn('nav-item flex items-center gap-3 px-3 py-2.5 rounded-r-lg text-sm', active ? 'active text-white' : 'text-zinc-300')}
                >
                  <Icon size={19} className={cn('text-red-400', active && 'drop-shadow-[0_0_6px_rgba(255,0,0,0.9)]')} />
                  <span>{t(it.label)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
