'use client';

import React, { useState } from 'react';
import { TrendingUp, Mail, Lock, User, Building2, ArrowRight, Chrome, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CadastroPage() {
  const router = useRouter();
  const [step, setStep] = useState<'choose' | 'form'>('choose');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nome: '', email: '', password: '', empresa: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || !form.email.trim() || !form.password.trim()) {
      setError('Preencha todos os campos obrigatórios.');
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
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        window.location.href = '/';
      } else {
        setError(data.error || 'Erro ao criar conta.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    'Radar Comercial com KPIs em tempo real',
    'Prospecção inteligente de leads B2B',
    'Engenharia de custos com tabelas CCT',
    'CRM com pipeline visual e WhatsApp',
    'Geração de propostas e contratos',
  ];

  return (
    <div className="min-h-screen bg-[#070B19] flex items-stretch relative overflow-hidden font-sans">

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#10B981]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#1B4D3E]/20 rounded-full blur-[100px]" />
      </div>

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 p-12 bg-gradient-to-b from-[#0D1A14] to-[#070B19] border-r border-white/5 relative z-10">
        {/* Logo */}
        <div>
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-[#10B981]" size={22} />
            </div>
            <div>
              <p className="text-lg font-black tracking-tight text-white uppercase leading-none">
                Smart<span className="text-[#10B981]">Bid</span>
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Facilities & CLM</p>
            </div>
          </Link>

          <h2 className="text-3xl font-black text-white leading-tight mb-4">
            Inteligência Comercial<br />
            <span className="text-[#10B981]">para Facilities</span>
          </h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-10">
            A plataforma que elimina planilhas e transforma a operação comercial da sua empresa em um sistema previsível e escalável.
          </p>

          {/* Benefits */}
          <div className="space-y-3">
            {benefits.map((b, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-[#10B981]/10 border border-[#10B981]/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={11} className="text-[#10B981]" />
                </div>
                <span className="text-sm text-slate-300">{b}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trial badge */}
        <div className="bg-[#10B981]/5 border border-[#10B981]/20 rounded-2xl p-5">
          <p className="text-[#10B981] text-xs font-black uppercase tracking-widest mb-1">14 dias grátis</p>
          <p className="text-white text-sm font-bold">Sem cartão de crédito</p>
          <p className="text-slate-500 text-xs mt-1">Cancele quando quiser, sem burocracia.</p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-9 h-9 bg-[#10B981]/10 border border-[#10B981]/30 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-[#10B981]" size={18} />
            </div>
            <p className="text-xl font-black tracking-tight text-white uppercase">
              Smart<span className="text-[#10B981]">Bid</span>
            </p>
          </div>

          {step === 'choose' ? (
            /* ── STEP 1: Escolha o método ── */
            <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
              <div className="mb-8 text-center">
                <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Criar Conta Grátis</h1>
                <p className="text-slate-400 text-sm">14 dias de teste. Sem cartão de crédito.</p>
              </div>

              {/* Google button */}
              <a
                href="/api/auth/google"
                className="flex items-center justify-center gap-3 w-full py-3.5 px-5 bg-white hover:bg-slate-100 text-slate-900 font-bold text-sm rounded-2xl transition-all shadow-lg mb-4 group"
              >
                <svg viewBox="0 0 48 48" className="w-5 h-5 shrink-0">
                  <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                  <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                  <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                  <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                </svg>
                Continuar com o Google
                <ArrowRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
              </a>

              {/* Divider */}
              <div className="flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-slate-500 text-xs font-bold uppercase tracking-widest">ou</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              {/* Email button */}
              <button
                onClick={() => setStep('form')}
                className="flex items-center justify-center gap-3 w-full py-3.5 px-5 bg-[#10B981] hover:bg-[#059669] text-slate-950 font-black text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20 group"
              >
                <Mail size={16} />
                Criar conta com E-mail
                <ArrowRight size={14} className="ml-auto group-hover:translate-x-1 transition-transform" />
              </button>

              <p className="text-center text-slate-500 text-xs mt-6">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-[#10B981] font-bold hover:underline">
                  Entrar
                </Link>
              </p>

              <p className="text-center text-slate-600 text-[11px] mt-4 leading-relaxed">
                Ao criar sua conta você concorda com os{' '}
                <span className="text-slate-500">Termos de Uso</span> e a{' '}
                <span className="text-slate-500">Política de Privacidade</span> do SmartBidHub.
              </p>
            </div>
          ) : (
            /* ── STEP 2: Formulário de cadastro ── */
            <div className="bg-white/[0.03] border border-white/8 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
              <button
                onClick={() => setStep('choose')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-wider mb-6 transition-colors"
              >
                ← Voltar
              </button>

              <div className="mb-7">
                <h1 className="text-2xl font-black text-white uppercase tracking-tight mb-2">Criar Conta</h1>
                <p className="text-slate-400 text-sm">Preencha os dados abaixo para começar.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome completo *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      name="nome"
                      type="text"
                      value={form.nome}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#10B981]/50 focus:bg-white/8 transition-all"
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">E-mail corporativo *</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="voce@empresa.com.br"
                      className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#10B981]/50 focus:bg-white/8 transition-all"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Empresa */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome da empresa</label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      name="empresa"
                      type="text"
                      value={form.empresa}
                      onChange={handleChange}
                      placeholder="Sua empresa Ltda."
                      className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#10B981]/50 focus:bg-white/8 transition-all"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha *</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full pl-9 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-[#10B981]/50 focus:bg-white/8 transition-all"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-xs font-medium">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full py-3.5 bg-[#10B981] hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black text-sm rounded-2xl transition-all shadow-lg shadow-emerald-500/20 mt-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    <>
                      Criar Conta Grátis
                      <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-slate-500 text-xs mt-5">
                Já tem uma conta?{' '}
                <Link href="/login" className="text-[#10B981] font-bold hover:underline">
                  Entrar
                </Link>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
