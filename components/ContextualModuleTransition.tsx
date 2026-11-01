'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, CheckSquare, Target, FileText, 
  Search, Calendar, CheckCircle2, Shield, Wrench, 
  Truck, Boxes, DollarSign, Award, Layers
} from 'lucide-react';

export type TransitionModule = 
  | 'radar' 
  | 'leads' 
  | 'tasks' 
  | 'fvp' 
  | 'contratos' 
  | 'propostas' 
  | 'prospeccao' 
  | 'calendar' 
  | 'pic' 
  | 'cct' 
  | 'ativos' 
  | 'entrega' 
  | 'default';

interface ContextualModuleTransitionProps {
  module?: TransitionModule;
  title?: string;
  subtitle?: string;
  variant?: 'fullscreen' | 'inline';
}

const MODULE_CONFIGS: Record<TransitionModule, {
  defaultTitle: string;
  defaultSubtitle: string;
  badge: string;
  accentColor: string;
}> = {
  radar: {
    defaultTitle: 'Sincronizando Radar Comercial',
    defaultSubtitle: 'Conectando pregão eletrônico, cotações de mercado e metas...',
    badge: 'MERCADO FINANCEIRO & B3',
    accentColor: '#10B981',
  },
  leads: {
    defaultTitle: 'Sincronizando Pipeline de Leads & CRM',
    defaultSubtitle: 'Carregando funis de venda, estágios de qualificação e WhatsApp...',
    badge: 'FUNIL COMERCIAL B2B',
    accentColor: '#10B981',
  },
  tasks: {
    defaultTitle: 'Sincronizando Gestão de Tarefas',
    defaultSubtitle: 'Atualizando quadros Kanban, checklists e prazos operacionais...',
    badge: 'KANBAN DE PRODUTIVIDADE',
    accentColor: '#3B82F6',
  },
  fvp: {
    defaultTitle: 'Sincronizando Engenharia de Custos (FPV)',
    defaultSubtitle: 'Calculando formação de preço, margens de lucro e BDI...',
    badge: 'CONTROLADORIA & ENGENHARIA',
    accentColor: '#10B981',
  },
  contratos: {
    defaultTitle: 'Sincronizando Gestão de Contratos',
    defaultSubtitle: 'Validando assinaturas digitais, vigências e cláusulas contratuais...',
    badge: 'JURÍDICO & CONTRATOS',
    accentColor: '#8B5CF6',
  },
  propostas: {
    defaultTitle: 'Sincronizando Propostas Comerciais',
    defaultSubtitle: 'Carregando dossiês executivos, clientes e lâminas de apresentação...',
    badge: 'PROPOSTAS & APRESENTAÇÕES',
    accentColor: '#F59E0B',
  },
  prospeccao: {
    defaultTitle: 'Sincronizando Prospecção Inteligente',
    defaultSubtitle: 'Varrendo mercado corporativo, identificando CNPJs e decisores...',
    badge: 'RADAR B2B DE MERCADO',
    accentColor: '#06B6D4',
  },
  calendar: {
    defaultTitle: 'Sincronizando Calendário Global',
    defaultSubtitle: 'Organizando compromissos, visitas presenciais e reuniões da equipe...',
    badge: 'AGENDA & OPERAÇÕES',
    accentColor: '#EC4899',
  },
  pic: {
    defaultTitle: 'Sincronizando PIC Implantação',
    defaultSubtitle: 'Verificando cronograma operacional e plano de implantação...',
    badge: 'IMPLANTAÇÃO DE CLIENTE',
    accentColor: '#10B981',
  },
  cct: {
    defaultTitle: 'Sincronizando Regras & Convenções (CCT)',
    defaultSubtitle: 'Calculando pisos salariais, encargos trabalhistas e benefícios...',
    badge: 'DIREITO DO TRABALHO & CCT',
    accentColor: '#6366F1',
  },
  ativos: {
    defaultTitle: 'Sincronizando Gestão de Ativos',
    defaultSubtitle: 'Inventariando equipamentos, manutenções e leitores QR Code...',
    badge: 'PATRIMÔNIO & EQUIPAMENTOS',
    accentColor: '#14B8A6',
  },
  entrega: {
    defaultTitle: 'Sincronizando Gestão de Entregas',
    defaultSubtitle: 'Traçando rotas de entrega e sincronizando status logístico...',
    badge: 'LOGÍSTICA & DISTRIBUIÇÃO',
    accentColor: '#F97316',
  },
  default: {
    defaultTitle: 'Sincronizando SmartBidHub Enterprise',
    defaultSubtitle: 'Carregando módulos integrados e inteligência de negócios...',
    badge: 'SISTEMA CORPORATIVO',
    accentColor: '#10B981',
  },
};

