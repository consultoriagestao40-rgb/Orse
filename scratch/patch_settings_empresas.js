const fs = require('fs');

let content = fs.readFileSync('app/admin/settings/page.tsx', 'utf8');

// 1. Add Import
if (!content.includes('getEmpresasEmissoras')) {
  content = content.replace(
    "} from './actions';",
    "} from './actions';\nimport { getEmpresasEmissoras, createEmpresaEmissora, deleteEmpresaEmissora } from './empresas-actions';"
  );
}

// 2. Add Tab Type
if (!content.includes("'empresas'")) {
  content = content.replace(
    "| 'segmentos' | 'metas';",
    "| 'segmentos' | 'metas' | 'empresas';"
  );
}

// 3. Add States
if (!content.includes('const [empresas, setEmpresas] = useState<any[]>([]);')) {
  content = content.replace(
    "// ── Estado principal",
    `// Empresas Emissoras
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [empresaForm, setEmpresaForm] = useState({ id: '', nomeFantasia: '', razaoSocial: '', cnpj: '', endereco: '', telefone: '', email: '' });

  // ── Estado principal`
  );
}

// 4. Load Data
if (!content.includes("else if (activeTab === 'empresas')")) {
  content = content.replace(
    "else if (activeTab === 'metas') {",
    `else if (activeTab === 'empresas') {
        const data = await getEmpresasEmissoras();
        setEmpresas(data || []);
      } else if (activeTab === 'metas') {`
  );
}

// 5. Handlers
const handlers = `
  // Empresas Emissoras
  const handleSaveEmpresa = async () => {
    if (!empresaForm.nomeFantasia.trim() || !empresaForm.razaoSocial.trim() || !empresaForm.cnpj.trim()) {
      alert('Nome Fantasia, Razão Social e CNPJ são obrigatórios.');
      return;
    }
    setLoading(true);
    // Para simplificar, estamos usando create sempre ou a lógica de update poderia ser feita aqui.
    // Como pedimos apenas cadastro simples, chamamos createEmpresaEmissora.
    const res = await createEmpresaEmissora(empresaForm);
    if (res.success) {
      setShowEmpresaModal(false);
      loadData();
    } else {
      alert('Erro: ' + res.error);
      setLoading(false);
    }
  };

  const handleDeleteEmpresa = async (id: string) => {
    if (!confirm('Excluir esta Empresa Emissora?')) return;
    const res = await deleteEmpresaEmissora(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  const openEmpresaModal = () => {
    setEmpresaForm({ id: '', nomeFantasia: '', razaoSocial: '', cnpj: '', endereco: '', telefone: '', email: '' });
    setShowEmpresaModal(true);
  };
`;

if (!content.includes('handleSaveEmpresa')) {
  content = content.replace(
    "// Tipos",
    handlers + "\n\n  // Tipos"
  );
}

// 6. Tab Button
if (!content.includes("{ id: 'empresas', label: 'Empresas Emissoras'")) {
  content = content.replace(
    "{ id: 'metas', label: 'Metas dos Vendedores', icon: Target, roles: ['ADMIN', 'MANAGER'] },",
    `{ id: 'empresas', label: 'Empresas Emissoras', icon: Briefcase, roles: ['ADMIN'] },
              { id: 'metas', label: 'Metas dos Vendedores', icon: Target, roles: ['ADMIN', 'MANAGER'] },`
  );
}

// Ensure Briefcase is imported
if (!content.includes('Briefcase')) {
  content = content.replace(
    "Settings as SettingsIcon, Layers, CalendarDays, Ruler, Plus, Trash2,",
    "Settings as SettingsIcon, Layers, CalendarDays, Ruler, Plus, Trash2, Briefcase,"
  );
}

// 7. Tab Content
const tabContent = `
            {/* ABA EMPRESAS EMISSORAS */}
            {activeTab === 'empresas' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} /> Empresas Emissoras (Propostas)
                  </h2>
                  <button 
                    onClick={openEmpresaModal}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <Plus size={12} /> Nova Empresa
                  </button>
                </div>

                <div className="p-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <th className="px-4 py-3">Nome Fantasia</th>
                        <th className="px-4 py-3">Razão Social</th>
                        <th className="px-4 py-3">CNPJ</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {empresas.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-700">{e.nomeFantasia}</td>
                          <td className="px-4 py-3 text-slate-600">{e.razaoSocial}</td>
                          <td className="px-4 py-3 text-slate-600">{e.cnpj}</td>
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => handleDeleteEmpresa(e.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))}
                      {empresas.length === 0 && (
                        <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Nenhuma empresa cadastrada.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
`;

if (!content.includes('ABA EMPRESAS EMISSORAS')) {
  content = content.replace(
    "{/* 6. ABA METAS DOS VENDEDORES",
    tabContent + "\n\n            {/* 6. ABA METAS DOS VENDEDORES"
  );
}

// 8. Modal Content
const modalContent = `
        {/* MODAL EMPRESA */}
        {showEmpresaModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Briefcase size={14} /> Nova Empresa Emissora
                </h2>
                <button onClick={() => setShowEmpresaModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome Fantasia</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.nomeFantasia} onChange={e => setEmpresaForm({...empresaForm, nomeFantasia: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Razão Social</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.razaoSocial} onChange={e => setEmpresaForm({...empresaForm, razaoSocial: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">CNPJ</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.cnpj} onChange={e => setEmpresaForm({...empresaForm, cnpj: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Endereço Completo</label>
                  <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.endereco} onChange={e => setEmpresaForm({...empresaForm, endereco: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Telefone</label>
                    <input type="text" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.telefone} onChange={e => setEmpresaForm({...empresaForm, telefone: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">E-mail Comercial</label>
                    <input type="email" className="w-full px-3 py-2 border border-slate-200 rounded text-sm outline-none focus:border-[#1B4D3E]" value={empresaForm.email} onChange={e => setEmpresaForm({...empresaForm, email: e.target.value})} />
                  </div>
                </div>
                <button onClick={handleSaveEmpresa} className="w-full bg-[#1B4D3E] hover:bg-emerald-900 text-white py-3 rounded text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all mt-4">
                  <Save size={18} /> Cadastrar Empresa
                </button>
              </div>
            </div>
          </div>
        )}
`;

if (!content.includes('MODAL EMPRESA')) {
  content = content.replace(
    "</main>",
    modalContent + "\n      </main>"
  );
}

fs.writeFileSync('app/admin/settings/page.tsx', content);
console.log('Patched Settings page for Empresas Emissoras');
