const fs = require('fs');

let content = fs.readFileSync('app/propostas/nova/page.tsx', 'utf8');

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
                           {segmentos.map((s) => <option key={s.id} value={s.nome}>{s.nome}</option>)}
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
  content = content.replace("{/* MODAL DE ESCOLHA DE SALVAMENTO (EDIÇÃO) */}", modalsCode + "\n\n         {/* MODAL DE ESCOLHA DE SALVAMENTO (EDIÇÃO) */}");
}

fs.writeFileSync('app/propostas/nova/page.tsx', content);
console.log('Modals injected successfully!');
