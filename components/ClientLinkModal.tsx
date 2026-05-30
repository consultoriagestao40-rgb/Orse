'use client';

import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Share2, FileText, Calculator, BookOpen, Presentation, Clock, Calendar } from 'lucide-react';
import { getTemplates } from '@/app/contratos/actions';
import { updateConfigApresentacao } from '@/app/propostas-comerciais/actions';

interface ClientLinkModalProps {
  documentoId: string;
  configApresentacao: any;
  onClose: () => void;
  onSaveSuccess?: (newConfig: any) => void;
}

export default function ClientLinkModal({ documentoId, configApresentacao, onClose, onSaveSuccess }: ClientLinkModalProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // Configuração padrão ou existente
  const [apresentacao, setApresentacao] = useState(
    configApresentacao?.clientTabs?.apresentacao !== false
  );
  const [proposta, setProposta] = useState(
    configApresentacao?.clientTabs?.proposta !== false
  );
  const [fpv, setFpv] = useState(
    configApresentacao?.clientTabs?.fpv !== false
  );
  const [minuta, setMinuta] = useState(
    configApresentacao?.clientTabs?.minuta === true // Padrão falso
  );
  const [minutaTemplateId, setMinutaTemplateId] = useState(
    configApresentacao?.clientTabs?.minutaTemplateId || ''
  );
  const [canvaEmbedUrl, setCanvaEmbedUrl] = useState(
    configApresentacao?.canvaEmbedUrl || ''
  );
  const [validadeDays, setValidadeDays] = useState<number | ''>(
    configApresentacao?.validadeDays && configApresentacao.validadeDays > 0
      ? configApresentacao.validadeDays
      : 7 // Padrão de 7 dias caso seja novo ou anteriormente permanente
  );

  // Carregar as minutas disponíveis no sistema
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await getTemplates();
        if (res.success && res.data) {
          setTemplates(res.data);
          // Se não houver template selecionado, seleciona o primeiro
          if (!minutaTemplateId && res.data.length > 0) {
            setMinutaTemplateId(res.data[0].id);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar minutas de contrato:', err);
      }
    }
    loadTemplates();
  }, [minutaTemplateId]);

  const handleSaveAndCopy = async () => {
    const days = Number(validadeDays);
    if (!validadeDays || isNaN(days) || days <= 0) {
      alert('Por favor, informe um prazo de validade em dias (número maior que zero).');
      return;
    }

    setLoading(true);
    try {
      const newConfig = {
        ...(configApresentacao || {}),
        useCanva: apresentacao && !!canvaEmbedUrl.trim(),
        canvaEmbedUrl: canvaEmbedUrl.trim(),
        clientTabs: {
          apresentacao,
          proposta,
          fpv,
          minuta,
          minutaTemplateId
        },
        validadeDays: days,
        linkCreatedAt: new Date().toISOString(),
        linkExpiresAt: new Date(new Date().getTime() + days * 24 * 60 * 60 * 1000).toISOString()
      };

      const res = await updateConfigApresentacao(documentoId, newConfig);
      if (res.success) {
        // Copiar o link do cliente para a área de transferência
        const shareUrl = `${window.location.origin}/proposta/ver/${documentoId}`;
        await navigator.clipboard.writeText(shareUrl);
        
        setCopied(true);
        if (onSaveSuccess) {
          onSaveSuccess(newConfig);
        }
        setTimeout(() => {
          setCopied(false);
          onClose();
        }, 1500);
      } else {
        alert('Erro ao salvar as configurações: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/proposta/ver/${documentoId}` : '';

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-slate-800 font-sans">
        
        {/* HEADER */}
        <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex justify-between items-center text-white shrink-0">
          <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
            <Share2 size={16} /> Configurar Link do Cliente
          </h2>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto flex-1 scrollbar-thin">
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-slate-800">
              O que o cliente visualizará no link?
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Marque os itens que deseja disponibilizar no menu de navegação do cliente final.
            </p>
          </div>

          {/* CHECKBOX LIST */}
          <div className="space-y-3">
            
            {/* 1. APRESENTAÇÃO CANVA */}
            <div className={`p-4 border rounded-2xl transition-all ${apresentacao ? 'border-indigo-500/30 bg-indigo-50/5' : 'border-slate-200 bg-white'}`}>
              <label className="flex items-start gap-4 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-indigo-650 focus:ring-indigo-500 border-slate-300 rounded cursor-pointer"
                  checked={apresentacao}
                  onChange={(e) => setApresentacao(e.target.checked)}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                    <Presentation size={14} className="text-indigo-600" />
                    1. Apresentação (Slides / Canva)
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Renderiza os slides widescreen incorporados do Canva com alta fidelidade gráfica.
                  </p>
                </div>
              </label>

              {apresentacao && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Código de Incorporação (Embed HTML) ou Link do Canva
                  </label>
                  <input 
                    type="text"
                    placeholder="Cole o link inteligente (https://www.canva.com/design/.../view?embed) ou o código iframe do Canva..."
                    value={canvaEmbedUrl}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val.includes('<iframe')) {
                        const match = val.match(/src="([^"]+)"/);
                        if (match && match[1]) {
                          val = match[1];
                        }
                      }
                      setCanvaEmbedUrl(val);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* 2. PROPOSTA COMERCIAL A4 */}
            <label className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50 select-none ${proposta ? 'border-emerald-500/30 bg-emerald-50/5' : 'border-slate-200 bg-white'}`}>
              <input 
                type="checkbox" 
                className="mt-1 w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300 rounded cursor-pointer"
                checked={proposta}
                onChange={(e) => setProposta(e.target.checked)}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                  <FileText size={14} className="text-emerald-600" />
                  2. Proposta Comercial (Contrato A4)
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Contrato comercial completo em A4 contendo o escopo básico, condições e aceite do cliente.
                </p>
              </div>
            </label>

            {/* 3. FPV DETALHADO (ABAS 2 A 9) */}
            <label className={`flex items-start gap-4 p-4 border rounded-2xl cursor-pointer transition-all hover:bg-slate-50 select-none ${fpv ? 'border-amber-500/30 bg-amber-50/5' : 'border-slate-200 bg-white'}`}>
              <input 
                type="checkbox" 
                className="mt-1 w-4 h-4 text-amber-600 focus:ring-amber-500 border-slate-300 rounded cursor-pointer"
                checked={fpv}
                onChange={(e) => setFpv(e.target.checked)}
              />
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                  <Calculator size={14} className="text-amber-600" />
                  3. FPV Detalhado (Abas de Posto Fixo)
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Permite o cliente navegar nas planilhas financeiras (Premissas, Encargos, Quadro, Insumos e Resumos).
                </p>
              </div>
            </label>

            {/* 4. MINUTA DO CONTRATO */}
            <div className={`p-4 border rounded-2xl transition-all ${minuta ? 'border-sky-500/30 bg-sky-50/5' : 'border-slate-200 bg-white'}`}>
              <label className="flex items-start gap-4 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="mt-1 w-4 h-4 text-sky-600 focus:ring-sky-500 border-slate-300 rounded cursor-pointer"
                  checked={minuta}
                  onChange={(e) => setMinuta(e.target.checked)}
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                    <BookOpen size={14} className="text-sky-600" />
                    4. Minuta de Contrato Padrão
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Minuta formal pré-preenchida com dados do cliente e da empresa emissora relacionados.
                  </p>
                </div>
              </label>

              {/* SELETOR DE TEMPLATE DE MINUTA SE HABILITADO */}
              {minuta && (
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">
                    Selecione o Modelo de Minuta Padrão
                  </label>
                  <select 
                    value={minutaTemplateId}
                    onChange={(e) => setMinutaTemplateId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    {templates.map(t => (
                      <option key={t.id} value={t.id}>{t.nome}</option>
                    ))}
                    {templates.length === 0 && (
                      <option value="">Nenhuma minuta cadastrada no sistema</option>
                    )}
                  </select>
                </div>
              )}
            </div>

            {/* 5. PRAZO DE VALIDADE DO LINK */}
            <div className="p-4 border rounded-2xl border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-slate-800">
                  <Clock size={14} className="text-amber-600" />
                  Validade do Link Comercial
                </div>
                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest bg-red-50 text-red-650 border border-red-200">
                  Obrigatório
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed font-sans">
                Insira obrigatoriamente a quantidade de dias para a validade desta proposta. Após esse prazo, o link de acesso público expirará automaticamente.
              </p>
              
              <div className="flex items-center gap-2 max-w-[200px]">
                <div className="relative flex items-center w-full">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    placeholder="Ex: 10"
                    value={validadeDays}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setValidadeDays('');
                      } else {
                        const parsed = parseInt(val, 10);
                        if (!isNaN(parsed)) {
                          setValidadeDays(parsed >= 1 ? parsed : 1);
                        }
                      }
                    }}
                    className="w-full pl-3 pr-12 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-700 outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 transition-all font-mono"
                  />
                  <div className="absolute right-3 text-[10px] font-black uppercase tracking-wider text-slate-400 pointer-events-none">
                    dias
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* VISUALIZADOR DE LINK */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-1.5">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">
              Endereço do Link Interativo do Cliente
            </span>
            <div className="flex gap-2 items-center bg-white border border-slate-250 p-1.5 pl-3 rounded-xl">
              <span className="text-[10px] text-slate-500 font-bold truncate flex-1 font-mono select-all">
                {shareUrl}
              </span>
              <button 
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="p-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 rounded-lg transition-all"
                title="Copiar Link"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider text-slate-500 bg-white border border-slate-350 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSaveAndCopy}
            disabled={loading}
            className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              loading 
                ? 'bg-slate-150 text-slate-400 border border-slate-250 cursor-not-allowed shadow-none'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/10 active:scale-[0.98]'
            }`}
          >
            {copied ? (
              <>
                <Check size={14} /> Link Copiado!
              </>
            ) : (
              <>
                🔗 Salvar e Copiar Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
