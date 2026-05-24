const fs = require('fs');
const path = './components/PropostaApresentacao.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCss = `        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-slide { page-break-after: always !important; page-break-inside: avoid !important; margin: 0 !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; width: 100vw !important; height: 100vh !important; aspect-ratio: auto !important; }
          .print-container { gap: 0 !important; }
          @page { size: landscape; margin: 0; }
        }`;

const newCss = `        @media print {
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

            .print-container { gap: 0 !important; width: 297mm !important; }
            .print-container-outer { justify-content: flex-start !important; align-items: flex-start !important; width: 297mm !important; }

            /* FORÇAR RENDERIZAÇÃO DE CORES DE FUNDO EXPLICITAMENTE */
            .print-slide.bg-[#1e4480], .print-slide[class*="bg-[#1e4480]"] {
                background-color: #1e4480 !important;
            }
            .print-slide.bg-slate-950, .print-slide[class*="bg-slate-950"] {
                background-color: #020617 !important;
            }
            .print-slide.bg-white, .print-slide[class*="bg-white"] {
                background-color: #ffffff !important;
            }

            /* ESCALA DE TEXTOS E ELEMENTOS AUMENTADOS PARA ALTA QUALIDADE NO IMPRESSO A4 */
            .print-slide .text-[7.5px] { font-size: 16px !important; line-height: 22px !important; }
            .print-slide .text-[8px] { font-size: 17px !important; line-height: 23px !important; }
            .print-slide .text-[8.5px] { font-size: 18px !important; line-height: 24px !important; }
            .print-slide .text-[9px] { font-size: 19px !important; line-height: 25px !important; }
            .print-slide .text-[9.5px] { font-size: 20px !important; line-height: 26px !important; }
            .print-slide .text-[10px] { font-size: 21px !important; line-height: 27px !important; }
            .print-slide .text-[11px] { font-size: 22px !important; line-height: 28px !important; }
            .print-slide .text-[12px] { font-size: 23px !important; line-height: 29px !important; }
            .print-slide .text-[13px] { font-size: 24px !important; line-height: 30px !important; }
            .print-slide .text-[14px] { font-size: 25px !important; line-height: 31px !important; }
            .print-slide .text-[15px] { font-size: 26px !important; line-height: 32px !important; }
            
            .print-slide .text-xs { font-size: 21px !important; line-height: 28px !important; }
            .print-slide .text-sm { font-size: 24px !important; line-height: 32px !important; }
            .print-slide .text-base { font-size: 28px !important; line-height: 38px !important; }
            .print-slide .text-lg { font-size: 32px !important; line-height: 42px !important; }
            .print-slide .text-xl { font-size: 36px !important; line-height: 46px !important; }
            .print-slide .text-2xl { font-size: 42px !important; line-height: 52px !important; }
            .print-slide .text-3xl { font-size: 50px !important; line-height: 60px !important; }
            .print-slide .text-4xl { font-size: 64px !important; line-height: 76px !important; }
            .print-slide .text-5xl { font-size: 78px !important; line-height: 90px !important; }

            .print-slide .p-16 { padding: 2.5rem 3.5rem !important; }
            .print-slide .p-8 { padding: 1.5rem 2rem !important; }
            .print-slide .p-6 { padding: 1rem 1.5rem !important; }
            .print-slide .gap-8 { gap: 2rem !important; }
            .print-slide .gap-6 { gap: 1.5rem !important; }

            /* REDIMENSIONAR E AMPLIAR CÍRCULOS DE ÍCONES NO PRINT */
            .print-slide .w-10 { width: 4rem !important; height: 4rem !important; }
            .print-slide .h-10 { height: 4rem !important; }
            .print-slide .w-12 { width: 5rem !important; height: 5rem !important; }
            .print-slide .h-12 { height: 5rem !important; }
            
            /* GARANTIR QUE OS SVGS DO LUCIDE CRESÇAM PROPORCIONALMENTE NO PRINT */
            .print-slide svg[viewBox="0 0 24 24"] { 
                width: 2.2rem !important; 
                height: 2.2rem !important; 
                stroke-width: 2.5 !important;
            }

            /* AUMENTAR A GAP DO GRID DE KPIS E LARGURA DE DESCRIÇÕES NO PRINT */
            .print-slide .gap-1.5 { gap: 2rem !important; }
            .print-slide .max-w-\\[65px\\] { max-width: 130px !important; }
            .print-slide .max-w-\\[80px\\] { max-width: 160px !important; }
            .print-slide .max-w-\\[90px\\] { max-width: 170px !important; }
            .print-slide .max-w-\\[100px\\] { max-width: 190px !important; }

            /* GENEROSO ESPAÇAMENTO E BORDAS NAS TABELAS NO PRINT */
            .print-slide table th, 
            .print-slide table td {
                padding: 0.75rem 1rem !important;
            }
        }`;

if (content.includes(oldCss)) {
  content = content.replace(oldCss, newCss);
} else {
  console.log("OLD CSS NOT FOUND! IT MIGHT HAVE DIFFERENT INDENTATION!");
  // fallback replace between @media print { and }
  // Find the exact block.
  content = content.replace(/@media print \{[\s\S]*?@page \{ size: landscape; margin: 0; \}\n        \}/g, newCss);
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done CSS Fix');
