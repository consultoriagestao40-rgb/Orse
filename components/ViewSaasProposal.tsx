'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, Check, Sparkles, Building2, User, Phone, 
  Mail, Calendar, ArrowRight, Lock, CheckCircle2, QrCode, 
  Copy, ExternalLink, Zap, Layers, Cpu, Award, HelpCircle
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
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white">
      {/* Container Principal */}
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top Header com Marca e Status */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">SmartBid Hub</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Proposta Oficial
                </span>
              </div>
              <p className="text-xs text-slate-400">Inteligência Comercial & Custos para Empresas de Facilities</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAssinada ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Proposta Aprovada & Assinada
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Aguardando Assinatura
              </div>
            )}
          </div>
        </header>

        {/* Apresentação do Cliente & Escopo */}
        <section className="p-8 bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/40 rounded-3xl border border-slate-800/80 shadow-2xl space-y-6">
          <div className="border-b border-slate-800 pb-6">
            <span className="text-xs font-semibold tracking-wider uppercase text-emerald-400">Proposta de Licenciamento SaaS</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {propostaState.empresaNome}
            </h2>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400 mt-3">
              {propostaState.cnpj && (
                <div className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>CNPJ: {propostaState.cnpj}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>Aos cuidados de: <strong className="text-slate-200">{propostaState.contatoNome}</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Data: {new Date(propostaState.createdAt).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* Módulos Selecionados */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                Módulos & Tecnologias Contratadas
              </h3>
              <span className="text-xs text-slate-400">
                {modulosContratados.length} {modulosContratados.length === 1 ? 'módulo incluso' : 'módulos inclusos'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modulosContratados.map((modulo) => (
                <div 
                  key={modulo.id} 
                  className="p-4 rounded-2xl bg-slate-950/60 border border-emerald-500/30 hover:border-emerald-500/60 transition shadow-inner relative overflow-hidden group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <h4 className="font-bold text-sm text-white">{modulo.name}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{modulo.description}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider shrink-0">
                      Incluso
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infraestrutura e Garantias Inclusas */}
          <div className="p-5 rounded-2xl bg-slate-950/40 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Garantias Corporativas & Serviços Inclusos:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Até <strong>{propostaState.maxUsuarios} usuários</strong> com permissões hierárquicas.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Nuvem corporativa criptografada (SLA 99.9% de uptime).</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Suporte técnico via WhatsApp e canal direto com especialistas.</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Em conformidade com a LGPD e sigilo absoluto de planilhas.</span>
              </div>
            </div>

            {propostaState.condicoesEspeciais && (
              <div className="mt-3 pt-3 border-t border-slate-800/80 text-xs text-amber-200/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                <strong>Condição Especial Acordada:</strong> {propostaState.condicoesEspeciais}
              </div>
            )}
          </div>
        </section>

        {/* Resumo do Investimento Financeiro */}
        <section className="p-8 bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            Resumo do Investimento
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Taxa de Setup / Onboarding */}
            <div className="p-6 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Implantação & Treinamento</span>
                <h4 className="text-lg font-bold text-white mt-1">Taxa Única de Onboarding</h4>
                <p className="text-xs text-slate-400 mt-1">Parametrização das CCTs, importação de clientes e treinamento da equipe.</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80">
                {propostaState.descontoSetup > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 line-through">
                    De R$ {propostaState.valorSetup.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-white">
                    {setupLiquido === 0 ? 'ISENTO' : `R$ ${setupLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                  </span>
                  {setupLiquido === 0 && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase">
                      Bônus de Fechamento
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mensalidade do SaaS */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/30 to-slate-950 border-2 border-emerald-500/50 flex flex-col justify-between shadow-xl shadow-emerald-950/20">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Assinatura do Software</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    Plano {propostaState.plano}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white mt-1">Mensalidade Corporativa</h4>
                <p className="text-xs text-slate-300 mt-1">Acesso ilimitado às ferramentas, banco de CCTs com IA e atualizações contínuas.</p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-baseline justify-between">
                <div>
                  <span className="text-3xl font-black text-emerald-400">
                    R$ {propostaState.valorMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-xs text-slate-400 ml-1">/ mês</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Área de Assinatura & Pagamento */}
        <section className="p-8 bg-gradient-to-b from-slate-900 to-slate-950 rounded-3xl border border-slate-800 shadow-2xl">
          {isAssinada ? (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-white">Parabéns! Proposta Aceita e Assinada</h3>
                <p className="text-sm text-slate-300 mt-2 max-w-lg mx-auto">
                  Assinada digitalmente por <strong className="text-white">{propostaState.assinadoPorNome}</strong> em{' '}
                  {new Date(propostaState.assinadoEm || Date.now()).toLocaleString('pt-BR')}.
                </p>
              </div>

              {/* Informações de Pagamento (PIX) */}
              <div className="max-w-md mx-auto p-6 rounded-2xl bg-slate-900 border border-emerald-500/30 text-left space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-emerald-400" />
                    Pagamento via PIX Instantâneo
                  </span>
                  <span className="text-xs font-black text-emerald-400">
                    R$ {(propostaState.valorMensal + setupLiquido).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {propostaState.asaasPixQrCode && (
                  <div className="flex flex-col items-center justify-center p-3 bg-white rounded-xl mx-auto w-48 h-48 shadow-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={propostaState.asaasPixQrCode} 
                      alt="QR Code Pix" 
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}

                {propostaState.asaasPixCopiaECola && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                      Código Pix Copia e Cola:
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={propostaState.asaasPixCopiaECola}
                        className="flex-1 bg-slate-950 border border-slate-700 text-slate-300 text-xs px-3 py-2 rounded-lg font-mono truncate"
                      />
                      <button
                        onClick={handleCopyPix}
                        className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0"
                      >
                        {copiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiado ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                  </div>
                )}

                <div className="pt-2 text-center">
                  <p className="text-[11px] text-slate-400">
                    Assim que o pagamento for compensado, o acesso ao painel do SmartBid é liberado automaticamente.
                  </p>
                </div>
              </div>

              {/* Botão de Suporte WhatsApp */}
              <div className="pt-2">
                <a
                  href={`https://wa.me/5511999999999?text=${encodeURIComponent(`Olá! Acabei de assinar a proposta do SmartBid para a empresa ${propostaState.empresaNome}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  <Phone className="w-4 h-4 text-emerald-400" />
                  Falar com nosso Consultor de Onboarding no WhatsApp
                </a>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSign} className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-400" />
                  Assinatura Digital & Aceite do Contrato
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Confirme seus dados para efetivar o credenciamento de sua empresa ao SmartBid Hub.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Nome Completo do Responsável Legal *
                  </label>
                  <input
                    type="text"
                    required
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: João Carlos da Silva"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    CPF ou Cargo na Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    value={cpfOuCargo}
                    onChange={(e) => setCpfOuCargo(e.target.value)}
                    placeholder="Ex: Diretor de Operações / 123.456.789-00"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                <input
                  type="checkbox"
                  id="termo_aceite"
                  required
                  checked={concordo}
                  onChange={(e) => setConcordo(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="termo_aceite" className="text-xs text-slate-300 leading-relaxed cursor-pointer">
                  Declaro que li e concordo com os valores e módulos especificados nesta proposta de prestação de serviços SaaS SmartBid, bem como os{' '}
                  <a href="/termos" target="_blank" className="text-emerald-400 underline underline-offset-2">Termos de Uso</a>{' '}
                  e a{' '}
                  <a href="/privacidade" target="_blank" className="text-emerald-400 underline underline-offset-2">Política de Privacidade (LGPD)</a>.
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || !concordo}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-base shadow-xl shadow-emerald-950/40 transition flex items-center justify-center gap-2 group cursor-pointer"
              >
                {loading ? (
                  <span>Registrando Assinatura Digital...</span>
                ) : (
                  <>
                    <span>Aceitar Proposta & Gerar Acesso</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* Rodapé Corporativo */}
        <footer className="text-center text-xs text-slate-500 py-4 space-y-1">
          <p>© {new Date().getFullYear()} Silva Consultoria Empresarial LTDA • SmartBid Hub.</p>
          <p>Dúvidas sobre esta proposta? Entre em contato pelo e-mail: suporte@smartbidhub.com.br</p>
        </footer>

      </div>
    </div>
  );
}
