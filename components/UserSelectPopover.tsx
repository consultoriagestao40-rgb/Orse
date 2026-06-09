'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Search, Check, X, User } from 'lucide-react';

interface UserItem {
  id: string;
  nome: string;
  avatarUrl?: string | null;
  cargo?: string | null;
  role?: string;
}

interface UserSelectPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserItem[];
  selectedIds: string[];
  onSelect: (userId: string) => void;
  title?: string;
  anchorEl: HTMLElement | null | string;
  isMulti?: boolean;
}

export default function UserSelectPopover({
  isOpen,
  onClose,
  users,
  selectedIds,
  onSelect,
  title = 'pesquisa',
  anchorEl,
  isMulti = false
}: UserSelectPopoverProps) {
  const [search, setSearch] = useState('');
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [popoverHeight, setPopoverHeight] = useState(300);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Remeasure popover height dynamically when mounted, when search updates, or users change
  useEffect(() => {
    if (isOpen && popoverRef.current) {
      const height = popoverRef.current.offsetHeight;
      if (height !== popoverHeight && height > 0) {
        setPopoverHeight(height);
      }
    }
  }, [isOpen, popoverHeight, coords, search, users]);

  // Position popover relative to anchor element
  useEffect(() => {
    if (isOpen && anchorEl) {
      const resolvedAnchor = typeof anchorEl === 'string'
        ? document.getElementById(anchorEl)
        : anchorEl;

      if (!resolvedAnchor) return;

      const rect = resolvedAnchor.getBoundingClientRect();
      const popoverWidth = 280;
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      let left = rect.left + window.scrollX;
      
      const spaceBelow = windowHeight - rect.bottom;
      const spaceAbove = rect.top;

      let top;
      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        // Open upwards
        top = rect.top + window.scrollY - popoverHeight - 8;
      } else {
        // Open downwards
        top = rect.bottom + window.scrollY + 8;
      }

      // Adjust horizontally if going off-screen
      if (left + popoverWidth > windowWidth) {
        left = windowWidth - popoverWidth - 16;
      }
      if (left < 16) left = 16;

      setCoords({ top, left });
    } else {
      setCoords(null);
    }
  }, [isOpen, anchorEl, popoverHeight]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const resolvedAnchor = typeof anchorEl === 'string'
        ? document.getElementById(anchorEl)
        : anchorEl;

      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        resolvedAnchor &&
        !resolvedAnchor.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);

  // Close on scroll anywhere in the application (except inside the popover itself)
  useEffect(() => {
    function handleScroll(event: Event) {
      if (popoverRef.current && popoverRef.current.contains(event.target as Node)) {
        return; // Ignore scroll events inside the popover list
      }
      onClose();
    }
    if (isOpen) {
      window.addEventListener('scroll', handleScroll, { capture: true });
    }
    return () => {
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted || !coords) return null;

  const filteredUsers = users.filter(u =>
    u.nome.toLowerCase().includes(search.toLowerCase()) ||
    (u.cargo && u.cargo.toLowerCase().includes(search.toLowerCase()))
  );

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'absolute',
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        zIndex: 9999
      }}
      className="w-[280px] bg-white border border-slate-200/80 rounded-2xl shadow-xl p-3 text-slate-800 flex flex-col gap-3 font-sans animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* Search Input */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
          <Search size={14} />
        </span>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={title}
          className="w-full pl-8 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-300 focus:bg-white text-slate-700 font-medium transition-all"
          autoFocus
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Users List */}
      <div className="max-h-[220px] overflow-y-auto pr-1 space-y-1 select-none">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 font-medium">
            Nenhum usuário encontrado
          </div>
        ) : (
          filteredUsers.map(u => {
            const isSelected = selectedIds.includes(u.id);
            const initials = u.nome
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <div
                key={u.id}
                onClick={() => {
                  onSelect(u.id);
                  if (!isMulti) onClose();
                }}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all duration-150 ${
                  isSelected 
                    ? 'bg-[#1B4D3E]/8 text-[#1B4D3E]' 
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {u.avatarUrl ? (
                    <img
                      src={u.avatarUrl}
                      alt={u.nome}
                      className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 uppercase border ${
                      isSelected 
                        ? 'bg-[#1B4D3E]/10 border-[#1B4D3E]/20 text-[#1B4D3E]' 
                        : 'bg-slate-100 border-slate-200 text-slate-500'
                    }`}>
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className={`text-xs truncate ${isSelected ? 'font-bold' : 'font-semibold'}`}>
                      {u.nome}
                    </p>
                    {u.cargo && (
                      <p className={`text-[9px] truncate ${isSelected ? 'text-[#1B4D3E]/70' : 'text-slate-400'}`}>
                        {u.cargo}
                      </p>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <Check size={14} className="text-[#1B4D3E] shrink-0 stroke-[3]" />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>,
    document.body
  );
}
