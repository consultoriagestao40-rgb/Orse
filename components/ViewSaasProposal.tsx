'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, Check, Sparkles, Building2, User, Users, Phone, 
  Mail, Calendar, ArrowRight, Lock, CheckCircle2, QrCode, 
  Copy, ExternalLink, Zap, Layers, Cpu, Award, HelpCircle,
  FileText, Clock, Server, CheckCircle, MessageCircle, AlertCircle
} from 'lucide-react';
import { signSaasProposta } from '@/app/admin/saas-crm/actions';
import { SAAS_AVAILABLE_MODULES } from '@/app/admin/saas-crm/constants';

interface ViewSaasProposalProps {
  proposta: {
    id: string;
    token: string;
    empresaNome: string;
    cnpj?: string | null;
    contatoNome: string;
    contatoEmail: string;
    contatoTelefone: string;
    modulosArray: string[];
    plano: string;
    valorMensal: number;
    valorSetup: number;
    descontoSetup: number;
    maxUsuarios: number;
    condicoesEspeciais?: string | null;
    status: string;
    assinadoEm?: string | Date | null;
    assinadoPorNome?: string | null;
    assinadoPorCpf?: string | null;
    asaasPixQrCode?: string | null;
    asaasPixCopiaECola?: string | null;
    createdAt: string | Date;
  };
}

