'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Search, Globe, Bell, Box, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useStore, useT } from '@/lib/store';
import { LANGS } from '@/lib/i18n';
import { relTime } from '@/lib/utils';
import type { Lang } from '@/lib/types';

export function Topbar({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const t = useT();
  const router = useRouter();
  const user = useStore((s) => s.user);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const logout = useStore((s) => s.logout);
  const projects = useStore((s) => s.projects);
  const setCurrentProject = useStore((s) => s.setCurrentProject);
  const notifications = useStore((s) => s.notifications);
  const markRead = useStore((s) => s.markNotificationsRead);

  const [menu, setMenu] = useState<null | 'lang' | 'notif' | 'profile'>(null);
  const [query, setQuery] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);
  const unread = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    const close = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setMenu(null); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const hits = query.trim()
    ? projects.flatMap((p) => {
        const out: { label: string; type: string; action: () => void }[] = [];
        if (p.name.toLowerCase().includes(query.toLowerCase()))
          out.push({ type: t('project'), label: p.name, action: () => { setCurrentProject(p.id); router.push('/bom'); } });
        p.parts.forEach((pt) => {
          if (pt.name.toLowerCase().includes(query.toLowerCase()) || pt.code.toLowerCase().includes(query.toLowerCase()))
            out.push({ type: t('material'), label: `${pt.code} · ${pt.name}`, action: () => { setCurrentProject(p.id); router.push('/bom'); } });
        });
        return out;
      }).slice(0, 10)
    : [];

  return (
    <header ref={boxRef} className="glass border-b border-red-900/40 px-3 md:px-5 h-16 flex items-center gap-3 shrink-0 z-30 relative">
      <button onClick={onToggleSidebar} className="bg-black/50 border border-red-500/20 text-orange-200 p-2 rounded-lg hover:bg-red-600/20"><Menu size={20} /></button>
      <div className="hidden md:flex items-center gap-2 font-display font-black text-lg grad-text">
        <Box className="text-blood" size={22} /> FSD<span className="text-red-300">PRO</span>
      </div>

      <div className="flex-1 max-w-xl relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-red-400" />
        <input className="fld pl-10" placeholder={t('search_ph')} value={query} onChange={(e) => setQuery(e.target.value)} />
        {hits.length > 0 && (
          <div className="absolute mt-2 w-full glass neon-border rounded-xl p-2 z-40 max-h-72 overflow-y-auto custom-scroll">
            {hits.map((h, i) => (
              <button key={i} onClick={() => { h.action(); setQuery(''); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-600/20 text-sm">
                <span className="text-[10px] text-red-400 uppercase mr-2">{h.type}</span>{h.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <div className="hidden sm:flex items-center gap-1.5 glass-soft px-3 py-1.5 rounded-full text-xs">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /><span className="text-green-300">{t('online')}</span>
        </div>

        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setMenu(menu === 'lang' ? null : 'lang'); }} className="bg-black/50 border border-red-500/20 text-orange-200 p-2 rounded-lg hover:bg-red-600/20"><Globe size={20} /></button>
          {menu === 'lang' && (
            <div className="absolute right-0 mt-2 glass neon-border rounded-xl p-1 z-40 w-40">
              {LANGS.map((l) => (
                <button key={l.code} onClick={() => { setLang(l.code as Lang); setMenu(null); }} className={`w-full text-left px-3 py-2 rounded-lg hover:bg-red-600/20 text-sm flex items-center gap-2 ${lang === l.code ? 'text-red-300' : 'text-zinc-300'}`}>{l.flag} {l.label}</button>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setMenu(menu === 'notif' ? null : 'notif'); markRead(); }} className="bg-black/50 border border-red-500/20 text-orange-200 p-2 rounded-lg hover:bg-red-600/20 relative">
            <Bell size={20} />
            {unread > 0 && <span className="absolute -top-1 -right-1 bg-blood text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-neon">{unread}</span>}
          </button>
          {menu === 'notif' && (
            <div className="absolute right-0 mt-2 glass neon-border rounded-xl p-2 z-40 w-80 max-h-96 overflow-y-auto custom-scroll">
              <div className="px-2 py-1 text-xs font-bold text-red-300 uppercase">{t('notifications')}</div>
              {notifications.map((n) => (
                <div key={n.id} className={`px-2 py-2 rounded-lg text-sm ${n.read ? 'opacity-60' : 'bg-red-600/10'}`}>{n.text}<div className="text-[10px] text-zinc-500 mt-0.5">{relTime(n.ts)}</div></div>
              ))}
            </div>
          )}
        </div>

        <div className="relative">
          <button onClick={(e) => { e.stopPropagation(); setMenu(menu === 'profile' ? null : 'profile'); }} className="flex items-center gap-2 bg-black/50 border border-red-500/20 pl-1 pr-3 py-1 rounded-full hover:bg-red-600/20">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-blood to-darkblood flex items-center justify-center font-bold text-sm">{user?.avatar || 'U'}</span>
            <span className="hidden md:block text-sm">{user?.name || 'User'}</span>
          </button>
          {menu === 'profile' && (
            <div className="absolute right-0 mt-2 glass neon-border rounded-xl p-2 z-40 w-56">
              <div className="px-3 py-2 border-b border-red-900/40">
                <div className="font-semibold text-sm">{user?.name}</div>
                <div className="text-xs text-zinc-400">{user?.email}</div>
                <span className="badge mt-1" style={{ background: 'rgba(255,0,0,0.15)', color: '#fca' }}>{t('role_admin')}</span>
              </div>
              <button onClick={() => { setMenu(null); router.push('/settings'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-600/20 text-sm flex items-center gap-2"><SettingsIcon size={16} /> {t('nav_settings')}</button>
              <button onClick={() => { logout(); router.push('/login'); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-600/20 text-sm flex items-center gap-2 text-red-300"><LogOut size={16} /> {t('logout')}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
