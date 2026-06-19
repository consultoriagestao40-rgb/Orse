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
  Briefcase 
} from 'lucide-react';
import { getUsuarios, createUsuario, deleteUsuario, updateUsuario, getTenantLimit } from './actions';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tenantLimit, setTenantLimit] = useState<number | null>(null);
  const [plano, setPlano] = useState<string>('STARTER');

  // Estados e helpers para Alertas e Confirmações Premium
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
    meta: ''
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
    setFormData({
      nome: '',
      email: '',
      password: '',
      role: 'USER',
      cargo: '',
      celular: '',
      managerId: '',
      avatarUrl: '',
      meta: ''
    });
    setShowModal(true);
  }

  function handleEditClick(user: any) {
    setEditingUserId(user.id);
    setFormData({
      nome: user.nome || '',
      email: user.email || '',
      password: '', // Blank by default, only updated if filled
      role: user.role || 'USER',
      cargo: user.cargo || '',
      celular: user.celular || '',
      managerId: user.managerId || '',
      avatarUrl: user.avatarUrl || '',
      meta: user.meta !== undefined && user.meta !== null ? String(user.meta) : ''
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    let res;
    if (editingUserId) {
      // In edit mode, if password is empty, omit it so it won't be updated
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
      setFormData({ 
        nome: '', 
        email: '', 
        password: '', 
        role: 'USER', 
        cargo: '', 
        celular: '', 
        managerId: '',
        avatarUrl: '',
        meta: ''
      });
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
      
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <div className="flex items-center gap-2 text-[#1B4D3E] font-black uppercase tracking-widest text-[10px] mb-2">
              <Shield size={12} />
              Administração de Sistema
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Usuários e <span className="text-[#10B981]">Permissões</span>
            </h1>
            <p className="text-slate-500 mt-2 font-medium">
              Gerencie o acesso, cargo e contato da sua equipe comercial e administrativa.
            </p>
          </div>

          <button 
            onClick={handleAddNewClick}
            className="bg-[#1B4D3E] hover:bg-[#13382D] text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1B4D3E]/10 transition-all active:scale-[0.98] flex items-center gap-2 bell-header-spacing"
          >
            <UserPlus size={16} />
            Novo Usuário
          </button>
        </header>

        {/* Busca e Filtros */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, e-mail ou cargo..."
              className="w-full bg-slate-50 border-none rounded-xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#1B4D3E]/5 font-medium text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="bg-slate-50 px-6 py-4 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
              Total: {usuarios.length}
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo e Contato</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil / Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestor Direto</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      {u.avatarUrl ? (
                        <img 
                          src={u.avatarUrl} 
                          alt={u.nome} 
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-100 shadow-sm shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B4D3E] font-black text-sm group-hover:bg-[#1B4D3E] group-hover:text-white transition-all shrink-0">
                          {u.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{u.nome}</p>
                        <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="space-y-1">
                      {u.cargo ? (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                          <Briefcase size={12} className="text-[#10B981]" />
                          <span>{u.cargo}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Cargo não informado</span>
                      )}
                      
                      {u.celular ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Phone size={12} className="text-slate-400" />
                          <span>{u.celular}</span>
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                      u.role === 'MANAGER' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                      u.role === 'LOGISTICA' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-600">
                      {u.manager?.nome || '--'}
                    </p>
                    {u.meta > 0 && (
                      <p className="text-[10px] font-black text-emerald-700 mt-1 uppercase">
                        Meta: {u.meta.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => handleEditClick(u)}
                        className="p-3 text-amber-500 hover:text-amber-600 hover:bg-[#1B4D3E]/5 rounded-xl transition-all"
                        title="Editar Usuário"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Excluir Usuário"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal de Criação / Edição */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
            <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
              <div className="bg-[#1B4D3E] p-8 text-white relative shrink-0">
                <h3 className="text-2xl font-black tracking-tighter uppercase">
                  {editingUserId ? 'Editar' : 'Novo'} <span className="text-[#10B981]">Colaborador</span>
                </h3>
                <p className="text-emerald-100/60 text-sm mt-1">
                  {editingUserId ? 'Atualize as informações, cargo e permissões.' : 'Configure o perfil e acesso do novo usuário.'}
                </p>
                <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-white/50 hover:text-white">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto flex-1">
                {/* Upload de Avatar Premium */}
                <div className="flex flex-col items-center justify-center pb-4">
                  <div className="relative group cursor-pointer">
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
                          className="w-24 h-24 rounded-full object-cover border-2 border-[#1B4D3E] shadow-lg group-hover:opacity-85 transition-all"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-all">
                          <Plus size={20} />
                          <span className="text-[9px] font-black uppercase tracking-wider mt-1">Foto</span>
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-[#1B4D3E]/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={16} />
                      </div>
                    </label>
                  </div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">Clique para alterar a foto</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-medium text-slate-700"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                    <input 
                      type="email" 
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-medium text-slate-700"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Consultor Sênior"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-medium text-slate-700"
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Celular / WhatsApp</label>
                    <input 
                      type="text" 
                      placeholder="Ex: (11) 99999-9999"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-medium text-slate-700"
                      value={formData.celular}
                      onChange={(e) => setFormData({...formData, celular: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Senha de Acesso
                      </label>
                      {editingUserId && (
                        <span className="text-[9px] text-[#10B981] font-bold uppercase tracking-wider">
                          Opcional na edição
                        </span>
                      )}
                    </div>
                    <input 
                      type="password" 
                      required={!editingUserId}
                      placeholder={editingUserId ? "Deixe em branco para manter" : "Senha provisória"}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-medium text-slate-700"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-bold text-slate-700 appearance-none"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="USER">Vendedor (Dados próprios)</option>
                      <option value="MANAGER">Gestor (Dados de equipe)</option>
                      <option value="ADMIN">Administrador (Tudo)</option>
                      <option value="LOGISTICA">Logística (Apenas Entrega e Técnico)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gestor Direto (Opcional)</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-bold text-slate-700 appearance-none"
                      value={formData.managerId}
                      onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                    >
                      <option value="">Sem gestor direto</option>
                      {usuarios
                        .filter(u => (u.role === 'MANAGER' || u.role === 'ADMIN') && u.id !== editingUserId)
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.nome} ({u.role})</option>
                        ))
                      }
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta de Vendas Mensal (R$)</label>
                    <input 
                      type="number"
                      step="any"
                      placeholder="Ex: 50000"
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-medium text-slate-700"
                      value={formData.meta}
                      onChange={(e) => setFormData({...formData, meta: e.target.value})}
                    />
                  </div>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382D] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1B4D3E]/20 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    ) : (
                      editingUserId ? 'Salvar Alterações' : 'Cadastrar Usuário'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* MODAL DE ALERTA PREMIUM */}
      {customAlert.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center border shadow-lg shadow-slate-100 animate-bounce">
                {customAlert.type === 'error' && <Shield className="text-red-500" size={32} />}
                {customAlert.type === 'warning' && <Shield className="text-amber-500" size={32} />}
                {customAlert.type === 'success' && <UserCheck className="text-emerald-500" size={32} />}
                {customAlert.type === 'info' && <Users className="text-blue-500" size={32} />}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{customAlert.title}</h3>
                <p className="text-sm text-slate-500 font-bold leading-relaxed whitespace-pre-line">{customAlert.message}</p>
              </div>
              <button 
                onClick={() => setCustomAlert(prev => ({ ...prev, open: false }))}
                className="w-full py-4 bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#1B4D3E]/10"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO PREMIUM */}
      {customConfirm.open && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-16 h-16 rounded-xl flex items-center justify-center border border-amber-100 bg-amber-50/50 text-amber-600 shadow-lg shadow-amber-50 animate-pulse">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{customConfirm.title}</h3>
                <p className="text-sm text-slate-500 font-bold leading-relaxed">{customConfirm.message}</p>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={() => setCustomConfirm(prev => ({ ...prev, open: false }))}
                  className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => {
                    customConfirm.onConfirm();
                    setCustomConfirm(prev => ({ ...prev, open: false }));
                  }}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-red-600/10"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
