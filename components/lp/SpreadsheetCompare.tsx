'use client';

import React, { useState } from 'react';
import { X, Check, AlertTriangle, FileSpreadsheet } from 'lucide-react';

const C = {
  paper: '#FBFAF7',
  ink: '#111418',
  muted: '#5B6470',
  line: '#E6E2DA',
  green: '#1B4D3E',
  greenSoft: '#EAF1ED',
  red: '#9A3B2E',
  redSoft: '#FBEDEA',
};
const title: React.CSSProperties = { fontFamily: 'var(--font-lp-text)', fontWeight: 700, letterSpacing: '-0.035em' };

const ROWS: [string, string, string][] = [
  ['Encargos e benefícios da CCT', 'Fórmulas copiadas da proposta anterior. Um reflexo esquecido e a margem some.', 'Calculados a partir da convenção cadastrada, igual em todas as propostas.'],
  ['Dissídio e novo piso', 'Alguém precisa lembrar de abrir cada arquivo e atualizar à mão.', 'Atualiza a CCT uma vez e todas as novas propostas já saem com o piso novo.'],
  ['Margem do contrato', 'Só aparece depois que o contrato roda, quando o prejuízo já aconteceu.', 'DRE do projeto antes de enviar: receita, tributos, custos e margem.'],
  ['Versões da proposta', '"v7_FINAL_revisado(2).xlsx" no e-mail de três pessoas diferentes.', 'Uma proposta só, sempre atualizada e acessível para a equipe.'],
  ['Envio ao cliente', 'PDF anexado no e-mail. Depois disso, silêncio.', 'Link com a sua marca: proposta, planilha de custos, minuta e fotos.'],
  ['Saber se o cliente leu', 'Impossível. O follow-up é no escuro.', 'Cada acesso registrado, com as seções que ele abriu e quando.'],
  ['Aprovação', 'Imprimir, assinar, escanear e mandar de volta.', 'Assinatura online com nome, CPF/CNPJ, IP e data. Aviso no WhatsApp.'],
  ['Reajuste na data-base', 'Descoberto quando o financeiro reclama do caixa.', 'Contrato marcado como "Reajuste pendente" antes da data-base.'],
  ['Trabalho em equipe', 'Arquivo travado: "fulano está editando".', 'Vários usuários com permissões, cada um na sua parte.'],
];

