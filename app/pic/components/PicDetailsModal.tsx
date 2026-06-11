'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, User, Plus, Trash2, Paperclip, Send, Copy,
  Tag, AlertTriangle, Users, Eye, History, MessageSquare,
  CheckCircle2, AlertCircle, FileText, Download, Check, Edit2, ClipboardCheck,
  FileSpreadsheet, FileImage, File, Briefcase, DollarSign, Wrench, Package, ListTodo
} from 'lucide-react';
import { 
  getPicById, updatePicDetails, updatePicEmployees, 
  updatePicEquipments, updatePicMaterials, createPicSection,
  deletePicSection, createPicAction, updatePicAction, deletePicAction 
} from '../actions';

interface PicDetailsModalProps {
  picId: string;
  users: any[];
  onClose: () => void;
  refreshData?: (silent?: boolean) => void | Promise<void>;
}

type TabType = 'identificacao' | 'financeiro' | 'operacional' | 'planejador';

const parseCurrency = (val: string): number => {
  if (!val) return 0;
  let clean = val.replace(/R\$\s?/, '').trim();
  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes(',')) {
    clean = clean.replace(',', '.');
  }
  return parseFloat(clean) || 0;
};

export default function PicDetailsModal({ picId, users, onClose, refreshData }: PicDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('identificacao');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pic, setPic] = useState<any>(null);
  const [summaryGrouping, setSummaryGrouping] = useState<'area' | 'responsavel'>('area');
  const [activeObservationEdit, setActiveObservationEdit] = useState<any | null>(null);

  // Aba 1 - Identificação
  const [anotacoes, setAnotacoes] = useState('');

  // Aba 2 - Financeiro
  const [valorMensal, setValorMensal] = useState(0);
  const [valorMensalStr, setValorMensalStr] = useState('');
  const [periodoMedicaoInicio, setPeriodoMedicaoInicio] = useState('');
  const [periodoMedicaoFim, setPeriodoMedicaoFim] = useState('');
  
  const handleValorMensalBlur = () => {
    const numeric = parseCurrency(valorMensalStr);
    setValorMensal(numeric);
    setValorMensalStr(numeric.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };
  const [dataFaturamento, setDataFaturamento] = useState('');
  const [documentacoesMensais, setDocumentacoesMensais] = useState('');
  const [prazoPagamento, setPrazoPagamento] = useState('');
  const [dataPagamento, setDataPagamento] = useState('');
  const [faturamentoCnpj, setFaturamentoCnpj] = useState('');
  const [faturamentoRazaoSocial, setFaturamentoRazaoSocial] = useState('');
  const [faturamentoEndereco, setFaturamentoEndereco] = useState('');
  const [faturamentoInscricaoEstadual, setFaturamentoInscricaoEstadual] = useState('');
  const [faturamentoInscricaoMunicipal, setFaturamentoInscricaoMunicipal] = useState('');
  const [faturamentoEmail, setFaturamentoEmail] = useState('');

  // Aba 3 - Operacional (Tabelas locais editáveis)
  const [funcionarios, setFuncionarios] = useState<any[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [materiais, setMateriais] = useState<any[]>([]);

  // Planejador (Adição de seções)
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [newActionNames, setNewActionNames] = useState<Record<string, string>>({});

  const loadPicData = async (silent = false) => {
    if (!silent) setLoading(true);
    const res = await getPicById(picId);
    if (res.success && res.pic) {
      const p = res.pic;
      setPic(p);
      setAnotacoes(p.anotacoes || '');
      setValorMensal(p.valorMensal || 0);
      setValorMensalStr((p.valorMensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setPeriodoMedicaoInicio(p.periodoMedicaoInicio || '');
      setPeriodoMedicaoFim(p.periodoMedicaoFim || '');
      setDataFaturamento(p.dataFaturamento || '');
      setDocumentacoesMensais(p.documentacoesMensais || '');
      setPrazoPagamento(p.prazoPagamento || '');
      setDataPagamento(p.dataPagamento || '');
      setFaturamentoCnpj(p.faturamentoCnpj || '');
      setFaturamentoRazaoSocial(p.faturamentoRazaoSocial || '');
      setFaturamentoEndereco(p.faturamentoEndereco || '');
      setFaturamentoInscricaoEstadual(p.faturamentoInscricaoEstadual || '');
      setFaturamentoInscricaoMunicipal(p.faturamentoInscricaoMunicipal || '');
      setFaturamentoEmail(p.faturamentoEmail || '');
      setFuncionarios(p.funcionarios || []);
      setEquipamentos(p.equipamentos || []);
      setMateriais(p.materiais || []);
    } else {
      alert(res.error || 'Erro ao carregar dados do PIC');
      onClose();
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    loadPicData();
  }, [picId]);

  // Salvar Aba 1 e Aba 2
  const handleSaveDetails = async () => {
    setSaving(true);
    const fields = {
      anotacoes,
      valorMensal: parseCurrency(valorMensalStr),
      periodoMedicaoInicio,
      periodoMedicaoFim,
      dataFaturamento,
      documentacoesMensais,
      prazoPagamento,
      dataPagamento,
      faturamentoCnpj,
      faturamentoRazaoSocial,
      faturamentoEndereco,
      faturamentoInscricaoEstadual,
      faturamentoInscricaoMunicipal,
      faturamentoEmail
    };

    const res = await updatePicDetails(picId, fields);
    setSaving(false);
    if (res.success) {
      if (refreshData) refreshData(true);
      // alert('Dados salvos com sucesso!');
    } else {
      alert(res.error || 'Erro ao salvar alterações');
    }
  };

  // ---------------------------------------------------------------------------
  // ABA 3: OPERACIONAL - MANIPULAÇÃO LOCAL E PERSISTÊNCIA
  // ---------------------------------------------------------------------------

  const handleAddEmployee = () => {
    setFuncionarios([
      ...funcionarios,
      {
        id: `temp-${Date.now()}-${Math.random()}`,
        funcao: 'Nova Função',
        quantidade: 1,
        escala: '5x2',
        horarioEntrada: '08:00',
        horarioSaida: '17:00',
        diasSemana: 'Segunda a Sexta'
      }
    ]);
  };

  const handleUpdateEmployee = (index: number, field: string, val: any) => {
    const updated = [...funcionarios];
    updated[index] = { ...updated[index], [field]: val };
    setFuncionarios(updated);
  };

  const handleRemoveEmployee = (index: number) => {
    setFuncionarios(funcionarios.filter((_, i) => i !== index));
  };

  const handleSaveEmployees = async () => {
    setSaving(true);
    const res = await updatePicEmployees(picId, funcionarios);
    setSaving(false);
    if (res.success) {
      if (refreshData) refreshData(true);
      alert('Quadro de funcionários atualizado com sucesso!');
    } else {
      alert(res.error || 'Erro ao atualizar funcionários');
    }
  };

  const handleAddEquipment = () => {
    setEquipamentos([
      ...equipamentos,
      {
        id: `temp-${Date.now()}-${Math.random()}`,
        nome: 'Novo Equipamento',
        quantidade: 1,
        tipo: 'PROPRIO',
        observacao: ''
      }
    ]);
  };

  const handleUpdateEquipment = (index: number, field: string, val: any) => {
    const updated = [...equipamentos];
    updated[index] = { ...updated[index], [field]: val };
    setEquipamentos(updated);
  };

  const handleRemoveEquipment = (index: number) => {
    setEquipamentos(equipamentos.filter((_, i) => i !== index));
  };

  const handleSaveEquipments = async () => {
    setSaving(true);
    const res = await updatePicEquipments(picId, equipamentos);
    setSaving(false);
    if (res.success) {
      if (refreshData) refreshData(true);
      alert('Relação de equipamentos atualizada com sucesso!');
    } else {
      alert(res.error || 'Erro ao atualizar equipamentos');
    }
  };

  const handleAddMaterial = () => {
    setMateriais([
      ...materiais,
      {
        id: `temp-${Date.now()}-${Math.random()}`,
        nome: 'Novo Material/Descartável',
        quantidade: 1,
        unidade: 'UN',
        observacao: ''
      }
    ]);
  };

  const handleUpdateMaterial = (index: number, field: string, val: any) => {
    const updated = [...materiais];
    updated[index] = { ...updated[index], [field]: val };
    setMateriais(updated);
  };

  const handleRemoveMaterial = (index: number) => {
    setMateriais(materiais.filter((_, i) => i !== index));
  };

  const handleSaveMaterials = async () => {
    setSaving(true);
    const res = await updatePicMaterials(picId, materiais);
    setSaving(false);
    if (res.success) {
      if (refreshData) refreshData(true);
      alert('Relação de materiais atualizada com sucesso!');
    } else {
      alert(res.error || 'Erro ao atualizar materiais');
    }
  };

  // ---------------------------------------------------------------------------
  // ABA 4: PLANEJADOR DE AÇÕES
  // ---------------------------------------------------------------------------

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSectionName.trim()) return;
    setSaving(true);
    const res = await createPicSection(picId, newSectionName.trim());
    setSaving(false);
    if (res.success) {
      setNewSectionName('');
      setShowAddSection(false);
      await loadPicData(true);
    } else {
      alert(res.error || 'Erro ao criar seção');
    }
  };

  const handleDeleteSection = async (secaoId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta seção de ações?')) return;
    setSaving(true);
    const res = await deletePicSection(secaoId);
    setSaving(false);
    if (res.success) {
      await loadPicData(true);
    } else {
      alert(res.error || 'Erro ao excluir seção');
    }
  };

  const handleAddAction = async (secaoId: string) => {
    const desc = newActionNames[secaoId] || '';
    if (!desc.trim()) return;
    setSaving(true);
    const res = await createPicAction(secaoId, desc.trim());
    setSaving(false);
    if (res.success) {
      setNewActionNames({ ...newActionNames, [secaoId]: '' });
      await loadPicData(true);
    } else {
      alert(res.error || 'Erro ao criar ação');
    }
  };

  const handleUpdateAction = async (actionId: string, data: any) => {
    const res = await updatePicAction(actionId, data);
    if (res.success) {
      await loadPicData(true);
      if (refreshData) refreshData(true);
    } else {
      alert(res.error || 'Erro ao atualizar ação');
    }
  };

  const handleDeleteAction = async (actionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta ação?')) return;
    setSaving(true);
    const res = await deletePicAction(actionId);
    setSaving(false);
    if (res.success) {
      await loadPicData(true);
    } else {
      alert(res.error || 'Erro ao excluir ação');
    }
  };

  // ---------------------------------------------------------------------------
  // CÁLCULOS DE PROGRESSO (VELOCÍMETRO / GAUGE)
  // ---------------------------------------------------------------------------

  const calculateProgress = () => {
    if (!pic || !pic.secoes) return { total: 0, completed: 0, percent: 0, sections: [], responsibles: [] };

    let totalActions = 0;
    let completedActions = 0;
    const sectionsProgress: any[] = [];
    const responsiblesProgressMap: Record<string, { nome: string; completed: number; total: number; avatarUrl?: string }> = {};

    for (const s of pic.secoes) {
      const act = s.acoes || [];
      const t = act.length;
      const c = act.filter((a: any) => a.status === 'CONCLUIDA').length;
      const pct = t > 0 ? Math.round((c / t) * 100) : 0;
      
      totalActions += t;
      completedActions += c;

      sectionsProgress.push({
        id: s.id,
        nome: s.nome,
        total: t,
        completed: c,
        percent: pct
      });

      for (const a of act) {
        const respId = a.responsavelId || 'unassigned';
        const respName = a.responsavel?.nome || 'Sem Responsável';
        const avatar = a.responsavel?.avatarUrl;
        
        if (!responsiblesProgressMap[respId]) {
          responsiblesProgressMap[respId] = {
            nome: respName,
            completed: 0,
            total: 0,
            avatarUrl: avatar
          };
        }
        
        responsiblesProgressMap[respId].total += 1;
        if (a.status === 'CONCLUIDA') {
          responsiblesProgressMap[respId].completed += 1;
        }
      }
    }

    const responsiblesProgress = Object.entries(responsiblesProgressMap).map(([id, data]) => {
      const pct = data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0;
      return {
        id,
        nome: data.nome,
        completed: data.completed,
        total: data.total,
        percent: pct,
        avatarUrl: data.avatarUrl
      };
    });

    // Sort responsibles by name (with Sem Responsável last)
    responsiblesProgress.sort((a, b) => {
      if (a.id === 'unassigned') return 1;
      if (b.id === 'unassigned') return -1;
      return a.nome.localeCompare(b.nome);
    });

    const percent = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;
    return {
      total: totalActions,
      completed: completedActions,
      percent,
      sections: sectionsProgress,
      responsibles: responsiblesProgress
    };
  };

  const progress = calculateProgress();

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs">
        <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#1B4D3E] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600 font-bold uppercase tracking-wider text-xs">Carregando PIC...</p>
        </div>
      </div>
    );
  }

  // Dados do contrato comercial (FPV Referencia)
  const contrato = pic.contrato || {};
  const client = contrato.client || {};
  const proposta = contrato.proposta || {};
  const lastVersao = proposta.versoes?.[0] || {};
  const meta = lastVersao.metadados || {};
  const FPVNum = proposta.numero ? `FPV-${proposta.numero.toString().padStart(3, '0')}` : 'S/N';
  const FPVRev = meta.revisao || 'R01';
  const vendedor = proposta.user || {};
  const formattedDataInicio = contrato.dataInicio 
    ? new Date(contrato.dataInicio).toLocaleDateString('pt-BR') 
    : 'Não definida';
  const formattedVigencia = contrato.vigenciaMeses 
    ? `${contrato.vigenciaMeses} meses` 
    : '-';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs font-sans text-left">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-slate-100 animate-fade-in relative">
        
        {/* Header do Modal */}
        <header className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#1B4D3E]/10 rounded-xl border border-[#1B4D3E]/20 flex items-center justify-center text-[#1B4D3E]">
              <ClipboardCheck size={22} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-800 uppercase tracking-wide">
                PIC: {client.razaoSocial || client.nomeFantasia || 'Cliente não identificado'}
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                Contrato: {contrato.id ? `ID-${contrato.id.substring(0,8).toUpperCase()}` : '-'} • Proposta: {FPVNum} (Rev {FPVRev})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer flex items-center justify-center"
          >
            <X size={20} className="stroke-[2.5]" />
          </button>
        </header>

        {/* Abas de Navegação */}
        <nav className="bg-white border-b border-slate-100 px-6 flex gap-6 shrink-0">
          {(['identificacao', 'financeiro', 'operacional', 'planejador'] as TabType[]).map((tab) => {
            const labels = {
              identificacao: '1. Identificação',
              financeiro: '2. Financeiro',
              operacional: '3. Operacional',
              planejador: '4. Planejador de Ações'
            };
            const icons = {
              identificacao: Briefcase,
              financeiro: DollarSign,
              operacional: Wrench,
              planejador: ListTodo
            };
            const Icon = icons[tab];
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3.5 border-b-2 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'border-[#1B4D3E] text-[#1B4D3E]' 
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#1B4D3E]' : 'text-slate-400'} />
                {labels[tab]}
              </button>
            );
          })}
        </nav>

        {/* Conteúdo das Abas (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          
          {/* ───────────────────────────────────────────────────────────────────
              ABA 01: IDENTIFICAÇÃO DO CONTRATO
              ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'identificacao' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Col Esquerda - Dados Cliente e Proposta */}
              <div className="md:col-span-2 space-y-6">
                
                {/* Cartão Dados Cliente */}
                {/* Cartão Dados Cliente */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider border-b border-slate-100 pb-2">
                    Dados Gerais do Cliente
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Nome Fantasia</span>
                      <span>{client.nomeFantasia || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Razão Social</span>
                      <span>{client.razaoSocial || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">CNPJ / CPF</span>
                      <span>{client.cnpj || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Segmento</span>
                      <span>{client.segmento || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Contato Principal</span>
                      <span>{client.contato ? `${client.contato} (${client.contatoCargo || 'Sem Cargo'})` : '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">WhatsApp / Fone</span>
                      <span>{client.whatsapp || '-'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] text-slate-400 uppercase block">Endereço da Prestação</span>
                      <span>{client.endereco || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#1B4D3E] font-extrabold uppercase block">Data de Início da Vigência</span>
                      <span className="text-slate-800 font-extrabold">{formattedDataInicio}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#1B4D3E] font-extrabold uppercase block">Prazo de Vigência</span>
                      <span className="text-slate-800 font-extrabold">{formattedVigencia}</span>
                    </div>
                  </div>
                </div>

                {/* Cartão Escopo e Itens */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider border-b border-slate-100 pb-2">
                    Escopo e Detalhamento da FPV
                  </h3>
                  <div className="space-y-3 text-xs font-semibold text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-black">Objeto / Escopo Técnico</span>
                      <p className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 mt-1 text-slate-600 font-medium whitespace-pre-line leading-relaxed">
                        {meta.escopoTecnico || meta.objetoProposta || 'Não especificado no contrato.'}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-black mb-1.5">Itens Inclusos e Excluídos</span>
                      <div className="overflow-x-auto mt-1">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9.5px] tracking-wider font-bold">
                              <th className="px-3 py-3 font-bold">Item / Descrição</th>
                              <th className="px-3 py-3 text-center w-28 font-bold">Status</th>
                            </tr>
                          </thead>
                          <tbody className="font-semibold text-slate-700">
                            {(meta.itensInclusosExcluidos || []).map((item: any) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 bg-white border-b border-slate-100/80">
                                <td className="px-3 py-3 text-slate-800 font-bold">
                                  {item.descricao}
                                </td>
                                <td className="px-3 py-3 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${
                                    item.incluso 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300/60' 
                                      : 'bg-red-50 text-red-700 border-red-300/60'
                                  }`}>
                                    {item.incluso ? 'Incluso' : 'Excluso'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                            {(meta.itensInclusosExcluidos || []).length === 0 && (
                              <tr>
                                <td colSpan={2} className="px-6 py-6 text-center text-slate-400 italic font-medium bg-white border-b border-slate-100">
                                  Nenhum item incluso ou excluso especificado.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Col Direita - Proponente, Comercial e Anotações */}
              <div className="space-y-6">
                
                {/* Cartão Comercial e Grupo */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider border-b border-slate-100 pb-2">
                    Dados da Proponente / Comercial
                  </h3>
                  <div className="space-y-3.5 text-xs font-bold text-slate-700">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Empresa do Grupo Associada</span>
                      <div className="flex items-center gap-2 mt-1 px-3 py-2 bg-[#1B4D3E]/5 border border-[#1B4D3E]/15 rounded-lg text-[#1B4D3E]">
                        <Briefcase size={14} />
                        <span className="font-extrabold uppercase">{contrato.empresaEmissora?.nomeFantasia || 'JVS Group'}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Vendedor / Fechamento</span>
                      <div className="flex items-center gap-2 mt-1">
                        {vendedor.avatarUrl ? (
                          <img src={vendedor.avatarUrl} alt={vendedor.nome} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[10px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                            {(vendedor.nome || 'Sis').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                          </div>
                        )}
                        <div>
                          <span className="block font-bold">{vendedor.nome || 'Não atribuído'}</span>
                          <span className="text-[10px] text-slate-400 font-semibold block">{vendedor.email || ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cartão Informações Anotáveis */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3 flex flex-col h-[280px]">
                  <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider border-b border-slate-100 pb-2 shrink-0">
                    Informações Anotáveis / Observações
                  </h3>
                  <textarea
                    value={anotacoes}
                    onChange={(e) => setAnotacoes(e.target.value)}
                    placeholder="Escreva anotações internas da implantação..."
                    className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 outline-none focus:border-[#1B4D3E] resize-none font-medium leading-relaxed"
                  />
                  <button
                    onClick={handleSaveDetails}
                    disabled={saving}
                    className="w-full py-2 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase rounded-lg tracking-widest transition-colors shrink-0 cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    {saving ? 'Gravando...' : 'Salvar Anotações'}
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────
              ABA 02: FINANCEIRO E FATURAMENTO
              ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'financeiro' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Dados de Faturamento Geral */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider border-b border-slate-100 pb-2">
                    Ciclos e Medições do Contrato
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Valor Mensal do Contrato</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-slate-400">R$</span>
                        <input
                          type="text"
                          value={valorMensalStr}
                          onChange={(e) => setValorMensalStr(e.target.value)}
                          onBlur={handleValorMensalBlur}
                          className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Data Prevista de Faturamento</label>
                      <input
                        type="text"
                        value={dataFaturamento}
                        onChange={(e) => setDataFaturamento(e.target.value)}
                        placeholder="Ex: Todo dia 25"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Período Medição (Início)</label>
                      <input
                        type="text"
                        value={periodoMedicaoInicio}
                        onChange={(e) => setPeriodoMedicaoInicio(e.target.value)}
                        placeholder="Ex: Dia 21 de cada mês"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Período Medição (Fim)</label>
                      <input
                        type="text"
                        value={periodoMedicaoFim}
                        onChange={(e) => setPeriodoMedicaoFim(e.target.value)}
                        placeholder="Ex: Dia 20 do mês subsequente"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Prazo de Pagamento (Vencimento)</label>
                      <input
                        type="text"
                        value={prazoPagamento}
                        onChange={(e) => setPrazoPagamento(e.target.value)}
                        placeholder="Ex: 15 dias após recebimento da NF"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Data Efetiva de Pagamento</label>
                      <input
                        type="text"
                        value={dataPagamento}
                        onChange={(e) => setDataPagamento(e.target.value)}
                        placeholder="Ex: Dia 10 do mês posterior"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#1B4D3E] font-black uppercase block mb-1">Início da Vigência (Contrato)</label>
                      <div className="w-full px-3 py-2 bg-slate-100/60 border border-slate-200 rounded-lg text-sm text-slate-500 font-extrabold select-none">
                        {formattedDataInicio}
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#1B4D3E] font-black uppercase block mb-1">Prazo de Vigência (Contrato)</label>
                      <div className="w-full px-3 py-2 bg-slate-100/60 border border-slate-200 rounded-lg text-sm text-slate-500 font-extrabold select-none">
                        {formattedVigencia}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dados para Emissão de Nota (Faturamento CNPJ) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider border-b border-slate-100 pb-2">
                    Dados Fiscais para Faturamento / Emissão de NF
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Razão Social de Faturamento</label>
                      <input
                        type="text"
                        value={faturamentoRazaoSocial}
                        onChange={(e) => setFaturamentoRazaoSocial(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">CNPJ de Faturamento</label>
                      <input
                        type="text"
                        value={faturamentoCnpj}
                        onChange={(e) => setFaturamentoCnpj(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">E-mail para Envio de NF</label>
                      <input
                        type="email"
                        value={faturamentoEmail}
                        onChange={(e) => setFaturamentoEmail(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Inscrição Estadual (IE)</label>
                      <input
                        type="text"
                        value={faturamentoInscricaoEstadual}
                        onChange={(e) => setFaturamentoInscricaoEstadual(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Inscrição Municipal (IM)</label>
                      <input
                        type="text"
                        value={faturamentoInscricaoMunicipal}
                        onChange={(e) => setFaturamentoInscricaoMunicipal(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-[10px] text-slate-400 uppercase block mb-1">Endereço de Faturamento</label>
                      <input
                        type="text"
                        value={faturamentoEndereco}
                        onChange={(e) => setFaturamentoEndereco(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Documentação necessária mensalmente */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider border-b border-slate-100 pb-2">
                  Documentação Exigida Mensalmente (Anexo à Fatura / Retenções)
                </h3>
                <div className="space-y-3">
                  <textarea
                    value={documentacoesMensais}
                    onChange={(e) => setDocumentacoesMensais(e.target.value)}
                    placeholder="Descreva as certidões e comprovantes exigidos pelo cliente..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]/20 h-24 resize-none font-medium leading-relaxed"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleSaveDetails}
                      disabled={saving}
                      className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase py-2 px-6 rounded-lg tracking-widest transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                    >
                      {saving ? 'Salvando...' : 'Salvar Detalhes Financeiros'}
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────
              ABA 03: OPERACIONAL (FUNCIONÁRIOS, EQUIPAMENTOS, MATERIAIS)
              ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'operacional' && (
            <div className="space-y-8">
              
              {/* Seção Funcionários (Quadro CLT Vendido) */}
              {/* Seção Funcionários (Quadro CLT Vendido) */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-1.5">
                    <Users size={16} /> Quadro de Funcionários (Postos CLT)
                  </h3>
                  <button
                    onClick={handleAddEmployee}
                    className="text-[10px] text-emerald-600 font-black uppercase tracking-wider hover:text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1 transition-colors cursor-pointer select-none"
                  >
                    <Plus size={12} /> Adicionar Nova Função
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9.5px] tracking-wider font-bold select-none">
                        <th className="px-3 py-3 font-bold">Função / Cargo</th>
                        <th className="px-3 py-3 text-center w-16 font-bold">Qtd</th>
                        <th className="px-3 py-3 text-center w-20 font-bold">Escala</th>
                        <th className="px-3 py-3 text-center w-24 font-bold">Horário Entrada</th>
                        <th className="px-3 py-3 text-center w-24 font-bold">Horário Saída</th>
                        <th className="px-3 py-3 w-44 font-bold">Dias da Semana</th>
                        <th className="px-3 py-3 text-center w-12 font-bold">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="font-semibold text-slate-700">
                      {funcionarios.map((emp, index) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 bg-white border-b border-slate-100/80">
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={emp.funcao}
                              onChange={(e) => handleUpdateEmployee(index, 'funcao', e.target.value)}
                              className="w-full bg-transparent outline-none text-slate-800 font-bold px-1.5 py-1.5 border border-transparent focus:border-[#1B4D3E]/30 focus:bg-slate-50/50 rounded-lg transition-all"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={emp.quantidade}
                              onChange={(e) => handleUpdateEmployee(index, 'quantidade', Number(e.target.value))}
                              className="w-full bg-transparent outline-none text-center font-bold px-1.5 py-1.5 border border-transparent focus:border-[#1B4D3E]/30 focus:bg-slate-50/50 rounded-lg transition-all"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={emp.escala}
                              onChange={(e) => handleUpdateEmployee(index, 'escala', e.target.value)}
                              className="w-full bg-transparent outline-none font-bold text-center py-1.5 border border-transparent focus:border-[#1B4D3E]/30 focus:bg-slate-50/50 rounded-lg cursor-pointer transition-all"
                            >
                              <option value="5x2">5x2</option>
                              <option value="6x1">6x1</option>
                              <option value="12x36">12x36</option>
                              <option value="4x2">4x2</option>
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={emp.horarioEntrada || '08:00'}
                              onChange={(e) => handleUpdateEmployee(index, 'horarioEntrada', e.target.value)}
                              className="w-full bg-transparent outline-none text-center font-bold px-1.5 py-1.5 border border-transparent focus:border-[#1B4D3E]/30 focus:bg-slate-50/50 rounded-lg transition-all"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={emp.horarioSaida || '17:00'}
                              onChange={(e) => handleUpdateEmployee(index, 'horarioSaida', e.target.value)}
                              className="w-full bg-transparent outline-none text-center font-bold px-1.5 py-1.5 border border-transparent focus:border-[#1B4D3E]/30 focus:bg-slate-50/50 rounded-lg transition-all"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={emp.diasSemana || 'Segunda a Sexta'}
                              onChange={(e) => handleUpdateEmployee(index, 'diasSemana', e.target.value)}
                              className="w-full bg-transparent outline-none text-slate-700 font-bold px-1.5 py-1.5 border border-transparent focus:border-[#1B4D3E]/30 focus:bg-slate-50/50 rounded-lg transition-all"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveEmployee(index)}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {funcionarios.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-6 py-6 text-center text-slate-400 italic font-medium bg-white border-b border-slate-100">
                            Nenhum funcionário cadastrado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={handleSaveEmployees}
                    disabled={saving}
                    className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase py-2.5 px-6 rounded-xl tracking-widest transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    Salvar Quadro
                  </button>
                </div>
              </div>

              {/* Seção Equipamentos */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase size={16} /> Relação de Equipamentos / Máquinas
                  </h3>
                  <button
                    onClick={handleAddEquipment}
                    className="text-[10px] text-emerald-600 font-black uppercase tracking-wider hover:text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1 transition-colors cursor-pointer select-none"
                  >
                    <Plus size={12} /> Adicionar Equipamento
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9.5px] tracking-wider font-bold select-none">
                        <th className="px-3 py-3 font-bold">Nome do Equipamento</th>
                        <th className="px-3 py-3 text-center w-20 font-bold">Quantidade</th>
                        <th className="px-3 py-3 text-center w-24 font-bold">Tipo Alocação</th>
                        <th className="px-3 py-3 text-center w-12 font-bold">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="font-semibold text-slate-700">
                      {equipamentos.map((eq, index) => (
                        <tr key={eq.id} className="hover:bg-slate-50/50 bg-white border-b border-slate-100/80">
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={eq.nome}
                                onChange={(e) => handleUpdateEquipment(index, 'nome', e.target.value)}
                                className="w-full bg-transparent outline-none text-slate-800 font-bold px-1.5 py-1.5 border border-transparent focus:border-[#1B4D3E]/30 focus:bg-slate-50/50 rounded-lg transition-all"
                              />
                              <button
                                type="button"
                                onClick={() => setActiveObservationEdit({
                                  type: 'equipamento',
                                  index,
                                  title: eq.nome || 'Novo Equipamento',
                                  value: eq.observacao || ''
                                })}
                                className="flex items-center gap-1 p-1.5 rounded-lg transition-colors text-slate-400 hover:text-[#1B4D3E] hover:bg-slate-100 cursor-pointer shrink-0 mt-0.5"
                                title="Observações / Detalhes do Equipamento"
                              >
                                <MessageSquare size={14} className={eq.observacao ? 'text-[#1B4D3E]' : 'text-slate-300'} />
                                {eq.observacao && (
                                  <span className="w-1.5 h-1.5 bg-[#1B4D3E] rounded-full shrink-0" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={eq.quantidade}
                              onChange={(e) => handleUpdateEquipment(index, 'quantidade', Number(e.target.value))}
                              className="w-full bg-transparent outline-none text-center font-bold px-1.5 py-1.5 border border-transparent focus:border-[#1B4D3E]/30 focus:bg-slate-50/50 rounded-lg transition-all"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <select
                              value={eq.tipo}
                              onChange={(e) => handleUpdateEquipment(index, 'tipo', e.target.value)}
                              className="w-full bg-transparent outline-none font-bold text-center py-1.5 border border-transparent focus:border-[#1B4D3E]/30 focus:bg-slate-50/50 rounded-lg cursor-pointer transition-all"
                            >
                              <option value="PROPRIO">Próprio</option>
                              <option value="LOCADO">Locado</option>
                            </select>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveEquipment(index)}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {equipamentos.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-6 py-6 text-center text-slate-400 italic font-medium bg-white border-b border-slate-100">
                            Nenhum equipamento listado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={handleSaveEquipments}
                    disabled={saving}
                    className="bg-slate-900 hover:bg-black text-white text-xs font-black uppercase py-4 px-8 rounded-3xl tracking-widest transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-slate-200"
                  >
                    Salvar Equipamentos
                  </button>
                </div>
              </div>

              {/* Seção Materiais */}
              <div className="bg-white border-0 rounded-3xl p-6 shadow-sm shadow-slate-100 space-y-4">
                <div className="flex items-center justify-between pb-2">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={16} /> Materiais e Insumos
                  </h3>
                  <button
                    onClick={handleAddMaterial}
                    className="text-[10px] text-slate-900 font-black uppercase tracking-wider hover:bg-slate-100 bg-slate-50 px-4 py-2 rounded-2xl flex items-center gap-1 transition-colors cursor-pointer select-none"
                  >
                    <Plus size={12} /> Adicionar
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 uppercase text-[9.5px] tracking-wider font-bold">
                        <th className="px-3 py-3">Nome do Material</th>
                        <th className="px-3 py-3 text-center w-20">Qtd</th>
                        <th className="px-3 py-3 text-center w-20">Unidade</th>
                        <th className="px-3 py-3 text-center w-12">Remover</th>
                      </tr>
                    </thead>
                    <tbody className="font-semibold text-slate-700">
                      {materiais.map((mat, index) => (
                        <tr key={mat.id} className="hover:bg-slate-50/50 rounded-3xl">
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-between gap-2">
                              <input
                                type="text"
                                value={mat.nome}
                                onChange={(e) => handleUpdateMaterial(index, 'nome', e.target.value)}
                                className="w-full bg-transparent outline-none text-slate-800 font-bold px-3 py-2.5 rounded-2xl transition-all focus:bg-slate-50"
                              />
                              <button
                                type="button"
                                onClick={() => setActiveObservationEdit({ type: 'material', index, title: mat.nome, value: mat.observacao || '' })}
                                className="p-2.5 rounded-2xl transition-colors text-slate-400 hover:text-slate-900 hover:bg-slate-100"
                              >
                                <MessageSquare size={16} />
                              </button>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={mat.quantidade}
                              onChange={(e) => handleUpdateMaterial(index, 'quantidade', Number(e.target.value))}
                              className="w-full bg-transparent outline-none text-center font-bold px-3 py-2.5 rounded-2xl transition-all focus:bg-slate-50"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={mat.unidade || 'UN'}
                              onChange={(e) => handleUpdateMaterial(index, 'unidade', e.target.value)}
                              className="w-full bg-transparent outline-none text-center font-bold px-3 py-2.5 rounded-2xl transition-all focus:bg-slate-50"
                            />
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveMaterial(index)}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    onClick={handleSaveMaterials}
                    disabled={saving}
                    className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase py-2 px-5 rounded-lg tracking-widest transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
                  >
                    Salvar Insumos
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ───────────────────────────────────────────────────────────────────
              ABA 04: PLANEJADOR DE AÇÕES (RH, SUPRIMENTOS, OPERAÇÃO)
              ─────────────────────────────────────────────────────────────────── */}
          {activeTab === 'planejador' && (
            <div className="space-y-6">
              
              {/* Resumo do Progresso com SVG Gauge/Velocímetro */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-center gap-8">
                
                {/* SVG Velocímetro */}
                <div className="relative flex flex-col items-center shrink-0">
                  <svg width="150" height="100" viewBox="0 0 150 100" className="overflow-visible">
                    {/* Arco cinza de fundo (fundo) */}
                    <path
                      d="M 20 80 A 55 55 0 0 1 130 80"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    {/* Arco de progresso dinâmico */}
                    <path
                      d="M 20 80 A 55 55 0 0 1 130 80"
                      fill="none"
                      stroke="#1B4D3E"
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray="172.78"
                      strokeDashoffset={172.78 - (172.78 * progress.percent) / 100}
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  <div className="absolute top-10 flex flex-col items-center">
                    <span className="text-2xl font-black text-[#1B4D3E]">{progress.percent}%</span>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Concluído</span>
                  </div>
                </div>

                {/* Progress bars por seção/responsável */}
                <div className="flex-1 w-full space-y-3">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                      {summaryGrouping === 'area'
                        ? `Resumo do Progresso por Área (${progress.completed}/${progress.total} Ações)`
                        : `Resumo do Progresso por Responsável (${progress.completed}/${progress.total} Ações)`
                      }
                    </h4>
                    
                    {/* Botão de Alternar Visão */}
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 shrink-0 select-none">
                      <button
                        type="button"
                        onClick={() => setSummaryGrouping('area')}
                        className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                          summaryGrouping === 'area'
                            ? 'bg-[#1B4D3E] text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Área
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryGrouping('responsavel')}
                        className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                          summaryGrouping === 'responsavel'
                            ? 'bg-[#1B4D3E] text-white shadow-xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        Responsável
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {summaryGrouping === 'area' ? (
                      progress.sections.map((sec: any) => (
                        <div key={sec.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider">{sec.nome}</span>
                            <span className="text-[10px] font-extrabold text-[#1B4D3E]">{sec.percent}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                            <div 
                              className="bg-[#1B4D3E] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${sec.percent}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 block mt-1 uppercase">
                            {sec.completed}/{sec.total} completas
                          </span>
                        </div>
                      ))
                    ) : (
                      progress.responsibles.map((resp: any) => (
                        <div key={resp.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                {resp.avatarUrl ? (
                                  <img src={resp.avatarUrl} alt={resp.nome} className="w-4.5 h-4.5 rounded-full object-cover shrink-0" />
                                ) : (
                                  <div className="w-4.5 h-4.5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[6.5px] font-black text-[#1B4D3E] uppercase shrink-0 border border-slate-200">
                                    {resp.nome.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                                  </div>
                                )}
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-wider truncate">{resp.nome}</span>
                              </div>
                              <span className="text-[10px] font-extrabold text-[#1B4D3E]">{resp.percent}%</span>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-[#1B4D3E] h-2 rounded-full transition-all duration-300"
                                style={{ width: `${resp.percent}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400 block mt-1 uppercase">
                            {resp.completed}/{resp.total} completas
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Botão de Adicionar Nova Seção */}
                <div className="shrink-0">
                  {!showAddSection ? (
                    <button
                      onClick={() => setShowAddSection(true)}
                      className="py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold uppercase rounded-lg tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus size={14} /> Nova Seção
                    </button>
                  ) : (
                    <form onSubmit={handleAddSection} className="flex gap-2 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                      <input
                        type="text"
                        placeholder="Nome da Seção (ex: TI)"
                        value={newSectionName}
                        onChange={(e) => setNewSectionName(e.target.value)}
                        className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none text-slate-800"
                        style={{ width: '130px' }}
                      />
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold uppercase rounded-lg"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddSection(false); setNewSectionName(''); }}
                        className="px-2.5 py-1.5 bg-slate-300 hover:bg-slate-400 text-slate-700 text-xs font-bold uppercase rounded-lg"
                      >
                        X
                      </button>
                    </form>
                  )}
                </div>

              </div>

              {/* Lista de Seções com suas Ações */}
              <div className="space-y-6">
                {(pic.secoes || []).map((sec: any) => {
                  const acoes = sec.acoes || [];
                  const secProg = progress.sections.find((s: any) => s.id === sec.id) || { total: 0, completed: 0, percent: 0 };
                  return (
                    <div key={sec.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
                      
                      {/* Título Seção */}
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-4 flex-1 min-w-0 mr-4">
                          <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                            📋 Seção: {sec.nome}
                          </h3>
                          
                          {/* Barra de Progresso da Seção */}
                          <div className="flex items-center gap-2.5 flex-1 max-w-64">
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
                              <div 
                                className="bg-[#1B4D3E] h-2 rounded-full transition-all duration-500" 
                                style={{ width: `${secProg.percent}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] font-black text-slate-500 shrink-0">
                              {secProg.percent}% ({secProg.completed}/{secProg.total})
                            </span>
                          </div>
                        </div>
                        {/* Apenas permite excluir seções que não sejam as padrões (RH, Suprimentos, Operação) */}
                        {!['RH', 'SUPRIMENTOS', 'OPERAÇÃO', 'OPERACAO'].includes(sec.nome.toUpperCase()) && (
                          <button
                            onClick={() => handleDeleteSection(sec.id)}
                            className="text-[10px] text-red-500 font-bold uppercase tracking-wider hover:text-red-700 bg-red-50 px-2.5 py-1 rounded-lg border border-red-200 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                          >
                            <Trash2 size={12} /> Excluir Área
                          </button>
                        )}
                      </div>

                      {/* Tabela de Ações */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs select-text table-fixed mt-0">
                          <colgroup>
                            <col style={{ width: '6%' }} />
                            <col style={{ width: '58%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '12%' }} />
                          </colgroup>
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[9.5px] font-bold select-none tracking-wider text-center">
                              <th className="py-3 px-1 text-center w-10">Item</th>
                              <th className="py-3 px-3 text-left">Descrição</th>
                              <th className="py-3 px-3 text-center">Resp.</th>
                              <th className="py-3 px-3 text-center">Prazo</th>
                              <th className="py-3 px-1.5 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {acoes.map((action: any, idx: number) => (
                              <ActionRow
                                key={action.id}
                                action={action}
                                users={users}
                                idx={idx}
                                handleUpdateAction={handleUpdateAction}
                                handleDeleteAction={handleDeleteAction}
                              />
                            ))}

                            {/* Campo de Cadastro Inline de Nova Ação */}
                            <tr className="bg-slate-50/20 border-b border-slate-100/80">
                              <td className="py-3.5 px-1 text-center text-slate-400 font-bold text-xs select-none">
                                +
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="text"
                                  placeholder="Escreva e adicione uma nova ação nesta área..."
                                  value={newActionNames[sec.id] || ''}
                                  onChange={(e) => setNewActionNames({
                                    ...newActionNames,
                                    [sec.id]: e.target.value
                                  })}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddAction(sec.id);
                                  }}
                                  className="w-full bg-transparent border-none outline-none focus:ring-0 text-xs font-bold text-slate-700 py-1"
                                />
                              </td>
                              <td className="py-2.5 px-1 text-center" colSpan={3}>
                                <button
                                  onClick={() => handleAddAction(sec.id)}
                                  className="text-[9px] text-[#1E4663] font-black uppercase tracking-widest hover:text-[#153145] bg-[#1E4663]/8 px-3.5 py-2 rounded-xl border border-[#1E4663]/20 transition-colors cursor-pointer"
                                >
                                  + Inserir Ação
                                </button>
                              </td>
                            </tr>

                          </tbody>
                        </table>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* MODAL PARA EDITAR OBSERVAÇÕES DE EQUIPAMENTO / MATERIAL */}
      {activeObservationEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs no-print animate-fade-in">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 text-left border border-slate-200/50">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-[#1B4D3E] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} /> Observações / Detalhes
              </h3>
              <button
                type="button"
                onClick={() => setActiveObservationEdit(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400 uppercase font-black">Item:</p>
              <p className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200/60 rounded-xl p-3">
                {activeObservationEdit.title}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-[#1B4D3E] font-black uppercase block">Anotações / Especificações</label>
              <textarea
                value={activeObservationEdit.value}
                onChange={(e) => setActiveObservationEdit({
                  ...activeObservationEdit,
                  value: e.target.value
                })}
                placeholder={activeObservationEdit.type === 'equipamento' ? "Especificações, voltagem, fabricante, etc..." : "Frequência de entrega, diluições, marca sugerida, etc..."}
                rows={5}
                className="w-full bg-slate-50 border border-slate-200/80 focus:border-[#1B4D3E]/80 outline-none text-xs font-bold text-slate-800 p-3 leading-relaxed resize-none rounded-xl focus:ring-2 focus:ring-[#1B4D3E]/10"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const { type, index, value } = activeObservationEdit;
                  if (type === 'equipamento') {
                    handleUpdateEquipment(index, 'observacao', value);
                  } else {
                    handleUpdateMaterial(index, 'observacao', value);
                  }
                  setActiveObservationEdit(null);
                }}
                className="px-5 py-2.5 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ActionRowProps {
  action: any;
  users: any[];
  idx: number;
  handleUpdateAction: (actionId: string, data: any) => Promise<void>;
  handleDeleteAction: (actionId: string) => Promise<void>;
}

function ActionRow({ action, users, idx, handleUpdateAction, handleDeleteAction }: ActionRowProps) {
  const isCompleted = action.status === 'CONCLUIDA';
  const [obsModalOpen, setObsModalOpen] = React.useState(false);

  // Local state for description and observation to avoid typing lag and parent rerenders
  const [localDescricao, setLocalDescricao] = React.useState(action.descricao || '');
  const [localObservacao, setLocalObservacao] = React.useState(action.observacao || '');

  // Keep local state in sync if parent state changes (e.g., reload from server)
  React.useEffect(() => {
    setLocalDescricao(action.descricao || '');
  }, [action.descricao]);

  React.useEffect(() => {
    setLocalObservacao(action.observacao || '');
  }, [action.observacao]);

  const handleDescBlur = () => {
    if (localDescricao.trim() && localDescricao !== action.descricao) {
      handleUpdateAction(action.id, { descricao: localDescricao });
    } else if (!localDescricao.trim()) {
      setLocalDescricao(action.descricao); // reset to original if empty
    }
  };

  const handleObsBlur = () => {
    if (localObservacao !== (action.observacao || '')) {
      handleUpdateAction(action.id, { observacao: localObservacao });
    }
  };

  const getStatusText = () => {
    if (isCompleted) return 'CONCLUÍDA';
    if (action.dataLimite) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const limit = new Date(action.dataLimite);
      if (limit < today) return 'ATRASADA';
    }
    return 'EM DIA';
  };

  const statusText = getStatusText();
  let statusColorClass = 'bg-blue-50 text-blue-700 border-blue-200';
  if (statusText === 'CONCLUÍDA') {
    statusColorClass = 'bg-emerald-50 text-emerald-700 border-emerald-300';
  } else if (statusText === 'ATRASADA') {
    statusColorClass = 'bg-red-50 text-red-700 border-red-300';
  }

  const selectedUser = action.responsavelId ? users.find(u => u.id === action.responsavelId) : null;
  const avatarUrl = selectedUser?.avatarUrl;
  const userName = selectedUser?.nome || 'Selecionar';

  return (
    <>
      <tr className={`hover:bg-slate-50/50 bg-white ${isCompleted ? 'bg-slate-50/10' : ''} border-b border-slate-100/80 transition-colors`}>
        {/* Número Sequencial / Item */}
        <td className="py-3 px-1 text-center font-bold text-slate-400 select-none text-[11px]">
          {idx + 1}
        </td>

        {/* Descrição + Speech Bubble Button */}
        <td className="py-2 px-3">
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              value={localDescricao}
              onChange={(e) => setLocalDescricao(e.target.value)}
              onBlur={handleDescBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur();
                }
              }}
              className={`w-full bg-transparent border-none outline-none focus:ring-0 text-slate-800 font-bold py-1 leading-normal text-xs ${
                isCompleted ? 'line-through text-slate-400' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => setObsModalOpen(true)}
              className="flex items-center gap-1 p-1.5 rounded-lg transition-colors text-slate-400 hover:text-[#1E4663] hover:bg-slate-100 cursor-pointer shrink-0 mt-0.5"
              title="Anotações / Observações da Ação"
            >
              <MessageSquare size={14} className={localObservacao ? 'text-[#1E4663]' : 'text-slate-300'} />
              {localObservacao && (
                <span className="w-1.5 h-1.5 bg-[#1E4663] rounded-full shrink-0" />
              )}
            </button>
          </div>
        </td>

        {/* Responsável (Avatar Dropdown) */}
        <td className="py-2 px-1 text-center relative">
          <div className="flex items-center justify-center">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt={userName} 
                className="w-6 h-6 rounded-full object-cover border border-slate-100 shadow-xs"
                title={userName}
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-[#1E4663]/8 flex items-center justify-center text-[8.5px] font-black text-[#1E4663] uppercase border border-slate-200/50 shadow-xs" title={userName}>
                {userName !== 'Selecionar' && userName !== 'Sem Responsável' 
                  ? userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2) 
                  : <User size={12} className="text-slate-400" />}
              </div>
            )}
            <select
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={action.responsavelId || ''}
              onChange={(e) => handleUpdateAction(action.id, {
                responsavelId: e.target.value || null
              })}
            >
              <option value="">Selecionar</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.nome}</option>
              ))}
            </select>
          </div>
        </td>

        {/* Prazo Final */}
        <td className="py-2 px-1 text-center">
          <input
            type="date"
            value={action.dataLimite ? new Date(action.dataLimite).toISOString().substring(0, 10) : ''}
            onChange={(e) => handleUpdateAction(action.id, {
              dataLimite: e.target.value || null
            })}
            className="w-full bg-transparent border-none outline-none focus:ring-0 text-center text-xs py-1 h-7 min-w-0 font-bold text-slate-700 cursor-pointer rounded-lg hover:bg-slate-100/60"
          />
        </td>

        {/* Status (Checkbox + Badge + Deletar) */}
        <td className="py-2 px-1.5 text-center">
          <div className="flex items-center justify-center gap-2">
            {/* Toggle Conclusão */}
            <input
              type="checkbox"
              checked={isCompleted}
              onChange={() => handleUpdateAction(action.id, {
                status: isCompleted ? 'PENDENTE' : 'CONCLUIDA'
              })}
              className="w-4 h-4 rounded-md border-slate-300 text-[#1E4663] focus:ring-[#1E4663]/25 cursor-pointer transition-all"
            />

            {/* Status Badge */}
            <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border select-none whitespace-nowrap ${statusColorClass}`}>
              {statusText}
            </span>

            {/* Delete Action Button */}
            <button
              onClick={() => handleDeleteAction(action.id)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
              title="Excluir Ação"
            >
              <X size={13} />
            </button>
          </div>
        </td>
      </tr>

      {/* MODAL DE OBSERVAÇÕES / ANOTAÇÕES */}
      {obsModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs no-print animate-fade-in">
          <div className="bg-white border border-slate-200/50 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black text-[#1E4663] uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} /> Anotações da Ação
              </h3>
              <button
                onClick={() => {
                  handleObsBlur();
                  setObsModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400 uppercase font-black">Ação:</p>
              <p className="text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200/60 rounded-xl p-3">
                {localDescricao}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] text-[#1E4663] font-black uppercase block">Observações / Histórico</label>
              <textarea
                value={localObservacao}
                onChange={(e) => setLocalObservacao(e.target.value)}
                placeholder="Insira observações de status, histórico ou anotações desta ação..."
                rows={5}
                className="w-full bg-slate-50 border border-slate-200/80 focus:border-[#1E4663]/80 outline-none text-xs font-bold text-slate-800 p-3 leading-relaxed resize-none rounded-xl focus:ring-2 focus:ring-[#1E4663]/10"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  handleObsBlur();
                  setObsModalOpen(false);
                }}
                className="px-5 py-2.5 bg-[#1E4663] hover:bg-[#153145] text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-colors"
              >
                Confirmar e Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
