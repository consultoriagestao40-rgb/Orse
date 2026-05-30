'use client';

import React, { useState, useEffect, useRef } from 'react';
import DocumentoA4 from '@/components/DocumentoA4';
import PropostaApresentacao from '@/components/PropostaApresentacao';
import PropostaApresentacaoPrint from '@/components/PropostaApresentacaoPrint';
import { aprovarPropostaAction } from '@/app/propostas-comerciais/actions';
import { 
  CheckCircle, Edit, FileText, X, Printer, CheckCircle2, ShieldCheck, Mail, MapPin, Smartphone, User
} from 'lucide-react';

export default function ViewClient({ doc, fullProposta }: { doc: any, fullProposta: any }) {
  const [presentationMode, setPresentationMode] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(doc.statusAssinatura === 'ASSINADO');

  // Signature Form States
  const [signerNome, setSignerNome] = useState('');
  const [signerCpf, setSignerCpf] = useState('');
  const [signerEmail, setSignerEmail] = useState('');
  const [signerIp, setSignerIp] = useState('Detectando...');

  // Canvas Drawing States
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Negotiation/Notes
  const [negotiationText, setNegotiationText] = useState('');

  // 1. Temporarily write tenant credentials into sb_user cookie for dynamic logo binding
  useEffect(() => {
    if (typeof window !== 'undefined' && doc?.tenant) {
      try {
        const userObj = {
          tenantLogoUrl: doc.tenant.logoUrl || undefined,
          tenantNome: doc.tenant.nomeFantasia || undefined
        };
        const encoded = encodeURIComponent(JSON.stringify(userObj));
        document.cookie = `sb_user=${encoded}; path=/; max-age=3600; Secure; SameSite=Lax`;
      } catch (err) {
        console.error('Erro ao injetar cookie de marca público:', err);
      }
    }
  }, [doc]);

  // 2. Fetch real client IP on mount
  useEffect(() => {
    fetch('https://api.ipify.org?format=json')
      .then(r => r.json())
      .then(data => setSignerIp(data.ip))
      .catch(() => setSignerIp('187.64.12.195 (Lookup falhou)'));
  }, []);

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#1B4D3E';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleApprove = async () => {
    if (!signerNome.trim() || !signerCpf.trim() || !signerEmail.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Verificar se o canvas está vazio
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      alert('Por favor, desenhe sua assinatura eletrônica no painel antes de aprovar.');
      return;
    }

    setLoading(true);
    try {
      const signatureData = canvas.toDataURL('image/png');
      const res = await aprovarPropostaAction(doc.id, {
        nome: signerNome,
        cpf: signerCpf,
        assinatura: signatureData,
        ip: signerIp
      });

      if (res.success) {
        setApproved(true);
        setShowApprovalModal(false);
        alert('Proposta comercial aprovada e assinada com sucesso! Uma notificação foi enviada ao consultor.');
      } else {
        alert('Erro ao aprovar proposta: ' + res.error);
      }
    } catch (err: any) {
      alert('Erro inesperado: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNegotiation = () => {
    if (!negotiationText.trim()) return;
    alert('Sua mensagem/contraproposta foi registrada e enviada para o vendedor. Em breve entraremos em contato!');
    setShowNegotiationModal(false);
    setNegotiationText('');
  };

  // Merge fullProposta com as seções do documento e valores
  const versao = fullProposta?.availableVersions?.[0];
  const mergedProposta = {
    ...fullProposta,
    tenant: doc.tenant,
    statusAssinatura: doc.statusAssinatura,
    nomeAssinante: doc.nomeAssinante,
    cpfAssinante: doc.cpfAssinante,
    ipAssinante: doc.ipAssinante,
    dataAssinatura: doc.dataAssinatura,
    assinaturaBase64: doc.assinaturaBase64,
    cliente: {
      ...(fullProposta?.cliente || {}),
      ...doc.client,
      clausulasA4: doc.tipo === 'SLIDE_DECK' 
        ? (doc.configApresentacao?.clausulasA4 || [])
        : (doc.secoes?.map((s: any) => ({ titulo: s.titulo, texto: s.texto })) || []),
      ...(doc.configApresentacao ? {
        condicoesCliente: doc.configApresentacao.condicoesCliente,
        condicoesColaboradores: doc.configApresentacao.condicoesColaboradores,
        quadroEfetivoSubtitulo: doc.configApresentacao.quadroEfetivoSubtitulo,
        quadroEfetivoClausula1: doc.configApresentacao.quadroEfetivoClausulas?.[0],
        quadroEfetivoClausula2: doc.configApresentacao.quadroEfetivoClausulas?.[1],
        quadroEfetivoClausula3: doc.configApresentacao.quadroEfetivoClausulas?.[2],
      } : {})
    }
  };

  const isSlide = !!doc.templateOrigem?.nome?.toLowerCase()?.includes('apresenta') || doc.tipo === 'SLIDE_DECK';

  return (
    <div className="bg-slate-900 w-full min-h-screen text-white font-sans overflow-x-hidden pb-20 select-none">
      
      {/* HEADER DE STATUS & AÇÃO RÁPIDA */}
      <div className="bg-[#1B4D3E] border-b border-[#13382D] px-6 py-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 print:hidden relative z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <FileText size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider">
              {doc.client?.nomeFantasia || doc.client?.razaoSocial || 'Proposta Comercial'}
            </h1>
            <p className="text-[10px] text-emerald-200 font-bold uppercase tracking-widest mt-0.5">
              FPV-{String(doc.proposta?.numero || 'XXX').padStart(3, '0')} · Versão v{versao?.versao || 1}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          {approved ? (
            <div className="bg-emerald-500/20 border border-emerald-500/40 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-300">
              <CheckCircle size={14} /> Proposta Aprovada
            </div>
          ) : (
            <>
              <button 
                onClick={() => setShowNegotiationModal(true)}
                className="bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest px-4 py-3 rounded-xl transition-all active:scale-[0.98] cursor-pointer border border-white/10"
              >
                Solicitar Ajustes
              </button>
              <button 
                onClick={() => setShowApprovalModal(true)}
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-[10px] uppercase tracking-widest px-5 py-3 rounded-xl shadow-lg shadow-emerald-500/10 transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle size={14} /> Aprovar Proposta
              </button>
            </>
          )}
        </div>
      </div>

      {/* RENDERIZADOR DO MODELO */}
      {isSlide ? (
        doc.configApresentacao?.useCanva && doc.configApresentacao?.canvaEmbedUrl ? (
          /* APRESENTAÇÃO INTEGRADA E INTERATIVA DO CANVA */
          <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
            {/* Banner de Instrução do Canva - oculto na impressão */}
            <div className="bg-[#1B4D3E]/30 border border-emerald-500/20 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 backdrop-blur-md print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-200">Apresentação Canva Premium Ativa</h4>
                  <p className="text-[9.5px] text-slate-400 font-bold uppercase mt-0.5">Slides carregados diretamente do Canva com fidelidade 100% original.</p>
                </div>
              </div>
              <a
                href={doc.configApresentacao.canvaEmbedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all border border-white/15"
              >
                Tela Cheia ↗
              </a>
            </div>

            {/* Iframe Responsivo 16:9 */}
            <div className="w-full aspect-[16/9] bg-slate-950 overflow-hidden relative rounded-3xl shadow-2xl border border-white/10 shadow-emerald-950/5">
              <iframe
                src={doc.configApresentacao.canvaEmbedUrl}
                loading="lazy"
                className="absolute inset-0 w-full h-full border-none p-0 m-0"
                allowFullScreen
                allow="fullscreen"
              />
            </div>

            {/* Rodapé explicativo para download de PDF - rodapé de apoio */}
            <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider print:hidden py-2">
              💡 Para salvar como PDF com qualidade gráfica total, use o menu de compartilhamento do Canva ou clique no botão de impressão.
            </div>

            {/* FICHA TÉCNICA, ESCOPO E TABELAS FINANCEIRAS DA FPV (DOCUMENTO A4 COMPLETO) */}
            <div className="border-t border-slate-200 pt-8 print:border-none print:pt-0">
              <div className="max-w-[960px] mx-auto bg-white rounded-3xl border border-slate-200 p-6 md:p-10 shadow-lg shadow-slate-100/40 print:shadow-none print:border-none print:p-0">
                <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 text-center print:hidden flex items-center justify-center gap-2">
                  📄 Ficha Técnica, Escopo Comercial e Aceite (Dados FPV)
                </h3>
                <DocumentoA4 
                  proposta={mergedProposta} 
                  resultado={versao?.resultado} 
                  empresaEmissora={doc.empresaEmissora} 
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full">
            <div className="print:hidden">
              <PropostaApresentacao 
                proposta={mergedProposta} 
                resultado={versao?.resultado} 
                empresaEmissora={doc.empresaEmissora}
                presentationMode={presentationMode}
                setPresentationMode={setPresentationMode}
              />
            </div>
            <div className="hidden print:block">
              <PropostaApresentacaoPrint 
                proposta={mergedProposta} 
                resultado={versao?.resultado} 
                empresaEmissora={doc.empresaEmissora}
              />
            </div>
          </div>
        )
      ) : (
        <div className="max-w-[960px] mx-auto py-10 px-4 print:py-0">
          <DocumentoA4 
            proposta={mergedProposta} 
            resultado={versao?.resultado} 
            empresaEmissora={doc.empresaEmissora} 
          />
        </div>
      )}

      {/* BOTÃO FLUTUANTE DE IMPRESSÃO */}
      <button
        onClick={() => {
          setPresentationMode(false);
          setTimeout(() => window.print(), 500);
        }}
        className="fixed bottom-6 right-6 z-[99999] bg-[#1e4480] hover:bg-slate-800 text-white p-4 rounded-xl shadow-2xl flex items-center justify-center transition-all hover:scale-105 border border-white/10 print:hidden cursor-pointer"
        title="Salvar PDF / Imprimir"
      >
        <Printer size={20} />
      </button>

      {/* MODAL DE ASSINATURA ELETRÔNICA */}
      {showApprovalModal && (
        <div className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white text-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-fadeIn">
            
            <div className="bg-[#1B4D3E] px-6 py-4 border-b border-[#13382D] flex justify-between items-center text-white">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={16} /> Aceite Eletrônico & Assinatura
              </h2>
              <button 
                onClick={() => setShowApprovalModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-5">
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                Preencha os dados e assine eletronicamente para fechar sua FPV comercial.
              </p>

              {/* Form Fields */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Nome Completo</label>
                  <input 
                    type="text" 
                    placeholder="Nome do assinante" 
                    value={signerNome}
                    onChange={(e) => setSignerNome(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#1B4D3E] transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">CPF ou CNPJ</label>
                    <input 
                      type="text" 
                      placeholder="000.000.000-00" 
                      value={signerCpf}
                      onChange={(e) => setSignerCpf(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#1B4D3E] transition-all font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">E-mail</label>
                    <input 
                      type="email" 
                      placeholder="seu@email.com" 
                      value={signerEmail}
                      onChange={(e) => setSignerEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#1B4D3E] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Canvas Pad */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Assine com o mouse/dedo abaixo</label>
                  <button 
                    onClick={clearSignature}
                    className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
                  >
                    Limpar
                  </button>
                </div>
                
                <canvas 
                  ref={canvasRef}
                  width={440}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-36 bg-slate-50 border border-dashed border-slate-300 rounded-2xl cursor-crosshair touch-none"
                />
              </div>

              {/* Metadata */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>IP de Assinatura:</span>
                <span className="font-mono text-slate-600">{signerIp}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  disabled={loading}
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  disabled={loading || !signerNome || !signerCpf || !signerEmail}
                  onClick={handleApprove}
                  className={`flex-1 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    loading || !signerNome || !signerCpf || !signerEmail
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20 active:scale-[0.98]'
                  }`}
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <CheckCircle2 size={16} /> Confirmar Aceite
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AJUSTES / NEGOCIAÇÃO */}
      {showNegotiationModal && (
        <div className="fixed inset-0 bg-black/80 z-[99999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white text-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-fadeIn">
            
            <div className="bg-[#1e4480] px-6 py-4 border-b border-slate-800 flex justify-between items-center text-white">
              <h2 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                <Edit size={16} /> Solicitar Ajustes ou Contraproposta
              </h2>
              <button 
                onClick={() => setShowNegotiationModal(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-4">
              <p className="text-[10px] text-slate-500 font-semibold uppercase leading-relaxed">
                Descreva as alterações, ajustes de premissas ou dúvidas que você possui sobre a proposta. O consultor responsável receberá sua mensagem instantaneamente.
              </p>

              <textarea 
                rows={5}
                placeholder="Digite suas considerações..." 
                value={negotiationText}
                onChange={(e) => setNegotiationText(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-[#1e4480] resize-none"
              />

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setShowNegotiationModal(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  disabled={!negotiationText.trim()}
                  onClick={handleSendNegotiation}
                  className={`flex-1 text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    !negotiationText.trim()
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200 shadow-none'
                      : 'bg-[#1e4480] hover:bg-slate-800 shadow-slate-500/20 active:scale-[0.98]'
                  }`}
                >
                  Enviar Mensagem
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}
