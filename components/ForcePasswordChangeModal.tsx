'use client';

import React, { useState, useEffect } from 'react';
import { Lock, ShieldAlert, CheckCircle2, XCircle, Eye, EyeOff, KeyRound, Loader2, ArrowRight } from 'lucide-react';
import { changeMyPassword } from '@/app/propostas/actions';
import PasswordInputWithRequirements from './PasswordInputWithRequirements';

export default function ForcePasswordChangeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Não executa em rotas públicas
    if (typeof window === 'undefined') return;
    const pathname = window.location.pathname;
    if (
      pathname.startsWith('/login') ||
      pathname.startsWith('/cadastro') ||
      pathname.startsWith('/proposta/ver/') ||
      pathname.startsWith('/lp')
    ) {
      return;
    }

    const checkMustChange = () => {
      const cookies = document.cookie.split('; ');
      const mustChangeCookie = cookies.find(row => row.startsWith('sb_must_change_password='));
      if (mustChangeCookie && mustChangeCookie.split('=')[1] === '1') {
        setIsOpen(true);
        return;
      }

      const userCookie = cookies.find(row => row.startsWith('sb_user='));
      if (userCookie) {
        try {
          const raw = decodeURIComponent(userCookie.split('=')[1]);
          const parsed = JSON.parse(raw);
          if (parsed?.mustChangePassword === true) {
            setIsOpen(true);
          }
        } catch {}
      }
    };

    checkMustChange();
  }, []);

  // Critérios da Política Forte de Segurança
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isDifferentFromCurrent = currentPassword.length > 0 && newPassword !== currentPassword;

  const isFormValid =
    currentPassword.length > 0 &&
    hasMinLength &&
    hasUpper &&
    hasLower &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch &&
    isDifferentFromCurrent;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setLoading(true);
    setError('');

    try {
      const res = await changeMyPassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        setSuccess(true);
        // Remove os cookies de bloqueio
        document.cookie = 'sb_must_change_password=; path=/; max-age=0';
        
        // Atualiza cookie sb_user localmente
        try {
          const userCookie = document.cookie.split('; ').find(row => row.startsWith('sb_user='));
          if (userCookie) {
            const parsed = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
            parsed.mustChangePassword = false;
            document.cookie = `sb_user=${encodeURIComponent(JSON.stringify(parsed))}; path=/; max-age=604800; SameSite=Lax`;
          }
        } catch {}

        setTimeout(() => {
          setIsOpen(false);
          window.location.reload();
        }, 1500);
      } else {
        setError(res.error || 'Erro ao atualizar a senha.');
      }
    } catch (err: any) {
      setError(err.message || 'Erro de comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden relative my-8">
        
        {/* Header de Segurança Institucional */}
        <div className="bg-[#1B4D3E] p-6 sm:p-8 text-white relative">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldAlert size={26} />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
                Troca Obrigatória de Senha
              </h2>
              <p className="text-xs text-emerald-100/80 font-medium">
                Política de Segurança & Proteção de Dados Corporativos
              </p>
            </div>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="p-6 sm:p-8 space-y-6">
          {success ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200 shadow-lg">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                Senha Atualizada com Sucesso!
              </h3>
              <p className="text-xs text-slate-500 font-medium max-w-xs mx-auto">
                Sua nova credencial atende à política forte de segurança. Liberando seu acesso à plataforma...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl flex items-start gap-3">
                <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-900 leading-relaxed font-medium">
                  Por determinação de segurança, todos os usuários devem atualizar a senha cadastrando uma nova combinação forte antes de acessar o sistema.
                </p>
              </div>

              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <XCircle size={16} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Senha Atual */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
                  Senha Atual (ou senha padrão/temporária)
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Digite sua senha atual..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-[#1B4D3E] focus:bg-white pr-10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Nova Senha e Confirmação com Checklist Visual */}
              <PasswordInputWithRequirements
                label="Nova Senha Forte"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Cadastre sua nova senha forte..."
                confirmValue={confirmPassword}
                onConfirmChange={setConfirmPassword}
                showConfirmInput={true}
                disabled={loading}
                required={true}
              />

              {currentPassword && newPassword && currentPassword === newPassword && (
                <p className="text-[11px] font-bold text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  ⚠️ A nova senha deve ser diferente da senha atual.
                </p>
              )}

              {/* Botão de Envio */}
              <button
                type="submit"
                disabled={!isFormValid || loading}
                className={`w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-md ${
                  isFormValid && !loading
                    ? 'bg-[#1B4D3E] hover:bg-[#13382D] text-white cursor-pointer active:scale-98 shadow-emerald-950/20'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed select-none'
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Validando & Salvando...
                  </>
                ) : (
                  <>
                    <KeyRound size={16} />
                    Salvar Nova Senha e Liberar Acesso
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
