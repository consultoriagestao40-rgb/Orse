const fs = require('fs');

let content = fs.readFileSync('app/propostas/nova/page.tsx', 'utf8');

// 1. Imports
if (!content.includes("import { createCliente, getClientes }")) {
  content = content.replace("import { saveProposta", "import { createCliente, getClientes } from '@/app/clientes/actions';\nimport { createProduto } from '@/app/produtos/actions';\nimport { saveProposta");
}

// 2. States
const stateCode = `
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [newClientForm, setNewClientForm] = useState({ nomeFantasia: '', razaoSocial: '', cnpj: '', email: '', whatsapp: '', endereco: '', contato: '', segmento: '' });
  const [savingClient, setSavingClient] = useState(false);

  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({ descricao: '', precoUnitario: 0, unidade: 'UN', categoria: 'Geral' });
  const [savingProduct, setSavingProduct] = useState(false);
  const [activeProdutoTipo, setActiveProdutoTipo] = useState(''); // To know which section opened the product modal
`;

if (!content.includes("showNewClientModal")) {
  content = content.replace("const [showClientDropdown, setShowClientDropdown] = useState(false);", "const [showClientDropdown, setShowClientDropdown] = useState(false);\n" + stateCode);
}

// 3. Handlers
const handlersCode = `
  const handleSaveNewClient = async () => {
    if (!newClientForm.nomeFantasia.trim()) return alert('Nome Fantasia é obrigatório');
    setSavingClient(true);
    try {
      const res = await createCliente(newClientForm);
      if (res.success || !res.error) {
        // success
        const updatedClientes = await getClientes();
        setClientesList(updatedClientes || []);
        setProposta({
          ...proposta,
          cliente: {
             ...proposta.cliente,
             cliente: newClientForm.nomeFantasia,
             cnpj: newClientForm.cnpj,
             email: newClientForm.email,
             celular: newClientForm.whatsapp,
             contato: newClientForm.contato,
             segmento: newClientForm.segmento
          }
        });
        setShowNewClientModal(false);
        setNewClientForm({ nomeFantasia: '', razaoSocial: '', cnpj: '', email: '', whatsapp: '', endereco: '', contato: '', segmento: '' });
      } else {
        alert(res.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingClient(false);
    }
  };

  const handleSaveNewProduct = async () => {
    if (!newProductForm.descricao.trim()) return alert('Descrição é obrigatória');
    setSavingProduct(true);
    try {
      const res = await createProduto(newProductForm);
      if (res.success && res.produto) {
        const updatedProdutos = await getProdutos();
        setProdutosDb(updatedProdutos || []);
        if (activeProdutoTipo) {
           addInsumoItem(activeProdutoTipo, res.produto);
        }
        setShowNewProductModal(false);
        setNewProductForm({ descricao: '', precoUnitario: 0, unidade: 'UN', categoria: 'Geral' });
      } else {
        alert(res.error);
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingProduct(false);
    }
  };
`;

if (!content.includes("handleSaveNewClient")) {
  content = content.replace("const handleSave = async () => {", handlersCode + "\n  const handleSave = async () => {");
}

// 4. Client Button
const clientBtn = `
                       <div className="flex justify-between items-center">
                          <label className="text-xs font-semibold text-slate-700">Cliente (Buscar Cadastrado)</label>
                          <button 
                             onClick={() => setShowNewClientModal(true)}
                             className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider hover:text-emerald-800 transition-colors bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                          >
                             + Novo Cliente
                          </button>
                       </div>
`;
content = content.replace('<label className="text-xs font-semibold text-slate-700">Cliente (Buscar Cadastrado)</label>', clientBtn);

// 5. Product Button
const productBtn = `
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-slate-500 uppercase block">Adicionar Item da Tabela de Produtos</label>
              <button 
                 onClick={() => {
                    setActiveProdutoTipo(tipo);
                    setShowNewProductModal(true);
                 }}
                 className="text-[10px] text-[#1B4D3E] font-bold uppercase tracking-wider hover:text-[#12362b] transition-colors bg-emerald-50 px-2 py-1 rounded border border-emerald-200"
              >
                 + Novo Produto
              </button>
            </div>
`;
content = content.replace('<label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Adicionar Item da Tabela de Produtos</label>', productBtn);