export default function ContextualModuleTransition({
  module = 'radar',
  title,
  subtitle,
  variant = 'fullscreen',
}: ContextualModuleTransitionProps) {
  const config = MODULE_CONFIGS[module] || MODULE_CONFIGS.default;
  const displayTitle = title || config.defaultTitle;
  const displaySubtitle = subtitle || config.defaultSubtitle;

  // Estados para animações dinâmicas
  const [activeCurrency, setActiveCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [counter, setCounter] = useState(148200);
  const [activeKanbanIndex, setActiveKanbanIndex] = useState(0);

  useEffect(() => {
    const intervalCurr = setInterval(() => {
      setActiveCurrency(prev => (prev === 'BRL' ? 'USD' : 'BRL'));
    }, 1200);

    const intervalCount = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 2500) + 120);
    }, 100);

    const intervalKanban = setInterval(() => {
      setActiveKanbanIndex(prev => (prev + 1) % 3);
    }, 800);

    return () => {
      clearInterval(intervalCurr);
      clearInterval(intervalCount);
      clearInterval(intervalKanban);
    };
  }, []);

  const formattedCounter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: activeCurrency === 'BRL' ? 'BRL' : 'USD',
  }).format(counter);

  const containerClasses =
    variant === 'fullscreen'
      ? 'fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl text-white select-none overflow-hidden'
      : 'w-full py-16 flex flex-col items-center justify-center bg-slate-950/90 rounded-3xl border border-slate-800 text-white shadow-2xl select-none my-4 overflow-hidden';

  return (
    <div className={containerClasses}>
      {/* Luz ambiente animada de fundo */}
      <div 
        className="absolute w-96 h-96 rounded-full blur-3xl pointer-events-none -top-10 opacity-20 animate-pulse" 
        style={{ backgroundColor: config.accentColor }} 
      />
      <div 
        className="absolute w-80 h-80 rounded-full blur-3xl pointer-events-none -bottom-10 opacity-15 animate-pulse" 
        style={{ backgroundColor: config.accentColor, animationDelay: '1s' }} 
      />

      {/* Central Visual Showcase dependente do Módulo */}
      <div className="relative flex flex-col items-center max-w-md w-full px-6 text-center space-y-6">

        {/* 1. RADAR COMERCIAL: Flipping de Moedas R$/USD & Candlesticks */}
        {module === 'radar' && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '2.5s' }} />
              <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/30 flex items-center justify-center">
                {activeCurrency === 'BRL' ? (
                  <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-300">
                    <span className="text-[9px] font-mono tracking-widest text-emerald-100 font-extrabold uppercase">BRASIL</span>
                    <span className="text-2xl font-black text-white tracking-tighter drop-shadow-md">R$</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-300">
                    <span className="text-[9px] font-mono tracking-widest text-teal-100 font-extrabold uppercase">GLOBAL</span>
                    <span className="text-2xl font-black text-white tracking-tighter drop-shadow-md">$ USD</span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Candlestick Bars */}
            <div className="flex items-end justify-center gap-1.5 h-8 px-3 py-1 bg-slate-900/80 rounded-xl border border-slate-800">
              {[16, 28, 12, 32, 20, 26, 18, 30].map((h, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5">
                  <span className="w-0.5 h-1 bg-slate-600 rounded-full" />
                  <div
                    className={`w-1.5 ${i % 3 === 2 ? 'bg-rose-400' : 'bg-emerald-400'} rounded-xs animate-pulse`}
                    style={{ height: `${h}px`, animationDuration: `${0.8 + (i % 3) * 0.2}s` }}
                  />
                  <span className="w-0.5 h-1 bg-slate-600 rounded-full" />
                </div>
              ))}
            </div>

            <div className="text-2xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-teal-300">
              {formattedCounter}
            </div>
          </div>
        )}

        {/* 2. PIPELINE DE LEADS CRM: Funil de Conversão Dinâmico */}
        {module === 'leads' && (
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 animate-pulse" />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                <Target size={32} className="stroke-[2] animate-bounce" style={{ animationDuration: '2s' }} />
              </div>
            </div>

            {/* Estágios do Funil Iluminados */}
            <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-[10px] font-bold">
              {['Descoberta', 'Qualificado', 'Reunião', 'Negociação'].map((etapa, idx) => (
                <span 
                  key={idx}
                  className={`px-2 py-1 rounded-lg transition-all duration-300 ${
                    idx === activeKanbanIndex 
                      ? 'bg-emerald-500 text-slate-950 font-black scale-105 shadow-xs' 
                      : 'text-slate-400'
                  }`}
                >
                  {etapa}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 3. GESTÃO DE TAREFAS: Mini Kanban Interativo */}
        {module === 'tasks' && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center text-white shadow-xl shadow-blue-500/20">
                <CheckSquare size={32} className="stroke-[2] animate-pulse" />
              </div>
            </div>

            {/* Mini Colunas Kanban com Tarefa Saltando */}
            <div className="grid grid-cols-3 gap-2 w-64 bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 text-left">
              {[
                { title: 'A Fazer', color: 'border-slate-700' },
                { title: 'Em Andamento', color: 'border-amber-500/40' },
                { title: 'Concluído', color: 'border-emerald-500/40' },
              ].map((col, idx) => (
                <div key={idx} className={`p-2 rounded-xl border bg-slate-950/60 ${col.color}`}>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{col.title}</p>
                  <div className="mt-2 space-y-1">
                    <div 
                      className={`h-5 rounded-md px-1.5 flex items-center text-[9px] font-bold transition-all duration-300 ${
                        activeKanbanIndex === idx 
                          ? 'bg-blue-500 text-white shadow-md scale-105' 
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      {idx === 2 ? '✓ Tarefa OK' : '• Tarefa'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. PIPELINE DE FVP: Engenharia de Custos & BDI */}
        {module === 'fvp' && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                <TrendingUp size={32} className="stroke-[2] animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 font-mono text-xs">
              <span className="text-slate-400 font-bold">BDI & Margem:</span>
              <span className="text-emerald-400 font-black animate-pulse">24.50%</span>
              <span className="text-slate-600">|</span>
              <span className="text-teal-300 font-black">Preço Fechado</span>
            </div>
          </div>
        )}

        {/* 5. GESTÃO DE CONTRATOS: Assinatura Digital Criptografada */}
        {module === 'contratos' && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-800 flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                <FileText size={32} className="stroke-[2]" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center shadow-md animate-bounce">
                <CheckCircle2 size={16} className="stroke-[3]" />
              </div>
            </div>

            <div className="bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800 text-xs font-mono flex items-center gap-2 text-purple-300">
              <Shield size={14} className="text-emerald-400" />
              <span>Assinatura Digital ICP-Brasil Válida</span>
            </div>
          </div>
        )}

        {/* 6. PROPOSTAS COMERCIAIS: Apresentação Executiva */}
        {module === 'propostas' && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 flex items-center justify-center text-white shadow-xl shadow-amber-500/20">
                <Award size={32} className="stroke-[2] animate-pulse" />
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-amber-300 font-bold">
              <span>📋 Dossiê Executivo & Lâminas Comerciais</span>
            </div>
          </div>
        )}

        {/* 7. PROSPECÇÃO INTELIGENTE: Radar Sonar B2B */}
        {module === 'prospeccao' && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative flex items-center justify-center w-24 h-24">
              <div className="absolute inset-0 rounded-full border border-cyan-500/40 animate-ping" style={{ animationDuration: '2s' }} />
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center text-white shadow-xl shadow-cyan-500/20">
                <Search size={32} className="stroke-[2] animate-pulse" />
              </div>
            </div>

            <div className="bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800 text-xs font-mono text-cyan-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Varrendo Base Receita Federal & CNPJs</span>
            </div>
          </div>
        )}

        {/* 8. CALENDÁRIO GLOBAL */}
        {module === 'calendar' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-800 flex items-center justify-center text-white shadow-xl shadow-pink-500/20">
              <Calendar size={32} className="stroke-[2] animate-pulse" />
            </div>
            <div className="bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800 text-xs text-pink-300 font-bold">
              <span>📅 Sincronizando Visitas & Prazos da Equipe</span>
            </div>
          </div>
        )}

        {/* 9. GESTÃO DE ATIVOS / PATRIMÔNIO */}
        {module === 'ativos' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-800 flex items-center justify-center text-white shadow-xl shadow-teal-500/20">
              <Boxes size={32} className="stroke-[2] animate-pulse" />
            </div>
            <div className="bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800 text-xs text-teal-300 font-mono">
              <span>📦 Leitura QR Code de Equipamentos</span>
            </div>
          </div>
        )}

        {/* 10. GESTÃO DE ENTREGAS */}
        {module === 'entrega' && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-600 to-amber-800 flex items-center justify-center text-white shadow-xl shadow-orange-500/20">
              <Truck size={32} className="stroke-[2] animate-bounce" style={{ animationDuration: '2s' }} />
            </div>
            <div className="bg-slate-900/80 px-4 py-1.5 rounded-xl border border-slate-800 text-xs text-orange-300 font-bold">
              <span>🚚 Traçando Rota de Entrega em Tempo Real</span>
            </div>
          </div>
        )}

        {/* 11. PADRÃO / OUTROS */}
        {(module === 'cct' || module === 'pic' || module === 'default') && (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
              <Layers size={32} className="stroke-[2] animate-pulse" />
            </div>
          </div>
        )}

        {/* Badge do Módulo */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono font-bold tracking-widest text-slate-300">
          <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: config.accentColor }} />
          {config.badge}
        </div>

        {/* Título & Subtítulo */}
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-100 font-display">
            {displayTitle}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm font-medium leading-relaxed">
            {displaySubtitle}
          </p>
        </div>

        {/* Barra de Progresso Temática */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
          <div 
            className="h-full w-full animate-progress-indeterminate rounded-full"
            style={{ 
              background: `linear-gradient(to right, ${config.accentColor}, #ffffff, ${config.accentColor})` 
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress-ind {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(0%); }
          100% { transform: translateX(100%); }
        }
        .animate-progress-indeterminate {
          animation: progress-ind 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
