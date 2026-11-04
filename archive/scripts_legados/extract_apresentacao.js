const fs = require('fs');
const text = fs.readFileSync('git_fpv.tsx', 'utf-8');
const lines = text.split('\n');
let start = -1;
let end = -1;
let openDivs = 0;

for(let i=0; i<lines.length; i++) {
  if(start === -1 && lines[i].includes("viewMode === 'document' ? 'hidden' : (presentationMode")) {
    start = i;
  }
  if (start !== -1 && i >= start) {
    const line = lines[i];
    const open = (line.match(/<div/g) || []).length;
    const close = (line.match(/<\/div>/g) || []).length;
    openDivs += open - close;
    if (openDivs === 0) {
      end = i;
      break;
    }
  }
}

if (start !== -1 && end !== -1) {
  let componentLines = lines.slice(start, end + 1);
  // Remove the wrapper class logic that depends on viewMode
  // The first line is: <div className={viewMode === 'document' ? 'hidden' : (presentationMode ...
  // Let's just output the raw slides block for now.
  
  let result = `import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, User, Cpu, Smartphone } from 'lucide-react';

export default function PropostaApresentacao({ proposta, resultado, empresaEmissora, presentationMode, setPresentationMode }: any) {
  const [currentSlide, setCurrentSlide] = useState(1);
  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: \`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fadeIn { animation: fadeIn 0.5s ease-in-out; }
      \`}} />
      
${componentLines.join('\n')}
    </>
  );
}
`;
  fs.writeFileSync('components/PropostaApresentacao.tsx', result, 'utf-8');
  console.log("Extracted slides lines", start, "to", end);
} else {
  console.log("Could not find slide block.");
}
