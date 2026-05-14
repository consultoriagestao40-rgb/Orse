const fs = require('fs');
const path = 'app/admin/ccts/[id]/edit/page.tsx';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // 1. Update initial state
  content = content.replace(/assistenciaMedica: 0,\s+assistenciaSocial: 0,\s+fundoFormacao: 0,/g, 'custosSindicato: 0,');
  content = content.replace(/vaSobreFerias: 0,/g, '');

  // 2. Remove the fields from the UI and add the unified ones
  // We'll replace the block from Assistência Médica to VA sobre Férias
  const startMarker = '{/* Assistência Médica */}';
  const endMarker = '{/* Reserva Técnica */}';
  
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  
  if (startIndex !== -1 && endIndex !== -1) {
    const unifiedFields = `              {/* Custos com Sindicatos */}
              <div className="space-y-1">
                <label className={labelClass}>Custos com Sindicatos (Mês)</label>
                <input
                  type="number"
                  step="0.01"
                  className={inputClass}
                  value={formData.custosSindicato}
                  onChange={e => setFormData({ ...formData, custosSindicato: e.target.value })}
                />
                <p className="text-[10px] text-slate-400 italic">Soma de Assistência Médica, Social e Fundo de Formação conforme CCT</p>
              </div>

`;
    content = content.substring(0, startIndex) + unifiedFields + content.substring(endIndex);
  }

  fs.writeFileSync(path, content, 'utf8');
  console.log('Success');
} catch (err) {
  console.error(err);
}