export default function ViewSaasProposal({ proposta }: ViewSaasProposalProps) {
  const [nome, setNome] = useState(proposta.assinadoPorNome || proposta.contatoNome || '');
  const [cpfOuCargo, setCpfOuCargo] = useState(proposta.assinadoPorCpf || '');
  const [concordo, setConcordo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [propostaState, setPropostaState] = useState(proposta);
  const [copiado, setCopiado] = useState(false);

  const isAssinada = propostaState.status === 'ASSINADA' || propostaState.status === 'PAGA';
  const setupLiquido = Math.max(0, propostaState.valorSetup - propostaState.descontoSetup);

  // Módulos contratados
  const modulosContratados = SAAS_AVAILABLE_MODULES.filter((m) =>
    propostaState.modulosArray.includes(m.id)
  );

  const fmt = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const dataEmissao = new Date(propostaState.createdAt).toLocaleDateString('pt-BR');
  const validadeData = new Date(new Date(propostaState.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR');

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !cpfOuCargo.trim()) {
      alert('Por favor, informe seu nome completo e CPF ou Cargo para assinar a proposta.');
      return;
    }
    if (!concordo) {
      alert('Por favor, marque a caixa confirmando o aceite dos termos.');
      return;
    }

    setLoading(true);
    try {
      const res = await signSaasProposta(propostaState.token, {
        nome,
        cpfOuCargo,
      });

      if (res.success && res.proposta) {
        setPropostaState({
          ...propostaState,
          ...res.proposta,
          modulosArray: propostaState.modulosArray,
        });
      } else {
        alert(res.error || 'Erro ao assinar proposta.');
      }
    } catch (err: any) {
      alert('Falha na conexão: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (propostaState.asaasPixCopiaECola) {
      navigator.clipboard.writeText(propostaState.asaasPixCopiaECola);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 3000);
    }
  };

  return (
    <div className="bg-[#FAFBFD] min-h-screen text-slate-800 font-sans selection:bg-[#1B4D3E] selection:text-white">
      {/* 1. Header Fixo com Branding SmartBid Oficial */}
      <header className="sticky top-0 z-50 bg-[#1B4D3E] text-white shadow-md border-b border-[#143d31]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center font-black text-lg text-emerald-300 shadow-sm">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight">SmartBid Hub</span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                  Proposta Oficial
                </span>
              </div>
              <p className="text-[11px] text-white/70 font-medium hidden sm:block">
                Software de Gestão Comercial, Engenharia de Custos e FPV para Facilities
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAssinada ? (
              <div className="flex items-center gap-1.5 bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                <CheckCircle2 size={14} className="text-emerald-300" />
                <span>Assinada</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-300/40 text-amber-200 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm">
                <Clock size={14} className="animate-pulse" />
                <span>Aguardando Assinatura</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Container Central */}
      <main className="max-w-5xl mx-auto py-8 sm:py-12 px-4 sm:px-6 space-y-8">
        
        {/* Banner de Boas-Vindas & Apresentação */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#1B4D3E] via-emerald-500 to-[#1B4D3E] absolute top-0 left-0" />
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-2 flex-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#1B4D3E] bg-[#1B4D3E]/8 px-2.5 py-1 rounded-md">
                <Sparkles size={12} />
                Proposta de Licenciamento SaaS
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {propostaState.empresaNome}
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl leading-relaxed">
                Temos o prazer de apresentar a proposta comercial para implantação da plataforma SmartBid Hub, personalizada para atender às demandas de engenharia de custos, automação de CCTs com IA e escala operacional da sua empresa.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:min-w-[260px] space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-500">
                <span>Data de Emissão:</span>
                <span className="font-bold text-slate-800">{dataEmissao}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Válida até:</span>
                <span className="font-bold text-slate-800">{validadeData}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500">
                <span>Aos cuidados de:</span>
                <span className="font-bold text-slate-800">{propostaState.contatoNome}</span>
              </div>
              {propostaState.cnpj && (
                <div className="flex justify-between items-center text-slate-500">
                  <span>CNPJ:</span>
                  <span className="font-mono text-slate-700">{propostaState.cnpj}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 3. Módulos e Escopo Técnico Contratado */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Layers size={20} className="text-[#1B4D3E]" />
                Módulos Selecionados & Escopo da Licença
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Funcionalidades inclusas no plano contratado da plataforma SmartBid Hub
              </p>
            </div>
            <span className="text-xs font-bold text-[#1B4D3E] bg-[#1B4D3E]/8 px-3 py-1 rounded-full border border-[#1B4D3E]/15">
              {modulosContratados.length} módulos inclusos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modulosContratados.map((mod) => (
              <div 
                key={mod.id}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-[#1B4D3E]/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-[#1B4D3E]/8 text-[#1B4D3E]">
                        <Cpu size={16} />
                      </div>
                      <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-tight">
                        {mod.name}
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <Check size={10} strokeWidth={3} /> Incluso
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed pl-9">
                    {mod.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Garantias Corporativas & Serviços Inclusos */}
        <section className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#1B4D3E]" />
            Garantias Corporativas & Serviços Inclusos na Licença
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
              <div className="p-2 rounded-lg bg-[#1B4D3E]/8 text-[#1B4D3E] shrink-0">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Até {propostaState.maxUsuarios} Usuários</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Perfis hierárquicos e alçadas comerciais.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
              <div className="p-2 rounded-lg bg-[#1B4D3E]/8 text-[#1B4D3E] shrink-0">
                <Server size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Nuvem 99.9% Uptime</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Infraestrutura em nuvem e backups diários.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
              <div className="p-2 rounded-lg bg-[#1B4D3E]/8 text-[#1B4D3E] shrink-0">
                <Lock size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Segurança & LGPD</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Sigilo comercial estrito de planilhas e margens.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80">
              <div className="p-2 rounded-lg bg-[#1B4D3E]/8 text-[#1B4D3E] shrink-0">
                <MessageCircle size={16} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Suporte Técnico</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Canal direto via WhatsApp com especialistas.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Resumo Financeiro & Condições Comerciais */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <Award size={20} className="text-[#1B4D3E]" />
                Condições Comerciais & Investimento
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Periodicidade contratada: <strong className="text-slate-800 uppercase">{propostaState.plano}</strong>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mensalidade */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Mensalidade da Licença
                  </span>
                  <span className="text-[11px] font-bold text-[#1B4D3E] bg-[#1B4D3E]/10 px-2 py-0.5 rounded-md">
                    Plano {propostaState.plano}
                  </span>
                </div>
                <div className="text-3xl font-black text-[#1B4D3E] mt-1">
                  {fmt(propostaState.valorMensal)}
                  <span className="text-xs font-semibold text-slate-500 ml-1.5">/mês</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Inclui suporte, atualizações contínuas de CCTs com inteligência artificial, correções e servidores em nuvem.
                </p>
              </div>
            </div>

            {/* Implantação / Setup */}
            <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Taxa Única de Setup & Treinamento
                  </span>
                  {propostaState.descontoSetup > 0 && (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Desconto de {fmt(propostaState.descontoSetup)}
                    </span>
                  )}
                </div>
                
                <div className="text-3xl font-black text-slate-900 mt-1">
                  {setupLiquido === 0 ? (
                    <span className="text-emerald-600 font-black">ISENTO (BÔNUS)</span>
                  ) : (
                    fmt(setupLiquido)
                  )}
                  {setupLiquido > 0 && (
                    <span className="text-xs font-semibold text-slate-500 ml-1.5">(taxa única)</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Configuração inicial das convenções coletivas da empresa, parametrização de encargos e treinamento da equipe.
                </p>
              </div>
            </div>
          </div>

          {propostaState.condicoesEspeciais && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900">
              <span className="font-bold uppercase tracking-wider text-[10px] block mb-1">
                Condições Especiais Acordadas:
              </span>
              <p className="whitespace-pre-line leading-relaxed">
                {propostaState.condicoesEspeciais}
              </p>
            </div>
          )}
        </section>

        {/* 6. Seção de Assinatura Digital / Status de Aceite */}
        <section className="bg-white border-2 border-[#1B4D3E]/20 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck size={22} className="text-[#1B4D3E]" />
                {isAssinada ? 'Proposta Assinada Formalmente' : 'Aceite Formal & Assinatura Digital'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {isAssinada 
                  ? 'Esta proposta já foi aprovada e assinada digitalmente pelas partes' 
                  : 'Preencha seus dados para formalizar a contratação e ativar os acessos à plataforma'}
              </p>
            </div>
          </div>

          {!isAssinada ? (
            <form onSubmit={handleSign} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    Nome Completo do Responsável Legal: *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    CPF ou Cargo na Empresa: *
                  </label>
                  <input
                    type="text"
                    required
                    value={cpfOuCargo}
                    onChange={(e) => setCpfOuCargo(e.target.value)}
                    placeholder="Ex: Diretor de Operações ou 000.000.000-00"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E]"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="concordo-termos"
                  required
                  checked={concordo}
                  onChange={(e) => setConcordo(e.target.checked)}
                  className="mt-1 h-4 w-4 text-[#1B4D3E] rounded border-slate-300 focus:ring-[#1B4D3E] cursor-pointer"
                />
                <label htmlFor="concordo-termos" className="text-xs text-slate-600 leading-relaxed cursor-pointer select-none">
                  Declaro que represento formalmente a empresa <strong className="text-slate-800">{propostaState.empresaNome}</strong> e manifesto o aceite das condições comerciais e escopo aqui descritos, autorizando o início do onboarding e faturamento da licença SmartBid Hub.
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#1B4D3E] hover:bg-[#13382D] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Processando Assinatura...</span>
                  ) : (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Assinar Digitalmente e Confirmar Contratação</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 flex items-center gap-4 text-emerald-800">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 className="font-black text-base text-emerald-900">
                    Proposta Aprovada & Assinada Digitalmente!
                  </h3>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Assinado por <strong>{propostaState.assinadoPorNome}</strong> ({propostaState.assinadoPorCpf}) em{' '}
                    {propostaState.assinadoEm ? new Date(propostaState.assinadoEm).toLocaleString('pt-BR') : 'Data confirmada'}.
                  </p>
                </div>
              </div>

              {/* PIX para ativação imediata */}
              {propostaState.asaasPixQrCode && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center space-y-4">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      Pagamento Instantâneo via PIX (Ativação Automática)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Escaneie o QR Code abaixo pelo aplicativo do seu banco:
                    </p>
                  </div>

                  <div className="inline-block p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <img 
                      src={`data:image/png;base64,${propostaState.asaasPixQrCode}`} 
                      alt="PIX QR Code" 
                      className="w-48 h-48 mx-auto object-contain" 
                    />
                  </div>

                  {propostaState.asaasPixCopiaECola && (
                    <div className="max-w-md mx-auto space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={propostaState.asaasPixCopiaECola}
                          className="w-full text-xs font-mono bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-600 truncate"
                        />
                        <button
                          type="button"
                          onClick={handleCopyPix}
                          className="bg-[#1B4D3E] hover:bg-[#13382D] text-white px-4 py-2 rounded-lg text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                        >
                          {copiado ? (
                            <>
                              <Check size={14} /> Copiado!
                            </>
                          ) : (
                            <>
                              <Copy size={14} /> Copiar PIX
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-center pt-2">
                <a
                  href={`https://wa.me/5541992823967?text=${encodeURIComponent(
                    `Olá! Acabei de assinar a proposta comercial do SmartBid Hub para a empresa ${propostaState.empresaNome}. Gostaria de agendar o início do onboarding.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold px-6 py-3 rounded-xl text-sm shadow-md transition-all active:scale-98"
                >
                  <MessageCircle size={18} />
                  <span>Falar com o Especialista de Onboarding no WhatsApp</span>
                </a>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* Footer Executivo */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p className="font-semibold text-slate-700">SmartBid Hub • Enterprise Facilities Management System</p>
        <p className="text-[11px] text-slate-400 mt-1">
          Proposta comercial confidencial emitida para {propostaState.empresaNome}. Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}
