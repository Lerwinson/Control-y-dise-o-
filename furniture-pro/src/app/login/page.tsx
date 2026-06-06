'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box } from 'lucide-react';
import { useStore, useT } from '@/lib/store';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const t = useT();
  const router = useRouter();
  const login = useStore((s) => s.login);
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    login(String(form.get('email')), form.get('name') ? String(form.get('name')) : undefined);
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass neon-border iridescent rounded-3xl w-full max-w-md p-8 animate-fadeIn relative">
        <div className="text-center mb-7">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blood to-darkblood flex items-center justify-center shadow-neon mb-4">
            <Box size={34} />
          </div>
          <h1 className="font-display font-black text-2xl grad-text neon-text">FURNITURE STRUCTURE</h1>
          <p className="font-display tracking-[0.3em] text-red-400 text-sm">DESIGNER&nbsp;PRO</p>
          <p className="text-xs text-zinc-400 mt-2">{t('tagline')}</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === 'register' && (
            <div><label className="lbl">{t('name')}</label><input name="name" required className="fld mt-1" placeholder="Lerwinson Mendoza" /></div>
          )}
          <div><label className="lbl">{t('email')}</label><input name="email" type="email" required className="fld mt-1" placeholder="correo@empresa.com" /></div>
          <div><label className="lbl">{t('password')}</label><input name="password" type="password" required className="fld mt-1" placeholder="••••••••" /></div>
          <Button className="w-full text-base py-3">{mode === 'register' ? t('register') : t('enter')}</Button>
        </form>

        <div className="text-center text-xs text-zinc-400 mt-5 space-y-1">
          <button onClick={() => setMode(mode === 'register' ? 'login' : 'register')} className="text-red-300 hover:text-white hover:underline">
            {mode === 'register' ? `${t('have_account')} ${t('login')}` : `${t('no_account')} ${t('register')}`}
          </button>
          <p className="text-zinc-600">{t('demo_hint')}</p>
        </div>

        <div className="absolute -bottom-9 left-0 right-0 text-center text-[10px] tracking-widest text-red-400/70">
          {t('developed_by')}: <span className="font-bold text-red-300">LERWINSON MENDOZA</span>
        </div>
      </div>
    </div>
  );
}
