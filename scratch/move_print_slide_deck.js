const fs = require('fs');
const pagePath = 'app/propostas/nova/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Extract print-slide-deck
const deckStartIdx = content.indexOf('<div className="print-slide-deck">');
if (deckStartIdx === -1) {
   console.error("❌ <div className=\"print-slide-deck\"> not found!");
   process.exit(1);
}

// Find matching closing div
let openDivs = 0;
let deckEndIdx = -1;
for (let i = deckStartIdx; i < content.length; i++) {
   if (content.substring(i, i + 4) === '<div') {
      openDivs++;
   } else if (content.substring(i, i + 5) === '</div') {
      openDivs--;
      if (openDivs === 0) {
         deckEndIdx = i + 6; // include '</div>'
         break;
      }
   }
}

if (deckEndIdx === -1) {
   console.error("❌ Matching closing div for print-slide-deck not found!");
   process.exit(1);
}

const printSlideDeckContent = content.substring(deckStartIdx, deckEndIdx);
console.log("✔ Successfully extracted print-slide-deck! Length: " + printSlideDeckContent.length);

// Remove print-slide-deck from original location
content = content.substring(0, deckStartIdx) + content.substring(deckEndIdx);
console.log("✔ Removed print-slide-deck from original location!");

// Insert print-slide-deck right before </main> at the end of page.tsx
const mainEndStr = '</main>';
const lastMainEndIdx = content.lastIndexOf(mainEndStr);
if (lastMainEndIdx === -1) {
   console.error("❌ </main> not found at the end of the file!");
   process.exit(1);
}

content = content.substring(0, lastMainEndIdx) + printSlideDeckContent + '\n' + content.substring(lastMainEndIdx);
console.log("✔ Inserted print-slide-deck right before </main>!");

// 2. Add presentation-mode-active class to the presentationMode container
const oldContainerClass = `                  <div className={presentationMode 
                     ? "fixed inset-0 bg-slate-950/98 z-[99999] flex flex-col justify-center items-center select-none p-6" 
                     : "w-full bg-slate-900/5 rounded-3xl p-8 border border-slate-200/40 flex justify-center items-center overflow-x-auto"
                  }>`;

const newContainerClass = `                  <div className={presentationMode 
                     ? "fixed inset-0 bg-slate-950/98 z-[99999] flex flex-col justify-center items-center select-none p-6 presentation-mode-active" 
                     : "w-full bg-slate-900/5 rounded-3xl p-8 border border-slate-200/40 flex justify-center items-center overflow-x-auto"
                  }>`;

if (content.includes(oldContainerClass)) {
   content = content.replace(oldContainerClass, newContainerClass);
   console.log("✔ Added presentation-mode-active class to presentation container!");
} else {
   console.error("❌ Target visual container classes not found!");
}

// 3. Update style block for printing & presentation mode text scaling
const oldStyleBlock = `                  <style>{\`
                     @media screen {
                        .print-slide-deck {
                           display: none !important;
                        }
                     }
                     @media print {
                        @page {
                           size: A4 landscape !important;
                           margin: 0 !important;
                        }
                        
                        body {
                           margin: 0 !important;
                           padding: 0 !important;
                           background: white !important;
                           -webkit-print-color-adjust: exact !important;
                           print-color-adjust: exact !important;
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
                           background: white !important;
                           margin: 0 !important;
                           padding: 0 !important;
                           border: none !important;
                        }

                        .print-slide {
                           display: flex !important;
                           page-break-after: always !important;
                           break-after: page !important;
                           width: 297mm !important;
                           height: 210mm !important;
                           box-sizing: border-box !important;
                           margin: 0 !important;
                           padding: 4rem !important;
                           position: relative !important;
                           background: white !important;
                           overflow: hidden !important;
                           border: none !important;
                        }
                     }
                  \`}</style>`;

const newStyleBlock = `                  <style>{\`
                     /* Estilos exclusivos para o Modo Apresentação - Aumento de Fontes */
                     .presentation-mode-active .text-[10px] { font-size: 14px !important; }
                     .presentation-mode-active .text-[11px] { font-size: 15px !important; }
                     .presentation-mode-active .text-[13px] { font-size: 18px !important; }
                     .presentation-mode-active .text-[15px] { font-size: 20px !important; }
                     .presentation-mode-active .text-xs { font-size: 16px !important; line-height: 22px !important; }
                     .presentation-mode-active .text-sm { font-size: 18px !important; line-height: 26px !important; }
                     .presentation-mode-active .text-base { font-size: 22px !important; line-height: 30px !important; }
                     .presentation-mode-active .text-lg { font-size: 26px !important; line-height: 34px !important; }
                     .presentation-mode-active .text-xl { font-size: 30px !important; line-height: 38px !important; }
                     .presentation-mode-active .text-2xl { font-size: 36px !important; line-height: 44px !important; }
                     .presentation-mode-active .text-3xl { font-size: 42px !important; line-height: 52px !important; }
                     .presentation-mode-active .text-4xl { font-size: 54px !important; line-height: 64px !important; }
                     .presentation-mode-active .text-5xl { font-size: 68px !important; line-height: 78px !important; }
                     
                     .presentation-mode-active .p-16 { padding: 4.5rem !important; }
                     .presentation-mode-active .p-8 { padding: 2.5rem !important; }
                     .presentation-mode-active .p-6 { padding: 2rem !important; }
                     .presentation-mode-active .gap-8 { gap: 2.5rem !important; }

                     @media screen {
                        .print-slide-deck {
                           display: none !important;
                        }
                     }
                     @media print {
                        @page {
                           size: A4 landscape !important;
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
                           width: 297mm !important;
                           height: 210mm !important;
                           box-sizing: border-box !important;
                           margin: 0 !important;
                           padding: 4rem !important;
                           position: relative !important;
                           background: transparent !important;
                           overflow: hidden !important;
                           border: none !important;
                        }
                     }
                  \`}</style>`;

if (content.includes(oldStyleBlock)) {
   content = content.replace(oldStyleBlock, newStyleBlock);
   console.log("✔ Print & Presentation stylesheet style tag successfully updated!");
} else {
   console.error("❌ Old style block target not found!");
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log("✔ page.tsx completely refactored successfully!");
