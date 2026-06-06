'use client';
import { useT } from '@/lib/store';

export function Brandbar() {
  const t = useT();
  return (
    <footer className="glass border-t border-red-900/40 px-4 py-1.5 flex items-center justify-between text-[11px] shrink-0">
      <span className="text-zinc-500">© {new Date().getFullYear()} Furniture Structure Designer Pro</span>
      <span className="tracking-[0.25em] text-red-400/80">
        {t('developed_by')}: <span className="font-bold grad-text">LERWINSON MENDOZA</span>
      </span>
    </footer>
  );
}
