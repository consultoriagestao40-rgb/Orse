const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/admin/usuarios/page.tsx');

const newCode = `'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Users, Plus, Trash2, Shield, UserCheck, Mail, Lock, ChevronRight, UserPlus, Search, Edit2, Phone, Briefcase } from 'lucide-react';
import { getUsuarios, createUsuario, deleteUsuario, updateUsuario } from './actions';

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'USER',
    cargo: '',
    celular: '',
    managerId: ''
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    setLoading(true);
    const data = await getUsuarios();
    setUsuarios(data);
    setLoading(false);
  }

  const handleNewClick = () => {
    setFormData({
      nome: '',
      email: '',
      password: '',
      role: 'USER',
      cargo: '',
      celular: '',
      managerId: ''
    });
    setIsEditing(false);
    setEditingUserId(null);
    setShowModal(true);
  };

  const handleEditClick = (u: any) => {
    setFormData({
      nome: u.nome,
      email: u.email,
      password: '',
      role: u.role,
      cargo: u.cargo || '',
      celular: u.celular || '',
      managerId: u.managerId || ''
    });
    setEditingUserId(u.id);
    setIsEditing(true);
    setShowModal(true);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let res: any;
    if (isEditing && editingUserId) {
      res = await updateUsuario(editingUserId, formData);
    } else {
      res = await createUsuario(formData);
    }
    if (res.success) {
      setShowModal(false);
      setFormData({ nome: '', email: '', password: '', role: 'USER', cargo: '', celular: '', managerId: '' });
      setIsEditing(false);
      setEditingUserId(null);
      loadUsuarios();
    } else {
      alert('Erro: ' + res.error);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Deseja realmente excluir este usuário?')) {
      await deleteUsuario(id);
      loadUsuarios();
    }
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
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Usuários e <span className="text-[#10B981]">Permissões</span></h1>
            <p className="text-slate-500 mt-2 font-medium">Gerencie o acesso da sua equipe comercial e administrativa.</p>
          </div>

          <button 
            onClick={handleNewClick}
            className="bg-[#1B4D3E] hover:bg-[#13382D] text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1B4D3E]/10 transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <UserPlus size={16} />
            Novo Usuário
          </button>
        </header>

        {/* Busca e Filtros */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm mb-8 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nome, e-mail ou cargo..."
              className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-[#1B4D3E]/5 font-medium text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <div className="bg-slate-50 px-6 py-4 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest border border-slate-100">
              Total: {usuarios.length}
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Celular</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Perfil / Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestor Direto</th>
                <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="inline-block w-8 h-8 border-4 border-[#10B981]/20 border-t-[#10B981] rounded-full animate-spin"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 font-medium italic">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-[#1B4D3E] font-black text-sm group-hover:bg-[#1B4D3E] group-hover:text-white transition-all">
                        {u.nome.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{u.nome}</p>
                        <p className="text-xs text-slate-500 font-medium">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-tight">
                      {u.cargo || '--'}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-600">
                      {u.celular || '--'}
                    </p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                      u.role === 'ADMIN' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                      u.role === 'MANAGER' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                      'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <p className="text-xs font-bold text-slate-600">
                      {u.manager?.nome || '--'}
                    </p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleEditClick(u)}
                        className="p-3 text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                        title="Editar Usuário"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id)}
                        className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Deletar Usuário"
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
            <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl border border-white/20 overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-[#1B4D3E] p-8 text-white relative">
                <h3 className="text-2xl font-black tracking-tighter uppercase">
                  {isEditing ? 'Editar' : 'Novo'} <span className="text-[#10B981]">Colaborador</span>
                </h3>
                <p className="text-emerald-100/60 text-sm mt-1">Configure o perfil, cargo, celular e acesso do usuário.</p>
                <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-white/50 hover:text-white">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                    <input 
                      type="text" 
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-medium text-slate-700"
                      value={formData.nome}
                      onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                    <input 
                      type="email" 
                      required
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-medium text-slate-700"
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
                      placeholder="Ex: Consultor Comercial"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-medium text-slate-700"
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Celular / WhatsApp</label>
                    <input 
                      type="text" 
                      placeholder="Ex: (41) 99999-9999"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-medium text-slate-700"
                      value={formData.celular}
                      onChange={(e) => setFormData({...formData, celular: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Senha {isEditing && '(Opcional)'}
                    </label>
                    <input 
                      type="password" 
                      required={!isEditing}
                      placeholder={isEditing ? 'Deixe em branco para não alterar' : 'Senha provisória'}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-medium text-slate-700"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Perfil de Acesso</label>
                    <select 
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-bold text-slate-700 appearance-none"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="USER">Vendedor (Dados próprios)</option>
                      <option value="MANAGER">Gestor (Dados de equipe)</option>
                      <option value="ADMIN">Administrador (Tudo)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gestor Direto (Opcional)</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-5 outline-none focus:border-[#1B4D3E] font-bold text-slate-700 appearance-none"
                    value={formData.managerId}
                    onChange={(e) => setFormData({...formData, managerId: e.target.value})}
                  >
                    <option value="">Sem gestor direto</option>
                    {usuarios.filter(u => (u.role === 'MANAGER' || u.role === 'ADMIN') && u.id !== editingUserId).map(u => (
                      <option key={u.id} value={u.id}>{u.nome} ({u.role})</option>
                    ))}
                  </select>
                </div>

                <div className="pt-6 flex gap-4">
                  <button 
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] bg-[#1B4D3E] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1B4D3E]/20"
                  >
                    {isEditing ? 'Salvar Alterações' : 'Cadastrar Usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
`;

fs.writeFileSync(pagePath, newCode, 'utf8');
console.log('✔ app/admin/usuarios/page.tsx reescrito com sucesso na Parte 13!');
