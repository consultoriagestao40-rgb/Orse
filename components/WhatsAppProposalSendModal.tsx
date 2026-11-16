'use client';

import React, { useEffect, useState } from 'react';
import { X, Check, Copy, Loader2, ExternalLink } from 'lucide-react';
import WhatsAppIcon from '@/components/WhatsAppIcon';
import {
  getDocumentoConfigApresentacao,
  sendProposalLinkViaZApiAction,
} from '@/app/propostas-comerciais/actions';
import {
  buildExecutiveProposalUrl,
  buildExecutiveWhatsAppMessage,
  buildProposalCardHeadline,
  buildProposalCardSubtitle,
  buildWhatsAppWebUrl,
  formatProposalCode,
  maskBrazilPhone,
} from '@/lib/proposal-share';

interface WhatsAppProposalSendModalProps {
  documentoId: string;
  initialDoc?: any;
  onClose: () => void;
  onSentSuccess?: (phone: string, contatoNome: string) => void;
}

export default function WhatsAppProposalSendModal({
  documentoId,
  initialDoc,
  onClose,
  onSentSuccess,
}: WhatsAppProposalSendModalProps) {
  const [loadingMeta, setLoadingMeta] = useState(!initialDoc?.tipoServicos && !initialDoc?.objetoProposta);
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [contatoNome, setContatoNome] = useState<string>(initialDoc?.contatoNome || '');
  const [contatoWhatsApp, setContatoWhatsApp] = useState<string>(
    maskBrazilPhone(initialDoc?.contatoWhatsApp || '')
  );

  const [meta, setMeta] = useState({
    numeroFPV: initialDoc?.numeroFPV || 1,
    versaoFPV: initialDoc?.versaoFPV || 1,
    clienteNome: initialDoc?.cliente || 'Cliente',
    empresaEmissora: initialDoc?.empresa || 'SmartBid Hub',
    valorTotal: Number(initialDoc?.valor || 0),
    tipoServicos: initialDoc?.tipoServicos || '',
    objetoProposta: initialDoc?.objetoProposta || '',
    tipoProposta: initialDoc?.tipoProposta || 'RECORRENTE',
    cargoPrincipal: '',
    codigoAcessoCustom: initialDoc?.configApresentacao?.regrasAcesso?.codigoAcessoCustom || '',
  });

  useEffect(() => {
    let active = true;
    getDocumentoConfigApresentacao(documentoId)
      .then((res: any) => {
        if (!active || !res?.success || !res.shareContext) return;
        const sc = res.shareContext;
        setMeta({
          numeroFPV: sc.numeroFPV || 1,
          versaoFPV: sc.versaoFPV || 1,
          clienteNome: sc.clienteNome || 'Cliente',
          empresaEmissora: sc.empresaEmissora || 'SmartBid Hub',
          valorTotal: Number(sc.valorTotal || 0),
          tipoServicos: sc.tipoServicos || '',
          objetoProposta: sc.objetoProposta || '',
          tipoProposta: sc.tipoProposta || 'RECORRENTE',
          cargoPrincipal: sc.cargoPrincipal || '',
          codigoAcessoCustom: res.configApresentacao?.regrasAcesso?.codigoAcessoCustom || '',
        });
        if (sc.contatoNome && !contatoNome) {
          setContatoNome(sc.contatoNome);
        }
        if (sc.contatoWhatsApp && !contatoWhatsApp) {
          setContatoWhatsApp(maskBrazilPhone(sc.contatoWhatsApp));
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingMeta(false);
      });
    return () => {
      active = false;
    };
  }, [documentoId]);

  const shareUrl = buildExecutiveProposalUrl({
    docId: documentoId,
    numeroFPV: meta.numeroFPV,
    versaoFPV: meta.versaoFPV,
    clienteNome: meta.clienteNome,
  });
  const shortDomainDisplay = shareUrl.replace(/^https?:\/\/(www\.)?/, '');
  const code = formatProposalCode(meta.numeroFPV, meta.versaoFPV);

  const cardHeadline = buildProposalCardHeadline({
    tipoServicos: meta.tipoServicos,
    objetoProposta: meta.objetoProposta,
    cargoPrincipal: meta.cargoPrincipal,
    numeroFPV: meta.numeroFPV,
    versaoFPV: meta.versaoFPV,
  });

  const cardSubtitle = buildProposalCardSubtitle({
    clienteNome: meta.clienteNome,
    valorTotal: meta.valorTotal,
    tipoProposta: meta.tipoProposta,
    empresaEmissora: meta.empresaEmissora,
  });

  const handleDispatchCard = async () => {
    const digits = contatoWhatsApp.replace(/\D/g, '');
    if (digits.length < 10) {
      setErrorMsg('Informe o número de WhatsApp com DDD (ex.: 41 99999-9999).');
      return;
    }

    setSending(true);
    setErrorMsg(null);
    setSentSuccess(false);

    try {
      const res = await sendProposalLinkViaZApiAction({
        documentoId,
        phone: contatoWhatsApp,
        contatoNome: contatoNome.trim(),
      });
      if (res.success) {
        setSentSuccess(true);
        if (onSentSuccess) onSentSuccess(contatoWhatsApp, contatoNome.trim());
      } else {
        setErrorMsg(res.error || 'Não foi possível enviar pela API.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Erro de conexão ao enviar proposta.');
    } finally {
      setSending(false);
    }
  };

  const handleOpenWhatsAppChat = () => {
    const msg = buildExecutiveWhatsAppMessage({
      docId: documentoId,
      numeroFPV: meta.numeroFPV,
      versaoFPV: meta.versaoFPV,
      clienteNome: meta.clienteNome,
      codigoAcessoCustom: meta.codigoAcessoCustom,
    });
    const waUrl = buildWhatsAppWebUrl(contatoWhatsApp, sentSuccess ? '' : msg);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 text-slate-800 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="bg-[#1B4D3E] px-5 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-[#25D366] text-white inline-flex items-center justify-center shadow-sm">
              <WhatsAppIcon size={15} />
            </span>
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider leading-tight">
                Enviar Proposta no WhatsApp
              </h2>
              <p className="text-[10px] text-emerald-200 font-semibold">{code} • Card Executivo</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4">
          {/* Prévia fiel do Card que chega no WhatsApp */}
          <div className="rounded-2xl bg-[#EFEAE2] p-3 border border-slate-200/80">
            <div className="flex items-center justify-between mb-2 px-0.5">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                Como chega no WhatsApp do cliente:
              </span>
              {loadingMeta && <Loader2 size={11} className="animate-spin text-slate-400" />}
            </div>

            <div className="bg-[#D9FDD3] rounded-2xl p-2 shadow-sm border border-emerald-200/80 space-y-2">
              {/* Faixa verde superior: SmartBid · Proposta + Número da Proposta */}
              <div className="rounded-xl bg-gradient-to-r from-[#092920] via-[#0E3A2D] to-[#144B3A] px-3 py-2.5 flex items-center justify-between gap-2 shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center shrink-0">
                    <svg
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#6EE7B7"
                      strokeWidth="2.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 17 L9 11 L13 15 L21 7" />
                      <path d="M15 7 H21 V13" />
                    </svg>
                  </div>
                  <span className="text-[12px] font-extrabold text-white tracking-tight truncate">
                    SmartBid <span className="text-emerald-300">·</span> Proposta
                  </span>
                </div>
                {code && code !== 'PROPOSTA' && (
                  <span className="text-[9.5px] font-extrabold text-emerald-200 bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.5 rounded-full shrink-0">
                    {code.replace(/-R/, ' · R')}
                  </span>
                )}
              </div>

              {/* Parte inferior: Dados reais + texto secundário cinza suave + link curto */}
              <div className="px-1 pb-0.5 space-y-1">
                <p className="text-[12px] font-black text-slate-900 leading-snug truncate">
                  {cardHeadline}
                </p>
                <div className="flex items-center gap-1.5 pl-0.5">
                  <span className="w-[2.5px] h-3.5 rounded-full bg-slate-400/70 shrink-0" />
                  <p className="text-[11px] font-medium text-[#667781] leading-snug truncate">
                    {cardSubtitle}
                  </p>
                </div>
                <p className="text-[10.5px] text-[#027EB5] underline truncate">
                  {shortDomainDisplay}
                </p>
              </div>
            </div>
          </div>

          {/* Contato e WhatsApp puxados da FPV */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                Contato (FPV)
              </label>
              <input
                type="text"
                placeholder="Nome do contato"
                value={contatoNome}
                onChange={(e) => setContatoNome(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block mb-1">
                WhatsApp (FPV)
              </label>
              <input
                type="tel"
                placeholder="(41) 99999-9999"
                value={contatoWhatsApp}
                onChange={(e) => setContatoWhatsApp(maskBrazilPhone(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono outline-none focus:bg-white focus:border-emerald-500"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[11px] font-bold">
              {errorMsg}
            </div>
          )}

          {sentSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5">
                <Check size={15} className="text-emerald-600 shrink-0" />
                Card enviado direto no WhatsApp de {contatoNome || contatoWhatsApp}!
              </span>
              <button
                type="button"
                onClick={handleOpenWhatsAppChat}
                className="text-[10px] font-black uppercase tracking-wider text-[#1B4D3E] underline flex items-center gap-1 shrink-0 cursor-pointer"
              >
                Abrir Chat <ExternalLink size={11} />
              </button>
            </div>
          )}

          {/* Botão principal 1-Clique (Disparo Rico estilo Autentique via API) */}
          <button
            type="button"
            onClick={handleDispatchCard}
            disabled={sending}
            className="w-full py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5D] active:scale-[0.99] text-white font-black text-xs uppercase tracking-wider shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {sending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Enviando Card no WhatsApp...
              </>
            ) : (
              <>
                <WhatsAppIcon size={16} />
                {sentSuccess ? 'Reenviar Card no WhatsApp' : 'Enviar Card Agora no WhatsApp'}
              </>
            )}
          </button>

          {/* Ações auxiliares discretas */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10.5px] font-bold text-slate-500">
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="hover:text-slate-800 flex items-center gap-1 transition-colors cursor-pointer"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copied ? 'Link copiado!' : 'Copiar apenas o link'}
            </button>
            <button
              type="button"
              onClick={handleOpenWhatsAppChat}
              className="hover:text-[#1B4D3E] flex items-center gap-1 transition-colors cursor-pointer"
            >
              Abrir WhatsApp Web <ExternalLink size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