// 6. Modals UI
const modalsCode = `
         {/* MODAL NOVO CLIENTE */}
         {showNewClientModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full flex flex-col overflow-hidden animate-modal-in">
                  <div className="bg-[#1B4D3E] text-white p-4 flex justify-between items-center">
                     <h3 className="font-bold text-sm uppercase tracking-wider">Cadastrar Novo Cliente</h3>
                     <button onClick={() => setShowNewClientModal(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[70vh]">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Nome Fantasia *</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none" value={newClientForm.nomeFantasia} onChange={e => setNewClientForm({...newClientForm, nomeFantasia: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Razão Social</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none" value={newClientForm.razaoSocial} onChange={e => setNewClientForm({...newClientForm, razaoSocial: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">CNPJ</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none" value={newClientForm.cnpj} onChange={e => setNewClientForm({...newClientForm, cnpj: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">E-mail Comercial</label>
                        <input type="email" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none" value={newClientForm.email} onChange={e => setNewClientForm({...newClientForm, email: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Celular / WhatsApp</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none" value={newClientForm.whatsapp} onChange={e => setNewClientForm({...newClientForm, whatsapp: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Contato (Responsável)</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none" value={newClientForm.contato} onChange={e => setNewClientForm({...newClientForm, contato: e.target.value})} />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Segmento</label>
                        <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none" value={newClientForm.segmento} onChange={e => setNewClientForm({...newClientForm, segmento: e.target.value})}>
                           <option value="">Selecione...</option>
                           {segmentos.map((s: any) => <option key={s.id} value={s.nome}>{s.nome}</option>)}
                        </select>
                     </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                     <button onClick={() => setShowNewClientModal(false)} className="px-4 py-2 rounded text-sm font-bold text-slate-600 hover:bg-slate-200">Cancelar</button>
                     <button onClick={handleSaveNewClient} disabled={savingClient} className="px-4 py-2 rounded text-sm font-bold bg-[#1B4D3E] text-white hover:bg-[#12362b] disabled:opacity-50">
                        {savingClient ? 'Salvando...' : 'Salvar Cliente'}
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* MODAL NOVO PRODUTO */}
         {showNewProductModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
               <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col overflow-hidden animate-modal-in">
                  <div className="bg-[#1B4D3E] text-white p-4 flex justify-between items-center">
                     <h3 className="font-bold text-sm uppercase tracking-wider">Cadastrar Novo Produto</h3>
                     <button onClick={() => setShowNewProductModal(false)} className="text-white/80 hover:text-white"><X size={18} /></button>
                  </div>
                  <div className="p-6 space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Descrição *</label>
                        <input type="text" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none" value={newProductForm.descricao} onChange={e => setNewProductForm({...newProductForm, descricao: e.target.value})} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Preço Unitário (R$)</label>
                           <input type="number" step="0.01" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none" value={newProductForm.precoUnitario} onChange={e => setNewProductForm({...newProductForm, precoUnitario: Number(e.target.value)})} />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[10px] font-bold text-slate-500 uppercase">Unidade</label>
                           <input type="text" placeholder="Ex: UN, KG, M" className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none" value={newProductForm.unidade} onChange={e => setNewProductForm({...newProductForm, unidade: e.target.value})} />
                        </div>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Categoria</label>
                        <select className="w-full border border-slate-300 rounded px-3 py-2 text-sm focus:border-[#1B4D3E] outline-none" value={newProductForm.categoria} onChange={e => setNewProductForm({...newProductForm, categoria: e.target.value})}>
                           <option value="Geral">Geral</option>
                           <option value="MATERIAL DE LIMPEZA">Material de Limpeza</option>
                           <option value="DESCARTAVEIS">Descartáveis</option>
                           <option value="MAQUINAS E EQUIPAMENTOS">Máquinas e Equipamentos</option>
                           <option value="EPI">EPI</option>
                           <option value="UNIFORME">Uniforme</option>
                        </select>
                     </div>
                  </div>
                  <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                     <button onClick={() => setShowNewProductModal(false)} className="px-4 py-2 rounded text-sm font-bold text-slate-600 hover:bg-slate-200">Cancelar</button>
                     <button onClick={handleSaveNewProduct} disabled={savingProduct} className="px-4 py-2 rounded text-sm font-bold bg-[#1B4D3E] text-white hover:bg-[#12362b] disabled:opacity-50">
                        {savingProduct ? 'Salvando...' : 'Salvar Produto'}
                     </button>
                  </div>
               </div>
            </div>
         )}
`;

if (!content.includes("MODAL NOVO CLIENTE")) {
  content = content.replace("{/* MODAL 1: SALVAR PROPOSTA / CHANGELOG */}", modalsCode + "\n\n         {/* MODAL 1: SALVAR PROPOSTA / CHANGELOG */}");
}

fs.writeFileSync('app/propostas/nova/page.tsx', content);
console.log('Modals injected successfully!');
