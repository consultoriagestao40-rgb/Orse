'use client';

import React, { useState } from 'react';
import {
  BarChart2, Search, Target, Mail, Calendar, CheckSquare, Brain,
  Briefcase, Home, ShoppingCart, ShieldCheck, Wrench,
  Presentation, ClipboardList, FileText, Users,
  ClipboardCheck, Boxes, Truck, Link as LinkIcon, ArrowRight,
} from 'lucide-react';

const C = {
  paper: '#FBFAF7',
  ink: '#111418',
  muted: '#5B6470',
  line: '#E6E2DA',
  green: '#1B4D3E',
  greenSoft: '#EAF1ED',
};
const title: React.CSSProperties = { fontFamily: 'var(--font-lp-text)', fontWeight: 700, letterSpacing: '-0.035em' };

type Mod = { icon: React.ElementType; t: string; d: string };
const GROUPS: { id: string; n: string; t: string; d: string; mods: Mod[] }[] = [
  {
    id: 'comercial', n: '01', t: 'Comercial',
    d: 'Do primeiro contato com o decisor até a reunião marcada, com metas e funil visíveis para a diretoria.',
    mods: [
      { icon: BarChart2, t: 'Radar Comercial', d: 'KPIs, conversão e ciclo de fechamento em tempo real.' },
      { icon: Search, t: 'Prospecção Inteligente', d: 'Empresas de grande porte via Google Places, direto no funil.' },
      { icon: Target, t: 'Pipeline de Leads', d: 'Funil visual com WhatsApp, etiquetas e histórico do lead.' },
      { icon: Mail, t: 'Gestão de E-mails', d: 'Caixa de entrada ligada ao lead, sem trocar de tela.' },
      { icon: Calendar, t: 'Calendário Global', d: 'Visitas técnicas, reuniões e retornos da equipe.' },
      { icon: CheckSquare, t: 'Gestão de Tarefas', d: 'Kanban com responsáveis, observadores e prazos.' },
      { icon: Brain, t: 'Planejamento e Metas', d: 'Metas por vendedor e acompanhamento do mês.' },
    ],
  },
  {
    id: 'custos', n: '02', t: 'Engenharia de custos',
    d: 'O preço sai da convenção coletiva, não de uma planilha copiada da proposta anterior.',
    mods: [
      { icon: Briefcase, t: 'Regras (CCT)', d: 'Pisos, encargos e benefícios por sindicato e região.' },
      { icon: Home, t: 'Pipeline de FPV', d: 'Formação de preço de venda por posto, com DRE do projeto.' },
      { icon: ShoppingCart, t: 'Produtos e Insumos', d: 'Catálogo de materiais com custo e consumo por posto.' },
      { icon: ShieldCheck, t: 'EPIs e Uniformes', d: 'Kits por função com periodicidade de troca.' },
      { icon: Wrench, t: 'Equipes Técnicas (SPOT)', d: 'Custo de equipes volantes e serviços pontuais.' },
    ],
  },
  {
    id: 'proposta', n: '03', t: 'Proposta e contrato',
    d: 'A proposta vira um link rastreável, o aceite é assinado online e o contrato já nasce na carteira.',
    mods: [
      { icon: Presentation, t: 'Proposta Comercial', d: 'Link com a sua marca, rastreio de visualizações e aceite.' },
      { icon: ClipboardList, t: 'Atas de Reunião', d: 'Registro das reuniões com o cliente, ligado à proposta.' },
      { icon: FileText, t: 'Contratos', d: 'Vigência, aditivos e alerta de reajuste pela data-base.' },
      { icon: Users, t: 'Clientes', d: 'Cadastro único com contatos, propostas e contratos.' },
    ],
  },
  {
    id: 'operacao', n: '04', t: 'Implantação e operação',
    d: 'Depois do sim, a implantação e a logística seguem no mesmo sistema, sem planilha paralela.',
    mods: [
      { icon: ClipboardCheck, t: 'PIC Implantação', d: 'Plano de implantação do contrato com checklist e responsáveis.' },
      { icon: Boxes, t: 'Gestão de Ativos', d: 'Equipamentos por contrato, com área do técnico no celular.' },
      { icon: Truck, t: 'Gestão de Entregas', d: 'Entregas de materiais com área do entregador e comprovante.' },
      { icon: LinkIcon, t: 'Integração ERPFlex', d: 'Envio de dados para o ERP sem redigitar.' },
    ],
  },
];

