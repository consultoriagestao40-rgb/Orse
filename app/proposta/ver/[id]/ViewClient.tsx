'use client';

import React, { useState, useEffect, useRef } from 'react';
import DocumentoA4 from '@/components/DocumentoA4';
import PropostaApresentacao from '@/components/PropostaApresentacao';
import PropostaApresentacaoPrint from '@/components/PropostaApresentacaoPrint';
import { aprovarPropostaAction } from '@/app/propostas-comerciais/actions';
import { getTemplates } from '@/app/contratos/actions';
import { 
  CheckCircle, Edit, FileText, X, Printer, CheckCircle2, ShieldCheck, Mail, MapPin, 
  Smartphone, User, Presentation, Calculator, BookOpen, ChevronRight, TrendingUp,
  UserCheck, ClipboardList, Package, Layers, Info
} from 'lucide-react';

export default function ViewClient({ doc, fullProposta }: { doc: any, fullProposta: any }) {
  const [loading, setLoading] = useState(false);
  const [approved, setApproved] = useState(doc.statusAssinatura === 'ASSINADO');
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showNegotiationModal, setShowNegotiationModal] = useState(false);

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

  // 1. Temporarily write tenant credentials into sb_user cookie for logo binding
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

  // Signature Canvas Drawing Handlers
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

  const stopDrawing = () => { setIsDrawing(false); };
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
    
    // Check if empty signature
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

  // -------------------------------------------------------------
  // CONTROLE DO MENU LATERAL E VISIBILIDADE DAS ABAS
  // -------------------------------------------------------------
  const tabsConfig = doc.configApresentacao?.clientTabs || {
    apresentacao: true,
    proposta: true,
    fpv: true,
    minuta: false
  };

  const isSlide = !!doc.templateOrigem?.nome?.toLowerCase()?.includes('apresenta') || doc.tipo === 'SLIDE_DECK';
  const hasCanva = isSlide && !!doc.configApresentacao?.useCanva && !!doc.configApresentacao?.canvaEmbedUrl;

  const navItems = [
    { id: 'apresentacao', label: '1. Apresentação Slides', icon: Presentation, show: tabsConfig.apresentacao && hasCanva },
    { id: 'proposta', label: '2. Proposta Comercial (A4)', icon: FileText, show: tabsConfig.proposta },
    { id: 'fpv', label: '3. Planilhas FPV Detalhada', icon: Calculator, show: tabsConfig.fpv && !!fullProposta },
    { id: 'minuta', label: '4. Minuta de Contrato', icon: BookOpen, show: tabsConfig.minuta && !!doc.configApresentacao?.clientTabs?.minutaTemplateId }
  ].filter(item => item.show);

  // Define a aba ativa padrão inicial
  const getFirstActiveTab = () => {
    if (tabsConfig.apresentacao && hasCanva) return 'apresentacao';
    if (tabsConfig.proposta) return 'proposta';
    if (tabsConfig.fpv && fullProposta) return 'fpv';
    if (tabsConfig.minuta && doc.configApresentacao?.clientTabs?.minutaTemplateId) return 'minuta';
    return 'proposta';
  };

  const [activeClientTab, setActiveClientTab] = useState<string>('proposta');

  useEffect(() => {
    setActiveClientTab(getFirstActiveTab());
  }, [doc]);

  // -------------------------------------------------------------
  // CONTROLE DAS PLANILHAS FINANCEIRAS FPV DETALHADAS (ABAS 02 A 09)
  // -------------------------------------------------------------
  const [activeFpvTab, setActiveFpvTab] = useState<'premissas' | 'encargos' | 'equipe' | 'insumos' | 'extrato' | 'resumo'>('resumo');

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

  const sumGroup = (g: any) => g ? Object.values(g).reduce((a: any, b: any) => a + Number(b), 0) as number : 0;
  const totalGeralEncargos = fullProposta?.encargos?.grupoA ? (sumGroup(fullProposta.encargos.grupoA) + sumGroup(fullProposta.encargos.grupoB) + sumGroup(fullProposta.encargos.grupoC) + sumGroup(fullProposta.encargos.grupoD) + sumGroup(fullProposta.encargos.grupoE) + sumGroup(fullProposta.encargos.grupoF)) : 0;

  // -------------------------------------------------------------
  // MOTOR DE LEITURA E SUBSTITUIÇÃO DE CLÁUSULAS DA MINUTA (ABA 04)
  // -------------------------------------------------------------
  const [minutaClausulas, setMinutaClausulas] = useState<any[]>([]);
  const [loadingMinuta, setLoadingMinuta] = useState(false);

  const replaceContractTags = (text: string) => {
    let t = text || '';
    const dateStr = new Date().toLocaleDateString('pt-BR');
    const valorMensal = versao?.resultado?.valorTotalMensal || doc.valorTotal || 0;
    
    let tableItens = '';
    if (fullProposta?.equipe) {
      tableItens = fullProposta.equipe.map((i: any) => `${i.quantidade || 1}x ${i.nomeCargo} (${i.escala || ''})`).join(', ');
    }

    const numFormatted = String(doc.proposta?.numero || '').padStart(3, '0');
    const versaoFormatted = String(versao?.versao || 1).padStart(2, '0');
    const tagNumFpv = `FPV-${numFormatted}-REV-${versaoFormatted}`;

    t = t.replace(/\[RAZAO_SOCIAL_CLIENTE\]/g, doc.client?.razaoSocial || doc.client?.nomeFantasia || '');
    t = t.replace(/\[CNPJ_CLIENTE\]/g, doc.client?.cnpj || '');
    t = t.replace(/\[ENDERECO_CLIENTE\]/g, doc.client?.endereco || '');
    t = t.replace(/\[RAZAO_SOCIAL_EMISSORA\]/g, doc.empresaEmissora?.razaoSocial || doc.empresaEmissora?.nomeFantasia || '');
    t = t.replace(/\[CNPJ_EMISSORA\]/g, doc.empresaEmissora?.cnpj || '');
    t = t.replace(/\[ENDERECO_EMISSORA\]/g, doc.empresaEmissora?.endereco || '');
    t = t.replace(/\[CIDADE_EMISSORA\]/g, doc.empresaEmissora?.cidade || 'Curitiba/PR'); 
    t = t.replace(/\[DATA_ATUAL\]/g, dateStr);
    t = t.replace(/\[NUMERO_FPV\]/g, tagNumFpv);
    t = t.replace(/\[TABELA_ITENS_FPV\]/g, tableItens);
    t = t.replace(/\[VALOR_MENSAL\]/g, formatCurrency(valorMensal));
    t = t.replace(/\[VIGENCIA_MESES\]/g, '12');
    t = t.replace(/\[DATA_INICIO\]/g, '-');
    return t;
  };

  useEffect(() => {
    async function loadMinuta() {
      const templateId = doc.configApresentacao?.clientTabs?.minutaTemplateId;
      if (!templateId) return;
      setLoadingMinuta(true);
      try {
        const res = await getTemplates();
        if (res.success && res.data) {
          const matchingTemplate = res.data.find((t: any) => t.id === templateId);
          if (matchingTemplate && matchingTemplate.clausulas) {
            const formatted = matchingTemplate.clausulas.map((c: any) => ({
              ...c,
              texto: replaceContractTags(c.texto)
            }));
            setMinutaClausulas(formatted);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar template da minuta:', err);
      } finally {
        setLoadingMinuta(false);
      }
    }
    if (activeClientTab === 'minuta') {
      loadMinuta();
    }
  }, [activeClientTab]);

  return (
    <div className="bg-slate-900 w-full min-h-screen text-white font-sans overflow-x-hidden pb-10 select-none">
      
      {/* HEADER DE STATUS & AÇÃO RÁPIDA (Comercial / Cliente) */}
      <header className="bg-[#1B4D3E] border-b border-[#13382D] px-6 py-4 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 print:hidden relative z-50">
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
      </header>

      {/* WORKSPACE DIVIDIDO (SIDEBAR + MAIN CANVAS) */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row p-4 md:p-8 gap-6 print:p-0 print:m-0">
        
        {/* SIDEBAR DE TABS DE NAVEGAÇÃO */}
        <aside className="w-full md:w-64 shrink-0 space-y-4 print:hidden">
          <div className="bg-slate-950/60 border border-white/5 rounded-3xl p-5 space-y-3 backdrop-blur-md">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-2 px-1">
              Menu de Navegação
            </span>
            <div className="flex flex-col gap-1.5">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveClientTab(item.id)}
                  className={`w-full text-left px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-3 active:scale-[0.98] cursor-pointer border ${
                    activeClientTab === item.id
                      ? 'bg-gradient-to-r from-[#1B4D3E]/30 to-[#1b4d3e]/10 border-emerald-500/20 text-emerald-300 shadow-md shadow-emerald-950/20'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <item.icon size={16} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* STATUS BOX IN SIDEBAR */}
          <div className="bg-slate-950/40 border border-white/5 rounded-3xl p-5 space-y-3 backdrop-blur-sm">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block mb-1 px-1">
              Status da Proposta
            </span>
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${approved ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-amber-500 shadow-lg shadow-amber-500/30'} animate-pulse shrink-0`} />
              <div>
                <div className="text-[10px] font-black text-white uppercase tracking-wider">
                  {approved ? 'Assinada Eletronicamente' : 'Pendente de Análise'}
                </div>
                <div className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                  {approved ? 'Aceite Comercial Registrado' : 'Aguardando Aprovação'}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTAINER PRINCIPAL DE CONTEÚDO (CANVAS) */}
        <main className="flex-1 min-h-[600px] print:w-full print:p-0 print:m-0">

          {/* 1. ABA: APRESENTAÇÃO CANVA */}
          {activeClientTab === 'apresentacao' && hasCanva && (
            <div className="space-y-6 animate-fadeIn print:hidden">
              <div className="bg-[#1B4D3E]/30 border border-emerald-500/20 rounded-3xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                    <CheckCircle size={16} />
                  </div>
                  <div>
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-200">Apresentação Canva Premium Ativa</h4>
                    <p className="text-[9.5px] text-slate-400 font-bold uppercase mt-0.5">Navegue pelas lâminas de apresentação widescreen e transições originais.</p>
                  </div>
                </div>
                <a
                  href={doc.configApresentacao.canvaEmbedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white font-black text-[9px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all border border-white/15 cursor-pointer whitespace-nowrap"
                >
                  Tela Cheia ↗
                </a>
              </div>

              {/* Iframe 16:9 */}
              <div className="w-full aspect-[16/9] bg-slate-950 overflow-hidden relative rounded-3xl shadow-2xl border border-white/10 shadow-emerald-950/5">
                <iframe
                  src={doc.configApresentacao.canvaEmbedUrl}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full border-none p-0 m-0"
                  allowFullScreen
                  allow="fullscreen"
                />
              </div>
            </div>
          )}

          {/* 2. ABA: PROPOSTA COMERCIAL A4 */}
          {activeClientTab === 'proposta' && (
            <div className="max-w-[960px] mx-auto bg-white rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-950/20 print:p-0 print:shadow-none">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center print:hidden flex items-center justify-center gap-2 border-b border-slate-100 pb-3">
                📄 Documento Comercial de Aceite (A4)
              </h3>
              <div className="text-slate-800">
                <DocumentoA4 
                  proposta={mergedProposta} 
                  resultado={versao?.resultado} 
                  empresaEmissora={doc.empresaEmissora} 
                />
              </div>
            </div>
          )}

          {/* 3. ABA: FPV DETALHADA */}
          {activeClientTab === 'fpv' && fullProposta && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Menu secundário horizontal para abas financeiras */}
              <div className="bg-slate-950/60 p-2 border border-white/5 rounded-3xl flex overflow-x-auto gap-2 scrollbar-none print:hidden">
                {[
                  { id: 'premissas', label: '2. Premissas', icon: TrendingUp },
                  { id: 'encargos', label: '3. Encargos', icon: Layers },
                  { id: 'equipe', label: '4. Quadro Equipe', icon: UserCheck },
                  { id: 'insumos', label: '5-7. Insumos', icon: Package },
                  { id: 'extrato', label: '8. Custos (Planilha)', icon: ClipboardList },
                  { id: 'resumo', label: '9. Preço & Resumo', icon: Info },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveFpvTab(t.id as any)}
                    className={`px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                      activeFpvTab === t.id
                        ? 'bg-[#10B981] text-white shadow-lg shadow-emerald-950/20'
                        : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    <t.icon size={13} />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* RENDER OPERACIONAL DE CADA ABA FPV */}
              <div className="bg-white rounded-3xl p-6 md:p-8 text-slate-800 shadow-2xl shadow-slate-950/20">

                {/* Sub-Aba 2: Premissas do Projeto */}
                {activeFpvTab === 'premissas' && (
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-3 flex items-center gap-2">
                      <TrendingUp size={16} className="text-emerald-600" /> Premissas de Taxas e Impostos
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Taxa Administrativa</span>
                        <span className="text-2xl font-black text-[#1B4D3E] mt-2">{(fullProposta.premissas?.taxaAdm || 0).toFixed(2)}%</span>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Margem de Lucro</span>
                        <span className="text-2xl font-black text-[#1B4D3E] mt-2">{(fullProposta.premissas?.margemLucro || 0).toFixed(2)}%</span>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Comissão Comercial</span>
                        <span className="text-2xl font-black text-[#1B4D3E] mt-2">{(fullProposta.premissas?.comissaoVendedor || 0).toFixed(2)}%</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl border border-slate-150 overflow-hidden mt-6">
                      <div className="bg-[#1B4D3E] text-white font-bold uppercase text-[10px] py-3.5 px-5 tracking-wider">
                        Tributos e Impostos Incidentes
                      </div>
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-100 text-slate-500 font-extrabold text-[9px] uppercase border-b border-slate-200">
                            <th className="py-2.5 px-6">Tributo</th>
                            <th className="py-2.5 px-6 text-right w-36">Percentual (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(fullProposta.premissas?.tributos || []).map((t: any, i: number) => (
                            <tr key={t.id || i} className="border-b border-slate-200 last:border-0 hover:bg-slate-50 bg-white">
                              <td className="py-3 px-6 font-semibold uppercase text-slate-700">{t.nome}</td>
                              <td className="py-3 px-6 text-right font-bold text-slate-800">{(t.percent || 0).toFixed(2)}%</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-emerald-50 text-[#1B4D3E] font-black border-t border-slate-250">
                            <td className="py-3.5 px-6 uppercase tracking-wider text-[10px]">Alíquota Efetiva de Impostos</td>
                            <td className="py-3.5 px-6 text-right">
                              {((fullProposta.premissas?.tributos || []).reduce((acc: number, t: any) => acc + (t.percent || 0), 0)).toFixed(2)}%
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub-Aba 3: Encargos Sociais */}
                {activeFpvTab === 'encargos' && (
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-3 flex items-center gap-2">
                      <Layers size={16} className="text-emerald-600" /> Detalhamento de Encargos Sociais CLT
                    </h3>
                    <div className="space-y-4">
                      {[
                        { id: 'grupoA', title: 'Grupo A - Encargos Básicos (INSS, FGTS, Seguro Acidente...)', data: fullProposta.encargos?.grupoA },
                        { id: 'grupoB', title: 'Grupo B - Provisões Trabalhistas (Férias, 13º Salário, Terço...)', data: fullProposta.encargos?.grupoB },
                        { id: 'grupoC', title: 'Grupo C - Afastamentos e Indenizações (Aviso Prévio, Multa FGTS...)', data: fullProposta.encargos?.grupoC },
                        { id: 'grupoD', title: 'Grupo D - Reincidência de Encargos Sociais', data: fullProposta.encargos?.grupoD },
                        { id: 'grupoE', title: 'Grupo E - Custos Sociais e Outros Custos', data: fullProposta.encargos?.grupoE },
                        { id: 'grupoF', title: 'Grupo F - Benefícios Obrigatórios CCT', data: fullProposta.encargos?.grupoF },
                      ].map((grp) => {
                        if (!grp.data) return null;
                        return (
                          <div key={grp.id} className="bg-slate-50 rounded-2xl border border-slate-150 overflow-hidden">
                            <div className="bg-slate-700 text-white font-bold uppercase text-[9px] py-2.5 px-5 tracking-wider">
                              {grp.title}
                            </div>
                            <table className="w-full text-left border-collapse text-[11px]">
                              <tbody>
                                {Object.entries(grp.data).map(([key, val]: any) => (
                                  <tr key={key} className="border-b border-slate-200 last:border-0 hover:bg-slate-50 bg-white">
                                    <td className="py-2.5 px-6 font-bold uppercase text-slate-500 text-[9px]">
                                      {key === 'previdenciaSocial' ? 'INSS - PREVIDENCIA SOCIAL' : key.replace(/([A-Z])/g, ' $1').trim()}
                                    </td>
                                    <td className="py-2.5 px-6 text-right font-black text-slate-800 w-32">
                                      {Number(val).toFixed(2)}%
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                              <tfoot>
                                <tr className="bg-emerald-50 text-[#1B4D3E] font-black border-t border-slate-200">
                                  <td className="py-2.5 px-6 text-[9.5px] uppercase">Total do Grupo</td>
                                  <td className="py-2.5 px-6 text-right">
                                    {sumGroup(grp.data).toFixed(2)}%
                                  </td>
                                </tr>
                              </tfoot>
                            </table>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Sub-Aba 4: Quadro de Equipe / Colaboradores */}
                {activeFpvTab === 'equipe' && (
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-3 flex items-center gap-2">
                      <UserCheck size={16} className="text-emerald-600" /> Quadro de Mão de Obra e Postos
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#1B4D3E] text-white text-[9.5px] font-black uppercase tracking-wider">
                            <th className="px-5 py-3 w-12 text-center">Item</th>
                            <th className="px-5 py-3">Cargo / Função</th>
                            <th className="px-5 py-3 text-center">Escala</th>
                            <th className="px-5 py-3 text-center">Qtd.</th>
                            <th className="px-5 py-3 text-right">Piso Salarial (R$)</th>
                            <th className="px-5 py-3 text-right">Adicionais (R$)</th>
                            <th className="px-5 py-3 text-right">Valor Venda Unit (R$)</th>
                            <th className="px-5 py-3 text-right">Valor Venda Total (R$)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fullProposta.equipe.map((p: any, idx: number) => {
                            const itemRes = versao?.resultado?.items?.find((x: any) => x.id === p.id);
                            const totalVenda = itemRes?.precoVenda || 0;
                            const isSpotItem = p.tipoItem === 'SPOT';
                            const qty = isSpotItem ? (p.quantidadeDemanda || 1) : (p.quantidade || 1);
                            const valorVendaUnit = qty > 0 ? (totalVenda / qty) : 0;
                            return (
                              <tr key={p.id || idx} className={`border-b border-slate-200 hover:bg-slate-50 bg-white ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                                <td className="px-5 py-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                                <td className="px-5 py-3.5 font-bold text-slate-800">{p.nomeCargo}</td>
                                <td className="px-5 py-3.5 text-center font-semibold text-slate-500">{p.escala || '-'}</td>
                                <td className="px-5 py-3.5 text-center font-black text-slate-800">{qty}</td>
                                <td className="px-5 py-3.5 text-right font-medium">{formatCurrency(p.salarioBase || 0)}</td>
                                <td className="px-5 py-3.5 text-right font-medium">{formatCurrency((p.adicionalPericulosidade || 0) + (p.adicionalInsalubridade || 0) + (p.adicionalNoturno || 0))}</td>
                                <td className="px-5 py-3.5 text-right font-bold text-slate-700">{formatCurrency(valorVendaUnit)}</td>
                                <td className="px-5 py-3.5 text-right font-black text-emerald-800 bg-emerald-50/50">{formatCurrency(totalVenda)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub-Aba 5-7: Insumos, Materiais, Máquinas */}
                {activeFpvTab === 'insumos' && (
                  <div className="space-y-8 animate-fadeIn">
                    
                    {/* MATERIAIS */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        📦 Materiais e Insumos Fisiológicos
                      </h4>
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase border-b border-slate-200">
                              <th className="px-5 py-2.5 w-16">Código</th>
                              <th className="px-5 py-2.5">Descrição</th>
                              <th className="px-5 py-2.5 text-right">Preço Unitário</th>
                              <th className="px-5 py-2.5 text-center w-24">Qtd.</th>
                              <th className="px-5 py-2.5 text-center w-24">Vida Útil (Meses)</th>
                              <th className="px-5 py-2.5 text-right">Custo Mensal (Venda)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(fullProposta.insumos?.detalheMateriais || []).map((item: any) => (
                              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 bg-white">
                                <td className="px-5 py-3 font-mono text-[10px] text-slate-400">{item.codigo}</td>
                                <td className="px-5 py-3 font-bold text-slate-700">{item.descricao}</td>
                                <td className="px-5 py-3 text-right">{formatCurrency(item.precoUnitario)}</td>
                                <td className="px-5 py-3 text-center font-black">{item.quantidade}</td>
                                <td className="px-5 py-3 text-center">{item.vidaUtil}</td>
                                <td className="px-5 py-3 text-right font-black text-[#1B4D3E] bg-emerald-50/20">{formatCurrency(item.custoMensal)}</td>
                              </tr>
                            ))}
                            {(fullProposta.insumos?.detalheMateriais || []).length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-6 text-center text-slate-400 italic bg-white">Nenhum material cadastrado nesta proposta.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* MÁQUINAS */}
                    <div className="space-y-4 pt-4">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        ⚙️ Máquinas e Equipamentos
                      </h4>
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase border-b border-slate-200">
                              <th className="px-5 py-2.5 w-16">Código</th>
                              <th className="px-5 py-2.5">Descrição</th>
                              <th className="px-5 py-2.5 text-right">Preço Unitário</th>
                              <th className="px-5 py-2.5 text-center w-24">Qtd.</th>
                              <th className="px-5 py-2.5 text-center w-24">Vida Útil (Meses)</th>
                              <th className="px-5 py-2.5 text-right">Custo Mensal (Venda)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(fullProposta.insumos?.detalheMaquinas || []).map((item: any) => (
                              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 bg-white">
                                <td className="px-5 py-3 font-mono text-[10px] text-slate-400">{item.codigo}</td>
                                <td className="px-5 py-3 font-bold text-slate-700">{item.descricao}</td>
                                <td className="px-5 py-3 text-right">{formatCurrency(item.precoUnitario)}</td>
                                <td className="px-5 py-3 text-center font-black">{item.quantidade}</td>
                                <td className="px-5 py-3 text-center">{item.vidaUtil}</td>
                                <td className="px-5 py-3 text-right font-black text-[#1B4D3E] bg-emerald-50/20">{formatCurrency(item.custoMensal)}</td>
                              </tr>
                            ))}
                            {(fullProposta.insumos?.detalheMaquinas || []).length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-6 text-center text-slate-400 italic bg-white">Nenhum equipamento cadastrado.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* DESCARTÁVEIS */}
                    <div className="space-y-4 pt-4">
                      <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        🧻 Descartáveis e EPIs
                      </h4>
                      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="bg-slate-100 text-slate-500 text-[9px] font-black uppercase border-b border-slate-200">
                              <th className="px-5 py-2.5 w-16">Código</th>
                              <th className="px-5 py-2.5">Descrição</th>
                              <th className="px-5 py-2.5 text-right">Preço Unitário</th>
                              <th className="px-5 py-2.5 text-center w-24">Qtd.</th>
                              <th className="px-5 py-2.5 text-center w-24">Vida Útil (Meses)</th>
                              <th className="px-5 py-2.5 text-right">Custo Mensal (Venda)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(fullProposta.insumos?.detalheDescartaveis || []).map((item: any) => (
                              <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50 bg-white">
                                <td className="px-5 py-3 font-mono text-[10px] text-slate-400">{item.codigo}</td>
                                <td className="px-5 py-3 font-bold text-slate-700">{item.descricao}</td>
                                <td className="px-5 py-3 text-right">{formatCurrency(item.precoUnitario)}</td>
                                <td className="px-5 py-3 text-center font-black">{item.quantidade}</td>
                                <td className="px-5 py-3 text-center">{item.vidaUtil}</td>
                                <td className="px-5 py-3 text-right font-black text-[#1B4D3E] bg-emerald-50/20">{formatCurrency(item.custoMensal)}</td>
                              </tr>
                            ))}
                            {(fullProposta.insumos?.detalheDescartaveis || []).length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-6 py-6 text-center text-slate-400 italic bg-white">Nenhum descartável/EPI cadastrado.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}

                {/* Sub-Aba 8: Planilha de Custos / Extrato */}
                {activeFpvTab === 'extrato' && (
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-3 flex items-center gap-2">
                      <ClipboardList size={16} className="text-emerald-600" /> Planilha de Composição de Custos Unitários
                    </h3>
                    <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#1B4D3E] text-white text-[9.5px] font-black uppercase tracking-wider border-b border-slate-200">
                            <th className="px-5 py-3">Montantes de Custos (Composição)</th>
                            <th className="px-5 py-3 text-center w-32">Percentual (%)</th>
                            <th className="px-5 py-3 text-right w-44">Valor Mensal (R$)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Montante A */}
                          <tr className="bg-slate-100 text-slate-700 font-extrabold text-[9.5px] uppercase border-y border-slate-200">
                            <td colSpan={3} className="px-5 py-2 tracking-wider">Montante "A" - Mão-de-Obra Direta</td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-white">
                            <td className="px-5 py-2.5 pl-8 text-slate-600">1. Piso Salarial / Remuneração Base</td>
                            <td className="px-5 py-2.5 text-center text-slate-400">-</td>
                            <td className="px-5 py-2.5 text-right font-medium text-slate-700">
                              {formatCurrency(versao?.resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.remuneracao || 0) * i.quantidade), 0))}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-white">
                            <td className="px-5 py-2.5 pl-8 text-slate-600">2. Encargos Sociais CLT</td>
                            <td className="px-5 py-2.5 text-center font-bold text-slate-500">{totalGeralEncargos.toFixed(2)}%</td>
                            <td className="px-5 py-2.5 text-right font-medium text-slate-700">
                              {formatCurrency(versao?.resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.encargos || 0) * i.quantidade), 0))}
                            </td>
                          </tr>
                          <tr className="bg-emerald-50/30 font-bold border-b border-slate-200">
                            <td className="px-5 py-2.5 uppercase text-[#1B4D3E] text-[9px] tracking-wider">Subtotal Montante "A"</td>
                            <td className="px-5 py-2.5 text-center text-slate-400">-</td>
                            <td className="px-5 py-2.5 text-right text-[#1B4D3E]">
                              {formatCurrency(versao?.resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.blocoA || 0) * i.quantidade), 0))}
                            </td>
                          </tr>

                          {/* Montante B */}
                          <tr className="bg-slate-100 text-slate-700 font-extrabold text-[9.5px] uppercase border-y border-slate-200">
                            <td colSpan={3} className="px-5 py-2 tracking-wider">Montante "B" - Insumos Operacionais</td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-white">
                            <td className="px-5 py-2.5 pl-8 text-slate-600">1. Materiais de Limpeza e EPIs</td>
                            <td className="px-5 py-2.5 text-center text-slate-400">-</td>
                            <td className="px-5 py-2.5 text-right font-medium text-slate-700">
                              {formatCurrency(versao?.resultado?.items?.reduce((acc: number, i: any) => acc + (((i.detalhes?.detalheBlocoB?.materiais || 0) + (i.detalhes?.detalheBlocoB?.descartaveis || 0)) * i.quantidade), 0))}
                            </td>
                          </tr>
                          <tr className="hover:bg-slate-50 bg-white">
                            <td className="px-5 py-2.5 pl-8 text-slate-600">2. Máquinas e Equipamentos Operacionais</td>
                            <td className="px-5 py-2.5 text-center text-slate-400">-</td>
                            <td className="px-5 py-2.5 text-right font-medium text-slate-700">
                              {formatCurrency(versao?.resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.detalheBlocoB?.maquinas || 0) * i.quantidade), 0))}
                            </td>
                          </tr>
                          <tr className="bg-emerald-50/30 font-bold border-b border-slate-200">
                            <td className="px-5 py-2.5 uppercase text-[#1B4D3E] text-[9px] tracking-wider">Subtotal Montante "B"</td>
                            <td className="px-5 py-2.5 text-center text-slate-400">-</td>
                            <td className="px-5 py-2.5 text-right text-[#1B4D3E]">
                              {formatCurrency(versao?.resultado?.items?.reduce((acc: number, i: any) => acc + ((i.detalhes?.blocoB || 0) * i.quantidade), 0))}
                            </td>
                          </tr>

                          {/* Total Direto */}
                          <tr className="bg-slate-200 font-black text-slate-800 border-y border-slate-350 text-[10px] uppercase">
                            <td className="px-5 py-3">Total dos Montantes Diretos (A + B)</td>
                            <td className="px-5 py-3 text-center">-</td>
                            <td className="px-5 py-3 text-right">
                              {formatCurrency(versao?.resultado?.items?.reduce((acc: number, i: any) => acc + (((i.detalhes?.blocoA || 0) + (i.detalhes?.blocoB || 0)) * i.quantidade), 0))}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Sub-Aba 9: Resumo e Formação do Preço */}
                {activeFpvTab === 'resumo' && (
                  <div className="space-y-6">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b pb-3 flex items-center gap-2">
                      <Info size={16} className="text-emerald-600" /> Resumo FPV e Preço Proposto
                    </h3>

                    {/* Preço de Venda em destaque */}
                    <div className="bg-[#1B4D3E] text-white p-8 rounded-3xl text-center space-y-2 border border-[#13382D] shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300 relative z-10">Valor Total Mensal Proposto</span>
                      <h2 className="text-3xl md:text-5xl font-black relative z-10 tracking-tight">
                        {formatCurrency(versao?.resultado?.valorTotalMensal || doc.valorTotal || 0)}
                      </h2>
                      <p className="text-[9.5px] text-slate-300/80 font-bold uppercase tracking-wider pt-2 relative z-10">
                        * Contempla todos os encargos, tributos indiretos e taxas operacionais aplicadas.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Margens Operacionais</span>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-600">Resultado Lucro Bruto:</span>
                            <span className="text-emerald-800">{formatCurrency(versao?.resultado?.dre?.margemBruta || 0)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-600">Alíquota Média:</span>
                            <span className="text-slate-800">{(fullProposta.premissas?.margemLucro || 0).toFixed(2)}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Impostos Totais Faturados</span>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-600">Valor Acumulado de Impostos:</span>
                            <span className="text-red-700">{formatCurrency(versao?.resultado?.dre?.impostos || 0)}</span>
                          </div>
                          <div className="flex justify-between font-bold">
                            <span className="text-slate-600">Alíquota Efetiva:</span>
                            <span className="text-slate-800">
                              {((fullProposta.premissas?.tributos || []).reduce((acc: number, t: any) => acc + (t.percent || 0), 0)).toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}

          {/* 4. ABA: MINUTA DO CONTRATO DINÂMICA */}
          {activeClientTab === 'minuta' && (
            <div className="max-w-[960px] mx-auto bg-white rounded-3xl p-6 md:p-10 shadow-2xl shadow-slate-950/20 text-slate-800 animate-fadeIn relative">
              
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 text-center print:hidden flex items-center justify-center gap-2 border-b border-slate-100 pb-3">
                ⚖️ Minuta Padrão de Contrato
              </h3>

              {loadingMinuta ? (
                <div className="py-20 text-center text-slate-400 font-bold uppercase animate-pulse">
                  Processando minuta de contrato...
                </div>
              ) : minutaClausulas.length === 0 ? (
                <div className="py-20 text-center text-slate-400 italic">
                  Nenhuma minuta vinculada ou cadastrada para esta proposta.
                </div>
              ) : (
                <div className="space-y-8 max-w-4xl mx-auto leading-relaxed text-slate-800 text-sm">
                  
                  {/* CABEÇALHO DA MINUTA */}
                  <div className="text-center space-y-4 mb-8">
                    <h4 className="font-extrabold uppercase text-lg tracking-wide border-b pb-4">
                      MINUTA DE CONTRATO DE PRESTAÇÃO DE SERVIÇOS
                    </h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                      DOCUMENTO DE AUDITORIA INTERNA · NÃO ASSINADO
                    </p>
                  </div>

                  {/* CLAUSULAS */}
                  <div className="space-y-6">
                    {minutaClausulas.map((c: any, index: number) => (
                      <div key={c.id || index} className="space-y-2">
                        <h4 className="font-black text-slate-900 uppercase text-xs tracking-wider">
                          {c.titulo}
                        </h4>
                        <p className="text-slate-700 whitespace-pre-line text-xs font-semibold leading-relaxed">
                          {c.texto}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ASSINATURAS MOCK NA MINUTA */}
                  <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-200 text-center text-xs">
                    <div className="space-y-4">
                      <div className="h-10 border-b border-slate-400" />
                      <div>
                        <div className="font-black text-slate-800 uppercase">
                          {doc.empresaEmissora?.razaoSocial || doc.empresaEmissora?.nomeFantasia}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          CONTRATADA (PROPONENTE)
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="h-10 border-b border-slate-400 flex items-center justify-center font-mono text-[9px] text-[#1B4D3E]">
                        {approved ? (
                          <span className="font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            ✓ Assinado Eletronicamente
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pendente de assinatura</span>
                        )}
                      </div>
                      <div>
                        <div className="font-black text-slate-800 uppercase">
                          {doc.client?.razaoSocial || doc.client?.nomeFantasia}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                          CONTRATANTE (CLIENTE)
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

        </main>
      </div>

      {/* BOTÃO FLUTUANTE DE IMPRESSÃO */}
      <button
        onClick={() => {
          window.print();
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
                className="text-white/60 hover:text-white transition-colors cursor-pointer"
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
                className="text-white/60 hover:text-white transition-colors cursor-pointer"
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
