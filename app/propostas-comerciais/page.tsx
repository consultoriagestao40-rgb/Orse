'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  FileText, Plus, Search, 
  LayoutList, LayoutGrid, UserSquare2,
  Edit2, Trash2, ArrowRightLeft, X, Building2, Tag, Presentation, Printer
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getPropostas } from '@/app/propostas/actions';
import { getEmpresasEmissoras } from '@/app/admin/settings/empresas-actions';
import { 
  getDocumentosProposta, 
  getTemplatesProposta, 
  createDocumentoProposta, 
  updateDocumentoStatus, 
  deleteDocumentoProposta 
} from './actions';

type ViewMode = 'lista' | 'kanban';

const STATUSES = [
  { nome: 'Rascunho', color: 'bg-slate-100 text-slate-600' },
  { nome: 'Enviada', color: 'bg-blue-100 text-blue-600' },
  { nome: 'Aprovada', color: 'bg-emerald-100 text-emerald-600' },
  { nome: 'Recusada', color: 'bg-red-100 text-red-600' }
];

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

export default function PropostasComerciaisDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('lista');

  // Dados para modal de criação
  const [fpvs, setFpvs] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);

  const [createModal, setCreateModal] = useState({
    isOpen: false,
    fpvId: '',
    templateId: '',
    empresaId: '',
    saving: false
  });

  const loadData = async () => {
    setLoading(true);
    const [dataDocs, dataFpvs, dataTemplates, dataEmpresas] = await Promise.all([
      getDocumentosProposta(),
      getPropostas(),
      getTemplatesProposta(),
      getEmpresasEmissoras()
    ]);
    setDocs(dataDocs);
    setFpvs(dataFpvs);
    setTemplates(dataTemplates);
    setEmpresas(dataEmpresas);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getStatusStyle = (statusNome: string) => {
    const found = STATUSES.find(s => s.nome === statusNome);
    return found?.color || 'bg-slate-100 text-slate-600';
  };

  const filteredDocs = docs.filter(d =>
    String(d.numeroFPV).includes(searchTerm.toLowerCase()) ||
    d.cliente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fmtRef = (num: number, versao: number) =>
    `FPV-${String(num).padStart(3, '0')}-REV-${String(versao).padStart(2, '0')}`;

  const activeCount = docs.length;
  const approvedCount = docs.filter(d => d.status === 'Aprovada').length;
  const totalValue = docs.reduce((acc, d) => acc + (d.valor || 0), 0);

  const handleCreate = async () => {
    if (!createModal.fpvId || !createModal.templateId || !createModal.empresaId) {
      alert('Preencha todos os campos para gerar a proposta comercial.');
      return;
    }
    setCreateModal(prev => ({ ...prev, saving: true }));
    const res = await createDocumentoProposta(createModal.fpvId, createModal.templateId, createModal.empresaId);
    if (res.success && res.docId) {
      router.push(`/propostas-comerciais/${res.docId}`);
    } else {
      alert('Erro: ' + res.error);
      setCreateModal(prev => ({ ...prev, saving: false }));
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-full mx-auto space-y-6">

          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <Presentation size={24} /> Propostas Comerciais
              </h1>
              <p className="text-slate-500 text-sm mt-1">Gerador de documentos comerciais em PDF</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
                <button
                  onClick={() => setViewMode('lista')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'lista' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutList size={14} /> Lista
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'kanban' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutGrid size={14} /> Kanban
                </button>
              </div>

              <button
                onClick={() => router.push('/propostas-comerciais/templates')}
                className="bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold py-2.5 px-5 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <FileText size={16} /> Templates
              </button>
              <button
                onClick={() => setCreateModal({ isOpen: true, fpvId: '', templateId: '', empresaId: '', saving: false })}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={18} /> Nova Proposta
              </button>
            </div>
          </header>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Propostas Geradas', value: activeCount.toString(), icon: Presentation, color: 'text-blue-600' },
              { label: 'Volume Negociado', value: fmt(totalValue), icon: FileText, color: 'text-[#1B4D3E]' },
              { label: 'Aprovadas', value: approvedCount.toString(), icon: Building2, color: 'text-indigo-600' },
            ].map((stat, i) => (
              <div key={i} className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
                <div className="p-3 bg-slate-50 rounded border border-slate-200">
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-black text-slate-800 leading-none mt-1">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* BARRA DE BUSCA */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              placeholder="Buscar por cliente ou ID FPV..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1B4D3E] focus:outline-none shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* LISTA */}
          {viewMode === 'lista' && (
            <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-6 py-3">FPV Referência</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Empresa Emissora</th>
                    <th className="px-6 py-3">Criado Por</th>
                    <th className="px-6 py-3">Data/Hora</th>
                    <th className="px-6 py-3 text-right">Valor Total</th>
                    <th className="px-6 py-3 text-center">Status</th>
                    <th className="px-6 py-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {loading ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Carregando...</td></tr>
                  ) : filteredDocs.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Nenhuma proposta encontrada.</td></tr>
                  ) : filteredDocs.map((doc) => (
                    <tr key={doc.id} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-slate-400" />
                          <span className="font-mono font-bold text-slate-800 text-xs">{fmtRef(doc.numeroFPV, doc.versaoFPV || 1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 font-semibold text-slate-700">{doc.cliente}</td>
                      <td className="px-6 py-3 text-slate-500">{doc.empresa}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-1.5">
                          {doc.avatarUrl ? (
                            <img 
                              src={doc.avatarUrl} 
                              alt={doc.usuario} 
                              className="w-5 h-5 rounded-full object-cover border border-slate-200"
                            />
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                              {(doc.usuario || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                            </div>
                          )}
                          <span className="text-slate-600 font-medium">{doc.usuario || 'Sistema'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-slate-500 font-mono text-xs">{doc.data}</td>
                      <td className="px-6 py-3 font-bold text-[#1B4D3E] text-right">{fmt(doc.valor)}</td>
                      <td className="px-6 py-3 text-center">
                        <select
                          value={doc.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            setDocs(docs.map(d => d.id === doc.id ? { ...d, status: newStatus } : d));
                            await updateDocumentoStatus(doc.id, newStatus);
                          }}
                          className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider border outline-none cursor-pointer ${getStatusStyle(doc.status)}`}
                        >
                          {STATUSES.map(s => <option key={s.nome} value={s.nome}>{s.nome}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => router.push(`/propostas-comerciais/${doc.id}`)}
                            title="Editar proposta"
                            className="text-amber-500 hover:text-amber-600 p-1 transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => window.open(`/propostas-comerciais/${doc.id}/print`, '_blank')}
                            title="Gerar PDF"
                            className="text-slate-500 hover:text-[#1B4D3E] p-1 transition-colors"
                          >
                            <Printer size={16} />
                          </button>
                          <button onClick={async () => {
                            if(confirm('Excluir proposta comercial?')) {
                              await deleteDocumentoProposta(doc.id);
                              loadData();
                            }
                          }}
                          title="Excluir proposta"
                          className="text-red-400 hover:text-red-600 p-1 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* KANBAN */}
          {viewMode === 'kanban' && (
            <div className="flex gap-5 min-w-max overflow-x-auto pb-6">
              {STATUSES.map(col => {
                const cards = filteredDocs.filter(d => d.status === col.nome);
                return (
                  <div key={col.nome} className="flex-shrink-0 w-72 bg-slate-50 border border-slate-200 rounded-xl p-3">
                    <h3 className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider mb-3 w-fit ${col.color}`}>
                      {col.nome} ({cards.length})
                    </h3>
                    <div className="space-y-3">
                      {cards.map(doc => (
                        <div key={doc.id} onClick={() => router.push(`/propostas-comerciais/${doc.id}`)} className="bg-white p-3 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:border-amber-400">
                          <p className="font-bold text-slate-800 text-sm mb-1">{doc.cliente}</p>
                          <div className="flex justify-between items-center text-xs text-slate-500 mb-2">
                            <span>FPV #{doc.numeroFPV}</span>
                            <div className="flex items-center gap-1">
                              {doc.avatarUrl ? (
                                <img 
                                  src={doc.avatarUrl} 
                                  alt={doc.usuario} 
                                  className="w-4 h-4 rounded-full object-cover border border-slate-200"
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[7px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                                  {(doc.usuario || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                </div>
                              )}
                              <span className="font-medium text-slate-400">{doc.usuario || 'Sistema'}</span>
                            </div>
                          </div>
                          <p className="font-black text-[#1B4D3E]">{fmt(doc.valor)}</p>
                          <div className="mt-2 text-[10px] text-slate-400 font-medium flex justify-between items-center border-t border-slate-50 pt-2">
                            <span>Gerado em:</span>
                            <span>{doc.data}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

      {/* MODAL CRIAR */}
      {createModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-[100] backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <Presentation size={20} className="text-[#1B4D3E]" /> Gerar Proposta
              </h2>
              <button onClick={() => setCreateModal({ ...createModal, isOpen: false })} className="text-amber-500 hover:text-amber-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Vincular a qual FPV?</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded focus:border-[#1B4D3E] text-sm"
                  value={createModal.fpvId}
                  onChange={e => setCreateModal({...createModal, fpvId: e.target.value})}
                >
                  <option value="">-- Selecione uma FPV --</option>
                  {fpvs.map(f => (
                    <option key={f.id} value={f.id}>
                      #{f.numero}-R{String(f.versao || 1).padStart(2, '0')} - {f.cliente} ({fmt(f.valor)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Template Base</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded focus:border-[#1B4D3E] text-sm"
                  value={createModal.templateId}
                  onChange={e => setCreateModal({...createModal, templateId: e.target.value})}
                >
                  <option value="">-- Selecione o Template --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.nome} {t.tipo === 'SLIDE_DECK' ? '(Apresentação)' : '(A4)'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Empresa do Grupo (Emissora)</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded focus:border-[#1B4D3E] text-sm"
                  value={createModal.empresaId}
                  onChange={e => setCreateModal({...createModal, empresaId: e.target.value})}
                >
                  <option value="">-- Selecione a Empresa --</option>
                  {empresas.map(e => (
                    <option key={e.id} value={e.id}>{e.nomeFantasia}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button onClick={() => setCreateModal({...createModal, isOpen: false})} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                <button 
                  onClick={handleCreate}
                  disabled={createModal.saving}
                  className="px-4 py-2 text-sm font-bold bg-[#1B4D3E] text-white rounded-lg hover:bg-[#13382d] disabled:opacity-50"
                >
                  {createModal.saving ? 'Gerando...' : 'Gerar e Editar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
