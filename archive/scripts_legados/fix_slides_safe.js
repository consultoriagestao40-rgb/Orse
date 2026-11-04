const fs = require('fs');
const path = './components/PropostaApresentacao.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. CSS Injection
const cssInject = `
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-slide { page-break-after: always !important; page-break-inside: avoid !important; margin: 0 !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; width: 100vw !important; height: 100vh !important; aspect-ratio: auto !important; }
          .print-container { gap: 0 !important; }
          @page { size: landscape; margin: 0; }
        }
`;
if (!content.includes('@media print')) {
  content = content.replace('.animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }', '.animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }' + cssInject);
}

// 2. Main wrappers
let wrapperFind = `      <div className={presentationMode 
         ? "fixed inset-0 bg-slate-950/98 z-[99999] flex flex-col justify-center items-center select-none p-6 presentation-mode-active" 
         : "w-full bg-slate-900/5 rounded-3xl p-8 border border-slate-200/40 flex justify-center items-center overflow-hidden relative"
      }>`;
let wrapperReplace = `      <div className={presentationMode 
         ? "fixed inset-0 bg-slate-950/98 z-[99999] flex flex-col justify-center items-center select-none p-6 presentation-mode-active" 
         : "w-full flex justify-center items-center relative print:bg-white print:p-0"
      }>`;
content = content.replace(wrapperFind, wrapperReplace);

let containerFind = `                     <div className={presentationMode
                        ? "w-[90vw] h-[50.625vw] max-h-[85vh] max-w-[151.1vh] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative flex flex-col justify-between"
                        : "w-full max-w-[960px] aspect-[16/9] min-w-[760px] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative select-none flex flex-col justify-between"
                     }>`;
let containerReplace = `                     <div className={presentationMode
                        ? "w-[90vw] h-[50.625vw] max-h-[85vh] max-w-[151.1vh] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative flex flex-col justify-between"
                        : "w-full max-w-[1123px] flex flex-col gap-12 bg-transparent select-none print-container"
                     }>`;
content = content.replace(containerFind, containerReplace);

// 3. Conditionals
content = content.replace(/\{currentSlide === (\d+) && \(/g, '{(!presentationMode || currentSlide === $1) && (');

// 4. Classes of slides (absolute inset-0 or w-full h-full)
// The safest way is to wrap the slide content in a new div if it's printed.
// Wait, actually changing `absolute inset-0 w-full h-full` and `absolute inset-0` to use conditional classes is the only way since it's tailwind.
// Let's replace EXACT strings that I know exist.

// Slide 1 (Capa)
content = content.replace(
  '<div className="absolute inset-0 w-full h-full flex flex-col justify-between p-16 z-10 text-white overflow-hidden bg-slate-950">',
  '<div className={presentationMode ? "absolute inset-0 w-full h-full flex flex-col justify-between p-16 z-10 text-white overflow-hidden bg-slate-950" : "relative w-full aspect-[16/9] shrink-0 border border-slate-200 print-slide flex flex-col justify-between p-16 z-10 text-white overflow-hidden bg-slate-950"}>'
);

// Slide 2 (Olá, Karin!)
content = content.replace(
  '<div className="absolute inset-0 w-full h-full flex flex-col justify-between p-16 z-10 animate-fadeIn bg-white overflow-hidden text-slate-800">',
  '<div className={presentationMode ? "absolute inset-0 w-full h-full flex flex-col justify-between p-16 z-10 animate-fadeIn bg-white overflow-hidden text-slate-800" : "relative w-full aspect-[16/9] shrink-0 border border-slate-200 print-slide flex flex-col justify-between p-16 z-10 animate-fadeIn bg-white overflow-hidden text-slate-800"}>'
);

// Any other slide starts with <div className="w-full h-full bg-[#1e4480]... or <div className="w-full h-full bg-white...
content = content.replace(
  /<div className="w-full h-full (bg-\[[^\]]+\]|bg-white) ([^"]+)"/g,
  '<div className={`' + "$1" + ' ' + "$2" + ' ${presentationMode ? "absolute inset-0 w-full h-full" : "relative w-full aspect-[16/9] shrink-0 border border-slate-200 print-slide"}`} '
);

// Hide buttons if not presentationMode
content = content.replace(
  /{presentationMode \? 'bg-white\/10 border-white\/20 text-white hover:bg-white\/20 hover:border-white\/30 backdrop-blur-sm' : ''}/g,
  "{presentationMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm' : 'hidden print:hidden'}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done2');
