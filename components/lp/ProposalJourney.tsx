'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Link2, Copy, Check, Eye, Clock, FileText, Sheet, Presentation,
  ScrollText, Image as ImageIcon, FolderOpen, HelpCircle, Video, ShieldCheck, Lock, Phone,
  MoreVertical, ChevronLeft, CheckCheck, MessageCircle,
} from 'lucide-react';

const C = {
  paper: '#FBFAF7',
  ink: '#111418',
  muted: '#5B6470',
  line: '#E6E2DA',
  green: '#1B4D3E',
  greenSoft: '#EAF1ED',
};
const title: React.CSSProperties = { fontFamily: 'var(--font-lp-text)', fontWeight: 700, letterSpacing: '-0.03em' };

type StepId = 'config' | 'cliente' | 'rastreio' | 'aceite';
const STEPS: { id: StepId; n: string; t: string; d: string }[] = [
  { id: 'config', n: '01', t: 'Configure o link', d: 'Escolha o que o cliente vai ver e a validade.' },
  { id: 'cliente', n: '02', t: 'O cliente abre', d: 'Uma página com a sua marca, não um PDF.' },
  { id: 'rastreio', n: '03', t: 'Você acompanha', d: 'Cada acesso, seção e minuto de leitura.' },
  { id: 'aceite', n: '04', t: 'Ele aprova', d: 'Assinatura online e aviso no seu WhatsApp.' },
];
const DURATION = 8000;

/* ---------- Peças de UI ---------- */
function Toggle({ on, delay = 0 }: { on: boolean; delay?: number }) {
  return (
    <span
      className="relative inline-flex w-9 h-5 rounded-full shrink-0 transition-colors duration-500"
      style={{ background: on ? C.green : '#D9D5CD', transitionDelay: `${delay}ms` }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-500"
        style={{ transform: on ? 'translateX(16px)' : 'none', transitionDelay: `${delay}ms`, transitionTimingFunction: 'cubic-bezier(0.34,1.56,0.64,1)' }}
      />
    </span>
  );
}

function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border overflow-hidden shadow-[0_30px_70px_-35px_rgba(17,20,24,0.45)]" style={{ borderColor: '#DCD8D0' }}>
      <div className="flex items-center gap-3 px-4 py-2.5 border-b shrink-0" style={{ borderColor: C.line, background: '#F6F5F2' }}>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E26B5A]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#E6B84F]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#5DB872]" />
        </div>
        <div className="flex-1 max-w-[460px] mx-auto flex items-center gap-1.5 text-[11.5px] bg-white rounded-md px-3 py-1 border truncate" style={{ borderColor: C.line, color: C.muted }}>
          <Lock size={10} className="shrink-0" /> <span className="truncate">{url}</span>
        </div>
        <span className="w-[52px]" />
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}