export default function SpreadsheetCompare() {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <section id="vs-planilhas" className="py-24 md:py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="max-w-[760px] mb-14">
          <p className="text-[14px] mb-4" style={{ color: C.muted }}>SmartBid x planilhas</p>
          <h2 className="text-[40px] md:text-[52px] leading-[1.05]" style={title}>
            A planilha não avisa quando está errada. O SmartBid não deixa errar.
          </h2>
        </div>

        {/* Lado a lado visual */}
        <div data-stagger className="grid md:grid-cols-2 gap-4 mb-6">
          {/* A planilha */}
          <div className="rounded-[22px] border overflow-hidden bg-white" style={{ borderColor: C.line }}>
            <div className="flex items-center gap-2 px-4 py-2.5 border-b text-[12px]" style={{ borderColor: C.line, background: '#F3F6F3' }}>
              <FileSpreadsheet size={14} style={{ color: '#1D6F42' }} />
              <span className="truncate" style={{ color: C.muted }}>Orcamento_HSL_v7_FINAL_revisado(2).xlsx</span>
            </div>
            <div className="text-[12px] tabular-nums">
              <div className="grid grid-cols-[34px_1fr_110px] border-b" style={{ borderColor: C.line, background: '#FAFAF8', color: '#9A958B' }}>
                <span className="px-2 py-1.5 border-r" style={{ borderColor: C.line }} />
                <span className="px-2 py-1.5 border-r" style={{ borderColor: C.line }}>A</span>
                <span className="px-2 py-1.5">B</span>
              </div>
              {[
                ['Salário-base (piso 2024)', 'R$ 1.712,00', 'warn'],
                ['Insalubridade 40%', 'R$ 564,80', ''],
                ['Encargos sociais', '#REF!', 'err'],
                ['Vale-transporte', 'R$ 286,00', ''],
                ['Vale-refeição', '=B7*22', 'err'],
                ['Uniformes', 'R$ 45,00', ''],
                ['Preço por posto', '#VALOR!', 'err'],
              ].map(([a, b, s], i) => (
                <div key={a} className="grid grid-cols-[34px_1fr_110px] border-b last:border-b-0" style={{ borderColor: '#EFEDE8' }}>
                  <span className="px-2 py-2 border-r text-center" style={{ borderColor: C.line, color: '#9A958B', background: '#FAFAF8' }}>{i + 2}</span>
                  <span className="px-2 py-2 border-r truncate" style={{ borderColor: '#EFEDE8' }}>{a}</span>
                  <span className="px-2 py-2 text-right font-medium" style={s === 'err' ? { background: C.redSoft, color: C.red } : s === 'warn' ? { background: '#FBF4DF', color: '#7A5410' } : undefined}>{b}</span>
                </div>
              ))}
            </div>
            <div className="flex items-start gap-2 px-4 py-3 border-t text-[12.5px]" style={{ borderColor: C.line, background: C.redSoft, color: C.red }}>
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              Piso desatualizado e fórmula quebrada. Ninguém percebe até a proposta sair.
            </div>
          </div>

          {/* O SmartBid */}
          <div className="rounded-[22px] border overflow-hidden bg-white" style={{ borderColor: 'rgba(27,77,62,0.3)' }}>
            <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b text-[12px]" style={{ borderColor: C.line, background: C.greenSoft }}>
              <span className="font-semibold" style={{ color: C.green }}>FPV-128 · Auxiliar de limpeza hospitalar</span>
              <span style={{ color: C.green }}>CCT SIEMACO 2026</span>
            </div>
            <div className="text-[12.5px] tabular-nums">
              {[
                ['Salário-base (piso 2026)', 'R$ 1.840,00'],
                ['Insalubridade 40%', 'R$ 607,20'],
                ['Encargos sociais (71,80%)', 'R$ 1.757,09'],
                ['Vale-transporte líquido (desc. 6%)', 'R$ 198,40'],
                ['Vale-refeição (22 dias)', 'R$ 847,00'],
                ['Uniformes e EPIs', 'R$ 62,50'],
              ].map(([a, b]) => (
                <div key={a} className="flex justify-between px-4 py-2 border-b" style={{ borderColor: '#EFEDE8' }}>
                  <span style={{ color: C.muted }}>{a}</span>
                  <span className="font-medium">{b}</span>
                </div>
              ))}
              <div className="flex justify-between items-baseline px-4 py-3">
                <span className="font-semibold">Preço por posto</span>
                <span className="text-[20px]" style={{ ...title, color: C.green }}>R$ 6.385,00</span>
              </div>
            </div>
            <div className="flex items-start gap-2 px-4 py-3 border-t text-[12.5px]" style={{ borderColor: C.line, background: C.greenSoft, color: C.green }}>
              <Check size={15} className="shrink-0 mt-0.5" strokeWidth={2.5} />
              Piso, encargos e benefícios puxados da convenção vigente. Sem fórmula para quebrar.
            </div>
          </div>
        </div>

        {/* Tabela linha a linha */}
        <div data-reveal className="rounded-[22px] border overflow-hidden bg-white" style={{ borderColor: C.line }}>
          <div className="hidden md:grid grid-cols-[1.1fr_1.4fr_1.4fr] text-[13px] font-semibold border-b" style={{ borderColor: C.line }}>
            <span className="px-6 py-4" style={{ color: C.muted }}>No dia a dia</span>
            <span className="px-6 py-4 flex items-center gap-2"><FileSpreadsheet size={15} style={{ color: '#1D6F42' }} /> Planilha</span>
            <span className="px-6 py-4 text-white flex items-center gap-2" style={{ background: C.green }}>SmartBid</span>
          </div>
          {ROWS.map(([k, a, b], i) => (
            <div
              key={k}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="grid md:grid-cols-[1.1fr_1.4fr_1.4fr] border-b last:border-b-0 transition-colors duration-200"
              style={{ borderColor: C.line, background: hover === i ? '#FAF9F6' : '#fff' }}
            >
              <p className="px-6 pt-5 md:py-5 text-[15px] font-semibold">{k}</p>
              <p className="px-6 py-2 md:py-5 text-[14px] leading-[1.55] flex gap-2.5" style={{ color: C.muted }}>
                <X size={16} className="shrink-0 mt-0.5" style={{ color: C.red }} strokeWidth={2.5} />
                {a}
              </p>
              <p className="px-6 pb-5 pt-2 md:py-5 text-[14px] leading-[1.55] flex gap-2.5 transition-colors duration-200" style={{ background: hover === i ? '#E3EDE7' : C.greenSoft }}>
                <Check size={16} className="shrink-0 mt-0.5" style={{ color: C.green }} strokeWidth={2.5} />
                {b}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
