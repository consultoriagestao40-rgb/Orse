'use client';

import React, { useState } from 'react';
import { KeyRound, X, Lock, CheckCircle2, PlusCircle } from 'lucide-react';
import PasswordInputWithRequirements from '@/components/PasswordInputWithRequirements';
import { changeMyAvatar, changeMyPassword } from '@/app/propostas/actions';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name?: string;
    email?: string;
    avatarUrl?: string;
    role?: string;
  } | null;
  onUserUpdated: (updatedUser: any) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
}) => {
  // Estados para o Enquadramento / Ajuste de Posição da Foto
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [cropZoom, setCropZoom] = useState(1);
  const [cropPanX, setCropPanX] = useState(0);
  const [cropPanY, setCropPanY] = useState(0);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [pendingFileImage, setPendingFileImage] = useState<HTMLImageElement | null>(null);

  // Estados de Senha
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  if (!isOpen) return null;

  const handleSidebarAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('Por favor, selecione uma imagem de até 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setPendingFileImage(img);
        setRawImageSrc(event.target?.result as string);
        setCropZoom(1);
        setCropPanX(0);
        setCropPanY(0);
        setCropModalOpen(true);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handlePanStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsPanning(true);
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setPanStart({ x: clientX - cropPanX, y: clientY - cropPanY });
  };

  const handlePanMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isPanning) return;
    const clientX = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    setCropPanX(clientX - panStart.x);
    setCropPanY(clientY - panStart.y);
  };

  const handlePanEnd = () => {
    setIsPanning(false);
  };

  const handleConfirmCrop = async () => {
    if (!pendingFileImage) return;
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 256, 256);

        const scaleMultiplier = 256 / 200; // Viewport is 200px
        
        ctx.translate(128, 128);
        ctx.translate(cropPanX * scaleMultiplier, cropPanY * scaleMultiplier);
        ctx.scale(cropZoom, cropZoom);

        const viewSize = 200;
        let drawW = pendingFileImage.width;
        let drawH = pendingFileImage.height;
        const ratio = drawW / drawH;

        if (ratio > 1) {
          drawH = viewSize;
          drawW = viewSize * ratio;
        } else {
          drawW = viewSize;
          drawH = viewSize / ratio;
        }

        drawW *= scaleMultiplier;
        drawH *= scaleMultiplier;

        ctx.drawImage(pendingFileImage, -drawW / 2, -drawH / 2, drawW, drawH);
      }

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      const res = await changeMyAvatar(dataUrl);
      if (res.success && res.avatarUrl) {
        const timestamp = Date.now();
        const updatedAvatar = `/api/user/avatar?email=${encodeURIComponent(user?.email || '')}&v=${timestamp}`;
        onUserUpdated((prev: any) => prev ? { ...prev, avatarUrl: updatedAvatar } : null);
        
        const cookiesList = document.cookie.split(';');
        const userCookie = cookiesList.find(c => c.trim().startsWith('sb_user='));
        if (userCookie) {
          try {
            const decoded = JSON.parse(decodeURIComponent(userCookie.split('=')[1]));
            decoded.avatarUrl = updatedAvatar;
            const encoded = encodeURIComponent(JSON.stringify(decoded));
            document.cookie = `sb_user=${encoded}; path=/; max-age=${60 * 60 * 24 * 7}; Secure; SameSite=Lax`;
          } catch (err) {
            console.error('Error updating sb_user cookie:', err);
          }
        }
        setCropModalOpen(false);
        setRawImageSrc(null);
        setPasswordSuccess('Foto de perfil atualizada com sucesso!');
        setTimeout(() => setPasswordSuccess(''), 2000);
      } else {
        setPasswordError('Erro ao salvar foto de perfil: ' + (res.error || 'Erro desconhecido.'));
      }
    } catch (err: any) {
      setPasswordError('Erro ao processar imagem: ' + err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    // Se os campos de senha estiverem vazios, apenas consideramos concluído com sucesso
    if (!currentPassword && !newPassword && !confirmPassword) {
      setPasswordSuccess('Perfil salvo com sucesso!');
      setTimeout(() => {
        onClose();
        setPasswordSuccess('');
      }, 1000);
      setPasswordLoading(false);
      return;
    }

    // Se algum campo de senha foi digitado, exige todos
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Preencha os campos de senha atual e nova senha para alterá-la.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('A confirmação da nova senha não confere.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      setPasswordError('A nova senha deve possuir pelo menos 8 caracteres com letras maiúsculas, minúsculas, números e caracteres especiais.');
      setPasswordLoading(false);
      return;
    }

    try {
      const res = await changeMyPassword(currentPassword, newPassword, confirmPassword);
      if (res.success) {
        setPasswordSuccess('Senha atualizada com sucesso!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          onClose();
          setPasswordSuccess('');
        }, 1500);
      } else {
        setPasswordError(res.error || 'Erro ao atualizar senha.');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Erro de comunicação.');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fadeIn no-print">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#1B4D3E] p-8 text-white relative">
          <h3 className="text-xl font-black tracking-tighter uppercase flex items-center gap-2">
            <KeyRound size={20} className="text-[#10B981]" />
            Meu Perfil <span className="text-[#10B981]">& Segurança</span>
          </h3>
          <p className="text-emerald-100/60 text-xs mt-1">
            Personalize sua foto de perfil corporativo ou altere sua senha de acesso.
          </p>
          <button 
            onClick={onClose} 
            className="absolute top-8 right-8 text-white/50 hover:text-white cursor-pointer"
            disabled={passwordLoading}
          >
            <X size={20} />
          </button>
        </div>

        {cropModalOpen && rawImageSrc ? (
          <div className="p-8 flex flex-col items-center space-y-6">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Ajustar Enquadramento</h4>
            <p className="text-[11px] text-slate-500 text-center max-w-xs leading-relaxed">
              Arraste a foto para ajustar a posição e use a barra para controlar o zoom.
            </p>
            
            {/* Viewport Circle */}
            <div 
              className="w-[200px] h-[200px] rounded-full overflow-hidden relative border-2 border-[#1B4D3E] shadow-xl bg-slate-950 select-none touch-none cursor-grab active:cursor-grabbing"
              onMouseDown={handlePanStart}
              onMouseMove={handlePanMove}
              onMouseUp={handlePanEnd}
              onMouseLeave={handlePanEnd}
              onTouchStart={handlePanStart}
              onTouchMove={handlePanMove}
              onTouchEnd={handlePanEnd}
            >
              <img 
                src={rawImageSrc} 
                alt="Crop Preview" 
                draggable={false}
                className="absolute pointer-events-none select-none max-w-none origin-center"
                style={{
                  width: pendingFileImage && pendingFileImage.width >= pendingFileImage.height ? 'auto' : '200px',
                  height: pendingFileImage && pendingFileImage.width < pendingFileImage.height ? 'auto' : '200px',
                  transform: `translate(-50%, -50%) translate(${cropPanX}px, ${cropPanY}px) scale(${cropZoom})`,
                  left: '50%',
                  top: '50%',
                }}
              />
            </div>

            {/* Zoom Slider */}
            <div className="w-full max-w-xs space-y-2">
              <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
                 <span>Zoom</span>
                 <span className="text-[#1B4D3E]">{Math.round(cropZoom * 100)}%</span>
              </div>
              <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.01" 
                value={cropZoom} 
                onChange={(e) => setCropZoom(parseFloat(e.target.value))} 
                className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#1B4D3E]"
              />
            </div>

            {/* Buttons */}
            <div className="w-full max-w-xs flex gap-3 pt-2">
              <button 
                type="button" 
                onClick={() => { setCropModalOpen(false); setRawImageSrc(null); }}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={handleConfirmCrop}
                className="flex-1 bg-[#1B4D3E] hover:bg-[#13382D] text-white py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#1B4D3E]/20 transition-all cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleChangePassword} className="p-8 space-y-5">
            {/* Foto de Perfil Upload */}
            <div className="flex flex-col items-center justify-center pb-4 border-b border-slate-100">
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  id="sidebar-avatar-upload" 
                  accept="image/png, image/jpeg" 
                  className="hidden" 
                  onChange={handleSidebarAvatarChange}
                />
                <label htmlFor="sidebar-avatar-upload" className="cursor-pointer block relative">
                  {user?.avatarUrl ? (
                    <img 
                      src={user.avatarUrl} 
                      alt="Preview Profile" 
                      className="w-24 h-24 rounded-full object-cover border-2 border-[#1B4D3E] shadow-lg group-hover:opacity-85 transition-all"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-all">
                      <PlusCircle size={20} className="text-[#1B4D3E]" />
                      <span className="text-[9px] font-black uppercase tracking-wider mt-1">Foto</span>
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-[#1B4D3E]/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlusCircle size={16} />
                  </div>
                </label>
              </div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-2">Clique na foto para alterar</span>
              {/* Nota de salvamento automático */}
              <div className="mt-3 text-[10px] text-emerald-800 font-extrabold bg-emerald-50 border border-emerald-100/50 rounded-xl px-3.5 py-2 flex items-center gap-1.5 animate-in fade-in duration-300">
                <span>💡</span>
                <span>A foto de perfil é salva automaticamente ao ser selecionada!</span>
              </div>
            </div>

            {/* Senha Atual */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha Atual</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1B4D3E] transition-colors" size={16} />
                <input 
                  type="password" 
                  placeholder="Sua senha atual"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 outline-none focus:border-[#1B4D3E] focus:ring-4 focus:ring-[#1B4D3E]/5 transition-all font-medium text-slate-700 text-sm"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={passwordLoading}
                />
              </div>
            </div>

            {/* Nova Senha e Confirmação com Checklist Visual */}
            <PasswordInputWithRequirements
              label="Nova Senha Corporativa"
              value={newPassword}
              onChange={setNewPassword}
              placeholder="Mínimo 8 caracteres (A, a, 1, !)"
              confirmValue={confirmPassword}
              onConfirmChange={setConfirmPassword}
              showConfirmInput={true}
              disabled={passwordLoading}
              required={true}
            />

            {/* Banner de Sucesso */}
            {passwordSuccess && (
              <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle2 size={16} />
                {passwordSuccess}
              </div>
            )}

            {/* Banner de Erro */}
            {passwordError && (
              <div className="bg-red-50 text-red-600 border border-red-100 p-4 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
                <X size={16} className="border border-red-200 rounded-full" />
                {passwordError}
              </div>
            )}

            {/* Controles do Formulário */}
            <div className="pt-2 flex gap-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-500 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all cursor-pointer"
                disabled={passwordLoading}
              >
                Cancelar
              </button>
              <button 
                type="submit"
                disabled={passwordLoading}
                className="flex-[2] bg-[#1B4D3E] hover:bg-[#13382D] text-white py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-[#1B4D3E]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {passwordLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  !currentPassword && !newPassword && !confirmPassword ? 'Concluir' : 'Salvar Senha'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
