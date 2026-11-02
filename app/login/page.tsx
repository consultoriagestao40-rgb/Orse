'use client';

import React, { useState } from 'react';
import { LogIn, Shield, TrendingUp, Briefcase, Mail, Lock, ArrowRight, X, KeyRound, Copy, CheckCircle2, Eye, EyeOff, XCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { requestPasswordReset, confirmPasswordResetWithCode } from '@/app/propostas/actions';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Estados de Autenticação em Dois Fatores (2FA)
  const [step, setStep] = useState<'LOGIN' | '2FA'>('LOGIN');
  const [twoFactorCode, setTwoFactorCode] = useState('');

  // Estados do modal de Esqueci minha Senha por E-mail (OTP)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'EMAIL' | 'CODE_PASSWORD'>('EMAIL');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNew, setShowForgotNew] = useState(false);
  const [showForgotConfirm, setShowForgotConfirm] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Validações da Política Forte de Senhas
  const forgotHasMinLength = forgotNewPassword.length >= 8;
  const forgotHasUpper = /[A-Z]/.test(forgotNewPassword);
  const forgotHasLower = /[a-z]/.test(forgotNewPassword);
  const forgotHasNumber = /[0-9]/.test(forgotNewPassword);
  const forgotHasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(forgotNewPassword);
  const forgotPasswordsMatch = forgotNewPassword.length > 0 && forgotNewPassword === forgotConfirmPassword;

  const isForgotFormValid =
    forgotCode.trim().length === 6 &&
    forgotHasMinLength &&
    forgotHasUpper &&
    forgotHasLower &&
    forgotHasNumber &&
    forgotHasSpecial &&
    forgotPasswordsMatch;

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await requestPasswordReset(forgotEmail);
      if (res.success) {
        setForgotStep('CODE_PASSWORD');
      } else {
        setForgotError(res.error || 'Erro ao processar solicitação.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Erro de comunicação com o servidor.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isForgotFormValid) return;

    setForgotLoading(true);
    setForgotError('');

    try {
      const res = await confirmPasswordResetWithCode(forgotEmail, forgotCode, forgotNewPassword, forgotConfirmPassword);
      if (res.success) {
        setForgotSuccess(true);
        setPassword(forgotNewPassword);
        setEmail(forgotEmail);
        setTimeout(() => {
          setShowForgotModal(false);
          setForgotSuccess(false);
          setForgotStep('EMAIL');
          setForgotCode('');
          setForgotNewPassword('');
          setForgotConfirmPassword('');
        }, 1800);
      } else {
        setForgotError(res.error || 'Erro ao redefinir a senha.');
      }
    } catch (err: any) {
      setForgotError(err.message || 'Erro de comunicação com o servidor.');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleLoginSuccess = (userData: any) => {
    const superAdmins = ['admin@smartbidhub.com.br', 'admin@smartbid.com'];
    const userEmail = userData?.email?.toLowerCase()?.trim() || '';
    const userCargo = userData?.cargo?.toLowerCase() || '';
    const isMobile = window.innerWidth < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    if (superAdmins.includes(userEmail)) {
      window.location.href = '/admin/empresas';
    } else if (isMobile || userCargo.includes('tecnico') || userCargo.includes('técnico')) {
      window.location.href = '/ativos/tecnico';
    } else {
      window.location.href = '/';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        if (data.requires2FA) {
          setStep('2FA');
          setError('');
        } else {
          handleLoginSuccess(data.user);
        }
      } else {
        setError(data.error || 'Credenciais inválidas.');
      }
    } catch (err) {
      setError('Erro ao tentar realizar login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: twoFactorCode })
      });

      const data = await res.json();

      if (res.ok) {
        handleLoginSuccess(data.user);
      } else {
        setError(data.error || 'Código incorreto ou expirado.');
      }
    } catch (err) {
      setError('Erro ao verificar código de segurança.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center relative overflow-hidden font-sans">
      {/* Background Decorativo - Gráficos Abstratos */}
      <div className="absolute inset-0 z-0">
        <svg className="absolute top-0 right-0 w-full h-full opacity-10" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M100 600C100 600 200 400 400 450C600 500 700 300 700 300" stroke="#10B981" strokeWidth="2" strokeDasharray="10 10" />
          <circle cx="700" cy="300" r="10" fill="#10B981" />
          <path d="M50 700C50 700 150 550 350 600C550 650 750 450 750 450" stroke="#1B4D3E" strokeWidth="4" />
          <circle cx="350" cy="600" r="5" fill="#1B4D3E" />
          <rect x="500" y="100" width="200" height="200" rx="20" transform="rotate(15)" stroke="#1B4D3E" strokeWidth="1" />
        </svg>
        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-[#1B4D3E] rounded-full blur-[120px] opacity-20"></div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#10B981] rounded-full blur-[100px] opacity-10"></div>
      </div>

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden z-10 mx-4">
        
        {/* Lado Esquerdo: Branding & Info */}
        <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-[#1B4D3E] to-[#0F172A] text-white">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                <TrendingUp className="text-[#10B981]" size={28} />
              </div>
              <h1 className="text-3xl font-black tracking-tighter uppercase">Smart<span className="text-[#10B981]">Bid</span></h1>
            </div>
            <h2 className="text-4xl font-bold leading-tight mb-6">
              Inteligência em Vendas <br /> 
              <span className="text-[#10B981]">Facilities & Serviços</span>
            </h2>
            <p className="text-slate-400 text-lg max-w-md">
              A plataforma definitiva para engenharia de custos e controle comercial da Silva Consultoria Empresarial LTDA.
            </p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Shield size={20} className="text-[#10B981]" />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-wider">Segurança de Dados</p>
                <p className="text-xs text-slate-400">Acesso criptografado e controle de perfil hierárquico.</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Briefcase size={20} className="text-[#10B981]" />
              </div>
              <div>
                <p className="font-bold text-sm uppercase tracking-wider">Gestão Comercial</p>
                <p className="text-xs text-slate-400">Visibilidade total do pipeline de propostas e margens.</p>
              </div>
            </div>
          </div>

          <p className="text-slate-500 text-xs font-medium uppercase tracking-[0.2em]">
            © 2026 Silva Consultoria Empresarial LTDA • CNPJ 40.180.983/0001-00
          </p>
        </div>

        {/* Lado Direito: Formulário */}
        <div className="p-8 lg:p-16 flex flex-col justify-center bg-white">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <TrendingUp className="text-[#1B4D3E]" size={24} />
            <h1 className="text-2xl font-black tracking-tighter uppercase text-[#0F172A]">Smart<span className="text-[#1B4D3E]">Bid</span></h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h3 className="text-3xl font-black text-[#0F172A] mb-2 uppercase tracking-tight">Bem-vindo</h3>
            <p className="text-slate-500 font-medium italic">Acesse sua conta para gerenciar propostas.</p>
          </div>

          {step === '2FA' ? (
            <form onSubmit={handleVerify2FA} className="space-y-6 animate-fadeIn">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#1B4D3E] flex items-center justify-center mx-auto border border-emerald-200 shadow-sm">
                  <Shield size={28} />
                </div>
                <h4 className="text-lg font-black text-slate-900 uppercase tracking-tight">Verificação em 2 Fatores</h4>
                <p className="text-xs text-slate-500">
                  Enviamos um código de segurança de 6 dígitos para o e-mail:
                </p>
                <p className="text-xs font-bold text-[#1B4D3E] bg-emerald-50/60 py-1 px-3 rounded-full inline-block border border-emerald-200">
                  {email}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">
                  Código de 6 dígitos
                </label>
                <input 
                  type="text" 
                  maxLength={6}
                  autoFocus
                  required
                  placeholder="000000"
                  className="w-full text-center text-3xl font-black tracking-[0.35em] bg-slate-50 border-2 border-slate-200 focus:border-[#1B4D3E] focus:bg-white rounded-2xl py-4 outline-none transition-all text-slate-800"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                />
                <p className="text-[11px] text-slate-400 text-center">
                  O código expira em 10 minutos.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-shake">
                  <Shield size={16} />
                  {error}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading || twoFactorCode.length < 6}
                className="w-full bg-[#1B4D3E] hover:bg-[#13382D] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1B4D3E]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    Confirmar e Entrar
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep('LOGIN');
                    setTwoFactorCode('');
                    setError('');
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-wider"
                >
                  ← Voltar para E-mail e Senha
                </button>
              </div>
            </form>
          ) : (
            <>
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={18} />
                    <input 
                      type="email" 
                      required
                      placeholder="exemplo@silvaconsultoria.com.br"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/5 transition-all font-medium text-slate-700"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center ml-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                    <button 
                      type="button"
                      onClick={() => {
                        setForgotEmail('');
                        setForgotError('');
                        setTempPassword('');
                        setShowForgotModal(true);
                      }}
                      className="text-[10px] font-bold text-[#1B4D3E] uppercase hover:underline cursor-pointer"
                    >
                      Esqueci a senha
                    </button>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={18} />
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/5 transition-all font-medium text-slate-700"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold flex items-center gap-2 animate-shake">
                    <Shield size={16} />
                    {error}
                  </div>
                )}

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1B4D3E] hover:bg-[#13382D] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1B4D3E]/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Entrar no Sistema
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <div className="relative my-6 text-center">
                <hr className="border-slate-100" />
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ou</span>
              </div>

              <button 
                type="button"
                onClick={() => window.location.href = '/api/auth/google'}
                className="w-full bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                </svg>
                Entrar com o Google
              </button>
            </>
          )}

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Não possui acesso? <span className="text-[#1B4D3E] font-bold cursor-pointer hover:underline">Contate o administrador</span>
            </p>
          </div>
        </div>
      </div>

      {/* MODAL ESQUECI MINHA SENHA POR E-MAIL & NOVA SENHA FORTE */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#1B4D3E] p-6 sm:p-8 text-white relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400">
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight uppercase">
                    Recuperação de <span className="text-[#10B981]">Acesso</span>
                  </h3>
                  <p className="text-emerald-100/70 text-xs">
                    {forgotStep === 'EMAIL' 
                      ? 'Validação de identidade por código no seu e-mail corporativo.' 
                      : 'Insira o código recebido e crie sua nova senha forte.'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep('EMAIL');
                  setForgotError('');
                }} 
                className="absolute top-6 right-6 text-white/50 hover:text-white cursor-pointer"
                disabled={forgotLoading}
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {forgotSuccess ? (
                <div className="py-6 text-center space-y-3 animate-in fade-in duration-300">
                  <div className="mx-auto w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shadow-md">
                    <CheckCircle2 size={30} />
                  </div>
                  <h4 className="text-base font-black text-slate-800 uppercase tracking-tight">
                    Senha Redefinida com Sucesso!
                  </h4>
                  <p className="text-xs text-slate-500 font-medium">
                    Suas novas credenciais foram atualizadas. Redirecionando para o login...
                  </p>
                </div>
              ) : forgotStep === 'EMAIL' ? (
                /* PASSO 1: SOLICITAR CÓDIGO POR E-MAIL */
                <form onSubmit={handleRequestReset} className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      E-mail Corporativo
                    </label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={18} />
                      <input 
                        type="email" 
                        required
                        placeholder="seu-email@grupojvsserv.com.br"
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-[#1B4D3E] focus:bg-white focus:ring-4 focus:ring-[#1B4D3E]/5 transition-all font-medium text-slate-700 text-sm"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        disabled={forgotLoading}
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-[11px] text-slate-500 font-medium flex items-center gap-2.5">
                    <Mail size={16} className="text-emerald-700 shrink-0" />
                    <span>Enviaremos um código de 6 dígitos para o e-mail informado para confirmar sua identidade com segurança.</span>
                  </div>

                  {forgotError && (
                    <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                      <XCircle size={16} className="shrink-0" />
                      {forgotError}
                    </div>
                  )}

                  <div className="pt-2 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                      disabled={forgotLoading}
                    >
                      Cancelar
                    </button>
                    <button 
                      type="submit"
                      disabled={forgotLoading || !forgotEmail}
                      className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382D] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#1B4D3E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Enviando Código...
                        </>
                      ) : (
                        <>
                          Enviar Código por E-mail
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* PASSO 2: INSERIR CÓDIGO E CADASTRAR NOVA SENHA FORTE */
                <form onSubmit={handleConfirmReset} className="space-y-4">
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-2xl flex items-center justify-between text-xs text-emerald-900 font-medium">
                    <span>Código enviado para: <strong>{forgotEmail}</strong></span>
                    <button
                      type="button"
                      onClick={() => setForgotStep('EMAIL')}
                      className="text-emerald-700 hover:underline font-bold text-[11px] cursor-pointer"
                    >
                      Alterar
                    </button>
                  </div>

                  {forgotError && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                      <XCircle size={16} className="shrink-0" />
                      {forgotError}
                    </div>
                  )}

                  {/* Código OTP de 6 dígitos */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Código de Verificação de 6 Dígitos
                    </label>
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      placeholder="123456"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-center font-mono text-xl font-black text-slate-800 tracking-[8px] outline-none focus:border-[#1B4D3E] focus:bg-white transition-all"
                      value={forgotCode}
                      onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                      disabled={forgotLoading}
                    />
                  </div>

                  {/* Nova Senha */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Nova Senha Forte
                    </label>
                    <div className="relative">
                      <input 
                        type={showForgotNew ? 'text' : 'password'}
                        required
                        placeholder="Digite sua nova senha..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-10 outline-none focus:border-[#1B4D3E] focus:bg-white text-xs font-bold text-slate-800 transition-all"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        disabled={forgotLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNew(!showForgotNew)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showForgotNew ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Nova Senha */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                      Confirmar Nova Senha
                    </label>
                    <div className="relative">
                      <input 
                        type={showForgotConfirm ? 'text' : 'password'}
                        required
                        placeholder="Repita a nova senha..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-10 outline-none focus:border-[#1B4D3E] focus:bg-white text-xs font-bold text-slate-800 transition-all"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        disabled={forgotLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirm(!showForgotConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showForgotConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Live Checklist dos Requisitos da Senha */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                    <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block">
                      Política Forte de Segurança:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                      <div className={`flex items-center gap-1 ${forgotHasMinLength ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {forgotHasMinLength ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} />}
                        <span>8+ caracteres</span>
                      </div>
                      <div className={`flex items-center gap-1 ${forgotHasUpper ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {forgotHasUpper ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} />}
                        <span>Maiúscula (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${forgotHasLower ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {forgotHasLower ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} />}
                        <span>Minúscula (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${forgotHasNumber ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {forgotHasNumber ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} />}
                        <span>Número (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${forgotHasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {forgotHasSpecial ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} />}
                        <span>Especial (!@#$)</span>
                      </div>
                      <div className={`flex items-center gap-1 ${forgotPasswordsMatch ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                        {forgotPasswordsMatch ? <CheckCircle2 size={12} className="text-emerald-600" /> : <XCircle size={12} />}
                        <span>Senhas conferem</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button 
                      type="button"
                      onClick={() => setForgotStep('EMAIL')}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                      disabled={forgotLoading}
                    >
                      Voltar
                    </button>
                    <button 
                      type="submit"
                      disabled={forgotLoading || !isForgotFormValid}
                      className={`flex-[2] py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                        isForgotFormValid && !forgotLoading
                          ? 'bg-[#1B4D3E] hover:bg-[#13382D] text-white shadow-lg shadow-[#1B4D3E]/20 cursor-pointer active:scale-98'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed select-none'
                      }`}
                    >
                      {forgotLoading ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Redefinindo...
                        </>
                      ) : (
                        <>
                          Redefinir e Acessar
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
}
