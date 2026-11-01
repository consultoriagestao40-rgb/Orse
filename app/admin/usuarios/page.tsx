'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { 
  Users, 
  Plus, 
  Trash2, 
  Shield, 
  UserCheck, 
  Mail, 
  Lock, 
  ChevronRight, 
  UserPlus, 
  Search, 
  Pencil, 
  Phone, 
  Briefcase,
  MessageSquare,
  Target,
  CheckSquare,
  FileText,
  Sparkles,
  GitBranch,
  Layers,
  Check,
  Eye,
  AlertCircle
} from 'lucide-react';
import { getUsuarios, createUsuario, deleteUsuario, updateUsuario, getTenantLimit } from './actions';
import { PERFIS_PRESETS } from './permissoesConstants';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'hierarquia' | 'permissoes'>('hierarquia');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tenantLimit, setTenantLimit] = useState<number | null>(null);
  const [plano, setPlano] = useState<string>('STARTER');

  // Estados e helpers para Alertas e Confirmações
  const [customAlert, setCustomAlert] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    title: '',
    message: '',
    type: 'info'
  });

  const [customConfirm, setCustomConfirm] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    setCustomAlert({ open: true, title, message, type });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setCustomConfirm({ open: true, title, message, onConfirm });
  };
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'USER',
    cargo: '',
    celular: '',
    managerId: '',
    avatarUrl: '',
    meta: '',
    perfilAcessoNome: 'Vendedor / Closer',
    acessoWhatsTipo: 'PROPRIOS' as 'TODOS' | 'PROPRIOS' | 'NENHUM',
    acessoLeadsTipo: 'ATRIBUIDOS' as 'TODOS' | 'ATRIBUIDOS',
    acessoContratos: false,
    acessoPic: false,
    acessoTarefasTipo: 'ENVOLVIDO' as 'TODAS' | 'ENVOLVIDO',
    acessoCrm: true,
    acessoProspeccao: true,
    acessoCct: true,
    acessoPropostas: true,
    twoFactorEnabled: false,
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showAlert('Arquivo Muito Grande', 'Por favor, selecione uma imagem de até 5MB.', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setFormData(prev => ({ ...prev, avatarUrl: dataUrl }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    setLoading(true);
    const data = await getUsuarios();
    setUsuarios(data);
    
    try {
      const limitData = await getTenantLimit();
      if (limitData) {
        setTenantLimit(limitData.limiteUsuarios);
        setPlano(limitData.plano);
      }
    } catch (err) {
      console.error('Erro ao obter limite de tenant:', err);
    }
    
    setLoading(false);
  }

  function handleAddNewClick() {
    if (tenantLimit !== null && usuarios.length >= tenantLimit) {
      const planoNome = plano.charAt(0).toUpperCase() + plano.slice(1).toLowerCase();
      showAlert(
        'Limite de Usuários Atingido',
        `Seu plano atual (${planoNome}) permite no máximo ${tenantLimit} usuários ativos.\n\nPor favor, solicite um upgrade de plano com o administrador do sistema para cadastrar mais colaboradores.`,
        'warning'
      );
      return;
    }
    setEditingUserId(null);
    setModalTab('hierarquia');
    // Aplica o preset padrão de Vendedor
    const defaultPreset = PERFIS_PRESETS[0];
    setFormData({
      nome: '',
      email: '',
      password: '',
      role: defaultPreset.role,
      cargo: '',
      celular: '',
      managerId: '',
      avatarUrl: '',
      meta: '',
      perfilAcessoNome: defaultPreset.nome,
      acessoWhatsTipo: defaultPreset.acessoWhatsTipo,
      acessoLeadsTipo: defaultPreset.acessoLeadsTipo,
      acessoContratos: defaultPreset.acessoContratos,
      acessoPic: defaultPreset.acessoPic,
      acessoTarefasTipo: defaultPreset.acessoTarefasTipo,
      acessoCrm: defaultPreset.acessoCrm,
      acessoProspeccao: defaultPreset.acessoProspeccao,
      acessoCct: defaultPreset.acessoCct,
      acessoPropostas: defaultPreset.acessoPropostas,
      twoFactorEnabled: false,
    });
    setShowModal(true);
  }

  function handleEditClick(user: any) {
    setEditingUserId(user.id);
    setModalTab('hierarquia');
    setFormData({
      nome: user.nome || '',
      email: user.email || '',
      password: '',
      role: user.role || 'USER',
      cargo: user.cargo || '',
      celular: user.celular || '',
      managerId: user.managerId || '',
      avatarUrl: user.avatarUrl || '',
      meta: user.meta !== undefined && user.meta !== null ? String(user.meta) : '',
      perfilAcessoNome: user.perfilAcessoNome || (user.role === 'ADMIN' ? 'Administrador Total' : user.role === 'MANAGER' ? 'Gestor Comercial' : 'Vendedor / Closer'),
      acessoWhatsTipo: user.acessoWhatsTipo || (user.role === 'ADMIN' ? 'TODOS' : 'PROPRIOS'),
      acessoLeadsTipo: user.acessoLeadsTipo || (user.role === 'ADMIN' ? 'TODOS' : 'ATRIBUIDOS'),
      acessoContratos: user.acessoContratos !== undefined ? Boolean(user.acessoContratos) : user.role === 'ADMIN' || user.role === 'MANAGER',
      acessoPic: user.acessoPic !== undefined ? Boolean(user.acessoPic) : user.role === 'ADMIN' || user.role === 'MANAGER',
      acessoTarefasTipo: user.acessoTarefasTipo || (user.role === 'ADMIN' ? 'TODAS' : 'ENVOLVIDO'),
      acessoCrm: user.acessoCrm !== undefined ? Boolean(user.acessoCrm) : true,
      acessoProspeccao: user.acessoProspeccao !== undefined ? Boolean(user.acessoProspeccao) : true,
      acessoCct: user.acessoCct !== undefined ? Boolean(user.acessoCct) : true,
      acessoPropostas: user.acessoPropostas !== undefined ? Boolean(user.acessoPropostas) : true,
      twoFactorEnabled: Boolean(user.twoFactorEnabled),
    });
    setShowModal(true);
  }

  // Aplica um perfil modelo pré-configurado
  function applyPreset(preset: typeof PERFIS_PRESETS[0]) {
    setFormData(prev => ({
      ...prev,
      role: preset.role,
      perfilAcessoNome: preset.nome,
      acessoWhatsTipo: preset.acessoWhatsTipo,
      acessoLeadsTipo: preset.acessoLeadsTipo,
      acessoContratos: preset.acessoContratos,
      acessoPic: preset.acessoPic,
      acessoTarefasTipo: preset.acessoTarefasTipo,
      acessoCrm: preset.acessoCrm,
      acessoProspeccao: preset.acessoProspeccao,
      acessoCct: preset.acessoCct,
      acessoPropostas: preset.acessoPropostas,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    let res;
    if (editingUserId) {
      const { password, ...submitData } = formData;
      const dataToSubmit = formData.password ? formData : submitData;
      res = await updateUsuario(editingUserId, dataToSubmit);
    } else {
      res = await createUsuario(formData);
    }

    setLoading(false);
    
    if (res.success) {
      setShowModal(false);
      setEditingUserId(null);
      loadUsuarios();
    } else {
      showAlert('Erro de Cadastro', res.error, 'error');
    }
  }

  async function handleDelete(id: string) {
    showConfirm(
      'Excluir Colaborador',
      'Deseja realmente remover permanentemente este colaborador do sistema? Esta ação é irreversível.',
      async () => {
        setLoading(true);
        const res = await deleteUsuario(id);
        if (res.success) {
          loadUsuarios();
        } else {
          setLoading(false);
          showAlert('Erro ao Excluir', res.error, 'error');
        }
      }
    );
  }

  const filteredUsers = usuarios.filter(u => 
    u.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.cargo && u.cargo.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-[#1B4D3E] font-black uppercase tracking-widest text-[10px] mb-2">
              <Shield size={13} />
              Gestão de Acessos & Hierarquia
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight uppercase">
              Colaboradores & <span className="text-[#10B981]">Permissões</span>
            </h1>
            <p className="text-slate-500 mt-1.5 font-medium text-sm">
              Defina a hierarquia de liderança e o nível granular de acesso de cada membro (WhatsApp, Leads atribuídos, Contratos, PIC e Tarefas).
            </p>
          </div>

          <button 
            onClick={handleAddNewClick}
            className="bg-gradient-to-r from-[#1B4D3E] to-[#12352B] hover:brightness-110 text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-950/10 transition-all active:scale-95 flex items-center gap-2"
          >
            <UserPlus size={16} />
            Novo Colaborador
          </button>
        </header>

        {/* Busca e Resumo */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Buscar por colaborador, e-mail ou cargo..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 outline-none focus:ring-2 focus:ring-[#1B4D3E]/10 focus:border-[#1B4D3E] text-xs font-medium text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-200">
              Colaboradores: {usuarios.length}
            </div>
            {tenantLimit !== null && (
              <div className="bg-emerald-50 text-emerald-800 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-emerald-200">
                Plano: {plano} (Máx: {tenantLimit})
              </div>
            )}
          </div>
        </div>

        {/* Lista de Usuários com Níveis de Acesso */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1B4D3E] text-white uppercase text-[10px] font-black tracking-widest">
                <th className="px-6 py-4">Colaborador</th>
                <th className="px-6 py-4">Cargo & Hierarquia</th>
                <th className="px-6 py-4 text-center">Perfil de Acesso</th>
                <th className="px-6 py-4">Níveis de Visibilidade & Módulos</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-[#1B4D3E] rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-400 font-medium italic text-xs">
                    Nenhum colaborador encontrado.
                  </td>
                </tr>
              ) : filteredUsers.map((u) => {
                const whatsTipo = u.acessoWhatsTipo || (u.role === 'ADMIN' ? 'TODOS' : 'PROPRIOS');
                const leadsTipo = u.acessoLeadsTipo || (u.role === 'ADMIN' ? 'TODOS' : 'ATRIBUIDOS');
                const tarefasTipo = u.acessoTarefasTipo || (u.role === 'ADMIN' ? 'TODAS' : 'ENVOLVIDO');

                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Colaborador */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        {u.avatarUrl ? (
                          <img 
                            src={u.avatarUrl} 
                            alt={u.nome} 
                            className="w-11 h-11 rounded-xl object-cover border border-slate-200 shadow-sm shrink-0"
                          />
                        ) : (
                          <div className="w-11 h-11 bg-slate-100 rounded-xl flex items-center justify-center text-[#1B4D3E] font-black text-xs shrink-0 border border-slate-200">
                            {u.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-slate-900 text-sm uppercase tracking-tight">{u.nome}</p>
                          <p className="text-xs text-slate-400 font-medium">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Cargo & Hierarquia */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                          <Briefcase size={12} className="text-[#10B981]" />
                          <span>{u.cargo || 'Cargo não definido'}</span>
                        </div>
                        
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <GitBranch size={11} className="text-slate-400" />
                          <span>
                            {u.manager ? `Reporta a: ${u.manager.nome}` : 'Líder / Direto'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Perfil de Acesso */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        u.role === 'MANAGER' ? 'bg-sky-50 text-sky-700 border border-sky-200' :
                        'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        <Shield size={10} />
                        {u.perfilAcessoNome || (u.role === 'ADMIN' ? 'Admin' : u.role === 'MANAGER' ? 'Gestor' : 'Vendedor')}
                      </span>
                      <div className="mt-1 flex items-center justify-center">
                        {u.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full" title="Autenticação em Dois Fatores Ativada">
                            <Lock size={9} /> 2FA Ativo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full" title="2FA Inativo para este usuário">
                            2FA Inativo
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Níveis de Visibilidade e Módulos */}
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        {/* Linha de Visibilidade Granular */}
                        <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                          <span className={`px-2 py-0.5 rounded font-bold border ${
                            whatsTipo === 'TODOS' 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                              : whatsTipo === 'PROPRIOS'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            💬 Whats: {whatsTipo === 'TODOS' ? 'Todas' : whatsTipo === 'PROPRIOS' ? 'Próprias' : 'Bloqueado'}
                          </span>

                          <span className={`px-2 py-0.5 rounded font-bold border ${
                            leadsTipo === 'TODOS'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            🎯 Leads: {leadsTipo === 'TODOS' ? 'Todos' : 'Atribuídos'}
                          </span>

                          <span className={`px-2 py-0.5 rounded font-bold border ${
                            tarefasTipo === 'TODAS'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            ✓ Tarefas: {tarefasTipo === 'TODAS' ? 'Todas' : 'Onde Envolvido'}
                          </span>
                        </div>

                        {/* Módulos com Acesso */}
                        <div className="flex flex-wrap items-center gap-1 text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                          <span className="text-slate-400">Módulos:</span>
                          {u.acessoCrm !== false && <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">CRM</span>}
                          {u.acessoProspeccao !== false && <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">Prosp</span>}
                          {u.acessoContratos ? (
                            <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Contratos</span>
                          ) : (
                            <span className="text-slate-300 line-through">Contratos</span>
                          )}
                          {u.acessoPic ? (
                            <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">PIC</span>
                          ) : (
                            <span className="text-slate-300 line-through">PIC</span>
                          )}
                          {u.acessoCct !== false && <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">CCT</span>}
                        </div>
                      </div>
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="p-2 text-slate-500 hover:text-[#1B4D3E] hover:bg-emerald-50 rounded-lg transition-all"
                          title="Editar Perfil e Permissões"
                        >
                          <Pencil size={15} />
                        </button>
                        <button 
                          onClick={() => handleDelete(u.id)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Excluir Colaborador"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Modal de Criação / Edição com Abas e Controle Fino */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-200">
              
              {/* Header do Modal */}
              <div className="bg-[#1B4D3E] p-6 text-white relative shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 mb-2">
                      <Shield size={11} /> Controle de Acessos & Hierarquia
                    </span>
                    <h3 className="text-xl font-black tracking-tight uppercase">
                      {editingUserId ? 'Editar' : 'Novo'} Colaborador
                    </h3>
                    <p className="text-emerald-100/70 text-xs mt-0.5">
                      Configure dados pessoais, subordinação hierárquica e permissões granulares por recurso.
                    </p>
                  </div>
                  <button 
                    onClick={() => setShowModal(false)} 
                    className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Plus size={20} className="rotate-45" />
                  </button>
                </div>

                {/* Abas do Modal */}
                <div className="flex gap-2 mt-5 border-b border-emerald-700/50 -mb-6 pb-2">
                  <button
                    type="button"
                    onClick={() => setModalTab('hierarquia')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      modalTab === 'hierarquia'
                        ? 'bg-white text-[#1B4D3E] shadow-sm'
                        : 'text-emerald-200 hover:text-white hover:bg-emerald-800/40'
                    }`}
                  >
                    <Users size={14} /> 1. Dados & Hierarquia
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalTab('permissoes')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                      modalTab === 'permissoes'
                        ? 'bg-white text-[#1B4D3E] shadow-sm'
                        : 'text-emerald-200 hover:text-white hover:bg-emerald-800/40'
                    }`}
                  >
                    <Lock size={14} /> 2. Níveis de Acesso & Módulos
                  </button>
                </div>
              </div>

              {/* Formulário com Abas */}
              <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1">
                
                {modalTab === 'hierarquia' ? (
                  <div className="space-y-6">
                    {/* Foto / Avatar */}
                    <div className="flex items-center gap-5 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="relative group shrink-0">
                        <input 
                          type="file" 
                          id="avatar-upload" 
                          accept="image/png, image/jpeg" 
                          className="hidden" 
                          onChange={handleAvatarChange}
                        />
                        <label htmlFor="avatar-upload" className="cursor-pointer block relative">
                          {formData.avatarUrl ? (
                            <img 
                              src={formData.avatarUrl} 
                              alt="Preview Avatar" 
                              className="w-16 h-16 rounded-xl object-cover border-2 border-[#1B4D3E] shadow-sm"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-slate-200 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-300 transition-colors">
                              <Plus size={18} />
                              <span className="text-[8px] font-black uppercase mt-0.5">Foto</span>
                            </div>
                          )}
                        </label>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">Foto do Colaborador</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Formatos JPG ou PNG até 5MB. Aparecerá no chat e em tarefas.</p>
                      </div>
                    </div>

                    {/* Nome e E-mail */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Nome Completo *</label>
                        <input 
                          type="text" 
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] focus:bg-white text-xs font-medium text-slate-800"
                          value={formData.nome}
                          onChange={(e) => setFormData({...formData, nome: e.target.value})}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">E-mail de Acesso *</label>
                        <input 
                          type="email" 
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] focus:bg-white text-xs font-medium text-slate-800"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                      </div>
                    </div>

                    {/* Cargo e Gestor Direto (Hierarquia) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                          Cargo / Função *
                        </label>
                        <input 
                          type="text" 
                          placeholder="Ex: Executivo de Contas, SDR, Supervisor"
                          required
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] focus:bg-white text-xs font-medium text-slate-800"
                          value={formData.cargo}
                          onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                          Gestor Direto (Posição na Hierarquia)
                        </label>
                        <select 
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] focus:bg-white text-xs font-bold text-slate-700"
                          value={formData.managerId}
                          onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                        >
                          <option value="">Nenhum (Liderança direta / Diretor)</option>
                          {usuarios
                            .filter(u => u.id !== editingUserId)
                            .map(u => (
                              <option key={u.id} value={u.id}>
                                {u.nome} ({u.cargo || u.role})
                              </option>
                            ))
                          }
                        </select>
                        <p className="text-[10px] text-slate-400">
                          Define a quem este colaborador se reporta e quem supervisiona seus leads e atividades.
                        </p>
                      </div>
                    </div>

                    {/* Celular, Senha e Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Celular / WhatsApp</label>
                        <input 
                          type="text" 
                          placeholder="(11) 99999-9999"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] focus:bg-white text-xs font-medium text-slate-800"
                          value={formData.celular}
                          onChange={(e) => setFormData({...formData, celular: e.target.value})}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                          {editingUserId ? 'Alterar Senha' : 'Senha Inicial *'}
                        </label>
                        <input 
                          type="password" 
                          required={!editingUserId}
                          placeholder={editingUserId ? "Deixe vazio para manter" : "Mínimo 6 dígitos"}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] focus:bg-white text-xs font-medium text-slate-800"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">Meta Mensal (R$)</label>
                        <input 
                          type="number"
                          step="any"
                          placeholder="50000"
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 outline-none focus:border-[#1B4D3E] focus:bg-white text-xs font-medium text-slate-800"
                          value={formData.meta}
                          onChange={(e) => setFormData({...formData, meta: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-black text-emerald-900 uppercase">Avançar para Permissões</p>
                        <p className="text-[11px] text-emerald-700">Configure agora o que este usuário pode visualizar e operar no sistema.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setModalTab('permissoes')}
                        className="bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors"
                      >
                        Configurar Acessos <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Presets de Perfis de Acesso */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles size={14} className="text-[#10B981]" /> Selecione um Perfil Modelo (Preset)
                        </label>
                        <span className="text-[11px] font-bold text-slate-400">
                          Perfil Atual: <strong className="text-[#1B4D3E]">{formData.perfilAcessoNome}</strong>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                        {PERFIS_PRESETS.map((preset) => {
                          const isSelected = formData.perfilAcessoNome === preset.nome;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => applyPreset(preset)}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                isSelected 
                                  ? 'border-[#1B4D3E] bg-emerald-50/60 shadow-sm ring-2 ring-[#1B4D3E]/20' 
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-xs text-slate-900">{preset.nome}</span>
                                {isSelected && <Check size={14} className="text-[#1B4D3E]" />}
                              </div>
                              <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                                {preset.descricao}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-5 space-y-5">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers size={14} className="text-[#1B4D3E]" /> Níveis Granulares de Visibilidade
                      </h4>

                      {/* 1. WhatsApp / Conversas */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <MessageSquare size={14} className="text-[#10B981]" /> Visibilidade de Conversas no WhatsApp
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <input 
                              type="radio" 
                              name="acessoWhatsTipo" 
                              value="PROPRIOS"
                              checked={formData.acessoWhatsTipo === 'PROPRIOS'}
                              onChange={() => setFormData({...formData, acessoWhatsTipo: 'PROPRIOS', perfilAcessoNome: 'Personalizado'})}
                              className="text-[#1B4D3E]"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">Somente Próprios</span>
                              <span className="text-[10px] text-slate-400">Leads atribuídos a ele</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <input 
                              type="radio" 
                              name="acessoWhatsTipo" 
                              value="TODOS"
                              checked={formData.acessoWhatsTipo === 'TODOS'}
                              onChange={() => setFormData({...formData, acessoWhatsTipo: 'TODOS', perfilAcessoNome: 'Personalizado'})}
                              className="text-[#1B4D3E]"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">Todas as Conversas</span>
                              <span className="text-[10px] text-slate-400">Visão global de chats</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <input 
                              type="radio" 
                              name="acessoWhatsTipo" 
                              value="NENHUM"
                              checked={formData.acessoWhatsTipo === 'NENHUM'}
                              onChange={() => setFormData({...formData, acessoWhatsTipo: 'NENHUM', perfilAcessoNome: 'Personalizado'})}
                              className="text-[#1B4D3E]"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">Sem Acesso</span>
                              <span className="text-[10px] text-slate-400">Não vê conversas</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* 2. Leads & CRM */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Target size={14} className="text-[#10B981]" /> Visibilidade de Oportunidades & Leads (CRM)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <input 
                              type="radio" 
                              name="acessoLeadsTipo" 
                              value="ATRIBUIDOS"
                              checked={formData.acessoLeadsTipo === 'ATRIBUIDOS'}
                              onChange={() => setFormData({...formData, acessoLeadsTipo: 'ATRIBUIDOS', perfilAcessoNome: 'Personalizado'})}
                              className="text-[#1B4D3E]"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">Somente Leads Atribuídos / Transferidos</span>
                              <span className="text-[10px] text-slate-400">Apenas leads passados pelo gestor ou criados por ele</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <input 
                              type="radio" 
                              name="acessoLeadsTipo" 
                              value="TODOS"
                              checked={formData.acessoLeadsTipo === 'TODOS'}
                              onChange={() => setFormData({...formData, acessoLeadsTipo: 'TODOS', perfilAcessoNome: 'Personalizado'})}
                              className="text-[#1B4D3E]"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">Todos os Leads da Empresa</span>
                              <span className="text-[10px] text-slate-400">Acesso amplo a todo o pipeline comercial</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* 3. Tarefas */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <CheckSquare size={14} className="text-[#10B981]" /> Visibilidade de Tarefas
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <input 
                              type="radio" 
                              name="acessoTarefasTipo" 
                              value="ENVOLVIDO"
                              checked={formData.acessoTarefasTipo === 'ENVOLVIDO'}
                              onChange={() => setFormData({...formData, acessoTarefasTipo: 'ENVOLVIDO', perfilAcessoNome: 'Personalizado'})}
                              className="text-[#1B4D3E]"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">Somente onde é Responsável, Participante ou Observador</span>
                              <span className="text-[10px] text-slate-400">Não vê tarefas privadas de outros setores</span>
                            </div>
                          </label>

                          <label className="flex items-center gap-2 p-2.5 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <input 
                              type="radio" 
                              name="acessoTarefasTipo" 
                              value="TODAS"
                              checked={formData.acessoTarefasTipo === 'TODAS'}
                              onChange={() => setFormData({...formData, acessoTarefasTipo: 'TODAS', perfilAcessoNome: 'Personalizado'})}
                              className="text-[#1B4D3E]"
                            />
                            <div>
                              <span className="font-bold text-slate-800 block">Todas as Tarefas da Empresa</span>
                              <span className="text-[10px] text-slate-400">Visão irrestrita do quadro e kanban de tarefas</span>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* 4. Permissões de Módulos (Contratos, PIC, CRM, Prospecção) */}
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Shield size={14} className="text-[#10B981]" /> Acesso aos Módulos Específicos
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                          {/* Contratos */}
                          <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <div>
                              <span className="font-bold text-slate-800 block">Módulo de Contratos</span>
                              <span className="text-[10px] text-slate-400">Contratos ativos, reajustes e minutas</span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={formData.acessoContratos}
                              onChange={(e) => setFormData({...formData, acessoContratos: e.target.checked, perfilAcessoNome: 'Personalizado'})}
                              className="w-4 h-4 rounded text-[#1B4D3E] focus:ring-[#1B4D3E]"
                            />
                          </label>

                          {/* PIC */}
                          <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <div>
                              <span className="font-bold text-slate-800 block">Módulo PIC (Implantação)</span>
                              <span className="text-[10px] text-slate-400">Planejamento e start de novos contratos</span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={formData.acessoPic}
                              onChange={(e) => setFormData({...formData, acessoPic: e.target.checked, perfilAcessoNome: 'Personalizado'})}
                              className="w-4 h-4 rounded text-[#1B4D3E] focus:ring-[#1B4D3E]"
                            />
                          </label>

                          {/* Prospecção */}
                          <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <div>
                              <span className="font-bold text-slate-800 block">Módulo de Prospecção</span>
                              <span className="text-[10px] text-slate-400">Busca em mapas, CNPJs e captura fria</span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={formData.acessoProspeccao}
                              onChange={(e) => setFormData({...formData, acessoProspeccao: e.target.checked, perfilAcessoNome: 'Personalizado'})}
                              className="w-4 h-4 rounded text-[#1B4D3E] focus:ring-[#1B4D3E]"
                            />
                          </label>

                          {/* CRM */}
                          <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <div>
                              <span className="font-bold text-slate-800 block">CRM & Pipeline</span>
                              <span className="text-[10px] text-slate-400">Etapas de negociação e funil</span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={formData.acessoCrm}
                              onChange={(e) => setFormData({...formData, acessoCrm: e.target.checked, perfilAcessoNome: 'Personalizado'})}
                              className="w-4 h-4 rounded text-[#1B4D3E] focus:ring-[#1B4D3E]"
                            />
                          </label>

                          {/* CCT */}
                          <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <div>
                              <span className="font-bold text-slate-800 block">Convenções Coletivas (CCT)</span>
                              <span className="text-[10px] text-slate-400">Pisos salariais e regras sindicais</span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={formData.acessoCct}
                              onChange={(e) => setFormData({...formData, acessoCct: e.target.checked, perfilAcessoNome: 'Personalizado'})}
                              className="w-4 h-4 rounded text-[#1B4D3E] focus:ring-[#1B4D3E]"
                            />
                          </label>

                          {/* Propostas */}
                          <label className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                            <div>
                              <span className="font-bold text-slate-800 block">Propostas Comerciais</span>
                              <span className="text-[10px] text-slate-400">Precificação FPV e emissão</span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={formData.acessoPropostas}
                              onChange={(e) => setFormData({...formData, acessoPropostas: e.target.checked, perfilAcessoNome: 'Personalizado'})}
                              className="w-4 h-4 rounded text-[#1B4D3E] focus:ring-[#1B4D3E]"
                            />
                          </label>
                        </div>

                        {/* Bloco de Segurança & 2FA */}
                        <div className="pt-4 border-t border-slate-200">
                          <label className="block text-[11px] font-black uppercase text-slate-600 mb-2 flex items-center gap-1.5">
                            <Lock size={13} className="text-[#10B981]" />
                            Segurança & Autenticação
                          </label>
                          <label className="flex items-center justify-between p-3.5 bg-emerald-50/50 border border-emerald-200/80 rounded-xl cursor-pointer hover:bg-emerald-50/90 transition-colors">
                            <div>
                              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                                <Shield size={13} className="text-emerald-700" />
                                Exigir Segundo Fator (2FA por E-mail)
                              </span>
                              <span className="text-[10px] text-slate-500 block mt-0.5">
                                Ao fazer login, um código de verificação numérico de 6 dígitos será enviado ao e-mail deste colaborador.
                              </span>
                            </div>
                            <input 
                              type="checkbox"
                              checked={formData.twoFactorEnabled}
                              onChange={(e) => setFormData({...formData, twoFactorEnabled: e.target.checked})}
                              className="w-4 h-4 rounded text-[#1B4D3E] focus:ring-[#1B4D3E] accent-[#1B4D3E]"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rodapé do Modal */}
                <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                  {modalTab === 'permissoes' ? (
                    <button 
                      type="button"
                      onClick={() => setModalTab('hierarquia')}
                      className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                    >
                      ← Voltar para Dados
                    </button>
                  ) : (
                    <div></div>
                  )}

                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 rounded-xl bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/10 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        editingUserId ? 'Salvar Alterações' : 'Cadastrar Colaborador'
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal de Alerta */}
        {customAlert.open && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#1B4D3E] flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">{customAlert.title}</h4>
                <p className="text-xs text-slate-500 mt-1 whitespace-pre-line">{customAlert.message}</p>
              </div>
              <button
                onClick={() => setCustomAlert({ ...customAlert, open: false })}
                className="w-full bg-[#1B4D3E] text-white py-2.5 rounded-xl text-xs font-bold"
              >
                Entendi
              </button>
            </div>
          </div>
        )}

        {/* Modal de Confirmação */}
        {customConfirm.open && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 size={24} />
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-base">{customConfirm.title}</h4>
                <p className="text-xs text-slate-500 mt-1">{customConfirm.message}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCustomConfirm({ ...customConfirm, open: false })}
                  className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    customConfirm.onConfirm();
                    setCustomConfirm({ ...customConfirm, open: false });
                  }}
                  className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-rose-700"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
