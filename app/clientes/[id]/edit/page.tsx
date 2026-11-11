'use client';

import React, { useState, useEffect, useRef, use } from 'react';
import Sidebar from '@/components/Sidebar';
import { ArrowLeft, Save, Building2, FileUp, Search, Sparkles, CheckCircle2, Loader2 } from 'lucide-react';
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
  const [searchingCnpj, setSearchingCnpj] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [extractFeedback, setExtractFeedback] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const applyExtractedClientData = (d: any, feedbackMsg: string) => {
    setFormData((prev: any) => ({
      ...prev,
      cnpj: d.cnpj || prev.cnpj,
      razaoSocial: d.razaoSocial || prev.razaoSocial,
      nomeFantasia: d.nomeFantasia || d.razaoSocial || prev.nomeFantasia,
      endereco: d.endereco || prev.endereco,
      email: d.email || prev.email,
      whatsapp: d.whatsapp || prev.whatsapp,
      contato: d.contato || prev.contato,
      contatoCargo: d.contatoCargo || prev.contatoCargo,
    }));
    if (d.cep) {
      setCep(d.cep);
    }
    setExtractFeedback(feedbackMsg);
    setTimeout(() => setExtractFeedback(null), 6000);
  };

  const handleSearchCnpj = async (cnpjVal?: string) => {
    const raw = cnpjVal !== undefined ? cnpjVal : formData.cnpj;
    const cleanCnpj = String(raw || '').replace(/\D/g, '');
    if (cleanCnpj.length !== 14) {
      if (cnpjVal === undefined) {
        alert('Digite um CNPJ válido com 14 números para buscar os dados.');
      }
      return;
    }

    try {
      setSearchingCnpj(true);
      setExtractFeedback(null);
      const res = await fetch('/api/clientes/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cnpj: cleanCnpj }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (cnpjVal === undefined) {
          alert(json.error || 'Não foi possível localizar este CNPJ.');
        }
        return;
      }
      applyExtractedClientData(json.data, 'Dados puxados automaticamente pelo CNPJ (Receita Federal)!');
    } catch (err) {
      console.error('Erro ao consultar CNPJ:', err);
    } finally {
      setSearchingCnpj(false);
    }
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const digits = raw.replace(/\D/g, '').slice(0, 14);
    let formatted = raw;
    if (digits.length === 14) {
      formatted = `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
    }
    setFormData((prev: any) => ({ ...prev, cnpj: formatted }));
    if (digits.length === 14) {
      handleSearchCnpj(digits);
    }
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Selecione um arquivo PDF (Cartão CNPJ ou Ficha Cadastral).');
      return;
    }

    try {
      setUploadingPdf(true);
      setExtractFeedback(null);
      const fData = new FormData();
      fData.append('pdf', file);

      const res = await fetch('/api/clientes/extract', {
        method: 'POST',
        body: fData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        alert(json.error || 'Não foi possível extrair os dados do PDF.');
        return;
      }

      applyExtractedClientData(
        json.data,
        json.source === 'PDF_AND_RECEITA'
          ? 'PDF lido com sucesso e enriquecido com dados da Receita Federal!'
          : 'Dados extraídos do PDF com sucesso!'
      );
    } catch (err: any) {
      alert('Erro ao processar PDF: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

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
          <header className="flex justify-between items-center mb-8 flex-wrap gap-4">
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
                <p className="text-slate-500 font-medium">Preencha manualmente, digite o CNPJ ou envie o PDF do Cartão CNPJ / Ficha Cadastral</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                ref={pdfInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handlePdfUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={uploadingPdf || searchingCnpj}
                className="bg-emerald-50 hover:bg-emerald-100 text-[#1B4D3E] border border-emerald-200 font-black py-3.5 px-5 rounded-2xl flex items-center gap-2 text-xs uppercase tracking-wider transition-all shadow-sm disabled:opacity-50"
              >
                {uploadingPdf ? <Loader2 size={16} className="animate-spin" /> : <FileUp size={16} />}
                {uploadingPdf ? 'Lendo PDF...' : 'Subir Cartão CNPJ / Ficha (PDF)'}
              </button>

              <button 
                onClick={handleSave}
                disabled={saving}
                className="bg-[#1B4D3E] hover:bg-emerald-900 text-white font-black py-4 px-8 rounded-2xl flex items-center gap-2 shadow-xl shadow-emerald-900/20 transition-all active:scale-95 disabled:opacity-50"
              >
                <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Cliente'}
              </button>
            </div>
          </header>

          {extractFeedback && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2.5 text-xs font-bold shadow-sm">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>{extractFeedback}</span>
            </div>
          )}

          <div className="bg-white rounded-md border border-slate-300 shadow-sm overflow-hidden mb-8">
            <div className="bg-[#1B4D3E] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-white" />
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">DADOS EMPRESARIAIS E CONTATO</h2>
              </div>
              <span className="text-[10px] font-bold text-emerald-200 flex items-center gap-1">
                <Sparkles size={12} /> Busca automática por CNPJ ou PDF integrada
              </span>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">CNPJ (Digite para puxar dados)</label>
                  <button
                    type="button"
                    onClick={() => handleSearchCnpj()}
                    disabled={searchingCnpj}
                    className="text-[10px] font-black text-[#1B4D3E] hover:underline uppercase flex items-center gap-1 disabled:opacity-50"
                  >
                    {searchingCnpj ? <Loader2 size={11} className="animate-spin" /> : <Search size={11} />}
                    {searchingCnpj ? 'Consultando Receita...' : 'Buscar CNPJ'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={formData.cnpj}
                    onChange={handleCnpjChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-md px-3 py-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500 focus:bg-white outline-none transition-all"
                    placeholder="00.000.000/0000-00"
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchCnpj()}
                    disabled={searchingCnpj}
                    title="Consultar CNPJ na Receita Federal"
                    className="px-3.5 py-2 bg-[#1B4D3E] hover:bg-emerald-900 text-white rounded-md text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all disabled:opacity-50"
                  >
                    {searchingCnpj ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    Puxar
                  </button>
                </div>
              </div>

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