export default function ModulesSection() {
  const [g, setG] = useState(0);
  const group = GROUPS[g];
  const total = GROUPS.reduce((a, x) => a + x.mods.length, 0);

  return (
    <section id="modulos" className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid lg:grid-cols-12 gap-8 mb-14 items-end">
          <div className="lg:col-span-7">
            <p className="text-[14px] mb-4" style={{ color: C.muted }}>Módulos</p>
            <h2 className="text-[40px] md:text-[52px] leading-[1.05]" style={title}>
              {total} módulos que conversam entre si. Uma empresa, um sistema.
            </h2>
          </div>
          <p className="lg:col-span-5 text-[16px] leading-[1.65]" style={{ color: C.muted }}>
            Cada módulo usa os dados do anterior. O lead vira proposta, a proposta vira contrato e o contrato vira implantação, sem copiar e colar entre planilhas.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* áreas */}
          <div className="lg:col-span-4 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-6 px-6 lg:mx-0 lg:px-0">
            {GROUPS.map((x, i) => {
              const on = i === g;
              return (
                <button
                  key={x.id}
                  onClick={() => setG(i)}
                  onMouseEnter={() => setG(i)}
                  className="group shrink-0 lg:shrink text-left rounded-2xl border px-5 py-4 lg:py-5 cursor-pointer transition-all duration-300"
                  style={{ borderColor: on ? 'rgba(27,77,62,0.3)' : C.line, background: on ? '#fff' : 'transparent', boxShadow: on ? '0 20px 40px -28px rgba(17,20,24,0.35)' : 'none' }}
                >
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                      <span className="text-[13px] font-semibold tabular-nums transition-colors" style={{ color: on ? C.green : '#A8A296' }}>{x.n}</span>
                      <span className="text-[17px] lg:text-[19px] whitespace-nowrap" style={{ ...title, fontWeight: on ? 700 : 600 }}>{x.t}</span>
                    </div>
                    <span className="hidden lg:flex items-center gap-2 text-[12px] tabular-nums" style={{ color: C.muted }}>
                      {x.mods.length}
                      <ArrowRight size={15} className="transition-all duration-300" style={{ color: C.green, opacity: on ? 1 : 0, transform: on ? 'none' : 'translateX(-6px)' }} />
                    </span>
                  </div>
                  <div className="hidden lg:grid transition-all duration-500" style={{ gridTemplateRows: on ? '1fr' : '0fr' }}>
                    <p className="overflow-hidden text-[14px] leading-[1.6]" style={{ color: C.muted }}>
                      <span className="block pt-2.5">{x.d}</span>
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* módulos da área */}
          <div className="lg:col-span-8 rounded-[24px] p-4 sm:p-6 md:p-7" style={{ background: 'linear-gradient(180deg, #EEF3F0 0%, #F4F2ED 100%)' }}>
            <p className="lg:hidden text-[14px] leading-[1.6] mb-4" style={{ color: C.muted }}>{group.d}</p>
            <div key={group.id} className="grid sm:grid-cols-2 gap-3">
              {group.mods.map((m, i) => (
                <div
                  key={m.t}
                  className="lp-mod lp-card bg-white rounded-2xl border p-5"
                  style={{ borderColor: C.line, animationDelay: `${i * 70}ms` }}
                >
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-500" style={{ background: C.greenSoft }}>
                    <m.icon size={19} style={{ color: C.green }} strokeWidth={2} />
                  </span>
                  <p className="text-[16px] font-semibold mt-4">{m.t}</p>
                  <p className="text-[14px] leading-[1.55] mt-1" style={{ color: C.muted }}>{m.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
