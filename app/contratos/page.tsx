'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  FileText, Plus, Search, 
  Users, TrendingUp, Clock,
  LayoutList, LayoutGrid, AlertCircle, Edit2, CheckCircle, Calendar, DollarSign, Trash2, Printer
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getContratos, updateContratoStatus, deleteContrato } from './actions';

type ViewMode = 'lista' | 'kanban-status';

const fmt = (v: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);

const gerarNumeroContrato = (c: any) => {
  if (!c || !c.proposta) return 'S/N';
  const numProp = c.proposta.numero?.toString().padStart(3, '0') || '000';
  const numRev = (c.proposta.versoes?.[0]?.versao || 1).toString().padStart(2, '0');
  const d = c.dataInicio ? new Date(c.dataInicio) : new Date(c.createdAt || Date.now());
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const y = d.getFullYear().toString();
  return `${numProp}.${numRev}.${m}.${y}`;
};

const renderVencimento = (dataInicio: any, vigenciaMeses: any) => {
  if (!dataInicio || !vigenciaMeses) return <span className="text-slate-400">-</span>;
  const d = new Date(dataInicio);
  
  // Extrai em UTC para evitar que 00:00Z vire 21:00 do dia anterior no BRT
  const dRef = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + vigenciaMeses, d.getUTCDate()));
  
  // Pega o 'hoje' na perspectiva local e joga para UTC meia-noite
  const hoje = new Date();
  const hojeUTC = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), hoje.getDate()));
  
  const diasParaVencer = Math.round((dRef.getTime() - hojeUTC.getTime()) / (1000 * 3600 * 24));
  
  // Mostra a string formatada forçando timezone UTC para manter o dia correto
  const dataStr = dRef.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  
  let colorClass = "bg-emerald-500";
  let title = "Contrato no prazo";
  
  if (diasParaVencer < 0) {
    colorClass = "bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]";
    title = `Vencido há ${Math.abs(diasParaVencer)} dias`;
  } else if (diasParaVencer <= 45) {
    colorClass = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]";
    title = `Vence em ${diasParaVencer} dias`;
  }

  return (
    <div className="flex items-center justify-center gap-2" title={title}>
      <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`}></div>
      <span className="font-bold">{dataStr}</span>
    </div>
  );
};

export default function ContratosDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contratos, setContratos] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('lista');

  useEffect(() => {
    const saved = localStorage.getItem('orse_contrato_view_mode');
    if (saved) setViewMode(saved as any);
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('orse_contrato_view_mode', mode);
  };

  const loadData = async () => {
    setLoading(true);
    const res = await getContratos();
    if (res.success) {
      setContratos(res.data || []);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const getStatusColor = (status: string) => {
    if (status === 'Pendente de Assinatura') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (status === 'Vigente') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (status === 'Reajuste Pendente') return 'bg-orange-100 text-orange-700 border-orange-200';
    if (status === 'Encerrado') return 'bg-slate-200 text-slate-700 border-slate-300';
    return 'bg-blue-100 text-blue-700 border-blue-200';
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este contrato? Essa ação não pode ser desfeita.')) {
      const res = await deleteContrato(id);
      if (res.success) {
        setContratos(prev => prev.filter(c => c.id !== id));
      } else {
        alert('Erro ao excluir: ' + res.error);
      }
    }
  };

  const filteredContratos = contratos.filter(c => 
    c.client?.razaoSocial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.client?.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.empresaEmissora?.nomeFantasia?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.proposta?.numero?.toString().includes(searchTerm)
  );

  const ativos = contratos.filter(c => c.status === 'Vigente');
  const pendentesAssinatura = contratos.filter(c => c.status === 'Pendente de Assinatura');
  const pendentesReajuste = contratos.filter(c => c.status === 'Reajuste Pendente');
  const encerrados = contratos.filter(c => c.status === 'Encerrado');
  
  const contratosValidosParaReceita = contratos.filter(c => c.status !== 'Encerrado');
  const valorMensalTotal = contratosValidosParaReceita.reduce((acc, c) => acc + (c.valorMensal || 0), 0);
  const valorGlobalTotal = contratosValidosParaReceita.reduce((acc, c) => acc + (c.valorTotal || 0), 0);

  const statusList = ['Pendente de Assinatura', 'Vigente', 'Reajuste Pendente', 'Encerrado'];

  const resolveStatusColorToHex = (status: string): string => {
    if (status === 'Pendente de Assinatura') return '#f59e0b'; // amber
    if (status === 'Vigente') return '#10b981'; // emerald
    if (status === 'Reajuste Pendente') return '#f97316'; // orange
    if (status === 'Encerrado') return '#64748b'; // slate
    return '#3b82f6'; // blue
  };

  const normalizeHex = (hex: string) => {
    let h = hex.replace('#', '');
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    return '#' + h;
  };

  const getContrastYIQ = (hex: string) => {
    const normalized = normalizeHex(hex);
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 140) ? 'black' : 'white';
  };

  const hexToRgba = (hex: string, alpha: number) => {
    const normalized = normalizeHex(hex);
    const r = parseInt(normalized.slice(1, 3), 16);
    const g = parseInt(normalized.slice(3, 5), 16);
    const b = parseInt(normalized.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  const getDarkenedHexForText = (hex: string) => {
    const normalized = normalizeHex(hex);
    let r = parseInt(normalized.slice(1, 3), 16);
    let g = parseInt(normalized.slice(3, 5), 16);
    let b = parseInt(normalized.slice(5, 7), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    if (yiq > 170) {
      r = Math.max(0, Math.floor(r * 0.5));
      g = Math.max(0, Math.floor(g * 0.5));
      b = Math.max(0, Math.floor(b * 0.5));
    }
    const toHexStr = (val: number) => val.toString(16).padStart(2, '0');
    return `#${toHexStr(r)}${toHexStr(g)}${toHexStr(b)}`;
  };

  const KanbanColumn = ({ status, isFirst = false }: { status: string; isFirst?: boolean }) => {
    const cards = filteredContratos.filter(c => c.status === status);
    const total = cards.reduce((acc, c) => acc + (c.valorMensal || 0), 0);

    const resolvedHex = resolveStatusColorToHex(status);
    const contrast = getContrastYIQ(resolvedHex);
    const badgeClass = contrast === 'white' ? 'bg-white/20 text-white' : 'bg-black/10 text-slate-800';

    return (
      <div 
        className="flex-shrink-0 w-80 flex flex-col"
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-slate-200/50', 'rounded-xl'); }}
        onDragLeave={(e) => e.currentTarget.classList.remove('bg-slate-200/50', 'rounded-xl')}
        onDrop={async (e) => {
          e.preventDefault();
          e.currentTarget.classList.remove('bg-slate-200/50', 'rounded-xl');
          const id = e.dataTransfer.getData('text/plain');
          if (id) {
            setContratos(prev => prev.map(c => c.id === id ? { ...c, status } : c));
            await updateContratoStatus(id, status);
          }
        }}
      >
        <div className="flex flex-col items-center gap-1.5 w-full mb-3 select-none">
          {/* Cabeçalho Chevron/Seta */}
          <div className="w-full h-11 relative group/title pointer-events-auto">
            {/* Background SVG Custom Shape */}
            <svg 
              className="absolute inset-0 w-full h-full drop-shadow-sm transition-all duration-200"
              viewBox="0 0 320 44"
              preserveAspectRatio="none"
              style={{
                color: resolvedHex,
              }}
            >
              <path 
                d={isFirst 
                  ? "M 10,0 L 306,0 L 320,22 L 306,44 L 10,44 A 10,10 0 0,1 0,34 L 0,10 A 10,10 0 0,1 10,0 Z" 
                  : "M 0,0 L 306,0 L 320,22 L 306,44 L 0,44 L 14,22 Z"
                }
                fill="currentColor"
                stroke={contrast === 'white' ? 'rgba(255,255,255,0.2)' : 'rgba(15,23,42,0.15)'}
                strokeWidth="1.5"
              />
            </svg>

            {/* Conteúdo do Cabeçalho */}
            <div 
              className={`absolute inset-0 z-10 flex items-center justify-between ${isFirst ? 'pl-4 pr-7' : 'pl-7 pr-7'}`}
              style={{
                color: contrast === 'white' ? '#ffffff' : '#0f172a'
              }}
            >
              <span className="text-xs font-black uppercase tracking-wider truncate max-w-[200px]">
                {status}
              </span>
              
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm ${badgeClass}`}>
                {cards.length}
              </span>
            </div>
          </div>

          {/* Totalizador de Volume */}
          <div 
            className="px-3.5 py-1 rounded-full text-xs font-bold shadow-sm select-none text-center border"
            style={{
              backgroundColor: hexToRgba(resolvedHex, 0.1),
              color: getDarkenedHexForText(resolvedHex),
              borderColor: hexToRgba(resolvedHex, 0.25)
            }}
          >
            {fmt(total)} /mês
          </div>
        </div>

        <div className="flex flex-col gap-3 flex-1">
          {cards.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-xl py-10 flex items-center justify-center">
              <p className="text-xs text-slate-300 font-medium">Vazio</p>
            </div>
          ) : (
            cards.map(c => (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', c.id)}
                onClick={() => router.push(`/contratos/${c.id}`)}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-[#1B4D3E]/30 transition-all cursor-pointer cursor-grab active:cursor-grabbing"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <FileText size={13} className="text-[#1B4D3E]" />
                    <span className="text-xs font-black text-slate-700 tracking-wide">{gerarNumeroContrato(c)}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded">{c.empresaEmissora?.nomeFantasia}</span>
                </div>

                <p className="text-sm font-bold text-slate-800 leading-tight mb-3 line-clamp-2">{c.client?.razaoSocial || c.client?.nomeFantasia}</p>
                
                <div className="grid grid-cols-2 gap-2 mb-3 border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Início</p>
                    <p className="text-[11px] font-bold text-slate-700">{c.dataInicio ? new Date(c.dataInicio).toLocaleDateString('pt-BR') : 'A definir'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Reajuste</p>
                    <p className="text-[11px] font-bold text-orange-600">{c.dataReajuste ? new Date(c.dataReajuste).toLocaleDateString('pt-BR') : 'Não definido'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Mensal</p>
                    <span className="text-sm font-black text-[#1B4D3E]">{fmt(c.valorMensal)}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Vigência</p>
                    <span className="text-[11px] font-bold text-slate-600">{c.vigenciaMeses} meses</span>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-400 font-medium border-t border-slate-50 pt-2 flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span>Criado por:</span>
                    <div className="flex items-center gap-1">
                      {c.proposta?.user?.avatarUrl ? (
                        <img 
                          src={c.proposta.user.avatarUrl} 
                          alt={c.proposta.user.nome} 
                          className="w-4 h-4 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[7px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                          {(c.proposta?.user?.nome || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                        </div>
                      )}
                      <span className="font-bold text-slate-600">{c.proposta?.user?.nome || 'Sistema'}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Gerado em:</span>
                    <span className="font-bold text-slate-600">{new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-full mx-auto space-y-6">

          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase">Gestão de Contratos (CLM)</h1>
              <p className="text-slate-500 text-sm mt-1">Ciclo de vida, Reajustes e Aditivos</p>
            </div>
            <div className="flex items-center gap-3 bell-header-spacing">
              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-1 shadow-sm gap-1">
                <button
                  onClick={() => handleViewModeChange('lista')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'lista' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutList size={14} /> Lista
                </button>
                <button
                  onClick={() => handleViewModeChange('kanban-status')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    viewMode === 'kanban-status' ? 'bg-[#1B4D3E] text-white shadow-sm' : 'text-amber-500 hover:text-amber-600'
                  }`}
                >
                  <LayoutGrid size={14} /> Kanban
                </button>
              </div>

              <button
                onClick={() => router.push('/contratos/templates')}
                className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <FileText size={18} /> Minutas (Templates)
              </button>
              
              <button
                onClick={() => router.push('/contratos/novo')}
                className="bg-[#1B4D3E] hover:bg-[#13382d] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center gap-2 shadow-sm transition-colors"
              >
                <Plus size={18} /> Novo Contrato
              </button>
            </div>
          </header>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-600"><AlertCircle size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Em Assinatura</p>
                <p className="text-lg font-black text-slate-800 leading-none mt-1">{pendentesAssinatura.length}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 text-emerald-600"><CheckCircle size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Ativos (Vigentes)</p>
                <p className="text-lg font-black text-slate-800 leading-none mt-1">{ativos.length}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-blue-50 rounded border border-blue-200 text-blue-600"><DollarSign size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Receita Mensal</p>
                <p className="text-base font-black text-slate-800 leading-none mt-1">{fmt(valorMensalTotal)}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-indigo-50 rounded border border-indigo-200 text-indigo-600"><TrendingUp size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Valor Global</p>
                <p className="text-base font-black text-slate-800 leading-none mt-1">{fmt(valorGlobalTotal)}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded border border-orange-200 text-orange-600"><AlertCircle size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pendentes de Reajuste</p>
                <p className="text-lg font-black text-slate-800 leading-none mt-1">{pendentesReajuste.length}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-md shadow-sm border border-slate-300 flex items-center gap-4">
              <div className="p-3 bg-slate-100 rounded border border-slate-300 text-slate-600"><Calendar size={20} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Encerrados</p>
                <p className="text-lg font-black text-slate-800 leading-none mt-1">{encerrados.length}</p>
              </div>
            </div>
          </div>

          {/* BARRA DE BUSCA */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Buscar contrato, cliente ou emissora..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1B4D3E] focus:outline-none shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* VISUALIZAÇÃO EM LISTA */}
          {viewMode === 'lista' && (
            <div className="bg-white rounded-md shadow-sm border border-slate-300 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1B4D3E] text-white text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-3">Contrato</th>
                      <th className="px-6 py-3">Cliente</th>
                      <th className="px-6 py-3">Empresa Grupo</th>
                      <th className="px-6 py-3">Criado Por</th>
                      <th className="px-6 py-3">Gerado Em</th>
                      <th className="px-6 py-3 text-center">Início</th>
                      <th className="px-6 py-3 text-center">Vigência</th>
                      <th className="px-6 py-3 text-center">Vencimento</th>
                      <th className="px-6 py-3 text-center">Data Reajuste</th>
                      <th className="px-6 py-3 text-right">Mensal</th>
                      <th className="px-6 py-3 text-center">Status</th>
                      <th className="px-6 py-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {loading ? (
                      <tr><td colSpan={12} className="px-6 py-12 text-center text-slate-400">Carregando contratos...</td></tr>
                    ) : filteredContratos.length === 0 ? (
                      <tr><td colSpan={12} className="px-6 py-12 text-center text-slate-400">Nenhum contrato encontrado.</td></tr>
                    ) : filteredContratos.map((c) => (
                      <tr key={c.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-3 font-bold text-slate-700">{gerarNumeroContrato(c)}</td>
                        <td className="px-6 py-3 font-semibold text-slate-800">{c.client?.razaoSocial || c.client?.nomeFantasia}</td>
                        <td className="px-6 py-3 text-slate-600">{c.empresaEmissora?.nomeFantasia}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5">
                            {c.proposta?.user?.avatarUrl ? (
                              <img 
                                src={c.proposta.user.avatarUrl} 
                                alt={c.proposta.user.nome} 
                                className="w-5 h-5 rounded-full object-cover border border-slate-200"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#1B4D3E]/10 flex items-center justify-center text-[8px] font-black text-[#1B4D3E] uppercase border border-slate-200">
                                {(c.proposta?.user?.nome || 'Sistema').split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                              </div>
                            )}
                            <span className="text-slate-600 font-medium">{c.proposta?.user?.nome || 'Sistema'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-slate-500 font-mono text-xs">{new Date(c.createdAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-6 py-3 text-center text-slate-600 font-medium">
                          {c.dataInicio ? new Date(c.dataInicio).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-3 text-center text-slate-600 font-medium">{c.vigenciaMeses}m</td>
                        <td className="px-6 py-3 text-center text-slate-600">
                          {renderVencimento(c.dataInicio, c.vigenciaMeses)}
                        </td>
                        <td className="px-6 py-3 text-center text-orange-600 font-bold">
                          {c.dataReajuste ? new Date(c.dataReajuste).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-3 text-right font-black text-[#1B4D3E]">{fmt(c.valorMensal)}</td>
                        <td className="px-6 py-3 text-center">
                          <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider border ${getStatusColor(c.status)}`}>
                            {c.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => window.open(`/contratos/${c.id}/print`, '_blank')}
                              className="text-slate-500 hover:text-slate-700 transition-colors p-1 bg-slate-100 rounded"
                              title="Gerar/Imprimir PDF"
                            >
                              <Printer size={16} />
                            </button>
                            <button
                              onClick={() => router.push(`/contratos/${c.id}`)}
                              className="text-amber-500 hover:text-amber-600 transition-colors p-1 bg-amber-50 rounded"
                              title="Editar Contrato"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={(e) => handleDelete(c.id, e)}
                              className="text-red-500 hover:text-red-600 transition-colors p-1 bg-red-50 rounded"
                              title="Excluir Contrato"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KANBAN POR STATUS */}
          {viewMode === 'kanban-status' && (
            <div className="overflow-x-auto pb-6">
              <div className="flex gap-5 min-w-max">
                {statusList.map((status, index) => (
                  <KanbanColumn key={status} status={status} isFirst={index === 0} />
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
