'use client';

import React, { useState } from 'react';
import { LogIn, Shield, TrendingUp, Briefcase, Mail, Lock, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
        if (data.user?.email === 'admin@smartbidhub.com.br') {
          window.location.href = '/admin/empresas';
        } else {
          window.location.href = '/propostas/nova'; // Redireciona via window para recarregar o estado
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
              A plataforma definitiva para engenharia de custos e controle comercial do Grupo JVS.
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
            © 2026 Grupo JVS • Orse Technology
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

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="exemplo@grupojvsserv.com.br"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/5 transition-all font-medium text-slate-700"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Senha de Acesso</label>
                <a href="#" className="text-[10px] font-bold text-[#1B4D3E] uppercase hover:underline">Esqueci a senha</a>
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

          <div className="mt-12 pt-8 border-t border-slate-100 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Não possui acesso? <span className="text-[#1B4D3E] font-bold cursor-pointer hover:underline">Contate o administrador</span>
            </p>
          </div>
        </div>
      </div>

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
