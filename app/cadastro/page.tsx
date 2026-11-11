'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { ArrowRight, Check, Mail, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import PasswordInputWithRequirements from '@/components/PasswordInputWithRequirements';
import { textFont } from '@/components/lp/fonts';
import { trackEvent } from '@/components/TrackingScripts';

const C = {
  paper: '#FBFAF7',
  ink: '#111418',
  muted: '#5B6470',
  line: '#E6E2DA',
  green: '#1B4D3E',
  greenSoft: '#EAF1ED',
};

const title: React.CSSProperties = {
  fontFamily: 'var(--font-lp-text)',
  fontWeight: 800,
  letterSpacing: '-0.035em',
};

function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function Field({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold mb-1.5" style={{ color: C.ink }}>{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  'w-full h-12 px-4 rounded-xl bg-white border text-[15px] outline-none transition-shadow focus:shadow-[0_0_0_4px_rgba(27,77,62,0.12)]';

function CadastroForm() {
  const params = useSearchParams();
  const plano = params.get('plano');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [form, setForm] = useState({ nome: '', empresa: '', email: '', celular: '', password: '' });

  // Estados do fluxo de verificação de e-mail
  const [step, setStep] = useState<'FORM' | 'VERIFICATION_INSTRUCTIONS'>('FORM');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Se o usuário veio com link expirado
  useEffect(() => {
    if (params.get('expired') === 'true' && params.get('email')) {
      const emailParam = params.get('email') || '';
      setRegisteredEmail(emailParam);
      setStep('VERIFICATION_INSTRUCTIONS');
      setResendError('O link de confirmação anterior expirou (validade de 24 horas). Clique no botão abaixo para receber um novo link.');
    }
  }, [params]);

  // Contador de reenvio (60s)
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((c) => Math.max(0, c - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = k === 'celular' ? maskPhone(e.target.value) : e.target.value;
    setForm(prev => ({ ...prev, [k]: v }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.empresa.trim() || !form.email.trim() || !form.password) {
      setError('Preencha todos os campos.');
      return;
    }

    if (!acceptedTerms) {
      setError('Você precisa ler e concordar com os Termos de Uso e a Política de Privacidade (LGPD) para prosseguir.');
      return;
    }
    if (form.celular.replace(/\D/g, '').length < 10) {
      setError('Informe um WhatsApp válido com DDD.');
      return;
    }
    if (form.password.length < 8 || !/[A-Z]/.test(form.password) || !/[a-z]/.test(form.password) || !/[0-9]/.test(form.password) || !/[^A-Za-z0-9]/.test(form.password)) {
      setError('A senha deve conter no mínimo 8 caracteres com letras maiúsculas, minúsculas, números e caracteres especiais.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, plano }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        trackEvent('CompleteRegistration', {
          content_name: plano || 'Trial 30 Dias',
          status: 'registered',
        });
        trackEvent('StartTrial', {
          content_name: plano || 'Trial 30 Dias',
        });
        setRegisteredEmail(data.email || form.email);
        setStep('VERIFICATION_INSTRUCTIONS');
      } else {
        setError(data.error || 'Não foi possível criar a conta.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendLoading || resendCooldown > 0) return;
    setResendLoading(true);
    setResendSuccess('');
    setResendError('');
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: registeredEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResendSuccess('Novo e-mail de ativação enviado com sucesso! Verifique sua caixa de entrada e spam.');
        setResendCooldown(60);
      } else {
        setResendError(data.error || 'Não foi possível reenviar o e-mail no momento.');
      }
    } catch {
      setResendError('Erro de conexão ao reenviar e-mail.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className={`${textFont.variable} min-h-screen antialiased`}
      style={{ background: C.paper, color: C.ink, fontFamily: 'var(--font-lp-text)' }}
    >
      {/* Topo */}
      <header className="max-w-[1200px] mx-auto px-6 h-[76px] flex items-center justify-between">
        <Link href="/" className="text-[20px]" style={title}>
          Smart<span style={{ color: C.green }}>Bid</span>
        </Link>
        <p className="text-[14px]" style={{ color: C.muted }}>
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold underline-offset-4 hover:underline" style={{ color: C.green }}>
            Entrar
          </Link>
        </p>
      </header>

      {step === 'VERIFICATION_INSTRUCTIONS' ? (
        /* TELA DE INSTRUÇÕES DE CONFIRMAÇÃO DE E-MAIL */
        <main className="max-w-[620px] mx-auto px-6 py-10 sm:py-16">
          <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
            
            {/* Ícone de Envio Branded */}
            <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-[#1B4D3E] to-[#13382D] flex items-center justify-center text-white shadow-xl shadow-emerald-950/20">
              <Mail size={38} className="animate-pulse" />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow">
                <CheckCircle2 size={16} className="text-white" />
              </div>
            </div>

            <div className="space-y-2">
              <span className="inline-block text-[11px] font-black uppercase tracking-widest px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
                Quase lá! Ativação de Conta
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight" style={title}>
                Confirme seu endereço de e-mail
              </h1>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                Para garantir a segurança dos dados da sua empresa, enviamos um link seguro de validação para:
              </p>
              <div className="pt-1">
                <span className="inline-block font-mono font-bold text-xs sm:text-sm text-[#1B4D3E] bg-emerald-50/70 border border-emerald-200 px-4 py-2 rounded-xl">
                  {registeredEmail}
                </span>
              </div>
            </div>

            {/* Passo a Passo */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-left space-y-3">
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-wider">
                Próximos passos simples:
              </p>
              <div className="space-y-3 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</div>
                  <span>Abra a caixa de entrada do seu provedor de e-mail.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</div>
                  <span>Localize a mensagem com assunto <strong>"Ative sua conta no SmartBid"</strong>.</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-[#1B4D3E] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</div>
                  <span>Clique no botão verde <strong>"Confirmar Meu E-mail e Acessar"</strong>.</span>
                </div>
              </div>
            </div>

            {/* Banner Destacado de Spam / Lixo Eletrônico */}
            <div className="p-5 bg-amber-50/90 rounded-2xl border border-amber-200 text-left flex items-start gap-3.5">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-amber-950">
                  ⚠️ Não encontrou o e-mail na Caixa de Entrada?
                </p>
                <p className="text-amber-900 leading-relaxed">
                  Verifique a sua pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>. Alguns provedores de e-mail podem filtrar a primeira mensagem automática. Ao abrir, clique em <strong>"Não é Spam"</strong> para autorizar o recebimento seguro de todas as notificações do sistema.
                </p>
              </div>
            </div>

            {/* Alertas de Reenvio */}
            {resendSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{resendSuccess}</span>
              </div>
            )}

            {resendError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                <AlertTriangle size={16} className="text-rose-600" />
                <span>{resendError}</span>
              </div>
            )}

            {/* Ações */}
            <div className="pt-2 space-y-3">
              <button
                type="button"
                onClick={handleResend}
                disabled={resendLoading || resendCooldown > 0}
                className="w-full py-3.5 px-4 rounded-xl border border-slate-300 hover:border-[#1B4D3E] bg-white text-slate-700 hover:text-[#1B4D3E] text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <RefreshCw size={15} className={resendLoading ? 'animate-spin' : ''} />
                {resendCooldown > 0 
                  ? `Reenviar e-mail em ${resendCooldown}s` 
                  : resendLoading ? 'Enviando novo link...' : 'Reenviar E-mail de Ativação'}
              </button>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 px-1">
                <button
                  type="button"
                  onClick={() => setStep('FORM')}
                  className="hover:text-slate-800 hover:underline cursor-pointer"
                >
                  ← Corrigir e-mail informado
                </button>
                <Link
                  href="/login"
                  className="font-bold text-[#1B4D3E] hover:underline"
                >
                  Ir para a tela de Login →
                </Link>
              </div>
            </div>

          </div>
        </main>
      ) : (
        /* FORMULÁRIO DE CADASTRO */
        <main className="max-w-[1200px] mx-auto px-6 pb-20 pt-6 lg:pt-12 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Coluna de valor */}
          <section className="lg:col-span-6 lg:pt-6">
            <p className="text-[14px] font-semibold mb-5" style={{ color: '#EA580C' }}>
              Teste grátis por 30 dias
            </p>
            <h1 className="text-[36px] sm:text-[46px] leading-[1.05]" style={title}>
              Crie a sua conta e monte a primeira proposta hoje.
            </h1>
            <p className="mt-5 text-[17px] leading-[1.6] max-w-[520px]" style={{ color: C.muted }}>
              Acesso completo à plataforma durante o teste. Sem cartão de crédito e sem falar com vendedor.
            </p>

            <ul className="mt-10 space-y-5 max-w-[520px]">
              {[
                ['Custos por CCT', 'Encargos, benefícios e insumos calculados por posto.'],
                ['DRE do projeto', 'Receita, tributos, custo operacional e margem antes de enviar.'],
                ['Proposta por link', 'Saiba quando o cliente abriu, quanto tempo leu e o que viu.'],
                ['Radar comercial', 'Pipeline, prospecção e reajustes anuais no mesmo lugar.'],
              ].map(([t, d]) => (
                <li key={t} className="flex gap-4">
                  <span
                    className="mt-0.5 w-6 h-6 shrink-0 rounded-full flex items-center justify-center"
                    style={{ background: C.greenSoft, color: C.green }}
                  >
                    <Check size={14} strokeWidth={3} />
                  </span>
                  <div>
                    <p className="text-[16px] font-semibold">{t}</p>
                    <p className="text-[15px] mt-0.5" style={{ color: C.muted }}>{d}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-12 pt-8 border-t grid grid-cols-3 gap-6 max-w-[520px]" style={{ borderColor: C.line }}>
              {[
                ['30 dias', 'de acesso completo'],
                ['2 min', 'para criar a conta'],
                ['R$ 0', 'durante o teste'],
              ].map(([n, l]) => (
                <div key={n}>
                  <p className="text-[28px] leading-none tabular-nums" style={title}>{n}</p>
                  <p className="text-[13px] mt-2" style={{ color: C.muted }}>{l}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Formulário */}
          <section className="lg:col-span-6">
            <div
              className="bg-white rounded-[22px] border p-7 sm:p-9 shadow-[0_30px_60px_-35px_rgba(17,20,24,0.3)]"
              style={{ borderColor: C.line }}
            >
              <h2 className="text-[24px]" style={title}>Comece o seu teste grátis de 30 dias</h2>
              <p className="text-[14px] mt-1.5 mb-7" style={{ color: C.muted }}>
                {plano ? `Plano escolhido: ${plano}. ` : ''}Você só escolhe e paga o plano após concluir os 30 dias.
              </p>

              <a
                href="/api/auth/google"
                className="flex items-center justify-center gap-3 w-full h-12 rounded-xl border text-[15px] font-semibold transition-colors hover:bg-[#F6F5F1]"
                style={{ borderColor: C.line }}
              >
                <svg viewBox="0 0 48 48" className="w-5 h-5 shrink-0" aria-hidden>
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                </svg>
                Continuar com Google
              </a>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px" style={{ background: C.line }} />
                <span className="text-[13px]" style={{ color: C.muted }}>ou com e-mail</span>
                <div className="flex-1 h-px" style={{ background: C.line }} />
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="Seu nome">
                    <input id="cadastro-nome" className={inputCls} style={{ borderColor: C.line }} value={form.nome} onChange={set('nome')} autoComplete="name" placeholder="Maria Souza" />
                  </Field>
                  <Field label="Empresa">
                    <input id="cadastro-empresa" className={inputCls} style={{ borderColor: C.line }} value={form.empresa} onChange={set('empresa')} autoComplete="organization" placeholder="Sua empresa Ltda." />
                  </Field>
                </div>
                <Field label="E-mail corporativo">
                  <input id="cadastro-email" type="email" className={inputCls} style={{ borderColor: C.line }} value={form.email} onChange={set('email')} autoComplete="email" placeholder="voce@empresa.com.br" />
                </Field>
                <Field label="WhatsApp">
                  <input id="cadastro-whatsapp" type="tel" inputMode="numeric" className={inputCls} style={{ borderColor: C.line }} value={form.celular} onChange={set('celular')} autoComplete="tel" placeholder="(11) 99999-9999" />
                </Field>
                <div>
                  <PasswordInputWithRequirements
                    label="Senha corporativa segura"
                    value={form.password}
                    onChange={(val) => setForm(f => ({ ...f, password: val }))}
                    placeholder="Mínimo 8 caracteres (A, a, 1, !)"
                    required={true}
                  />
                </div>

                {error && (
                  <p className="text-[14px] rounded-xl px-4 py-3" style={{ background: '#FDF0EE', color: '#9B2C1F' }}>
                    {error}
                  </p>
                )}

                {/* Checkbox de Aceite LGPD */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1 pb-1 text-left select-none group">
                  <input
                    type="checkbox"
                    id="accept-terms-checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (e.target.checked) setError('');
                    }}
                    className="w-4 h-4 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer shrink-0"
                  />
                  <span className="text-[12px] leading-relaxed" style={{ color: C.muted }}>
                    Declaro que li e concordo com os{' '}
                    <Link href="/termos" target="_blank" className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950">
                      Termos de Uso
                    </Link>{' '}
                    e a{' '}
                    <Link href="/privacidade" target="_blank" className="font-semibold text-emerald-800 underline underline-offset-2 hover:text-emerald-950">
                      Política de Privacidade (LGPD)
                    </Link>.
                  </span>
                </label>

                <button
                  id="cadastro-submit"
                  type="submit"
                  disabled={loading}
                  className="group w-full h-[52px] rounded-xl text-white text-[15px] font-bold inline-flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-12px_rgba(234,88,12,0.8)] disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                  style={{ background: '#EA580C', boxShadow: '0 10px 30px -10px rgba(234,88,12,0.7)' }}
                >
                  {loading ? 'Criando a sua conta…' : (
                    <>
                      Criar conta e começar o teste
                      <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </section>
        </main>
      )}
    </div>
  );
}

export default function CadastroPage() {
  return (
    <Suspense fallback={null}>
      <CadastroForm />
    </Suspense>
  );
}
