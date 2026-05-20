const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log('Removendo icones do Slide 12 e aplicando bullets nativos (Parte 10)...');

content = content.split('\r\n').join('\n');

// Vamos substituir a estrutura flex com CheckCircle2 por bullets nativos e limpos
const oldBlock = `<div key={idx} className="flex gap-2.5 items-start text-[9.5px] leading-normal">
                                                  <CheckCircle2 size={8} className="text-[#1b4d3e] shrink-0 mt-0.5" /> 
                                                  <span className="text-slate-700 font-semibold text-[9.5px] leading-normal">{cond}</span>
                                               </div>`;

const newBlock = `<div key={idx} className="text-slate-700 font-semibold text-[9.5px] leading-normal pl-1.5 relative before:content-['•'] before:absolute before:left-0 before:text-[#1b4d3e]">
                                                  {cond}
                                               </div>`;

if (content.includes(oldBlock)) {
   content = content.split(oldBlock).join(newBlock);
   console.log('✔ Bullets aplicados na TELA com sucesso.');
} else {
   console.log('⚠ Nao encontrou bloco exato na TELA. Tentando bloco alternativo com espaco extra...');
   
   // Tentar com possiveis diferencas de espacos
   const oldBlockAlt = `<div key={idx} className="flex gap-2.5 items-start text-[9.5px] leading-normal">
                                                  <CheckCircle2 size={8} className="text-[#1b4d3e] shrink-0 mt-0.5" /> \n                                                  <span className="text-slate-700 font-semibold text-[9.5px] leading-normal">{cond}</span>\n                                               </div>`;
   content = content.replace(oldBlockAlt, newBlock);
}

// Vamos fazer o mesmo para a versao PDF do Slide 12
const oldBlockPDF = `<div key={idx} className="flex gap-2.5 items-start text-[9.5px] leading-normal">
                                                        <CheckCircle2 size={8} className="text-[#1b4d3e] shrink-0 mt-0.5" /> 
                                                        <span className="text-slate-700 font-semibold text-[9.5px] leading-normal">{cond}</span>
                                                     </div>`;

const newBlockPDF = `<div key={idx} className="text-slate-700 font-semibold text-[9.5px] leading-normal pl-1.5 relative before:content-['•'] before:absolute before:left-0 before:text-[#1b4d3e]">
                                                        {cond}
                                                     </div>`;

if (content.includes(oldBlockPDF)) {
   content = content.split(oldBlockPDF).join(newBlockPDF);
   console.log('✔ Bullets aplicados no PDF com sucesso.');
} else {
   console.log('⚠ Nao encontrou bloco exato no PDF.');
}

// Se por acaso restou alguma outra variacao de CheckCircle2 size={8} ou size={13}
// Vamos fazer uma substituicao direta mais generica
content = content.split('<CheckCircle2 size={8} className="text-[#1b4d3e] shrink-0 mt-0.5" />').join('');
content = content.split('<CheckCircle2 size={13} className="text-[#1b4d3e] shrink-0 mt-0.5" />').join('');

fs.writeFileSync(pagePath, content, 'utf8');
console.log('✔ page.tsx gravado com sucesso na Parte 10!');
