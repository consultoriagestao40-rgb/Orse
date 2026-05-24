const fs = require('fs');

const path = './components/PropostaApresentacao.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Mudar `currentSlide === X && (` para `(!presentationMode || currentSlide === X) && (`
content = content.replace(/\{currentSlide === (\d+) && \(/g, '{(!presentationMode || currentSlide === $1) && (');

// 2. Mudar `absolute inset-0` para um estilo condicional.
// Muitos slides começam com `<div className="absolute inset-0 ...">`
// Vamos substituir `absolute inset-0` por `${presentationMode ? 'absolute inset-0' : 'relative w-full aspect-[16/9] page-break-after-always shrink-0'}`
// Em alguns casos é `<div className="w-full h-full... absolute` ou algo parecido.

// Uma forma mais segura é fazer um replace regex global em `className="absolute inset-0 `
// ou simplesmente envolver o wrapper do slide.
// Mas notice: `w-[90vw] h-[50.625vw]` container is there.

// O container que envolve todos os slides é:
// className={presentationMode ? "w-[90vw]..." : "w-full max-w-[960px] ..."}
// If not presentationMode, it should just be a flex col with gap-8, not fixed height.

let containerFind = `                     <div className={presentationMode
                        ? "w-[90vw] h-[50.625vw] max-h-[85vh] max-w-[151.1vh] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative flex flex-col justify-between"
                        : "w-full max-w-[960px] aspect-[16/9] min-w-[760px] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative select-none flex flex-col justify-between"
                     }>`;
let containerReplace = `                     <div className={presentationMode
                        ? "w-[90vw] h-[50.625vw] max-h-[85vh] max-w-[151.1vh] bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden relative flex flex-col justify-between"
                        : "w-full max-w-[1123px] flex flex-col gap-12 bg-transparent select-none print-container"
                     }>`;
                     
content = content.replace(containerFind, containerReplace);

// Substituir as classes dos slides individuais.
// Todos os slides são: `<div className="...` logo após o `&& (`
// Alguns são `<div className="absolute inset-0`
// Outros são `<div className="w-full h-full`

content = content.replace(/<div className="absolute inset-0/g, '<div className={presentationMode ? "absolute inset-0" : "relative w-full aspect-[16/9] shrink-0 border border-slate-200 print-slide"} className={"' + "absolute inset-0".replace("absolute inset-0", "") + '" ');
// Wait, the regex replace for `<div className="...` will break if I do that.
// Let's use a simpler regex.
content = content.replace(/className="absolute inset-0 ([^"]+)"/g, 'className={`' + "$1" + ' ${presentationMode ? "absolute inset-0" : "relative w-full aspect-[16/9] shadow-xl rounded-2xl shrink-0 page-break-after-always print-slide"}`}');

content = content.replace(/className="w-full h-full ([^"]+)"/g, 'className={`' + "$1" + ' ${presentationMode ? "absolute inset-0 w-full h-full" : "relative w-full aspect-[16/9] shadow-xl rounded-2xl shrink-0 page-break-after-always print-slide"}`}');

// Remover os botões de navegação no modo de impressão
content = content.replace(/<button\s+type="button"\s+onClick=\{\(\) => setCurrentSlide\(currentSlide === 1 \? 13 : currentSlide - 1\)\}.*?<\/button>/s, '{presentationMode && (<button type="button" onClick={() => setCurrentSlide(currentSlide === 1 ? 13 : currentSlide - 1)} className={`absolute left-4 top-1/2 -translate-y-1/2 z-[100] w-14 h-14 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-[#1e4480] hover:text-white hover:border-[#1e4480] shadow-xl active:scale-95 transition-all cursor-pointer ${presentationMode ? \'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm\' : \'\'}`}><ChevronLeft size={28} className="stroke-[3] -ml-1" /></button>)}');

content = content.replace(/<button\s+type="button"\s+onClick=\{\(\) => setCurrentSlide\(currentSlide === 13 \? 1 : currentSlide \+ 1\)\}.*?<\/button>/s, '{presentationMode && (<button type="button" onClick={() => setCurrentSlide(currentSlide === 13 ? 1 : currentSlide + 1)} className={`absolute right-4 top-1/2 -translate-y-1/2 z-[100] w-14 h-14 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-[#1e4480] hover:text-white hover:border-[#1e4480] shadow-xl active:scale-95 transition-all cursor-pointer ${presentationMode ? \'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm\' : \'\'}`}><ChevronRight size={28} className="stroke-[3] -mr-1" /></button>)}');


// CSS global de impressão
const cssInject = `
        @media print {
          body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print-slide { page-break-after: always !important; page-break-inside: avoid !important; margin: 0 !important; border: none !important; box-shadow: none !important; border-radius: 0 !important; width: 100vw !important; height: 100vh !important; aspect-ratio: auto !important; }
          .print-container { gap: 0 !important; }
          @page { size: landscape; margin: 0; }
        }
`;
content = content.replace('.animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }', '.animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }' + cssInject);

// O wrapper principal:
// <div className={presentationMode ? "fixed inset-0 ... presentation-mode-active" : "w-full bg-slate-900/5 rounded-3xl p-8 border border-slate-200/40 flex justify-center items-center overflow-hidden relative"}>
let wrapperFind = `      <div className={presentationMode 
         ? "fixed inset-0 bg-slate-950/98 z-[99999] flex flex-col justify-center items-center select-none p-6 presentation-mode-active" 
         : "w-full bg-slate-900/5 rounded-3xl p-8 border border-slate-200/40 flex justify-center items-center overflow-hidden relative"
      }>`;
let wrapperReplace = `      <div className={presentationMode 
         ? "fixed inset-0 bg-slate-950/98 z-[99999] flex flex-col justify-center items-center select-none p-6 presentation-mode-active" 
         : "w-full flex justify-center items-center relative print:bg-white print:p-0"
      }>`;
content = content.replace(wrapperFind, wrapperReplace);

fs.writeFileSync(path, content, 'utf8');
console.log('Done');
