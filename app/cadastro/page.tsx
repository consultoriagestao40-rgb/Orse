'use client';

import React, { Suspense, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Check } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { textFont } from '@/components/lp/fonts';

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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nome: '', empresa: '', email: '', celular: '', password: '' });

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
    if (form.celular.replace(/\D/g, '').length < 10) {
      setError('Informe um WhatsApp válido com DDD.');
      return;
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
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
      if (res.ok) {
        window.location.href = '/';
      } else {
        setError(data.error || 'Não foi possível criar a conta.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
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

      <main className="max-w-[1200px] mx-auto px-6 pb-20 pt-6 lg:pt-12 grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Coluna de valor */}
        <section className="lg:col-span-6 lg:pt-6">
          <p className="text-[14px] font-semibold mb-5" style={{ color: C.green }}>
            Teste grátis por 7 dias
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
              ['7 dias', 'de acesso completo'],
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
            <h2 className="text-[24px]" style={title}>Comece o seu teste grátis</h2>
            <p className="text-[14px] mt-1.5 mb-7" style={{ color: C.muted }}>
              {plano ? `Plano escolhido: ${plano}. ` : ''}Você só escolhe o plano depois dos 7 dias.
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
              <Field label="Senha">
                <div className="relative">
                  <input
                    id="cadastro-senha"
                    type={showPassword ? 'text' : 'password'}
                    className={`${inputCls} pr-12`}
                    style={{ borderColor: C.line }}
                    value={form.password}
                    onChange={set('password')}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 cursor-pointer"
                    style={{ color: C.muted }}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>

              {error && (
                <p className="text-[14px] rounded-xl px-4 py-3" style={{ background: '#FDF0EE', color: '#9B2C1F' }}>
                  {error}
                </p>
              )}

              <button
                id="cadastro-submit"
                type="submit"
                disabled={loading}
                className="group w-full h-[52px] rounded-xl text-white text-[15px] font-semibold inline-flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0 cursor-pointer"
                style={{ background: C.green }}
              >
                {loading ? 'Criando a sua conta…' : (
                  <>
                    Criar conta e começar o teste
                    <ArrowRight size={17} className="group-hover:translate-x-0.5 transition-transform" />
                  </>
                )}
              </button>

              <p className="text-[12px] leading-relaxed text-center pt-1" style={{ color: C.muted }}>
                Ao criar a conta você concorda com os Termos de Uso e a Política de Privacidade do SmartBid.
              </p>
            </form>
          </div>
        </section>
      </main>
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
