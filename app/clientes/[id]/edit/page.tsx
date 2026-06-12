'use client';

import React, { useState, useEffect, use } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getClientes, createCliente, updateCliente } from '../../actions';

export default function ClienteEditPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const isNew = id === 'new';

  const [formData, setFormData] = useState<any>({
    nomeFantasia: '',
    razaoSocial: '',
    cnpj: '',
    email: '',
    whatsapp: '',
    endereco: '',
    contato: '',
    contatoCargo: '',
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isNew) {
      async function load() {
        const data = await getClientes();
        const item = data.find((c: any) => c.id === id);
        if (item) {
          setFormData(item);
        }
        setLoading(false);
      }
      load();
    }
  }, [id, isNew]);

  const handleSave = async () => {
    try {
      setSaving(true);
      let res: any;
      if (isNew) {
        res = await createCliente(formData);
      } else {
        res = await updateCliente(id as string, formData);
      }
      
      if (res && res.error) {
        alert('Erro do Banco de Dados:\n\n' + res.error);
        setSaving(false);
        return;
      }
      
      router.push('/clientes');
    } catch (err: any) {
      console.error(err);
      alert('Erro inesperado no navegador: ' + (err?.message || 'Desconhecido'));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-[#F8FAFC]">
        <Sidebar />
        <main className="flex-1 p-10 flex items-center justify-center">
          <div className="text-slate-400 font-bold animate-pulse">Carregando dados...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <main className="flex-1 p-10 overflow-y-auto">
        <div className="max-w-5xl mx-auto w-full">
          <header className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => router.push('/clientes')}
              className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:shadow-lg hover:shadow-emerald-100 transition-all border border-slate-100"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase">
                {isNew ? 'Cadastrar Cliente' : 'Editar Cliente'}
              </h1>
              <p className="text-slate-500 font-medium">Informações cadastrais e de contato do cliente</p>
            </div>
          </div>
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="bg-[#1B4D3E] hover:bg-emerald-900 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-2 shadow-xl shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
          >
            <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Cliente'}
          </button>
        </header>

        <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden mb-8">
          <div className="bg-[#1B4D3E] px-4 py-2 flex items-center gap-2">
            <Building2 size={16} className="text-white" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">DADOS EMPRESARIAIS E CONTATO</h2>
          </div>

          <div className="p-6 grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NOME FANTASIA</label>
              <input 
                type="text" 
                value={formData.nomeFantasia}
                onChange={(e) => setFormData({...formData, nomeFantasia: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                placeholder="Ex: Empresa Silva"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">RAZÃO SOCIAL</label>
              <input 
                type="text" 
                value={formData.razaoSocial}
                onChange={(e) => setFormData({...formData, razaoSocial: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                placeholder="Ex: Silva Serviços LTDA"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ</label>
              <input 
                type="text" 
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                placeholder="00.000.000/0000-00"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ENDEREÇO COMPLETO</label>
              <input 
                type="text" 
                value={formData.endereco}
                onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                placeholder="Rua, Número, Bairro, Cidade - UF"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-MAIL COMERCIAL</label>
              <input 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                placeholder="contato@empresa.com.br"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WHATSAPP / TELEFONE</label>
              <input 
                type="text" 
                value={formData.whatsapp}
                onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CONTATO / RESPONSÁVEL</label>
              <input 
                type="text" 
                value={formData.contato}
                onChange={(e) => setFormData({...formData, contato: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                placeholder="Nome do responsável no cliente"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CARGO DO CONTATO</label>
              <input 
                type="text" 
                value={formData.contatoCargo || ''}
                onChange={(e) => setFormData({...formData, contatoCargo: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                placeholder="Ex: Comprador / Gerente Financeiro"
              />
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
