const fs = require('fs');

const lines = fs.readFileSync('old_fpv_utf8.tsx', 'utf8').split('\n');
// Include up to line 6608 (index 6607) by slicing up to 6608 (exclusive, so it grabs 6607)
let printDeck = lines.slice(5426, 6608).join('\n');

// Replace viewMode logic
printDeck = printDeck.replace('<div className={`print-slide-deck hidden ${viewMode === \'slide\' ? \'print:block\' : \'\'}`}>', '<div className="print-slide-deck hidden print:block">');

const componentCode = `import React from 'react';
import { Box, Drill, Trash, Presentation, Award, Sparkles, Users, Trophy, Lightbulb, Wrench, Trees, HardHat, ConciergeBell, ChevronLeft, Factory, Store, Bus, Building, Hospital, ShoppingBag, GraduationCap, Share2, Clock, Smartphone, Cpu, CreditCard, User, Calendar, UserCheck, Briefcase } from 'lucide-react';

export default function PropostaApresentacaoPrint({ proposta }: { proposta: any }) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  
  const margemBrutaMensal = 0;
  const impostosValor = 0;
  const lucroLiquidoMensal = 0;
  const totalBeneficiosSubtotal = 0;
  const insumosEquipamentosTotal = 0;
  const totalSalariosEncargos = 0;
  const despesasOperacionaisFixas = 0;
  const mdoExtraMensal = 0;
  const provisaoRescisao = 0;
  const outrosCustosSubtotal = 0;
  const resultado = { divisor: 1, items: [] };
  
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: \`
        @media print {
            @page {
                size: 297mm 167mm !important;
                margin: 0 !important;
            }
            
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }

            body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
            }

            body * {
                visibility: hidden !important;
            }

            .print-slide-deck, .print-slide-deck * {
                visibility: visible !important;
            }

            .print-slide-deck {
                display: block !important;
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 297mm !important;
                height: auto !important;
                background: transparent !important;
                margin: 0 !important;
                padding: 0 !important;
                border: none !important;
            }

            .print-slide {
                display: flex !important;
                page-break-after: always !important;
                break-after: page !important;
                page-break-inside: avoid !important;
                break-inside: avoid !important;
                width: 297mm !important;
                height: 167mm !important;
                max-height: 167mm !important;
                box-sizing: border-box !important;
                margin: 0 !important;
                padding: 2.5rem 3.5rem !important;
                position: relative !important;
                overflow: hidden !important;
                border: none !important;
            }

            .print-slide-deck .text-[7.5px] { font-size: 16px !important; line-height: 22px !important; }
            .print-slide-deck .text-[8px] { font-size: 17px !important; line-height: 23px !important; }
            .print-slide-deck .text-[8.5px] { font-size: 18px !important; line-height: 24px !important; }
            .print-slide-deck .text-[9px] { font-size: 19px !important; line-height: 25px !important; }
            .print-slide-deck .text-[9.5px] { font-size: 20px !important; line-height: 26px !important; }
            .print-slide-deck .text-[10px] { font-size: 21px !important; line-height: 27px !important; }
            .print-slide-deck .text-[11px] { font-size: 22px !important; line-height: 28px !important; }
            .print-slide-deck .text-[12px] { font-size: 23px !important; line-height: 29px !important; }
            .print-slide-deck .text-[13px] { font-size: 24px !important; line-height: 30px !important; }
            .print-slide-deck .text-[14px] { font-size: 25px !important; line-height: 31px !important; }
            .print-slide-deck .text-[15px] { font-size: 26px !important; line-height: 32px !important; }
            
            .print-slide-deck .text-xs { font-size: 21px !important; line-height: 28px !important; }
            .print-slide-deck .text-sm { font-size: 24px !important; line-height: 32px !important; }
            .print-slide-deck .text-base { font-size: 28px !important; line-height: 38px !important; }
            .print-slide-deck .text-lg { font-size: 32px !important; line-height: 42px !important; }
            .print-slide-deck .text-xl { font-size: 36px !important; line-height: 46px !important; }
            .print-slide-deck .text-2xl { font-size: 42px !important; line-height: 52px !important; }
            .print-slide-deck .text-3xl { font-size: 50px !important; line-height: 60px !important; }
            .print-slide-deck .text-4xl { font-size: 64px !important; line-height: 76px !important; }
            .print-slide-deck .text-5xl { font-size: 78px !important; line-height: 90px !important; }

            .print-slide-deck .p-16 { padding: 2.5rem 3.5rem !important; }
            .print-slide-deck .p-8 { padding: 1.5rem 2rem !important; }
            .print-slide-deck .p-6 { padding: 1rem 1.5rem !important; }
            .print-slide-deck .gap-8 { gap: 2rem !important; }
            .print-slide-deck .gap-6 { gap: 1.5rem !important; }

            .print-slide-deck .w-10 { width: 4rem !important; height: 4rem !important; }
            .print-slide-deck .h-10 { height: 4rem !important; }
            .print-slide-deck .w-12 { width: 5rem !important; height: 5rem !important; }
            .print-slide-deck .h-12 { height: 5rem !important; }
            
            .print-slide-deck svg[viewBox="0 0 24 24"] { 
                width: 2.2rem !important; 
                height: 2.2rem !important; 
                stroke-width: 2.5 !important;
            }

            .print-slide-deck .gap-1.5 { gap: 2rem !important; }
            .print-slide-deck .max-w-\\[65px\\] { max-width: 130px !important; }
            .print-slide-deck .max-w-\\[80px\\] { max-width: 160px !important; }
            .print-slide-deck .max-w-\\[90px\\] { max-width: 170px !important; }
            .print-slide-deck .max-w-\\[100px\\] { max-width: 190px !important; }

            .print-slide-deck table th, 
            .print-slide-deck table td {
                padding: 0.75rem 1rem !important;
            }
        }
      \`}} />
      ${printDeck}
    </>
  );
}
`;

fs.writeFileSync('components/PropostaApresentacaoPrint.tsx', componentCode, 'utf8');
console.log('Successfully recreated components/PropostaApresentacaoPrint.tsx');
