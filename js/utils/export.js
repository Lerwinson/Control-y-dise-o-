// Export helpers: CSV, print-to-PDF (browser), PNG/SVG from canvas
import { t } from '../i18n.js';
import { download, fmtMoney, fmtNum, esc } from './helpers.js';
import { computeCosts } from '../calc.js';

export function exportBOMCsv(proj, bom) {
  const head = ['#', t('code'), t('name_lbl'), t('category'), t('material'), t('length'), t('width'), t('thickness'), t('quantity'), t('weight') + '(kg)', t('cost'), t('notes')];
  const lines = [head.join(',')];
  bom.rows.forEach((r) => {
    lines.push([r.idx, r.code, `"${r.name}"`, t('cat_' + r.category), r.materialName, r.length, r.width, r.thickness, r.qty, r.weight.toFixed(2), r.cost.toFixed(2), `"${r.notes || ''}"`].join(','));
  });
  lines.push(['', '', '', '', '', '', '', '', '', bom.weight.toFixed(2), bom.materialCost.toFixed(2), ''].join(','));
  download(`BOM_${proj.name.replace(/\s+/g, '_')}.csv`, '\ufeff' + lines.join('\n'), 'text/csv;charset=utf-8');
}

export function exportCsvGeneric(filename, rows) {
  download(filename, '\ufeff' + rows.map((r) => r.join(',')).join('\n'), 'text/csv;charset=utf-8');
}

// Open a styled print window (user can "Save as PDF")
export function printBOM(proj, bom, settings) {
  const c = computeCosts(proj, settings);
  const w = window.open('', '_blank');
  if (!w) return;
  const rows = bom.rows.map((r) => `<tr><td>${r.idx}</td><td>${esc(r.code)}</td><td>${esc(r.name)}</td><td>${t('cat_' + r.category)}</td><td>${esc(r.materialName)}</td><td>${r.length}×${r.width}×${r.thickness}</td><td>${r.qty}</td><td>${fmtNum(r.weight, 2)}</td><td>${fmtMoney(r.cost, proj.currency)}</td></tr>`).join('');
  const costRows = c.breakdown.map((b) => `<tr><td>${t(b.key)}</td><td style="text-align:right">${fmtMoney(b.value, proj.currency)}</td></tr>`).join('');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${esc(proj.name)} — ${t('bom_title')}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:32px;}
      h1{color:#8B0000;margin:0;font-size:22px;} h2{color:#FF0000;font-size:14px;border-bottom:2px solid #FF0000;padding-bottom:4px;margin-top:24px;}
      .hd{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px solid #000;padding-bottom:10px;}
      table{width:100%;border-collapse:collapse;font-size:11px;margin-top:8px;}
      th{background:#000;color:#fff;text-align:left;padding:6px;} td{padding:5px 6px;border-bottom:1px solid #ddd;}
      tfoot td{font-weight:bold;border-top:2px solid #000;}
      .meta{font-size:11px;color:#555;} .brand{font-size:10px;color:#8B0000;letter-spacing:2px;text-align:center;margin-top:30px;border-top:1px solid #ccc;padding-top:8px;}
      .grid{display:flex;gap:24px;} .grid>div{flex:1;}
      @media print{button{display:none;}}
    </style></head><body>
    <div class="hd"><div><h1>${esc(proj.name)}</h1><div class="meta">${esc(settings.company || '')} · ${new Date().toLocaleDateString()}</div></div>
      <div style="text-align:right"><div style="font-size:20px;font-weight:bold;color:#FF0000">FSD&nbsp;PRO</div><div class="meta">${t('bom_title')}</div></div></div>
    <h2>${t('bom_title')}</h2>
    <table><thead><tr><th>#</th><th>${t('code')}</th><th>${t('name_lbl')}</th><th>${t('category')}</th><th>${t('material')}</th><th>L×A×E (mm)</th><th>${t('quantity')}</th><th>${t('weight')}</th><th>${t('cost')}</th></tr></thead>
      <tbody>${rows}</tbody>
      <tfoot><tr><td colspan="7" style="text-align:right">${t('total')}</td><td>${fmtNum(bom.weight, 1)} kg</td><td>${fmtMoney(bom.materialCost, proj.currency)}</td></tr></tfoot></table>
    <div class="grid">
      <div><h2>${t('cost_breakdown')}</h2><table><tbody>${costRows}<tr><td><b>${t('final_price')}</b></td><td style="text-align:right"><b>${fmtMoney(c.finalPrice, proj.currency)}</b></td></tr></tbody></table></div>
      <div><h2>${t('material_consumption')}</h2><table><tbody>
        <tr><td>${t('wood_consumption')}</td><td style="text-align:right">${fmtNum(bom.woodM3, 3)} m³</td></tr>
        <tr><td>${t('foam_consumption')}</td><td style="text-align:right">${fmtNum(bom.foamM3, 3)} m³</td></tr>
        <tr><td>${t('fabric_consumption')}</td><td style="text-align:right">${fmtNum(bom.fabricM2, 2)} m²</td></tr>
        <tr><td>${t('hardware_count')}</td><td style="text-align:right">${bom.hardware}</td></tr>
      </tbody></table></div>
    </div>
    <div class="brand">${t('developed_by')}: LERWINSON MENDOZA</div>
    <button onclick="window.print()" style="margin-top:20px;padding:10px 20px;background:#FF0000;color:#fff;border:none;border-radius:6px;cursor:pointer;">${t('export')} PDF</button>
    </body></html>`);
  w.document.close();
}

// Download a canvas as PNG/JPG
export function canvasToImage(canvas, filename, type = 'image/png') {
  canvas.toBlob((blob) => download(filename, blob, type), type, 0.95);
}

// Download an SVG string
export function downloadSVG(svgString, filename) {
  download(filename, svgString, 'image/svg+xml');
}
