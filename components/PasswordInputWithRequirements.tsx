'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, Sparkles, KeyRound } from 'lucide-react';

interface PasswordInputWithRequirementsProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  confirmValue?: string;
  onConfirmChange?: (value: string) => void;
  showConfirmInput?: boolean;
  disabled?: boolean;
  required?: boolean;
  showGenerateButton?: boolean;
}

export default function PasswordInputWithRequirements({
  label = 'Senha',
  value,
  onChange,
  placeholder = 'Digite sua senha...',
  confirmValue,
  onConfirmChange,
  showConfirmInput = false,
  disabled = false,
  required = false,
  showGenerateButton = true,
}: PasswordInputWithRequirementsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  // Regras de validação (exatamente como solicitado)
  const hasNumber = /[0-9]/.test(value);
  const hasLower = /[a-z]/.test(value);
  const hasUpper = /[A-Z]/.test(value);
  const hasMinLength = value.length >= 8;
  const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(value);
  const hasOnlyLatin = value.length > 0 && /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]+$/.test(value);
  const passwordsMatch = confirmValue !== undefined && value.length > 0 && value === confirmValue;

  const handleCopy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleGenerateStrongPassword = () => {
    const lowers = 'abcdefghjkmnpqrstuvwxyz';
    const uppers = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const symbols = '!@#$%&*';

    // Garante pelo menos um de cada
    let pwd = [
      lowers[Math.floor(Math.random() * lowers.length)],
      uppers[Math.floor(Math.random() * uppers.length)],
      numbers[Math.floor(Math.random() * numbers.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
    ];

    const allChars = lowers + uppers + numbers + symbols;
    for (let i = 0; i < 8; i++) {
      pwd.push(allChars[Math.floor(Math.random() * allChars.length)]);
    }

    // Embaralha
    pwd = pwd.sort(() => Math.random() - 0.5);
    const generated = pwd.join('');

    onChange(generated);
    if (onConfirmChange) {
      onConfirmChange(generated);
    }
    setShowPassword(true);
  };

  return (
    <div className="space-y-3 w-full">
      {/* Label e Botão Gerador */}
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 block">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {showGenerateButton && (
          <button
            type="button"
            onClick={handleGenerateStrongPassword}
            disabled={disabled}
            className="text-[11px] font-bold text-[#1B4D3E] hover:text-[#13382D] hover:underline flex items-center gap-1 cursor-pointer transition-colors"
          >
            <Sparkles size={12} className="text-amber-500" />
            Gerar senha forte
          </button>
        )}
      </div>

      {/* Container do Input com botões internos */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 group">
          <input
            type={showPassword ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            className="w-full bg-white border-2 border-slate-200 focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/10 rounded-2xl py-3 pl-4 pr-24 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
          />

          {/* Botões à direita do input: Copiar e Ver */}
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400">
            {value && (
              <button
                type="button"
                onClick={handleCopy}
                title={copied ? 'Senha copiada!' : 'Copiar senha'}
                className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              title={showPassword ? 'Ocultar senha' : 'Exibir senha'}
              className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Botão de Atalho para Gerador de Senha */}
        {showGenerateButton && (
          <button
            type="button"
            onClick={handleGenerateStrongPassword}
            title="Gerar automaticamente uma senha segura"
            disabled={disabled}
            className="p-3 bg-slate-50 hover:bg-slate-100 border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-2xl transition-all cursor-pointer flex items-center justify-center font-mono font-bold text-xs tracking-tighter"
          >
            ***
          </button>
        )}
      </div>

      {/* Input Opcional de Confirmação de Senha */}
      {showConfirmInput && onConfirmChange && (
        <div className="space-y-1.5 pt-1">
          <label className="text-xs font-bold text-slate-700 block">
            Confirmar Senha {required && <span className="text-red-500">*</span>}
          </label>
          <div className="relative group">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmValue || ''}
              onChange={(e) => onConfirmChange(e.target.value)}
              placeholder="Digite a mesma senha novamente..."
              disabled={disabled}
              required={required}
              className="w-full bg-white border-2 border-slate-200 focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/10 rounded-2xl py-3 pl-4 pr-12 text-sm font-semibold text-slate-800 outline-none transition-all placeholder:text-slate-400 placeholder:font-normal"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
      )}

      {/* GRID DE CHECKS (Conforme o layout solicitado pelo usuário) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-2">
        {/* Coluna 1 */}
        <div className="space-y-2">
          {/* Um número */}
          <div className="flex items-center gap-2 text-xs transition-colors">
            <Check
              size={15}
              className={`shrink-0 transition-colors ${
                hasNumber ? 'text-emerald-600 stroke-[3]' : 'text-slate-300 stroke-[2]'
              }`}
            />
            <span className={hasNumber ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
              Um número
            </span>
          </div>

          {/* Uma letra minúscula */}
          <div className="flex items-center gap-2 text-xs transition-colors">
            <Check
              size={15}
              className={`shrink-0 transition-colors ${
                hasLower ? 'text-emerald-600 stroke-[3]' : 'text-slate-300 stroke-[2]'
              }`}
            />
            <span className={hasLower ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
              Uma letra minúscula
            </span>
          </div>

          {/* No mínimo 8 caracteres */}
          <div className="flex items-center gap-2 text-xs transition-colors">
            <Check
              size={15}
              className={`shrink-0 transition-colors ${
                hasMinLength ? 'text-emerald-600 stroke-[3]' : 'text-slate-300 stroke-[2]'
              }`}
            />
            <span className={hasMinLength ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
              No mínimo 8 caracteres
            </span>
          </div>
        </div>

        {/* Coluna 2 */}
        <div className="space-y-2">
          {/* Um símbolo */}
          <div className="flex items-center gap-2 text-xs transition-colors">
            <Check
              size={15}
              className={`shrink-0 transition-colors ${
                hasSymbol ? 'text-emerald-600 stroke-[3]' : 'text-slate-300 stroke-[2]'
              }`}
            />
            <span className={hasSymbol ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
              Um símbolo
            </span>
          </div>

          {/* Uma letra maiúscula */}
          <div className="flex items-center gap-2 text-xs transition-colors">
            <Check
              size={15}
              className={`shrink-0 transition-colors ${
                hasUpper ? 'text-emerald-600 stroke-[3]' : 'text-slate-300 stroke-[2]'
              }`}
            />
            <span className={hasUpper ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
              Uma letra maiúscula
            </span>
          </div>

          {/* Apenas letras do alfabeto latino OU Confirmação idêntica */}
          {showConfirmInput ? (
            <div className="flex items-center gap-2 text-xs transition-colors">
              <Check
                size={15}
                className={`shrink-0 transition-colors ${
                  passwordsMatch ? 'text-emerald-600 stroke-[3]' : 'text-slate-300 stroke-[2]'
                }`}
              />
              <span className={passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-slate-400'}>
                Confirmação idêntica
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs transition-colors">
              <Check
                size={15}
                className={`shrink-0 transition-colors ${
                  hasOnlyLatin ? 'text-emerald-600 stroke-[3]' : 'text-slate-300 stroke-[2]'
                }`}
              />
              <span className={hasOnlyLatin ? 'text-slate-800 font-semibold' : 'text-slate-400'}>
                Apenas letras do alfabeto latino
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
