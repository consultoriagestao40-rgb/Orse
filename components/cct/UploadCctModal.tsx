'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileUp, Sparkles, X, CheckCircle2, AlertCircle, 
  Loader2, FileText, ArrowRight, ShieldCheck, Globe, Search,
  Download, ExternalLink, Check
} from 'lucide-react';

interface UploadCctModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (cct: any) => void;
}

interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

export default function UploadCctModal({ isOpen, onClose, onSuccess }: UploadCctModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [activeTab, setActiveTab] = useState<'upload' | 'web'>('upload');

  // Estado da aba Upload
  const [file, setFile] = useState<File | null>(null);
  const [nomeSindicato, setNomeSindicato] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepStatus, setStepStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Estado da aba Localizar na Web (IA)
  const [webUf, setWebUf] = useState('SC');
  const [webTermo, setWebTermo] = useState('Limpeza e Conservação');
  const [webSearching, setWebSearching] = useState(false);
  const [webResults, setWebResults] = useState<WebSearchResult[]>([]);
  const [selectedWebLink, setSelectedWebLink] = useState<string | null>(null);
  const [importingLink, setImportingLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setError('Por favor, selecione um arquivo em formato PDF.');
        return;
      }
      setFile(selected);
      setError(null);
      if (!nomeSindicato) {
        const cleanName = selected.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' ');
        setNomeSindicato(cleanName);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      if (!dropped.name.toLowerCase().endsWith('.pdf')) {
        setError('Por favor, arraste um arquivo em formato PDF.');
        return;
      }
      setFile(dropped);
      setError(null);
      if (!nomeSindicato) {
        setNomeSindicato(dropped.name.replace(/\.pdf$/i, '').replace(/[_-]/g, ' '));
      }
    }
  };

  // Submissão do arquivo PDF local
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Selecione o arquivo PDF da Convenção Coletiva.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setStepStatus('Lendo e extraindo texto integral do PDF...');

      const formData = new FormData();
      formData.append('pdf', file);
      if (nomeSindicato.trim()) {
        formData.append('nomeSindicato', nomeSindicato.trim());
      }
      formData.append('autoSave', 'true');

      const timer1 = setTimeout(() => {
        setStepStatus('Consultando Cláusula de Vigência, pisos e benefícios...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setStepStatus('Indexando cláusulas na íntegra para busca inteligente com IA...');
      }, 3500);

      const res = await fetch('/api/cct/upload-and-parse', {
        method: 'POST',
        body: formData,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      let data: any = null;
      try {
        data = await res.json();
      } catch {
        throw new Error('Falha ao processar o PDF. O arquivo pode estar corrompido ou exceder o limite suportado.');
      }

      if (!res.ok || data?.error) {
        throw new Error(data?.error || 'Falha ao processar a Convenção Coletiva.');
      }

      setStepStatus('CCT publicada com sucesso! Redirecionando...');

      if (onSuccess) {
        onSuccess(data.cct);
      }

      setTimeout(() => {
        onClose();
        if (data.cct?.id) {
          router.push(`/admin/ccts/${data.cct.id}`);
        } else {
          router.refresh();
        }
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Erro ao processar CCT.');
      setStepStatus('');
    } finally {
      setLoading(false);
    }
  };

  // Busca de CCTs na Web via IA Serper
  const handleWebSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setWebSearching(true);
      setError(null);
      setWebResults([]);
      setSelectedWebLink(null);

      const res = await fetch('/api/cct/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          uf: webUf,
          termo: webTermo
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Erro ao pesquisar CCTs na web.');
      }

      setWebResults(data.results || []);
      if ((data.results || []).length === 0) {
        setError(`Nenhuma convenção coletiva em PDF encontrada para "${webTermo}" em ${webUf}. Tente variar o termo.`);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao buscar na web.');
    } finally {
      setWebSearching(false);
    }
  };

  // Importar CCT selecionada da Web
  const handleImportWeb = async (link: string, title: string) => {
    try {
      setImportingLink(link);
      setLoading(true);
      setError(null);
      setStepStatus('Baixando PDF oficial do sindicato / MTE...');

      const timer1 = setTimeout(() => {
        setStepStatus('Consultando Cláusula Oficial de Vigência no documento...');
      }, 2000);

      const timer2 = setTimeout(() => {
        setStepStatus('Mapeando pisos salariais, benefícios e gerando tabelas...');
      }, 4500);

      const res = await fetch('/api/cct/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'import',
          pdfUrl: link,
          uf: webUf,
          autoSave: true
        })
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || 'Falha ao importar e processar a CCT selecionada.');
      }

      setStepStatus('CCT importada e publicada com sucesso! Redirecionando...');

      if (onSuccess) {
        onSuccess(data.cct);
      }

      setTimeout(() => {
        onClose();
        if (data.cct?.id) {
          router.push(`/admin/ccts/${data.cct.id}`);
        } else {
          router.refresh();
        }
      }, 800);
    } catch (err: any) {
      setError(err?.message || 'Erro ao importar CCT da web.');
      setStepStatus('');
    } finally {
      setLoading(false);
      setImportingLink(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Corporativo com gradiente */}
        <div className="bg-gradient-to-r from-[#1B4D3E] via-[#163f33] to-[#12352B] p-6 text-white relative">
          <button 
            onClick={onClose}
            disabled={loading}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white transition-colors disabled:opacity-50 p-1 rounded-lg hover:bg-white/10"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-2 mb-1.5">
            <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={11} /> Captura Inteligente com IA
            </span>
          </div>

          <h2 className="text-xl font-black uppercase tracking-tight">Cadastrar Convenção Coletiva</h2>
          <p className="text-xs text-emerald-100/80 mt-1">
            A IA consulta a Cláusula Oficial de Vigência, extrai todos os pisos salariais e benefícios normativos.
          </p>

          {/* Abas Alternadoras */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setActiveTab('upload'); setError(null); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'upload'
                  ? 'bg-white text-[#1B4D3E] shadow-sm'
                  : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileUp size={14} /> Enviar Arquivo PDF
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('web'); setError(null); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                activeTab === 'web'
                  ? 'bg-white text-[#1B4D3E] shadow-sm'
                  : 'text-emerald-100/70 hover:text-white hover:bg-white/10'
              }`}
            >
              <Globe size={14} /> Localizar na Web com IA
              <span className="bg-emerald-400 text-slate-900 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase">Novo</span>
            </button>
          </div>
        </div>

        {/* Mensagem de Erro Geral */}
        {error && (
          <div className="mx-6 mt-4 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* CONTEÚDO DA ABA 1: UPLOAD LOCAL DE PDF */}
        {activeTab === 'upload' && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            {/* Dropzone para PDF */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                file 
                  ? 'border-emerald-500 bg-emerald-50/40' 
                  : 'border-slate-300 hover:border-[#1B4D3E] hover:bg-slate-50'
              }`}
            >
              <input 
                ref={fileInputRef}
                type="file" 
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
              />

              {file ? (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#1B4D3E] flex items-center justify-center mb-2 shadow-sm">
                    <FileText size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 break-all">{file.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB • Clique para substituir
                  </p>
                  <span className="mt-2.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={12} /> PDF Selecionado
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center mb-2">
                    <FileUp size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-700">
                    Arraste e solte o PDF da CCT aqui
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    ou clique para selecionar do computador (PDF oficial do MTE ou Sindicato)
                  </p>
                </div>
              )}
            </div>

            {/* Nome da Regra Opcional */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                Nome da Regra / Sindicato (Opcional)
              </label>
              <input 
                type="text"
                placeholder="Ex: Convenção Coletiva Asseio e Conservação PR 2026/2028"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-2 focus:ring-emerald-500/10 font-medium"
                value={nomeSindicato}
                onChange={(e) => setNomeSindicato(e.target.value)}
                disabled={loading}
              />
              <p className="text-[11px] text-slate-400">
                Se deixar vazio, a IA detectará o sindicato e o período no cabeçalho e na Cláusula de Vigência.
              </p>
            </div>

            {/* Regras automatizadas */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1.5">
              <p className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                <ShieldCheck size={14} className="text-[#1B4D3E]" /> Garantia de Conformidade com a CCT:
              </p>
              <ul className="text-slate-600 space-y-1 pl-4 list-disc text-[11px]">
                <li>A <strong>vigência exata</strong> é extraída da Cláusula Oficial de Vigência (início e término sem shifts);</li>
                <li>Pisos salariais mapeados e associados à tabela de cargos;</li>
                <li>Íntegra do documento disponível para o <strong>CCT Copilot IA</strong>.</li>
              </ul>
            </div>

            {/* Status do Processamento */}
            {loading && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-xs">
                  <Loader2 size={16} className="animate-spin text-[#1B4D3E]" />
                  <span>{stepStatus || 'Processando CCT...'}</span>
                </div>
                <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#1B4D3E] h-1.5 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || !file}
                className="px-6 py-2.5 rounded-xl bg-[#1B4D3E] hover:bg-[#13382D] text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/10 transition-all disabled:opacity-50 active:scale-95"
              >
                {loading ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Processando com IA...
                  </>
                ) : (
                  <>
                    <Sparkles size={14} /> Processar e Publicar CCT <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* CONTEÚDO DA ABA 2: LOCALIZAR NA WEB COM IA */}
        {activeTab === 'web' && (
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Filtros de Busca */}
            <form onSubmit={handleWebSearch} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                
                {/* UF */}
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider block mb-1">
                    Estado (UF)
                  </label>
                  <select
                    value={webUf}
                    onChange={(e) => setWebUf(e.target.value)}
                    disabled={webSearching || loading}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E]"
                  >
                    {['SC', 'PR', 'SP', 'RJ', 'RS', 'MG', 'BA', 'GO', 'DF', 'PE', 'CE', 'ES', 'MT', 'MS'].map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>

                {/* Termo / Categoria */}
                <div className="sm:col-span-6">
                  <label className="text-[11px] font-black uppercase text-slate-600 tracking-wider block mb-1">
                    Segmento / Categoria
                  </label>
                  <input
                    type="text"
                    value={webTermo}
                    onChange={(e) => setWebTermo(e.target.value)}
                    placeholder="Ex: Limpeza e Conservação, Asseio, Portaria..."
                    disabled={webSearching || loading}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-[#1B4D3E]"
                  />
                </div>

                {/* Botão Buscar */}
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    disabled={webSearching || loading}
                    className="w-full py-2 px-3 bg-[#1B4D3E] hover:bg-[#13382D] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                  >
                    {webSearching ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    <span>{webSearching ? 'Buscando...' : 'Buscar CCT'}</span>
                  </button>
                </div>
              </div>

              {/* Sugestões Rápidas de Segmento */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Atalhos:</span>
                {[
                  'Limpeza e Conservação',
                  'Asseio e Conservação',
                  'Portaria e Vigilância',
                  'SIEMACO',
                  'SEAC'
                ].map(sug => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setWebTermo(sug)}
                    className="text-[10px] px-2 py-0.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-[#1B4D3E] hover:text-[#1B4D3E] font-medium transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </form>

            {/* Status do Processamento de Importação */}
            {loading && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-emerald-800 font-bold text-xs">
                  <Loader2 size={16} className="animate-spin text-[#1B4D3E]" />
                  <span>{stepStatus || 'Importando e indexando CCT...'}</span>
                </div>
                <div className="w-full bg-emerald-200/60 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-[#1B4D3E] h-1.5 rounded-full animate-pulse w-3/4"></div>
                </div>
              </div>
            )}

            {/* Resultados da Busca */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                <span>Resultados de CCTs oficiais encontrados:</span>
                {webResults.length > 0 && (
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-bold text-[10px] border border-emerald-200">
                    {webResults.length} documentos disponíveis
                  </span>
                )}
              </div>

              {webResults.length === 0 && !webSearching && (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 text-slate-400 text-xs">
                  <Globe size={28} className="mx-auto mb-2 text-slate-300" />
                  <p className="font-bold text-slate-600">Pesquise CCTs oficiais registradas na internet</p>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-sm mx-auto">
                    Selecione o Estado (ex: <strong>SC</strong>) e clique em Buscar para localizar PDFs oficiais do SEAC, FEVASC, SIEMACO e MTE.
                  </p>
                </div>
              )}

              {webResults.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200">
                        PDF Oficial
                      </span>
                      <span className="text-[10px] text-slate-400 truncate">
                        {item.source}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 mt-1 truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                      {item.snippet}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Abrir PDF original em nova aba"
                    >
                      <ExternalLink size={15} />
                    </a>

                    <button
                      type="button"
                      onClick={() => handleImportWeb(item.link, item.title)}
                      disabled={loading}
                      className="px-3.5 py-2 rounded-xl bg-[#1B4D3E] hover:bg-[#13382D] text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                    >
                      {importingLink === item.link ? (
                        <>
                          <Loader2 size={13} className="animate-spin" /> Importando...
                        </>
                      ) : (
                        <>
                          <Sparkles size={13} /> Importar com IA
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé com botão de fechar */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Fechar
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
