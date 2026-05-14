const fs = require('fs');
const path = 'app/propostas/nova/page.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // 1. Fix the map in Montante B (remove the pct logic if it's there by mistake)
  // Actually, let's just make the rendering logic safe for both.
  
  const trReplacement = `<tr key={i} className="border-b border-slate-200 border-dotted">
                                       <td colSpan={(row as any).pct !== undefined ? 2 : 3} className={"py-1 px-6 font-bold " + (row.red ? "text-red-600" : "")}>{row.label}</td>
                                       {(row as any).pct !== undefined && (
                                          <td className="py-1 px-6 text-center font-bold bg-slate-50 text-slate-500">{(row as any).pct.toFixed(2)}%</td>
                                       )}
                                       <td className={"py-1 px-6 text-right bg-emerald-100/50 font-semibold " + (row.red ? "text-red-600" : "")}>
                                          {row.val < 0 ? "-" + formatCurrency(Math.abs(row.val)) : formatCurrency(row.val)}
                                       </td>
                                    </tr>`;

  // Use a more specific replacement for Montante B map
  content = content.replace(/\{row\.pct !== undefined \? 2 : 3\}/g, "(row as any).pct !== undefined ? 2 : 3");
  content = content.replace(/\{row\.pct !== undefined && \(/g, "{(row as any).pct !== undefined && (");
  content = content.replace(/\{row\.pct\.toFixed\(2\)\}%/g, "{(row as any).pct.toFixed(2)}%");

  // Also fix the other table (Montante C) which I missed
  const montanteCStart = 'const rows: any[] = [';
  const montanteCEnd = 'return (';
  
  // Find where Montante C map is
  const cIndex = content.indexOf(montanteCStart);
  if (cIndex !== -1) {
    const sub = content.substring(cIndex);
    const mapStart = sub.indexOf('.map((row, i) => (');
    if (mapStart !== -1) {
        // Replace the tr inside this map
        const trStart = sub.indexOf('<tr key={i}', mapStart);
        const trEnd = sub.indexOf('</tr>', trStart) + 5;
        
        const oldTr = sub.substring(trStart, trEnd);
        const newTr = `<tr key={i} className="border-b border-slate-200 border-dotted">
                                       <td colSpan={row.pct !== undefined ? 2 : 3} className={"py-1 px-6 font-bold " + (row.red ? "text-red-600" : "")}>{row.label}</td>
                                       {row.pct !== undefined && (
                                          <td className="py-1 px-6 text-center font-bold bg-slate-50 text-slate-500">{row.pct.toFixed(2)}%</td>
                                       )}
                                       <td className={"py-1 px-6 text-right bg-emerald-100/50 font-semibold " + (row.red ? "text-red-600" : "")}>
                                          {row.val < 0 ? "-" + formatCurrency(Math.abs(row.val)) : formatCurrency(row.val)}
                                       </td>
                                    </tr>`;
        
        content = content.substring(0, cIndex + trStart) + newTr + content.substring(cIndex + trEnd);
    }
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log('Success');
} catch (err) {
  console.error(err);
}
