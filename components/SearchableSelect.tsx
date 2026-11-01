'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export interface SearchableOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  group?: string;
  disabled?: boolean;
}

interface SearchableSelectProps {
  options: SearchableOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  clearOnSelect?: boolean; // Útil para seleções tipo "Adicionar produto" que resetam após escolher
  buttonClassName?: string;
  renderOption?: (option: SearchableOption) => React.ReactNode;
}

// Remove acentuação e caracteres especiais para busca fluida
function normalizeText(text: string): string {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Selecione uma opção...',
  searchPlaceholder = '🔍 Digite para filtrar...',
  emptyMessage = 'Nenhum resultado encontrado.',
  className = '',
  disabled = false,
  clearOnSelect = false,
  buttonClassName = '',
  renderOption
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Acha a opção selecionada atual
  const selectedOption = useMemo(() => {
    return options.find(opt => opt.value === value);
  }, [options, value]);

  // Filtra as opções em tempo real ignorando maiúsculas e acentos
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    const term = normalizeText(searchTerm);
    return options.filter(opt => {
      const labelNorm = normalizeText(opt.label);
      const sublabelNorm = normalizeText(opt.sublabel || '');
      const groupNorm = normalizeText(opt.group || '');
      const badgeNorm = normalizeText(opt.badge || '');
      return labelNorm.includes(term) || sublabelNorm.includes(term) || groupNorm.includes(term) || badgeNorm.includes(term);
    });
  }, [options, searchTerm]);

  // Agrupa as opções caso tenham propriedade group
  const groupedOptions = useMemo(() => {
    const hasGroups = filteredOptions.some(opt => opt.group);
    if (!hasGroups) return null;

    const groups: { [key: string]: SearchableOption[] } = {};
    filteredOptions.forEach(opt => {
      const g = opt.group || 'Geral';
      if (!groups[g]) groups[g] = [];
      groups[g].push(opt);
    });
    return groups;
  }, [filteredOptions]);

  // Auto-foco no input de busca ao abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);

      // Checa se deve abrir para cima ou para baixo baseado na posição da tela
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 280 && spaceAbove > spaceBelow) {
          setOpenUpward(true);
        } else {
          setOpenUpward(false);
        }
      }
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Fechar ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Teclado: Escape fecha
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    if (!clearOnSelect) {
      setIsOpen(false);
    } else {
      setSearchTerm('');
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Botão Gatilho do Dropdown */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full bg-white border border-slate-300 rounded px-3 py-1.5 text-sm font-medium text-slate-800 outline-none focus:border-[#1B4D3E] focus:ring-1 focus:ring-[#1B4D3E] flex items-center justify-between gap-2 text-left transition-all ${
          disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'cursor-pointer hover:border-slate-400'
        } ${buttonClassName}`}
      >
        <span className="truncate block flex-1">
          {selectedOption ? (
            <span className="text-slate-900 font-semibold">{selectedOption.label}</span>
          ) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown 
          size={16} 
          className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#1B4D3E]' : ''}`} 
        />
      </button>

      {/* Painel Suspenso com Campo de Busca e Lista */}
      {isOpen && (
        <div
          className={`absolute left-0 z-50 w-full min-w-[260px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col transition-all duration-150 animate-in fade-in zoom-in-95 ${
            openUpward ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          }`}
          style={{ maxHeight: '340px' }}
        >
          {/* Header com Campo de Digitação / Busca Integrado */}
          <div className="p-2 border-b border-slate-100 bg-slate-50/80 sticky top-0 z-10">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-2.5 text-slate-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:border-[#1B4D3E] focus:ring-2 focus:ring-emerald-500/10 shadow-xs"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between px-1 pt-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Opções</span>
              <span>{filteredOptions.length} encontrados</span>
            </div>
          </div>

          {/* Lista de Opções Rolável */}
          <div ref={listRef} className="overflow-y-auto flex-1 p-1 max-h-[260px] divide-y divide-slate-50">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-400 font-medium">
                {emptyMessage}
              </div>
            ) : groupedOptions ? (
              // Renderização Agrupada (ex: por CCT)
              Object.entries(groupedOptions).map(([groupName, groupOpts]) => (
                <div key={groupName} className="py-1">
                  <div className="px-2.5 py-1 text-[10px] font-black text-[#1B4D3E] uppercase tracking-wider bg-emerald-50/60 rounded">
                    {groupName}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {groupOpts.map(opt => {
                      const isSelected = opt.value === value;
                      return (
                        <div
                          key={opt.value}
                          onClick={() => !opt.disabled && handleSelect(opt.value)}
                          className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                            opt.disabled
                              ? 'opacity-40 cursor-not-allowed bg-slate-50'
                              : isSelected
                              ? 'bg-emerald-50 text-[#1B4D3E] font-bold'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            {renderOption ? (
                              renderOption(opt)
                            ) : (
                              <div>
                                <span className="block truncate">{opt.label}</span>
                                {opt.sublabel && (
                                  <span className="block text-[10px] text-slate-400 truncate">{opt.sublabel}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {opt.badge && (
                              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                                {opt.badge}
                              </span>
                            )}
                            {isSelected && <Check size={14} className="text-[#1B4D3E] stroke-[2.5]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              // Renderização Simples
              filteredOptions.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-all ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-50'
                        : isSelected
                        ? 'bg-emerald-50 text-[#1B4D3E] font-bold'
                        : 'hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {renderOption ? (
                        renderOption(opt)
                      ) : (
                        <div>
                          <span className="block truncate">{opt.label}</span>
                          {opt.sublabel && (
                            <span className="block text-[10px] text-slate-400 truncate">{opt.sublabel}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {opt.badge && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check size={14} className="text-[#1B4D3E] stroke-[2.5]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
