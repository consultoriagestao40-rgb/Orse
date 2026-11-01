'use client';

import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Activity, Zap, BarChart2 } from 'lucide-react';

interface FinancialLoadingProps {
  title?: string;
  subtitle?: string;
  variant?: 'fullscreen' | 'inline' | 'card';
}

const TICKER_ITEMS = [
  { symbol: 'SMARTBID', val: '▲ +24.8%', color: 'text-emerald-400', isUp: true },
  { symbol: 'USD / BRL', val: '5.42 ▼ -0.32%', color: 'text-emerald-400', isUp: false },
  { symbol: 'IBOVESPA', val: '134.280 ▲ +1.15%', color: 'text-emerald-400', isUp: true },
  { symbol: 'PIPELINE COMERCIAL', val: 'R$ 4.890.000', color: 'text-emerald-300', isUp: true },
  { symbol: 'CONVERSÃO B2B', val: '38.4% ▲ +4.2%', color: 'text-emerald-400', isUp: true },
  { symbol: 'NOVOS LEADS', val: 'REAL-TIME ACTIVE', color: 'text-emerald-400', isUp: true },
];

export default function FinancialLoadingTransition({
  title = 'Sincronizando Mercado & Pipeline',
  subtitle = 'Conectando cotações em tempo real e base de dados...',
  variant = 'fullscreen',
}: FinancialLoadingProps) {
  const [activeCurrency, setActiveCurrency] = useState<'BRL' | 'USD'>('BRL');
  const [counter, setCounter] = useState(148200);

  useEffect(() => {
    const currencyInterval = setInterval(() => {
      setActiveCurrency(prev => (prev === 'BRL' ? 'USD' : 'BRL'));
    }, 1200);

    const counterInterval = setInterval(() => {
      setCounter(prev => prev + Math.floor(Math.random() * 3200) + 150);
    }, 90);

    return () => {
      clearInterval(currencyInterval);
      clearInterval(counterInterval);
    };
  }, []);

  const formattedCounter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: activeCurrency === 'BRL' ? 'BRL' : 'USD',
    minimumFractionDigits: 2,
  }).format(counter);

  const containerClasses =
    variant === 'fullscreen'
      ? 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl text-white select-none'
      : variant === 'inline'
      ? 'w-full py-16 flex flex-col items-center justify-center bg-slate-950/90 rounded-3xl border border-slate-800 text-white shadow-2xl select-none my-4'
      : 'flex flex-col items-center justify-center p-8 bg-slate-950/90 rounded-2xl border border-slate-800 text-white shadow-xl select-none';

  return (
    <div className={containerClasses}>
      {/* Background Ambient Glow */}
      <div className="absolute w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -top-10 animate-pulse" />
      <div className="absolute w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none -bottom-10 animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Ticker Bar at Top */}
      <div className="w-full max-w-2xl overflow-hidden py-2 px-4 mb-6 border-y border-emerald-500/20 bg-emerald-950/30 rounded-lg relative">
        <div className="flex items-center gap-6 animate-marquee whitespace-nowrap text-[11px] font-mono tracking-wider">
          {TICKER_ITEMS.concat(TICKER_ITEMS).map((item, idx) => (
            <div key={idx} className="inline-flex items-center gap-2">
              <span className="text-slate-400 font-bold">{item.symbol}</span>
              <span className={`font-black ${item.color}`}>{item.val}</span>
              <span className="text-slate-600">|</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Trading Central Display */}
      <div className="relative flex flex-col items-center max-w-md w-full px-6 text-center space-y-6">
        
        {/* Animated Coins / Currency Flipper */}
        <div className="relative flex items-center justify-center w-28 h-28">
          {/* Outer Pulsing Rings */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-500/30 animate-ping" style={{ animationDuration: '2.5s' }} />
          <div className="absolute -inset-2 rounded-full border border-teal-500/20 animate-spin" style={{ animationDuration: '8s' }} />
          
          {/* Central Glowing Currency Token */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/30 flex items-center justify-center transform transition-transform duration-500 hover:scale-105">
            <div className="absolute inset-0 rounded-2xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/30 via-transparent to-transparent" />
            
            {activeCurrency === 'BRL' ? (
              <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-300">
                <span className="text-[10px] font-mono tracking-widest text-emerald-100 font-extrabold uppercase">BRASIL</span>
                <span className="text-2xl font-black text-white tracking-tighter drop-shadow-md">R$</span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-300">
                <span className="text-[10px] font-mono tracking-widest text-teal-100 font-extrabold uppercase">GLOBAL</span>
                <span className="text-2xl font-black text-white tracking-tighter drop-shadow-md">$ USD</span>
              </div>
            )}
          </div>
        </div>

        {/* Live Candlestick Bars */}
        <div className="flex items-end justify-center gap-1.5 h-10 px-4 py-1 bg-slate-900/80 rounded-xl border border-slate-800">
          {[
            { h: 'h-4', color: 'bg-emerald-400', anim: 'animate-bounce' },
            { h: 'h-7', color: 'bg-emerald-500', anim: 'animate-pulse' },
            { h: 'h-3', color: 'bg-rose-400', anim: 'animate-bounce' },
            { h: 'h-8', color: 'bg-emerald-400', anim: 'animate-pulse' },
            { h: 'h-5', color: 'bg-emerald-500', anim: 'animate-bounce' },
            { h: 'h-6', color: 'bg-teal-400', anim: 'animate-pulse' },
            { h: 'h-4', color: 'bg-emerald-400', anim: 'animate-bounce' },
            { h: 'h-8', color: 'bg-emerald-300', anim: 'animate-pulse' },
          ].map((bar, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <span className="w-0.5 h-1.5 bg-slate-600 rounded-full" />
              <div
                className={`w-2 ${bar.h} ${bar.color} rounded-xs shadow-xs shadow-emerald-500/20 ${bar.anim}`}
                style={{ animationDuration: `${0.8 + (i % 4) * 0.3}s` }}
              />
              <span className="w-0.5 h-1.5 bg-slate-600 rounded-full" />
            </div>
          ))}
        </div>

        {/* Dynamic Financial Counter */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            PREGÃO ELETRÔNICO ATIVO
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-teal-300">
            {formattedCounter}
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-black tracking-tight text-slate-100 font-display">
            {title}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm font-medium leading-relaxed">
            {subtitle}
          </p>
        </div>

        {/* Progress Bar (High-Tech Stock Market Style) */}
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 w-full animate-progress-indeterminate" />
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: inline-flex;
          animation: marquee 16s linear infinite;
        }
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
