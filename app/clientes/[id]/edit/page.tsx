'use client';

import React, { useState, useEffect, use } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getClientes, createCliente, updateCliente } from '../../actions';
import { getSegmentos } from '@/app/admin/settings/actions';

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
    segmento: '',
  });

  const [segmentos, setSegmentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cep, setCep] = useState('');
  const [searchingCep, setSearchingCep] = useState(false);

  const handleSearchCep = async (cepVal: string) => {
    const cleanCep = cepVal.replace(/\D/g, '');
    if (cleanCep.length !== 8) return;
    
    try {
      setSearchingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (data.erro) {
        alert('CEP não localizado.');
        return;
      }
      
      const parts = [
        data.logradouro,
        data.bairro,
        `${data.localidade} - ${data.uf}`
      ].filter(Boolean);
      const address = parts.join(', ');
      
      setFormData((prev: any) => ({
        ...prev,
        endereco: address
      }));
    } catch (err) {
      console.error('Erro ao buscar CEP:', err);
    } finally {
      setSearchingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 8) val = val.slice(0, 8);
    
    if (val.length === 8) {
      handleSearchCep(val);
    }
    
    if (val.length > 5) {
      val = `${val.slice(0, 5)}-${val.slice(5)}`;
    }
    setCep(val);
  };

  useEffect(() => {
    async function load() {
      try {
        const segmentsData = await getSegmentos();
        setSegmentos(segmentsData || []);

        if (!isNew) {
          const data = await getClientes();
          const item = data.find((c: any) => c.id === id);
          if (item) {
            setFormData({
              nomeFantasia: item.nomeFantasia || '',
              razaoSocial: item.razaoSocial || '',
              cnpj: item.cnpj || '',
              email: item.email || '',
              whatsapp: item.whatsapp || '',
              endereco: item.endereco || '',
              contato: item.contato || '',
              contatoCargo: item.contatoCargo || '',
              segmento: item.segmento || '',
            });
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
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
              <div className="flex justify-between items-center select-none">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CEP (Busca Automática)</label>
                {searchingCep && (
                  <span className="text-[9px] font-extrabold text-[#1B4D3E] uppercase animate-pulse">Buscando...</span>
                )}
              </div>
              <input 
                type="text" 
                value={cep}
                onChange={handleCepChange}
                disabled={searchingCep}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                placeholder="00000-000"
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

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SEGMENTO DO CLIENTE</label>
              <select 
                value={formData.segmento || ''}
                onChange={(e) => setFormData({...formData, segmento: e.target.value})}
                className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all cursor-pointer"
              >
                <option value="">Selecione um segmento...</option>
                {segmentos.map((s: any) => (
                  <option key={s.id} value={s.nome}>{s.nome}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
