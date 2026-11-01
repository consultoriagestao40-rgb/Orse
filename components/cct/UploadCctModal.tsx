'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileUp, Sparkles, X, CheckCircle2, AlertCircle, 
  Loader2, FileText, ArrowRight, ShieldCheck 
} from 'lucide-react';

interface UploadCctModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (cct: any) => void;
}

export default function UploadCctModal({ isOpen, onClose, onSuccess }: UploadCctModalProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [nomeSindicato, setNomeSindicato] = useState('');
  const [loading, setLoading] = useState(false);
  const [stepStatus, setStepStatus] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

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
        // Tenta inferir nome simplificado a partir do nome do arquivo
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

      // Feedback visual em etapas
      const timer1 = setTimeout(() => {
        setStepStatus('Processando cláusulas, pisos salariais e benefícios...');
      }, 1500);

      const timer2 = setTimeout(() => {
        setStepStatus('Criando tabelas salariais e indexando para busca IA...');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header com gradiente corporativo */}
        <div className="bg-gradient-to-r from-[#1B4D3E] to-[#12352B] p-6 text-white relative">
          <button 
            onClick={onClose}
            disabled={loading}
            className="absolute top-5 right-5 text-emerald-200 hover:text-white transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-300/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Sparkles size={11} /> Captura Inteligente com IA
            </span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight">Cadastrar CCT via PDF</h2>
          <p className="text-xs text-emerald-100/80 mt-1">
            Envie a Convenção Coletiva e a IA extrairá automaticamente pisos salariais, cláusulas e benefícios para criar as tabelas.
          </p>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2.5">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Dropzone para PDF */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => !loading && fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
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
                <span className="mt-3 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <CheckCircle2 size={12} /> PDF Carregado com Sucesso
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
                  ou clique para selecionar do seu computador (PDF até 25MB)
                </p>
              </div>
            )}
          </div>

          {/* Nome do Sindicato ou Regra */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Nome da Regra / Sindicato (Opcional)
            </label>
            <input 
              type="text"
              placeholder="Ex: SIEMACO SP 2024/2025 (deixe vazio para a IA detectar)"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-2 focus:ring-emerald-500/10 font-medium placeholder:text-slate-400"
              value={nomeSindicato}
              onChange={(e) => setNomeSindicato(e.target.value)}
              disabled={loading}
            />
            <p className="text-[11px] text-slate-400">
              Se deixar vazio, a IA identificará a entidade sindical e o período no cabeçalho do documento.
            </p>
          </div>

          {/* O que a IA fará */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <p className="font-bold text-slate-700 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
              <ShieldCheck size={14} className="text-[#1B4D3E]" /> O que o sistema irá automatizar:
            </p>
            <ul className="text-slate-600 space-y-1 pl-5 list-disc">
              <li>Extração de todos os <strong>cargos e pisos salariais</strong> para a tabela de funções;</li>
              <li>Detecção de <strong>Vale Alimentação/Refeição</strong> e <strong>Vale Transporte</strong>;</li>
              <li>Publicação da CCT na íntegra com <strong>Chat IA especializado</strong> e <strong>download do PDF</strong>.</li>
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
      </div>
    </div>
  );
}
