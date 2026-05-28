'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Settings as SettingsIcon, Layers, CalendarDays, Ruler, Plus, Trash2, 
  Save, X, Tag, Edit2, Target, Briefcase, MessageSquare
} from 'lucide-react';
import { 
  getPropostaStatuses, createPropostaStatus, deletePropostaStatus 
} from '@/app/propostas/actions';
import { 
  getEscalas, createEscala, updateEscala, deleteEscala 
} from '@/app/escalas/actions';
import { 
  getUnidadesMedida, createUnidadeMedida, deleteUnidadeMedida,
  getCategorias, createCategoria, deleteCategoria,
  getTiposServico, createTipoServico, deleteTipoServico,
  getSegmentos, createSegmento, deleteSegmento,
  getSellers
} from './actions';
import { getEmpresasEmissoras, createEmpresaEmissora, updateEmpresaEmissora, deleteEmpresaEmissora } from './empresas-actions';
import { 
  getWhatsAppConnectionStatus, connectWhatsAppInstance, 
  getWhatsAppQrCode, disconnectWhatsAppInstance 
} from './zapi-actions';

type Tab = 'status' | 'escalas' | 'unidades' | 'categorias' | 'tipos' | 'segmentos' | 'metas' | 'empresas' | 'whatsapp';

export default function SettingsPage() {
  // Empresas Emissoras
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [showEmpresaModal, setShowEmpresaModal] = useState(false);
  const [empresaForm, setEmpresaForm] = useState({ id: '', nomeFantasia: '', razaoSocial: '', cnpj: '', endereco: '', telefone: '', email: '' });

  // WhatsApp Integration State
  const [waConnected, setWaConnected] = useState(false);
  const [waPhone, setWaPhone] = useState<string | null>(null);
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waLoading, setWaLoading] = useState(false);
  const [waStatusMsg, setWaStatusMsg] = useState('Verificando status...');

  const checkWhatsAppStatus = async () => {
    setWaLoading(true);
    setWaStatusMsg('Consultando conexão Z-API...');
    try {
      const res = await getWhatsAppConnectionStatus();
      if (res.success) {
        setWaConnected(!!res.connected);
        setWaPhone(res.phone || null);
        if (res.connected) {
          setWaQrCode(null);
          setWaStatusMsg('WhatsApp Conectado com sucesso!');
        } else {
          setWaStatusMsg('WhatsApp Desconectado. Pronto para escanear.');
        }
      } else {
        setWaStatusMsg('Erro ao obter status: ' + res.error);
      }
    } catch (err: any) {
      setWaStatusMsg('Falha de rede ao consultar status.');
    } finally {
      setWaLoading(false);
    }
  };

  const handleConnectWhatsApp = async () => {
    setWaLoading(true);
    setWaStatusMsg('Criando instância na Z-API...');
    try {
      const res = await connectWhatsAppInstance();
      if (res.success) {
        setWaStatusMsg('Instância pronta! Carregando QR Code...');
        // Busca o QR Code
        const qrRes = await getWhatsAppQrCode();
        if (qrRes.success && qrRes.qrCode) {
          setWaQrCode(qrRes.qrCode);
          setWaStatusMsg('Aguardando leitura do QR Code...');
        } else {
          setWaStatusMsg(qrRes.error || 'Erro ao carregar o QR Code.');
        }
      } else {
        alert('Erro ao conectar: ' + res.error);
        setWaStatusMsg('Erro na conexão.');
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setWaLoading(false);
    }
  };

  const handleDisconnectWhatsApp = async () => {
    if (!confirm('Deseja realmente desconectar o WhatsApp desta empresa? Isso interromperá todos os envios e recebimentos no CRM.')) return;
    setWaLoading(true);
    setWaStatusMsg('Desconectando dispositivo na Z-API...');
    try {
      const res = await disconnectWhatsAppInstance();
      if (res.success) {
        setWaConnected(false);
        setWaPhone(null);
        setWaQrCode(null);
        setWaStatusMsg('WhatsApp desconectado.');
        alert('WhatsApp desconectado com sucesso!');
      } else {
        alert('Erro ao desconectar: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setWaLoading(false);
    }
  };

  // ── Estado principal ─────────────────────────────────────────────────────────
  const [userRole, setUserRole] = useState<string>('USER');
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<Tab>('status');
  const [loading, setLoading] = useState(true);

  // Status
  const [statuses, setStatuses] = useState<any[]>([]);
  const [newStatusName, setNewStatusName] = useState('');

  
  // Empresas Emissoras
  const handleSaveEmpresa = async () => {
    if (!empresaForm.nomeFantasia.trim() || !empresaForm.razaoSocial.trim() || !empresaForm.cnpj.trim()) {
      alert('Nome Fantasia, Razão Social e CNPJ são obrigatórios.');
      return;
    }
    setLoading(true);
    let res;
    if (empresaForm.id) {
      res = await updateEmpresaEmissora(empresaForm.id, empresaForm);
    } else {
      res = await createEmpresaEmissora(empresaForm);
    }
    
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

  const openEmpresaModal = (empresa?: any) => {
    if (empresa && empresa.id) {
      setEmpresaForm(empresa);
    } else {
      setEmpresaForm({ id: '', nomeFantasia: '', razaoSocial: '', cnpj: '', endereco: '', telefone: '', email: '' });
    }
    setShowEmpresaModal(true);
  };


  // Tipos de Serviço
  const [tipos, setTipos] = useState<any[]>([]);
  const [newTipoNome, setNewTipoNome] = useState('');

  // Escalas
  const [escalas, setEscalas] = useState<any[]>([]);
  const [showEscalaModal, setShowEscalaModal] = useState(false);
  const [escalaForm, setEscalaForm] = useState({ id: '', nome: '', diasTrabalhadosMes: 22, horasMensais: 220 });

  // Unidades de Medida
  const [unidades, setUnidades] = useState<any[]>([]);
  const [newUnidade, setNewUnidade] = useState({ nome: '' });

  // Categorias
  const [categorias, setCategorias] = useState<any[]>([]);
  const [newCategoriaNome, setNewCategoriaNome] = useState('');

  // Segmentos
  const [segmentos, setSegmentos] = useState<any[]>([]);
  const [newSegmentoNome, setNewSegmentoNome] = useState('');

  // Metas
  const [sellers, setSellers] = useState<string[]>([]);
  const [metas, setMetas] = useState<Record<string, number>>({});
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    return new Date().toISOString().substring(0, 7);
  });

  // ── Verificação de acesso (deve ficar ANTES de qualquer return) ───────────────
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const cookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
      if (cookie) {
        try {
          const parsed = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          setUserRole(parsed.role || 'USER');
          setHasAccess(true);
        } catch {
          window.location.href = '/';
        }
      } else {
        window.location.href = '/login';
      }
    }
  }, []);

  // ── Metas ────────────────────────────────────────────────────────────────────
  const loadMetas = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sb_kpi_goals');
      if (saved) {
        try {
          setMetas(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  useEffect(() => {
    loadMetas();
  }, [selectedMonth]);

  const handleSaveMeta = (sellerName: string, val: number) => {
    const goalKey = `${sellerName}_${selectedMonth}`;
    const updated = { ...metas, [goalKey]: val };
    setMetas(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sb_kpi_goals', JSON.stringify(updated));
    }
  };

  // ── Carregamento de dados por aba ─────────────────────────────────────────────
  useEffect(() => {
    if (hasAccess) {
      loadData();
    }
  }, [activeTab, hasAccess]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'status') {
        const data = await getPropostaStatuses();
        setStatuses(data || []);
      } else if (activeTab === 'escalas') {
        const data = await getEscalas();
        setEscalas(data || []);
      } else if (activeTab === 'unidades') {
        const data = await getUnidadesMedida();
        setUnidades(data || []);
      } else if (activeTab === 'categorias') {
        const data = await getCategorias();
        setCategorias(data || []);
      } else if (activeTab === 'tipos') {
        const data = await getTiposServico();
        setTipos(data || []);
      } else if (activeTab === 'segmentos') {
        const data = await getSegmentos();
        setSegmentos(data || []);
      } else if (activeTab === 'empresas') {
        const data = await getEmpresasEmissoras();
        setEmpresas(data || []);
      } else if (activeTab === 'metas') {
        if (userRole === 'USER') {
          setActiveTab('status');
          return;
        }
        const sellersList = await getSellers();
        setSellers(sellersList || []);
        loadMetas();
      } else if (activeTab === 'whatsapp') {
        await checkWhatsAppStatus();
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // ── Handlers ──────────────────────────────────────────────────────────────────

  // Tipos
  const handleAddTipo = async () => {
    if (!newTipoNome.trim()) {
      alert('Preencha o nome do tipo de serviço.');
      return;
    }
    const res = await createTipoServico(newTipoNome);
    if (res.success) {
      setNewTipoNome('');
      loadData();
    } else {
      alert('Erro ao adicionar tipo de serviço: ' + res.error);
    }
  };

  const handleDeleteTipo = async (id: string) => {
    if (!confirm('Remover este tipo de serviço?')) return;
    const res = await deleteTipoServico(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // Segmentos
  const handleAddSegmento = async () => {
    if (!newSegmentoNome.trim()) {
      alert('Preencha o nome do segmento.');
      return;
    }
    const res = await createSegmento(newSegmentoNome);
    if (res.success) {
      setNewSegmentoNome('');
      loadData();
    } else {
      alert('Erro ao adicionar segmento: ' + res.error);
    }
  };

  const handleDeleteSegmento = async (id: string) => {
    if (!confirm('Remover este segmento?')) return;
    const res = await deleteSegmento(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // Status
  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;
    const res = await createPropostaStatus(newStatusName);
    if (res.success) {
      setNewStatusName('');
      loadData();
    } else {
      alert('Erro ao adicionar status: ' + res.error);
    }
  };

  const handleDeleteStatus = async (id: string) => {
    if (!confirm('Tem certeza que deseja remover este status?')) return;
    const res = await deletePropostaStatus(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // Escalas
  const handleSaveEscala = async () => {
    if (!escalaForm.nome.trim()) return alert('O nome da escala é obrigatório.');
    setLoading(true);
    const payload = {
      nome: escalaForm.nome,
      diasTrabalhadosMes: escalaForm.diasTrabalhadosMes,
      horasMensais: escalaForm.horasMensais
    };
    if (escalaForm.id) {
      await updateEscala(escalaForm.id, payload);
    } else {
      await createEscala(payload);
    }
    setShowEscalaModal(false);
    loadData();
  };

  const openEscalaModal = (escala?: any) => {
    if (escala) {
      setEscalaForm({
        id: escala.id,
        nome: escala.nome,
        diasTrabalhadosMes: escala.diasTrabalhadosMes,
        horasMensais: escala.horasMensais
      });
    } else {
      setEscalaForm({ id: '', nome: '', diasTrabalhadosMes: 22, horasMensais: 220 });
    }
    setShowEscalaModal(true);
  };

  // Unidades
  const handleAddUnidade = async () => {
    if (!newUnidade.nome.trim()) {
      alert('Preencha o nome da unidade.');
      return;
    }
    const res = await createUnidadeMedida(newUnidade.nome);
    if (res.success) {
      setNewUnidade({ nome: '' });
      loadData();
    } else {
      alert('Erro ao adicionar unidade: ' + res.error);
    }
  };

  const handleDeleteUnidade = async (id: string) => {
    if (!confirm('Remover esta unidade de medida?')) return;
    const res = await deleteUnidadeMedida(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // Categorias
  const handleAddCategoria = async () => {
    if (!newCategoriaNome.trim()) {
      alert('Preencha o nome da categoria.');
      return;
    }
    const res = await createCategoria(newCategoriaNome);
    if (res.success) {
      setNewCategoriaNome('');
      loadData();
    } else {
      alert('Erro ao adicionar categoria: ' + res.error);
    }
  };

  const handleDeleteCategoria = async (id: string) => {
    if (!confirm('Remover esta categoria?')) return;
    const res = await deleteCategoria(id);
    if (res.success) loadData();
    else alert('Erro ao excluir: ' + res.error);
  };

  // ── Guarda de acesso (APÓS todos os hooks) ────────────────────────────────────
  if (!hasAccess) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-[#1B4D3E] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-bold text-[#1B4D3E] uppercase tracking-widest">Verificando permissões...</span>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* HEADER */}
          <header className="flex justify-between items-end border-b border-slate-300 pb-4">
            <div>
              <h1 className="text-2xl font-bold text-[#1B4D3E] tracking-wider uppercase flex items-center gap-2">
                <SettingsIcon size={22} /> Configurações do Sistema
              </h1>
              <p className="text-slate-500 text-sm mt-1 uppercase font-bold tracking-tighter">Parâmetros operacionais e tabelas auxiliares</p>
            </div>
          </header>

          {/* TABS */}
          <div className="flex gap-4 border-b border-slate-200">
            {[
              { id: 'status', label: 'Status de Proposta', icon: Layers, roles: ['ADMIN', 'MANAGER', 'USER'] },
              { id: 'escalas', label: 'Escalas de Trabalho', icon: CalendarDays, roles: ['ADMIN', 'MANAGER', 'USER'] },
              { id: 'unidades', label: 'Unidades de Medida', icon: Ruler, roles: ['ADMIN', 'MANAGER', 'USER'] },
              { id: 'categorias', label: 'Categorias', icon: Tag, roles: ['ADMIN', 'MANAGER', 'USER'] },
              { id: 'tipos', label: 'Tipos de Serviço', icon: SettingsIcon, roles: ['ADMIN', 'MANAGER', 'USER'] },
              { id: 'segmentos', label: 'Segmentos de Cliente', icon: Target, roles: ['ADMIN', 'MANAGER', 'USER'] },
              { id: 'empresas', label: 'Empresas Emissoras', icon: Briefcase, roles: ['ADMIN'] },
              { id: 'metas', label: 'Metas dos Vendedores', icon: Target, roles: ['ADMIN', 'MANAGER'] },
              { id: 'whatsapp', label: 'Integração WhatsApp', icon: MessageSquare, roles: ['ADMIN', 'MANAGER'] },
            ].filter(tab => tab.roles.includes(userRole)).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 -mb-[2px] ${
                  activeTab === tab.id 
                    ? 'border-[#1B4D3E] text-[#1B4D3E]' 
                    : 'border-transparent text-amber-500 hover:text-amber-600'
                }`}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* CONTEÚDO */}
          <div className="bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden min-h-[500px] relative">
            
            {/* 1. ABA STATUS */}
            {activeTab === 'status' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Layers size={14} /> Definição de Status das Propostas
                  </h2>
                </div>
                
                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Novo nome de status (Ex: EM ANÁLISE)"
                      value={newStatusName}
                      onChange={e => setNewStatusName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddStatus()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddStatus}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {statuses.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:shadow-sm transition-all group">
                        <span className={`text-[10px] font-black px-3 py-1 rounded uppercase tracking-wider ${s.color}`}>
                          {s.nome}
                        </span>
                        <button 
                          onClick={() => handleDeleteStatus(s.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. ABA ESCALAS */}
            {activeTab === 'escalas' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays size={14} /> Gestão de Escalas de Trabalho
                  </h2>
                  <button 
                    onClick={() => openEscalaModal()}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all"
                  >
                    <Plus size={12} /> Nova Escala
                  </button>
                </div>

                <div className="p-6">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                        <th className="px-4 py-3">Nome da Escala</th>
                        <th className="px-4 py-3 text-center">Dias / Mês</th>
                        <th className="px-4 py-3 text-center">Horas Mensais</th>
                        <th className="px-4 py-3 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {escalas.map(e => (
                        <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 font-bold text-slate-700 uppercase">{e.nome}</td>
                          <td className="px-4 py-3 text-center font-bold">{e.diasTrabalhadosMes}</td>
                          <td className="px-4 py-3 text-center font-bold">{e.horasMensais}h</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEscalaModal(e)} className="text-amber-500 hover:text-amber-600"><Edit2 size={14} /></button>
                              <button onClick={() => { if(confirm('Excluir escala?')) deleteEscala(e.id).then(loadData) }} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. ABA UNIDADES */}
            {activeTab === 'unidades' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Ruler size={14} /> Unidades de Medida Disponíveis
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Unidade de Medida (Ex: UN, KG, LITRO)"
                      value={newUnidade.nome}
                      onChange={e => setNewUnidade({nome: e.target.value})}
                      onKeyDown={e => e.key === 'Enter' && handleAddUnidade()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddUnidade}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {unidades.map(u => (
                      <div key={u.id} className="p-4 bg-slate-50 border border-slate-200 rounded relative group hover:bg-white hover:shadow-sm transition-all">
                        <p className="text-lg font-black text-slate-800 uppercase">{u.nome}</p>
                        <button 
                          onClick={() => handleDeleteUnidade(u.id)}
                          className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 4. ABA CATEGORIAS */}
            {activeTab === 'categorias' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Tag size={14} /> Gestão de Categorias Geral
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome da Categoria (Ex: MATERIAL DE LIMPEZA)"
                      value={newCategoriaNome}
                      onChange={e => setNewCategoriaNome(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddCategoria()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddCategoria}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {categorias.map(c => (
                      <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:shadow-sm transition-all group">
                        <span className="text-xs font-bold text-slate-700 uppercase">{c.nome}</span>
                        <button 
                          onClick={() => handleDeleteCategoria(c.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 5. ABA TIPOS DE SERVIÇO */}
            {activeTab === 'tipos' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <SettingsIcon size={14} /> Gestão de Tipos de Serviço
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Tipo de Serviço (Ex: Limpeza e Conservação)"
                      value={newTipoNome}
                      onChange={e => setNewTipoNome(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTipo()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold"
                    />
                    <button 
                      onClick={handleAddTipo}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {tipos.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:shadow-sm transition-all group">
                        <span className="text-xs font-bold text-slate-700">{t.nome}</span>
                        <button 
                          onClick={() => handleDeleteTipo(t.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA SEGMENTOS */}
            {activeTab === 'segmentos' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D]">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} /> Gestão de Segmentos de Cliente
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nome do Segmento (Ex: Indústria, Varejo, Viação)"
                      value={newSegmentoNome}
                      onChange={e => setNewSegmentoNome(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddSegmento()}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded text-sm outline-none focus:border-[#1B4D3E] font-bold uppercase"
                    />
                    <button 
                      onClick={handleAddSegmento}
                      className="bg-[#1B4D3E] hover:bg-emerald-900 text-white px-6 py-2 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-all"
                    >
                      <Plus size={16} /> Adicionar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {segmentos.map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded hover:bg-white hover:shadow-sm transition-all group">
                        <span className="text-xs font-bold text-slate-700 uppercase">{s.nome}</span>
                        <button 
                          onClick={() => handleDeleteSegmento(s.id)}
                          className="text-slate-400 hover:text-red-600 transition-colors"
                          title="Remover"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            
            {/* ABA EMPRESAS EMISSORAS */}
            {activeTab === 'empresas' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Briefcase size={14} /> Empresas Emissoras (Propostas)
                  </h2>
                  <button 
                    onClick={() => openEmpresaModal()}
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
                            <div className="flex justify-end gap-2">
                              <button onClick={() => openEmpresaModal(e)} className="text-amber-500 hover:text-amber-600"><Edit2 size={14} /></button>
                              <button onClick={() => handleDeleteEmpresa(e.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14} /></button>
                            </div>
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


            {/* 6. ABA METAS DOS VENDEDORES — somente ADMIN e MANAGER */}
            {activeTab === 'metas' && userRole !== 'USER' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex flex-col md:flex-row justify-between items-center gap-4">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Target size={14} /> Metas Mensais por Vendedor
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-200 font-bold uppercase">Mês de Referência:</span>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={e => setSelectedMonth(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] cursor-pointer"
                    />
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-slate-700 uppercase">Como funciona?</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Selecione o mês de referência e insira as metas individuais dos vendedores nos campos abaixo. 
                        As metas são salvas automaticamente após a alteração dos valores e serão exibidas na aba de <strong>Controladoria</strong> para monitorar o atingimento.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 max-w-2xl">
                    {sellers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">Nenhum vendedor cadastrado no sistema.</p>
                    ) : (
                      sellers.map((nome) => {
                        const goalKey = `${nome}_${selectedMonth}`;
                        const goalVal = metas[goalKey] !== undefined ? metas[goalKey] : 100000;

                        return (
                          <div key={nome} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-white hover:shadow-xs transition-all group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-[#1B4D3E]/10 text-[#1B4D3E] font-black rounded-xl flex items-center justify-center text-xs">
                                {nome.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-xs font-bold text-slate-700">{nome}</span>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Meta: R$</span>
                              <input
                                type="number"
                                value={goalVal}
                                onChange={(e) => {
                                  const newVal = Number(e.target.value);
                                  handleSaveMeta(nome, newVal);
                                }}
                                className="w-36 px-3 py-2 border border-slate-300 rounded text-xs font-extrabold text-slate-800 text-right outline-none focus:border-[#1B4D3E]"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 7. ABA WHATSAPP INTEGRATION */}
            {activeTab === 'whatsapp' && (
              <div>
                <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex justify-between items-center">
                  <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare size={14} className="text-emerald-400" /> Integração de WhatsApp do CRM
                  </h2>
                  <button 
                    onClick={checkWhatsAppStatus}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                    disabled={waLoading}
                  >
                    🔄 Atualizar Status
                  </button>
                </div>

                <div className="p-8 max-w-3xl mx-auto">
                  {waConnected ? (
                    /* ESTADO: CONECTADO (PREMIUM CARD) */
                    <div className="bg-gradient-to-br from-emerald-50/40 to-teal-50/20 border border-emerald-200 rounded-3xl p-8 space-y-6 text-center flex flex-col items-center shadow-xs animate-in zoom-in-95 duration-300 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                      
                      {/* Premium Success Circle with floating waves */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-emerald-500/10 rounded-full blur-xl animate-pulse"></div>
                        <div className="relative w-20 h-20 bg-emerald-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200">
                          <MessageSquare size={36} className="stroke-[2] animate-bounce" style={{ animationDuration: '3s' }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[10px] font-black tracking-widest text-emerald-600 bg-emerald-100/60 px-4 py-1.5 rounded-full uppercase">Conexão Ativa</span>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">WhatsApp Vinculado com Sucesso</h3>
                        <p className="text-xs text-slate-500 max-w-md leading-relaxed">
                          O número da sua empresa está totalmente integrado ao SmartBidHub CRM. Você já pode enviar e receber mensagens diretamente da tela de leads.
                        </p>
                      </div>

                      {/* Device Metadata Box */}
                      <div className="w-full max-w-sm bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs divide-y divide-slate-100 space-y-3">
                        <div className="flex justify-between items-center text-xs pb-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider">Número Vinculado</span>
                          <span className="font-extrabold text-slate-800 tracking-tight text-sm">{waPhone ? `+${waPhone}` : 'Telefone Identificado'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs pt-3">
                          <span className="font-bold text-slate-400 uppercase tracking-wider">Serviço de Envio</span>
                          <span className="font-extrabold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-md text-[10px]">Z-API Ativo</span>
                        </div>
                      </div>

                      <div className="w-full max-w-sm pt-4">
                        <button
                          onClick={handleDisconnectWhatsApp}
                          className="w-full py-4 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 hover:border-rose-200 text-xs font-black uppercase tracking-widest rounded-2xl transition-all hover:shadow-xs active:scale-[0.98] cursor-pointer"
                        >
                          🔴 Desconectar WhatsApp
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* ESTADO: DESCONECTADO (CONNECTION PANEL) */
                    <div className="space-y-8 animate-in fade-in duration-300">
                      
                      {/* Intro Banner */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 flex flex-col md:flex-row items-center gap-6">
                        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center shrink-0">
                          <MessageSquare size={28} className="stroke-[2]" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Integre o WhatsApp da sua Empresa</h4>
                          <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                            Conecte o seu número corporativo em segundos. O processo gera um QR Code exclusivo diretamente no nosso painel. Basta escanear como se estivesse abrindo o WhatsApp Web.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-center justify-center space-y-6">
                        
                        {waQrCode ? (
                          /* SE QR CODE ESTIVER DISPONÍVEL */
                          <div className="flex flex-col items-center space-y-6 p-8 bg-white border border-slate-200 rounded-3xl shadow-sm w-full max-w-md animate-in zoom-in-95 duration-200">
                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200/50 px-3.5 py-1.5 rounded-full animate-pulse">
                              Aguardando Leitura
                            </span>
                            
                            {/* QR Code Container with nice visual borders */}
                            <div className="w-56 h-56 bg-slate-50 border-4 border-slate-100 rounded-2xl flex items-center justify-center p-4 shadow-2xs relative overflow-hidden group">
                              <img src={waQrCode} alt="WhatsApp QR Code" className="w-full h-full object-contain select-none" />
                              <div className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"></div>
                            </div>

                            <div className="text-center space-y-2 max-w-xs">
                              <p className="text-xs font-bold text-slate-700 leading-normal">
                                Abra o WhatsApp no seu celular, vá em <strong className="text-slate-900">Aparelhos Conectados</strong> e selecione <strong className="text-slate-900">Conectar Aparelho</strong>.
                              </p>
                              <p className="text-[10px] text-slate-400 leading-relaxed italic">
                                O QR Code expira a cada 30 segundos. Ele se atualizará automaticamente na tela.
                              </p>
                            </div>

                            {/* Actions inside QR mode */}
                            <div className="w-full pt-4 flex gap-3">
                              <button
                                onClick={checkWhatsAppStatus}
                                className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                              >
                                Verifiquei Conexão
                              </button>
                              <button
                                onClick={handleDisconnectWhatsApp}
                                className="flex-1 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* SE AINDA NÃO GEROU O QR CODE */
                          <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-8 text-center flex flex-col items-center space-y-6 shadow-2xs">
                            <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400">
                              <MessageSquare size={24} />
                            </div>
                            
                            <div className="space-y-2 max-w-xs">
                              <h4 className="text-base font-black text-slate-800 tracking-tight">Sem Instância Inicializada</h4>
                              <p className="text-xs text-slate-400 leading-relaxed">
                                Você precisa inicializar as credenciais de envio e receber as informações do canal antes de gerar o QR Code de autenticação.
                              </p>
                            </div>

                            <button
                              onClick={handleConnectWhatsApp}
                              className="w-full py-4.5 bg-gradient-to-r from-[#1B4D3E] to-emerald-800 hover:from-emerald-800 hover:to-emerald-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-md shadow-emerald-100 hover:shadow-lg hover:shadow-emerald-200 active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                              disabled={waLoading}
                            >
                              🚀 Inicializar e Gerar QR Code
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                   <div className="w-8 h-8 border-4 border-[#1B4D3E] border-t-transparent rounded-full animate-spin"></div>
                   <span className="text-xs font-bold text-[#1B4D3E] uppercase tracking-widest">Sincronizando...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MODAL ESCALA */}
        {showEscalaModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-md overflow-hidden">
              <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <CalendarDays size={14} /> {escalaForm.id ? 'Editar' : 'Nova'} Escala de Trabalho
                </h2>
                <button onClick={() => setShowEscalaModal(false)} className="text-white/60 hover:text-white transition-colors"><X size={18} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nome da Escala</label>
                  <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E] transition-all" value={escalaForm.nome} onChange={e => setEscalaForm({...escalaForm, nome: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dias Trab. / Mês</label>
                    <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={escalaForm.diasTrabalhadosMes} onChange={e => setEscalaForm({...escalaForm, diasTrabalhadosMes: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Horas Mensais</label>
                    <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm font-bold text-slate-800 outline-none focus:border-[#1B4D3E]" value={escalaForm.horasMensais} onChange={e => setEscalaForm({...escalaForm, horasMensais: Number(e.target.value)})} />
                  </div>
                </div>
                <button onClick={handleSaveEscala} className="w-full bg-[#1B4D3E] hover:bg-emerald-900 text-white py-3 rounded text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] mt-4">
                  <Save size={18} /> Salvar Escala
                </button>
              </div>
            </div>
          </div>
        )}
      
        {/* MODAL EMPRESA */}
        {showEmpresaModal && (
          <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="bg-[#1B4D3E] px-6 py-3 border-b border-[#13382D] flex justify-between items-center">
                <h2 className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                  <Briefcase size={14} /> {empresaForm.id ? 'Editar' : 'Nova'} Empresa Emissora
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

      </main>
    </div>
  );
}
