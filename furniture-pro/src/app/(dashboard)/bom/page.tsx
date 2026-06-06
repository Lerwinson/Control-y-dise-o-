'use client';
import { useState } from 'react';
import { Plus, Download, FileText, Pencil, Trash2, List, Box, Layers, PencilRuler, Settings, Zap } from 'lucide-react';
import { useStore, useT, useCurrentProject } from '@/lib/store';
import { MATERIALS } from '@/lib/data';
import { computeBOM } from '@/lib/calc';
import { fmtMoney, fmtNum, download } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Part, PartCategory } from '@/lib/types';

const CATS: PartCategory[] = ['frame', 'reinforcement', 'crossbar', 'panel', 'support', 'foam', 'fabric', 'hardware', 'leg'];

export default function BomPage() {
  const t = useT();
  const proj = useCurrentProject();
  const addPart = useStore((s) => s.addPart);
  const updatePart = useStore((s) => s.updatePart);
  const deletePart = useStore((s) => s.deletePart);
  const [editing, setEditing] = useState<Part | 'new' | null>(null);

  if (!proj) return <p className="text-zinc-500">{t('select_project')}</p>;
  const bom = computeBOM(proj);

  const summary = [
    { label: t('parts_count'), value: String(bom.pieces), Icon: List },
    { label: t('wood_consumption'), value: `${fmtNum(bom.woodM3, 3)} m³`, Icon: Box },
    { label: t('foam_consumption'), value: `${fmtNum(bom.foamM3, 3)} m³`, Icon: Layers },
    { label: t('fabric_consumption'), value: `${fmtNum(bom.fabricM2, 2)} m²`, Icon: PencilRuler },
    { label: t('hardware_count'), value: String(bom.hardware), Icon: Settings },
    { label: t('total_weight'), value: `${fmtNum(bom.weight, 1)} kg`, Icon: Zap },
  ];

  const exportCsv = () => {
    const head = ['#', t('code'), t('name_lbl'), t('category'), t('material'), 'L', 'A', 'E', t('quantity'), 'kg', t('cost')];
    const lines = [head.join(',')];
    bom.rows.forEach((r) => lines.push([r.idx, r.code, `"${r.name}"`, t('cat_' + r.category), r.materialName, r.length, r.width, r.thickness, r.qty, r.weight.toFixed(2), r.cost.toFixed(2)].join(',')));
    download(`BOM_${proj.name.replace(/\s+/g, '_')}.csv`, '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8');
  };

  return (
    <div>
      <PageHeader title={t('bom_title')} subtitle={`${proj.name} · ${t('auto_calc')}`}
        actions={<>
          <Button onClick={() => setEditing('new')}><Plus size={16} /> {t('add')}</Button>
          <Button variant="ghost" onClick={exportCsv}><Download size={16} /> CSV</Button>
          <Button variant="ghost" onClick={() => window.print()}><FileText size={16} /> PDF</Button>
        </>} />

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
        {summary.map((s, i) => {
          const Icon = s.Icon;
          return (
            <Card key={i} className="p-3 glow-hover">
              <Icon className="text-red-300" size={18} />
              <div className="text-lg font-display font-bold grad-text mt-1">{s.value}</div>
              <div className="text-[10px] text-zinc-400">{s.label}</div>
            </Card>
          );
        })}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto custom-scroll max-h-[55vh]">
          <table className="tech">
            <thead><tr>
              <th>#</th><th>{t('code')}</th><th>{t('name_lbl')}</th><th>{t('category')}</th><th>{t('material')}</th>
              <th>{t('length')}</th><th>{t('width')}</th><th>{t('thickness')}</th><th>{t('quantity')}</th>
              <th>{t('weight')}</th><th>{t('cost')}</th><th></th>
            </tr></thead>
            <tbody>
              {bom.rows.length === 0 && <tr><td colSpan={12} className="text-center text-zinc-500 py-8">{t('none')}</td></tr>}
              {bom.rows.map((r) => (
                <tr key={r.id}>
                  <td className="text-red-400 font-bold">{r.idx}</td>
                  <td className="font-mono text-xs">{r.code}</td>
                  <td><span className="inline-block w-3 h-3 rounded-sm mr-2 align-middle" style={{ background: r.color, boxShadow: `0 0 5px ${r.color}` }} />{r.name}</td>
                  <td><span className="badge" style={{ background: 'rgba(255,0,0,0.12)', color: '#fca' }}>{t('cat_' + r.category)}</span></td>
                  <td className="text-zinc-300">{r.materialName}</td>
                  <td>{r.length}</td><td>{r.width}</td><td>{r.thickness}</td>
                  <td>
                    <input type="number" min={1} defaultValue={r.qty} className="fld py-1 px-2 w-16 text-center"
                      onChange={(e) => updatePart(proj.id, r.id, { qty: Math.max(1, parseInt(e.target.value) || 1) })} />
                  </td>
                  <td>{fmtNum(r.weight, 2)} kg</td>
                  <td className="grad-text font-semibold">{fmtMoney(r.cost, proj.currency)}</td>
                  <td><div className="flex gap-1">
                    <button className="bg-black/50 border border-red-500/20 p-1.5 rounded-lg hover:bg-red-600/20" onClick={() => setEditing(proj.parts.find((p) => p.id === r.id)!)}><Pencil size={14} /></button>
                    <button className="bg-black/50 border border-red-500/20 p-1.5 rounded-lg hover:bg-red-600/20" onClick={() => deletePart(proj.id, r.id)}><Trash2 size={14} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr className="font-bold">
              <td colSpan={9} className="text-right text-red-300 uppercase text-xs">{t('total')}</td>
              <td>{fmtNum(bom.weight, 1)} kg</td>
              <td className="grad-text">{fmtMoney(bom.materialCost, proj.currency)}</td>
              <td></td>
            </tr></tfoot>
          </table>
        </div>
      </Card>

      {editing && (
        <PartModal
          part={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSave={(data) => {
            if (editing === 'new') addPart(proj.id, data);
            else updatePart(proj.id, (editing as Part).id, data);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function PartModal({ part, onClose, onSave }: { part: Part | null; onClose: () => void; onSave: (d: Partial<Part>) => void }) {
  const t = useT();
  const p = part || {};
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    onSave({
      code: String(f.get('code')), name: String(f.get('name')),
      category: f.get('category') as PartCategory, material: String(f.get('material')),
      length: +(f.get('length') || 0), width: +(f.get('width') || 0), thickness: +(f.get('thickness') || 0),
      qty: Math.max(1, +(f.get('qty') || 1)), color: String(f.get('color')), notes: String(f.get('notes') || ''),
    });
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="glass neon-border rounded-2xl w-full max-w-2xl relative animate-fadeIn max-h-[88vh] overflow-y-auto custom-scroll">
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-900/40">
          <h3 className="font-display font-bold text-lg grad-text">{part ? t('edit') : t('add')} · {t('material')}</h3>
          <button onClick={onClose} className="text-red-300 hover:text-white">✕</button>
        </div>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4 p-5">
          <Field label={t('code')} name="code" defaultValue={(p as Part).code || ''} />
          <Field label={t('name_lbl')} name="name" defaultValue={(p as Part).name || ''} required />
          <div><label className="lbl">{t('category')}</label>
            <select name="category" defaultValue={(p as Part).category || 'frame'} className="fld mt-1">
              {CATS.map((c) => <option key={c} value={c}>{t('cat_' + c)}</option>)}
            </select></div>
          <div><label className="lbl">{t('material')}</label>
            <select name="material" defaultValue={(p as Part).material || 'pine'} className="fld mt-1">
              {MATERIALS.map((m) => <option key={m.key} value={m.key}>{m.name}</option>)}
            </select></div>
          <Field label={`${t('length')} (mm)`} name="length" type="number" defaultValue={String((p as Part).length ?? 1000)} />
          <Field label={`${t('width')} (mm)`} name="width" type="number" defaultValue={String((p as Part).width ?? 50)} />
          <Field label={`${t('thickness')} (mm)`} name="thickness" type="number" defaultValue={String((p as Part).thickness ?? 25)} />
          <Field label={t('quantity')} name="qty" type="number" defaultValue={String((p as Part).qty ?? 1)} />
          <div><label className="lbl">Color</label><input name="color" type="color" defaultValue={(p as Part).color || '#c98a4b'} className="fld mt-1 h-10" /></div>
          <div className="col-span-2"><label className="lbl">{t('notes')}</label><textarea name="notes" defaultValue={(p as Part).notes || ''} className="fld mt-1" rows={2} /></div>
          <div className="col-span-2 flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>{t('cancel')}</Button>
            <Button type="submit">{t('save')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return <div><label className="lbl">{label}</label><input className="fld mt-1" {...props} /></div>;
}
