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

// 3. Conditionals
content = content.replace(/\{currentSlide === (\d+) && \(/g, '{(!presentationMode || currentSlide === $1) && (');

// 4. Classes of slides
// The safest way is to target exactly:
// <div className="absolute inset-0 w-full h-full...
// <div className="w-full h-full...

content = content.replace(
  /<div className="absolute inset-0 w-full h-full flex flex-col justify-between p-16 z-10 text-white overflow-hidden bg-slate-950">/g,
  '<div className={presentationMode ? "absolute inset-0 w-full h-full flex flex-col justify-between p-16 z-10 text-white overflow-hidden bg-slate-950" : "relative w-full aspect-[16/9] shrink-0 border border-slate-200 print-slide flex flex-col justify-between p-16 z-10 text-white overflow-hidden bg-slate-950"}>'
);

content = content.replace(
  /<div className="absolute inset-0 w-full h-full flex flex-col justify-between p-16 z-10 animate-fadeIn bg-white overflow-hidden text-slate-800">/g,
  '<div className={presentationMode ? "absolute inset-0 w-full h-full flex flex-col justify-between p-16 z-10 animate-fadeIn bg-white overflow-hidden text-slate-800" : "relative w-full aspect-[16/9] shrink-0 border border-slate-200 print-slide flex flex-col justify-between p-16 z-10 animate-fadeIn bg-white overflow-hidden text-slate-800"}>'
);

content = content.replace(
  /<div className="w-full h-full (bg-\[[^\]]+\]|bg-white) ([^"]+)"/g,
  (match, p1, p2) => {
    return `<div className={\`${p1} ${p2} \${presentationMode ? "absolute inset-0 w-full h-full" : "relative w-full aspect-[16/9] shrink-0 shadow-xl rounded-2xl border border-slate-200 print-slide"}\`}`;
  }
);

// Navigation buttons hide on print
content = content.replace(
  /className=\{\`absolute left-4 top-1\/2 -translate-y-1\/2 z-\[100\] w-14 h-14 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-\[\#1e4480\] hover:text-white hover:border-\[\#1e4480\] shadow-xl active:scale-95 transition-all cursor-pointer \$\{presentationMode \? 'bg-white\/10 border-white\/20 text-white hover:bg-white\/20 hover:border-white\/30 backdrop-blur-sm' : ''\}\`\}/g,
  "className={`absolute left-4 top-1/2 -translate-y-1/2 z-[100] w-14 h-14 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-[#1e4480] hover:text-white hover:border-[#1e4480] shadow-xl active:scale-95 transition-all cursor-pointer ${presentationMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm' : 'hidden print:hidden'}`}"
);

content = content.replace(
  /className=\{\`absolute right-4 top-1\/2 -translate-y-1\/2 z-\[100\] w-14 h-14 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-\[\#1e4480\] hover:text-white hover:border-\[\#1e4480\] shadow-xl active:scale-95 transition-all cursor-pointer \$\{presentationMode \? 'bg-white\/10 border-white\/20 text-white hover:bg-white\/20 hover:border-white\/30 backdrop-blur-sm' : ''\}\`\}/g,
  "className={`absolute right-4 top-1/2 -translate-y-1/2 z-[100] w-14 h-14 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-[#1e4480] hover:text-white hover:border-[#1e4480] shadow-xl active:scale-95 transition-all cursor-pointer ${presentationMode ? 'bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30 backdrop-blur-sm' : 'hidden print:hidden'}`}"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Done safe');
