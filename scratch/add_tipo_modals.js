const fs = require('fs');

let content = fs.readFileSync('app/propostas/nova/page.tsx', 'utf8');

// 1. Add Imports
if (!content.includes('createTipoServico')) {
  content = content.replace(
    "import { getTiposServico, getSegmentos } from '@/app/admin/settings/actions';",
    "import { getTiposServico, getSegmentos, createTipoServico, createSegmento } from '@/app/admin/settings/actions';"
  );
}

// 2. Add States
if (!content.includes('showNewTipoModal')) {
  content = content.replace(
    "const [segmentos, setSegmentos] = useState<any[]>([]);",
    `const [segmentos, setSegmentos] = useState<any[]>([]);
  const [showNewTipoModal, setShowNewTipoModal] = useState(false);
  const [newTipoName, setNewTipoName] = useState('');
  const [isSavingTipo, setIsSavingTipo] = useState(false);
  const [showNewSegmentoModal, setShowNewSegmentoModal] = useState(false);
  const [newSegmentoName, setNewSegmentoName] = useState('');
  const [isSavingSegmento, setIsSavingSegmento] = useState(false);`
  );
}

// 3. Add save functions
const saveFunctions = `
  const handleSaveTipoServico = async () => {
    if (!newTipoName.trim()) return;
    setIsSavingTipo(true);
    try {
      const novo = await createTipoServico(newTipoName);
      setTiposServico([...tiposServico, novo]);
      setProposta({...proposta, cliente: {...proposta.cliente, tipoServicos: novo.nome}});
      setShowNewTipoModal(false);
      setNewTipoName('');
    } catch (e) {
      alert("Erro ao criar tipo de serviço");
    } finally {
      setIsSavingTipo(false);
    }
  };

  const handleSaveSegmento = async () => {
    if (!newSegmentoName.trim()) return;
    setIsSavingSegmento(true);
    try {
      const novo = await createSegmento(newSegmentoName);
      setSegmentos([...segmentos, novo]);
      setProposta({...proposta, cliente: {...proposta.cliente, segmento: novo.nome}});
      setShowNewSegmentoModal(false);
      setNewSegmentoName('');
    } catch (e) {
      alert("Erro ao criar segmento");
    } finally {
      setIsSavingSegmento(false);
    }
  };
`;

if (!content.includes('handleSaveTipoServico')) {
  content = content.replace(
    "const handleSaveNewClient = async () => {",
    saveFunctions + "\n  const handleSaveNewClient = async () => {"
  );
}

// 4. Update the labels in the UI
const tipoLabelOld = '<label className="text-xs font-semibold text-slate-700">Tipo dos Serviços</label>';
const tipoLabelNew = `<div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-slate-700">Tipo dos Serviços</label>
                          <button onClick={() => setShowNewTipoModal(true)} className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1"><Plus size={12}/> Novo</button>
                       </div>`;

content = content.replace(tipoLabelOld, tipoLabelNew);

const segmentoLabelOld = '<label className="text-xs font-semibold text-slate-700">Segmento do Cliente</label>';
const segmentoLabelNew = `<div className="flex justify-between items-center mb-1">
                          <label className="text-xs font-semibold text-slate-700">Segmento do Cliente</label>
                          <button onClick={() => setShowNewSegmentoModal(true)} className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-bold px-2 py-0.5 rounded transition-colors flex items-center gap-1"><Plus size={12}/> Novo</button>
                       </div>`;

content = content.replace(segmentoLabelOld, segmentoLabelNew);

// 5. Add Modals
const modalsCode = `
         {/* MODAL NOVO TIPO SERVICO */}
         {showNewTipoModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-300">
                  <div className="bg-[#1B4D3E] px-4 py-3 flex justify-between items-center">
                     <h2 className="text-white text-xs font-bold uppercase flex items-center gap-2"><Plus size={14}/> Novo Tipo de Serviço</h2>
                     <button onClick={() => setShowNewTipoModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={16}/></button>
                  </div>
                  <div className="p-4 space-y-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Nome do Tipo</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E]" value={newTipoName} onChange={e => setNewTipoName(e.target.value)} placeholder="Ex: Limpeza Comercial" autoFocus />
                     </div>
                     <button disabled={isSavingTipo} onClick={handleSaveTipoServico} className="w-full bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold py-2 rounded text-sm transition-colors shadow-sm disabled:opacity-50">
                        {isSavingTipo ? 'Salvando...' : 'Salvar Tipo'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL NOVO SEGMENTO */}
         {showNewSegmentoModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden flex flex-col border border-slate-300">
                  <div className="bg-[#1B4D3E] px-4 py-3 flex justify-between items-center">
                     <h2 className="text-white text-xs font-bold uppercase flex items-center gap-2"><Plus size={14}/> Novo Segmento</h2>
                     <button onClick={() => setShowNewSegmentoModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={16}/></button>
                  </div>
                  <div className="p-4 space-y-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Nome do Segmento</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E]" value={newSegmentoName} onChange={e => setNewSegmentoName(e.target.value)} placeholder="Ex: Condomínios" autoFocus />
                     </div>
                     <button disabled={isSavingSegmento} onClick={handleSaveSegmento} className="w-full bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold py-2 rounded text-sm transition-colors shadow-sm disabled:opacity-50">
                        {isSavingSegmento ? 'Salvando...' : 'Salvar Segmento'}
                     </button>
                  </div>
               </div>
            </div>
         )}
`;

if (!content.includes('MODAL NOVO TIPO SERVICO')) {
  // Inject before MODAL NOVO CLIENTE
  content = content.replace('{/* MODAL NOVO CLIENTE */}', modalsCode + '\n         {/* MODAL NOVO CLIENTE */}');
}

fs.writeFileSync('app/propostas/nova/page.tsx', content);
console.log('patched modals for tipo servico and segmento');