/* ---------- 01: Configuração do compartilhamento ---------- */
function ScreenConfig({ active }: { active: boolean }) {
  const [on, setOn] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!active) { setOn(false); setCopied(false); return; }
    const a = setTimeout(() => setOn(true), 350);
    const b = setTimeout(() => setCopied(true), 4200);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [active]);

  const items = [
    { icon: Presentation, t: 'Apresentação institucional', d: 'Slides do Canva incorporados', v: true },
    { icon: FileText, t: 'Proposta comercial', d: 'Escopo, condições e aceite do cliente', v: true },
    { icon: Sheet, t: 'Planilha de custos (FPV)', d: 'Premissas, encargos, quadro e insumos', v: true },
    { icon: ScrollText, t: 'Minuta do contrato', d: 'Modelo padrão pré-preenchido', v: true },
    { icon: Video, t: 'Vídeo de apresentação', d: 'YouTube, Vimeo ou MP4', v: false },
    { icon: ImageIcon, t: 'Fotos da visita técnica', d: '12 fotos enviadas', v: true },
    { icon: FolderOpen, t: 'Certidões e documentos', d: 'CND federal, FGTS, trabalhista', v: true },
    { icon: HelpCircle, t: 'Perguntas frequentes', d: '6 perguntas padrão', v: false },
  ];

  return (
    <div className="h-full grid md:grid-cols-[1fr_300px] rounded-2xl overflow-hidden border bg-white shadow-[0_30px_70px_-35px_rgba(17,20,24,0.45)]" style={{ borderColor: '#DCD8D0' }}>
      <div className="p-5 md:p-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11.5px]" style={{ color: C.muted }}>FPV-128 · Hospital Geral São Lucas</p>
            <p className="text-[18px] mt-0.5" style={title}>Link do cliente</p>
          </div>
          <span className="text-[11.5px] font-semibold px-2.5 py-1 rounded-md" style={{ background: C.greenSoft, color: C.green }}>22 postos · R$ 48.900/mês</span>
        </div>
        <p className="text-[13px] font-semibold mt-5">O que o cliente vai ver no link?</p>
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          {items.map((it, i) => (
            <div key={it.t} className="flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-300 hover:scale-[1.015] hover:shadow-sm cursor-pointer" style={{ borderColor: on && it.v ? 'rgba(27,77,62,0.3)' : C.line, background: on && it.v ? '#F7FAF8' : '#fff', transitionDelay: `${i * 110}ms` }}>
              <it.icon size={16} style={{ color: on && it.v ? C.green : '#A8A296' }} className="shrink-0 transition-colors duration-500" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold truncate">{it.t}</p>
                <p className="text-[11px] truncate" style={{ color: C.muted }}>{it.d}</p>
              </div>
              <Toggle on={on && it.v} delay={i * 110} />
            </div>
          ))}
        </div>
      </div>
      <div className="border-t md:border-t-0 md:border-l p-5 md:p-6 flex flex-col" style={{ borderColor: C.line, background: C.paper }}>
        <p className="text-[13px] font-semibold">Validade do link</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1 h-10 rounded-lg border bg-white flex items-center px-3 text-[14px] font-semibold tabular-nums" style={{ borderColor: C.line }}>15</div>
          <span className="text-[13px]" style={{ color: C.muted }}>dias</span>
        </div>
        <p className="text-[11.5px] mt-2" style={{ color: C.muted }}>Expira em 26/10. Depois disso o link sai do ar sozinho.</p>

        <p className="text-[13px] font-semibold mt-6">Você é avisado</p>
        {['No sistema, a cada abertura', 'No WhatsApp, ao aprovar ou recusar'].map((t, i) => (
          <div key={t} className="mt-2.5 flex items-center gap-2 text-[12.5px] transition-opacity duration-500" style={{ opacity: on ? 1 : 0.4, transitionDelay: `${900 + i * 150}ms` }}>
            <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ background: C.greenSoft }}><Check size={10} style={{ color: C.green }} strokeWidth={3} /></span>
            <span>{t}</span>
          </div>
        ))}

        <div className="mt-auto pt-6">
          <div className="rounded-lg border bg-white px-3 py-2 text-[11.5px] truncate" style={{ borderColor: C.line, color: C.muted }}>
            smartbidhub.com.br/proposta/ver/<span style={{ color: C.ink }}>sao-lucas-128</span>
          </div>
          <div className="mt-2 h-10 rounded-lg text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors duration-300" style={{ background: copied ? '#2F7A61' : C.green }}>
            {copied ? <><Check size={15} /> Link copiado</> : <><Copy size={14} /> Copiar link</>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- 02: O que o cliente vê ---------- */
function ScreenCliente({ active }: { active: boolean }) {
  const tabs = ['Apresentação', 'Proposta', 'Planilha de custos', 'Minuta', 'Fotos', 'Documentos'];
  const [tab, setTab] = useState(1);
  useEffect(() => {
    if (!active) { setTab(1); return; }
    const a = setTimeout(() => setTab(2), 3600);
    return () => clearTimeout(a);
  }, [active]);

  return (
    <BrowserFrame url="smartbidhub.com.br/proposta/ver/sao-lucas-128">
      <div className="h-full flex flex-col" style={{ background: '#F7F7F5' }}>
        {/* topo com a marca do prestador */}
        <div className="px-5 md:px-7 pt-4 pb-0 bg-white border-b" style={{ borderColor: C.line }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold" style={{ background: '#0F3B5F' }}>AS</span>
              <div>
                <p className="text-[13px] font-semibold leading-tight">Aliança Serviços</p>
                <p className="text-[11px]" style={{ color: C.muted }}>Proposta para Hospital Geral São Lucas</p>
              </div>
            </div>
            <span className="hidden sm:flex items-center gap-1.5 text-[11.5px]" style={{ color: C.muted }}>
              <Clock size={12} /> Válida até 26/10
            </span>
          </div>
          <div className="flex gap-5 mt-3 text-[12.5px] overflow-hidden">
            {tabs.map((t, i) => (
              <span key={t} className="relative pb-2.5 whitespace-nowrap transition-colors duration-300" style={{ color: tab === i ? C.ink : C.muted, fontWeight: tab === i ? 600 : 400 }}>
                {t}
                <span className="absolute left-0 right-0 bottom-0 h-[2px] transition-transform duration-500 origin-left" style={{ background: '#0F3B5F', transform: tab === i ? 'scaleX(1)' : 'scaleX(0)' }} />
              </span>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 p-5 md:p-7 grid md:grid-cols-[1fr_230px] gap-5 overflow-hidden">
          {tab === 1 ? (
            <div key="proposta" className="lp-swap bg-white rounded-xl border p-5 overflow-hidden" style={{ borderColor: C.line }}>
              <p className="text-[11px] font-semibold" style={{ color: '#0F3B5F' }}>PROPOSTA COMERCIAL · FPV-128</p>
              <p className="text-[19px] mt-1 leading-tight" style={title}>Asseio, higienização hospitalar e apoio operacional</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[['22', 'postos'], ['12', 'meses'], ['24h', 'cobertura']].map(([a, b]) => (
                  <div key={b} className="rounded-lg px-3 py-2.5" style={{ background: '#F4F6F8' }}>
                    <p className="text-[17px] tabular-nums" style={title}>{a}</p>
                    <p className="text-[11px]" style={{ color: C.muted }}>{b}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 text-[12px]">
                {[['Auxiliar de limpeza hospitalar', '14 postos · 12x36'], ['Encarregado de turno', '2 postos · 44h'], ['Copeira', '4 postos · 44h'], ['Maqueiro', '2 postos · 12x36']].map(([a, b]) => (
                  <div key={a} className="flex justify-between border-b pb-2" style={{ borderColor: '#EFEDE8' }}>
                    <span>{a}</span><span style={{ color: C.muted }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div key="fpv" className="lp-swap bg-white rounded-xl border overflow-hidden text-[12px]" style={{ borderColor: C.line }}>
              <div className="px-4 py-3 border-b flex justify-between" style={{ borderColor: C.line }}>
                <span className="font-semibold">Planilha de custos · Auxiliar de limpeza</span>
                <span style={{ color: C.muted }}>CCT SIEMACO 2026</span>
              </div>
              {[['Salário-base', 'R$ 1.840,00'], ['Insalubridade 40%', 'R$ 607,20'], ['Encargos sociais (71,80%)', 'R$ 1.757,09'], ['Vale-transporte líquido', 'R$ 198,40'], ['Vale-refeição', 'R$ 847,00'], ['Uniformes e EPIs', 'R$ 62,50'], ['Tributos (12,50%)', 'R$ 798,12']].map(([a, b], i) => (
                <div key={a} className="flex justify-between px-4 py-2" style={{ background: i % 2 ? '#FAFAF8' : '#fff' }}>
                  <span style={{ color: C.muted }}>{a}</span><span className="tabular-nums font-medium">{b}</span>
                </div>
              ))}
              <div className="flex justify-between px-4 py-2.5 border-t font-semibold" style={{ borderColor: C.line }}>
                <span>Valor por posto</span><span className="tabular-nums">R$ 6.385,00</span>
              </div>
            </div>
          )}

          <div className="hidden md:flex flex-col gap-3">
            <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.line }}>
              <p className="text-[11.5px]" style={{ color: C.muted }}>Investimento mensal</p>
              <p className="text-[24px] tabular-nums leading-tight mt-0.5" style={title}>R$ 48.900</p>
              <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>tributos inclusos</p>
              <div className="mt-4 h-10 rounded-lg text-white text-[13px] font-semibold flex items-center justify-center gap-1.5" style={{ background: '#0F3B5F' }}>
                <ShieldCheck size={15} /> Aprovar proposta
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="h-9 rounded-lg border text-[12px] font-medium flex items-center justify-center" style={{ borderColor: C.line }}>Pedir ajuste</div>
                <div className="h-9 rounded-lg border text-[12px] font-medium flex items-center justify-center" style={{ borderColor: C.line, color: C.muted }}>Recusar</div>
              </div>
            </div>
            <div className="bg-white rounded-xl border p-3.5 flex items-center gap-3" style={{ borderColor: C.line }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: C.greenSoft }}>
                <ShieldCheck size={15} style={{ color: C.green }} />
              </span>
              <div className="text-[11.5px] leading-tight">
                <p className="font-semibold">Link seguro e exclusivo</p>
                <p style={{ color: C.muted }}>Válido até 26/10 · 15 dias</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------- 03: Rastreamento ---------- */
function ScreenRastreio({ active }: { active: boolean }) {
  const [grow, setGrow] = useState(false);
  const [live, setLive] = useState(false);
  useEffect(() => {
    if (!active) { setGrow(false); setLive(false); return; }
    const a = setTimeout(() => setGrow(true), 300);
    const b = setTimeout(() => setLive(true), 2600);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [active]);

  const secoes = [
    { t: 'Planilha de custos (FPV)', v: 100, n: 9 },
    { t: 'Proposta comercial', v: 67, n: 6 },
    { t: 'Minuta do contrato', v: 44, n: 4 },
    { t: 'Fotos da visita técnica', v: 22, n: 2 },
    { t: 'Apresentação', v: 11, n: 1 },
  ];
  const eventos = [
    { h: 'há 2 min', t: 'Abriu a Planilha de custos (FPV)', hot: true },
    { h: 'hoje, 10:42', t: 'Abriu a Minuta do contrato' },
    { h: 'hoje, 10:38', t: 'Abriu a Planilha de custos (FPV)' },
    { h: 'ontem, 17:05', t: 'Abriu a Proposta comercial' },
    { h: 'ontem, 16:58', t: 'Primeiro acesso ao link' },
  ];

  return (
    <BrowserFrame url="app.smartbidhub.com.br/propostas/128/rastreio">
      <div className="h-full p-5 md:p-6 overflow-hidden" style={{ background: '#FCFCFB' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11.5px]" style={{ color: C.muted }}>FPV-128 · Hospital Geral São Lucas</p>
            <p className="text-[18px] mt-0.5" style={title}>Rastreio de visualizações</p>
          </div>
          <span className="flex items-center gap-2 text-[12px] font-semibold px-2.5 py-1 rounded-full transition-opacity duration-500" style={{ background: '#E7F5EE', color: C.green, opacity: live ? 1 : 0 }}>
            <span className="lp-live w-2 h-2 rounded-full" style={{ background: '#22A06B' }} /> Novo acesso há 2 min
          </span>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2.5">
          {[[Eye, '22', 'visualizações'], [FileText, '5 de 6', 'seções abertas'], [Clock, '11/10', 'primeiro acesso'], [Clock, '13 dias', 'para expirar']].map(([I, a, b]) => {
            const Icon = I as typeof Eye;
            return (
              <div key={b as string} className="bg-white rounded-xl border px-3 py-2.5" style={{ borderColor: C.line }}>
                <Icon size={14} style={{ color: C.green }} />
                <p className="text-[18px] tabular-nums mt-1 leading-none" style={title}>{a as string}</p>
                <p className="text-[11px] mt-1" style={{ color: C.muted }}>{b as string}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-3 grid md:grid-cols-2 gap-3">
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: C.line }}>
            <p className="text-[12.5px] font-semibold">Visualizações por seção</p>
            <div className="mt-3 space-y-2.5">
              {secoes.map((s, i) => (
                <div key={s.t}>
                  <div className="flex justify-between text-[11.5px]">
                    <span>{s.t}</span>
                    <span className="tabular-nums" style={{ color: C.muted }}>{s.n}x</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#EFEDE8' }}>
                    <div className="h-full rounded-full" style={{ width: grow ? `${s.v}%` : '0%', background: i === 0 ? C.green : '#7FB39D', transition: `width 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 120}ms` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border p-4 overflow-hidden" style={{ borderColor: C.line }}>
            <p className="text-[12.5px] font-semibold">Linha do tempo</p>
            <div className="mt-3 space-y-0">
              {eventos.map((e, i) => (
                <div key={i} className="flex gap-3 transition-all duration-500" style={{ opacity: grow ? 1 : 0, transform: grow ? 'none' : 'translateY(8px)', transitionDelay: `${300 + i * 140}ms` }}>
                  <div className="flex flex-col items-center">
                    <span className="w-2 h-2 rounded-full mt-1.5" style={{ background: e.hot ? '#22A06B' : '#C9C3B8' }} />
                    {i < eventos.length - 1 && <span className="w-px flex-1" style={{ background: C.line }} />}
                  </div>
                  <div className="pb-2.5 min-w-0">
                    <p className="text-[12px] font-medium truncate">{e.t}</p>
                    <p className="text-[11px]" style={{ color: C.muted }}>{e.h}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  );
}

/* ---------- 04: Aprovação + WhatsApp ---------- */
function WaText({ text }: { text: string }) {
  // Renderiza *negrito* no padrão do WhatsApp
  return (
    <>
      {text.split('\n').map((line, i) => (
        <React.Fragment key={i}>
          {line.split(/(\*[^*]+\*)/g).map((p, j) => p.startsWith('*') && p.endsWith('*') ? <strong key={j}>{p.slice(1, -1)}</strong> : <span key={j}>{p}</span>)}
          <br />
        </React.Fragment>
      ))}
    </>
  );
}

function ScreenAceite({ active }: { active: boolean }) {
  const [phase, setPhase] = useState(0); // 0 form, 1 assinando, 2 aprovado, 3 digitando, 4 mensagem
  useEffect(() => {
    if (!active) { setPhase(0); return; }
    const t = [
      setTimeout(() => setPhase(1), 1400),
      setTimeout(() => setPhase(2), 2400),
      setTimeout(() => setPhase(3), 3100),
      setTimeout(() => setPhase(4), 4600),
    ];
    return () => t.forEach(clearTimeout);
  }, [active]);

  const msg =
    '🎉 *PROPOSTA APROVADA!* 🎉\n\n' +
    'Olá, *Ricardo*!\n\n' +
    'O cliente *Hospital Geral São Lucas* acabou de visualizar, aprovar e assinar eletronicamente a proposta comercial *FPV-128*!\n\n' +
    '✍️ *Assinado por:* Marina Duarte\n' +
    '🆔 *CPF/CNPJ:* 12.345.678/0001-90\n' +
    '🌐 *IP:* 189.45.112.20\n' +
    '📅 *Data/Hora:* 14/10/2026, 10:47\n\n' +
    'Parabéns por mais este fechamento! 🚀💼';

  return (
    <div className="h-full grid md:grid-cols-[1fr_290px] gap-5 items-center">
      {/* Tela de aprovação (lado do cliente) */}
      <BrowserFrame url="smartbidhub.com.br/proposta/ver/sao-lucas-128">
        <div className="h-full flex items-center justify-center p-5 relative" style={{ background: 'rgba(17,20,24,0.04)' }}>
          {phase < 2 ? (
            <div key="form" className="lp-swap w-full max-w-[380px] bg-white rounded-2xl border p-5 shadow-[0_24px_50px_-30px_rgba(17,20,24,0.5)]" style={{ borderColor: C.line }}>
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} style={{ color: '#0F3B5F' }} />
                <p className="text-[16px]" style={title}>Aprovar e assinar proposta</p>
              </div>
              <p className="text-[12px] mt-1" style={{ color: C.muted }}>FPV-128 · R$ 48.900,00/mês · 12 meses</p>
              <div className="mt-4 space-y-3">
                {[['Nome completo', 'Marina Duarte'], ['CPF ou CNPJ', '12.345.678/0001-90'], ['E-mail', 'marina@hsaolucas.com.br']].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-[11.5px] font-semibold mb-1">{l}</p>
                    <div className="h-9 rounded-lg border px-3 flex items-center text-[13px]" style={{ borderColor: C.line }}>{v}</div>
                  </div>
                ))}
                <div>
                  <p className="text-[11.5px] font-semibold mb-1">Assinatura</p>
                  <div className="h-14 rounded-lg border border-dashed flex items-center justify-center" style={{ borderColor: '#CFCAC0', background: '#FCFCFB' }}>
                    <svg viewBox="0 0 200 50" className="h-11 w-[180px]" aria-hidden>
                      <path key={active ? "on" : "off"} className="lp-sign" d="M8 34 C 18 10, 26 10, 28 30 S 40 44, 46 22 C 50 10, 58 12, 56 30 C 55 40, 66 38, 72 26 C 78 16, 84 18, 86 30 C 88 38, 98 36, 104 24 L 110 32 C 118 40, 126 20, 134 26 C 142 32, 150 30, 162 22 C 170 18, 182 20, 192 26" fill="none" stroke="#0F3B5F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <label className="flex items-start gap-2 text-[11.5px] leading-snug" style={{ color: C.muted }}>
                  <span className="mt-0.5 w-4 h-4 rounded flex items-center justify-center shrink-0" style={{ background: '#0F3B5F' }}><Check size={11} className="text-white" strokeWidth={3} /></span>
                  Li e concordo com a proposta, a planilha de custos e a minuta do contrato.
                </label>
              </div>
              <div className="mt-4 h-10 rounded-lg text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-all" style={{ background: '#0F3B5F', transform: phase === 1 ? 'scale(0.98)' : 'none' }}>
                {phase === 1 ? <><span className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" /> Registrando assinatura…</> : 'Assinar e aprovar'}
              </div>
              <p className="text-[10.5px] mt-2.5 text-center" style={{ color: C.muted }}>IP, data, horário e versão do documento ficam registrados.</p>
            </div>
          ) : (
            <div key="ok" className="lp-swap w-full max-w-[380px] bg-white rounded-2xl border p-6 text-center shadow-[0_24px_50px_-30px_rgba(17,20,24,0.5)]" style={{ borderColor: C.line }}>
              <span className="lp-pop mx-auto w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#E7F5EE' }}>
                <Check size={28} style={{ color: '#22A06B' }} strokeWidth={3} />
              </span>
              <p className="text-[18px] mt-4" style={title}>Proposta aprovada</p>
              <p className="text-[12.5px] mt-1.5 leading-relaxed" style={{ color: C.muted }}>
                Obrigado, Marina. A Aliança Serviços já foi avisada e entrará em contato para a implantação.
              </p>
              <div className="mt-4 rounded-lg px-3 py-2.5 text-[11px] text-left space-y-0.5" style={{ background: '#F6F5F2', color: C.muted }}>
                <p>Assinatura nº 7F3A-21C9 · 14/10/2026 10:47</p>
                <p>IP 189.45.112.20 · Curitiba, PR</p>
              </div>
            </div>
          )}
        </div>
      </BrowserFrame>

      {/* Celular com WhatsApp do comercial */}
      <div className="hidden md:block mx-auto w-[270px]">
        <div className="rounded-[38px] p-[9px] shadow-[0_40px_80px_-30px_rgba(17,20,24,0.55)]" style={{ background: '#1B1D21' }}>
          <div className="rounded-[30px] overflow-hidden h-[500px] flex flex-col relative" style={{ background: '#EFEAE2' }}>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[86px] h-[22px] rounded-full bg-black z-10" />
            <div className="pt-9 pb-2.5 px-3 flex items-center gap-2 text-white shrink-0" style={{ background: '#008069' }}>
              <ChevronLeft size={18} />
              <span className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold" style={{ background: '#E8F5EF', color: C.green }}>SB</span>
              <div className="flex-1 min-w-0 leading-tight">
                <p className="text-[13px] font-semibold truncate">SmartBid Avisos</p>
                <p className="text-[10.5px] text-white/80">{phase === 3 ? 'digitando…' : 'online'}</p>
              </div>
              <Phone size={15} />
              <MoreVertical size={15} />
            </div>
            <div className="flex-1 p-2.5 space-y-2 overflow-hidden flex flex-col justify-end">
              <div className="self-center text-[10px] px-2 py-0.5 rounded-md bg-white/80" style={{ color: C.muted }}>HOJE</div>
              {phase === 3 && (
                <div className="lp-swap self-start bg-white rounded-lg rounded-tl-none px-3 py-2.5 shadow-sm flex gap-1">
                  {[0, 1, 2].map(i => <span key={i} className="lp-typing w-1.5 h-1.5 rounded-full" style={{ background: '#8696A0', animationDelay: `${i * 160}ms` }} />)}
                </div>
              )}
              {phase >= 4 && (
                <div className="lp-msg self-start max-w-[92%] bg-white rounded-lg rounded-tl-none px-2.5 py-1.5 text-[11.5px] leading-snug shadow-sm">
                  <WaText text={msg} />
                  <span className="flex justify-end items-center gap-1 text-[9.5px] -mt-2" style={{ color: '#8696A0' }}>10:47 <CheckCheck size={12} style={{ color: '#53BDEB' }} /></span>
                </div>
              )}
            </div>
            <div className="p-2 flex items-center gap-2 shrink-0">
              <div className="flex-1 h-8 rounded-full bg-white px-3 flex items-center text-[11px]" style={{ color: '#8696A0' }}>Mensagem</div>
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#008069' }}><MessageCircle size={14} className="text-white" /></span>
            </div>
          </div>
        </div>
        <p className="text-center text-[12px] mt-3" style={{ color: C.muted }}>O aviso chega no WhatsApp do vendedor.</p>
      </div>
    </div>
  );
}

/* ---------- Jornada completa ---------- */
export default function ProposalJourney() {
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // só começa a girar quando a seção aparece na tela
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !visible) return;
    const id = setTimeout(() => setStep(s => (s + 1) % STEPS.length), DURATION);
    return () => clearTimeout(id);
  }, [auto, visible, step]);

  const go = (i: number) => { setAuto(false); setStep(i); };

  return (
    <div ref={ref}>
      {/* passos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {STEPS.map((s, i) => {
          const on = i === step;
          return (
            <button
              key={s.id}
              onClick={() => go(i)}
              className="relative text-left rounded-2xl border p-4 cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
              style={{ borderColor: on ? 'rgba(27,77,62,0.35)' : C.line, background: on ? '#fff' : 'transparent', boxShadow: on ? '0 18px 40px -26px rgba(17,20,24,0.35)' : 'none' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold tabular-nums transition-colors duration-300" style={{ background: on ? C.green : '#EFEDE8', color: on ? '#fff' : C.muted }}>{s.n}</span>
                <span className="text-[15px] font-semibold">{s.t}</span>
              </div>
              <p className="text-[13px] mt-2 leading-snug" style={{ color: C.muted }}>{s.d}</p>
              <span className="absolute left-0 bottom-0 h-[3px] w-full" style={{ background: on ? '#E3EBE6' : 'transparent' }}>
                {on && <span key={`${step}-${auto}-${visible}`} className="block h-full" style={{ background: C.green, width: auto && visible ? undefined : '100%', animation: auto && visible ? `lp-tab-fill ${DURATION}ms linear forwards` : 'none' }} />}
              </span>
            </button>
          );
        })}
      </div>

      {/* palco */}
      <div className="lp-showcase-stage mt-5 relative rounded-[28px] p-3 sm:p-5 md:p-8 overflow-hidden">
        <div className="relative h-[620px] md:h-[540px]">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className="absolute inset-0 transition-all duration-700"
              style={{
                opacity: i === step ? 1 : 0,
                transform: i === step ? 'none' : i < step ? 'translateX(-36px) scale(0.985)' : 'translateX(36px) scale(0.985)',
                pointerEvents: i === step ? 'auto' : 'none',
                transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
              }}
              aria-hidden={i !== step}
            >
              {s.id === 'config' && <ScreenConfig active={i === step && visible} />}
              {s.id === 'cliente' && <ScreenCliente active={i === step && visible} />}
              {s.id === 'rastreio' && <ScreenRastreio active={i === step && visible} />}
              {s.id === 'aceite' && <ScreenAceite active={i === step && visible} />}
            </div>
          ))}
        </div>
      </div>
      <p className="mt-3 text-center text-[13px] flex items-center justify-center gap-1.5" style={{ color: C.muted }}>
        <Link2 size={13} /> Telas reais do fluxo de proposta por link do SmartBid, com dados de exemplo.
      </p>
    </div>
  );
}
