'use client';
import { Download, Copy, Trash2, Check, Shield } from 'lucide-react';
import { useStore, useT } from '@/lib/store';
import { LANGS } from '@/lib/i18n';
import { download } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Lang } from '@/lib/types';

const ROLES = [
  { key: 'role_admin', perms: ['*'] },
  { key: 'role_designer', perms: ['design', 'bom', 'library'] },
  { key: 'role_production', perms: ['production', 'reports'] },
  { key: 'role_viewer', perms: ['view'] },
];

export default function SettingsPage() {
  const t = useT();
  const settings = useStore((s) => s.settings);
  const updateSettings = useStore((s) => s.updateSettings);
  const lang = useStore((s) => s.lang);
  const setLang = useStore((s) => s.setLang);
  const resetAll = useStore((s) => s.resetAll);

  const doBackup = () => {
    const state = useStore.getState();
    download('fsdp_backup.json', JSON.stringify(state, null, 2), 'application/json');
  };

  return (
    <div>
      <PageHeader title={t('nav_settings')} subtitle={t('set_general')} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5">
          <h3 className="font-display font-bold mb-4">{t('set_general')}</h3>
          <div className="space-y-3">
            <div><label className="lbl">{t('set_company')}</label><input className="fld mt-1" defaultValue={settings.company} onBlur={(e) => updateSettings({ company: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="lbl">{t('set_currency')}</label>
                <select className="fld mt-1" value={settings.currency} onChange={(e) => updateSettings({ currency: e.target.value })}>
                  {['USD', 'EUR', 'BRL', 'MXN', 'COP'].map((c) => <option key={c}>{c}</option>)}
                </select></div>
              <div><label className="lbl">{t('set_units')}</label>
                <select className="fld mt-1" value={settings.units} onChange={(e) => updateSettings({ units: e.target.value as any })}>
                  {['mm', 'cm', 'in'].map((u) => <option key={u}>{u}</option>)}
                </select></div>
            </div>
            <div><label className="lbl">{t('language')}</label>
              <select className="fld mt-1" value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                {LANGS.map((l) => <option key={l.code} value={l.code}>{l.flag} {l.label}</option>)}
              </select></div>
            <label className="flex items-center gap-2 text-sm mt-2">
              <input type="checkbox" checked={settings.versioning} onChange={(e) => updateSettings({ versioning: e.target.checked })} className="accent-red-600" /> {t('versioning')}
            </label>
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2"><Shield size={18} /> {t('set_roles')}</h3>
          <div className="space-y-2">
            {ROLES.map((r) => (
              <div key={r.key} className="glass-soft rounded-xl p-3 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-sm">{t(r.key)}</div>
                  <div className="text-[10px] text-zinc-400 flex gap-1 mt-1">{r.perms.map((p) => <span key={p} className="badge" style={{ background: 'rgba(255,0,0,0.12)', color: '#fca' }}>{p}</span>)}</div>
                </div>
                <span className="badge" style={{ background: 'rgba(40,209,124,0.12)', color: '#5ef0a0' }}><Check size={12} /></span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="font-display font-bold mb-4 flex items-center gap-2"><Download size={18} /> {t('set_backup')}</h3>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={doBackup}><Download size={16} /> {t('backup_now')}</Button>
            <Button variant="ghost"><Copy size={16} /> {t('restore')}</Button>
            <Button variant="ghost" className="text-red-300" onClick={() => resetAll()}><Trash2 size={16} /> Reset</Button>
          </div>
          <p className="text-[11px] text-zinc-500 mt-3">{t('versioning')}: {settings.versioning ? '✓' : '✕'} · localStorage / Prisma</p>
        </Card>
      </div>

      <div className="text-center mt-8 text-xs tracking-[0.3em] text-red-400/70">
        {t('developed_by')}: <span className="font-bold grad-text">LERWINSON MENDOZA</span>
      </div>
    </div>
  );
}
