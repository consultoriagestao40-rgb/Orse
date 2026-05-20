const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Normalizar quebras de linha para \n
const originalLineEnding = content.includes('\r\n') ? '\r\n' : '\n';
content = content.split('\r\n').join('\n');

console.log('Iniciando aplicacao de correcoes cirurgicas do Slide 04 PDF...');

// Identificar a secao do Slide 04 PRINT no PDF e aplicar as classes corretas
const trophyOriginalClass = 'className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl"';
const trophyNewClass = 'className="absolute top-0 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';

const lightbulbOriginalClass = 'className="absolute bottom-12 left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl"';
const lightbulbNewClass = 'className="absolute bottom-12 left-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';

const usersOriginalClass = 'className="absolute bottom-12 right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl"';
const usersNewClass = 'className="absolute bottom-12 right-4 flex items-center justify-center w-20 h-20 rounded-full bg-[#1e4480] text-white shadow-2xl z-10 transition-all duration-300 hover:scale-105"';

// Vamos fazer a substituicao apenas no bloco após a tag de print-slide do Slide 04
// Para isso, encontramos onde fica o SLIDE 04 PRINT
const slide04PrintIndex = content.indexOf('{/* SLIDE 04 PRINT - NOSSOS VALORES */}');
if (slide04PrintIndex !== -1) {
   let slide04Part = content.substring(slide04PrintIndex, slide04PrintIndex + 3000);
   
   if (slide04Part.includes(trophyOriginalClass)) {
      slide04Part = slide04Part.replace(trophyOriginalClass, trophyNewClass);
      console.log('✔ Trophy no PDF atualizado.');
   }
   if (slide04Part.includes(lightbulbOriginalClass)) {
      slide04Part = slide04Part.replace(lightbulbOriginalClass, lightbulbNewClass);
      console.log('✔ Lightbulb no PDF atualizado.');
   }
   if (slide04Part.includes(usersOriginalClass)) {
      slide04Part = slide04Part.replace(usersOriginalClass, usersNewClass);
      console.log('✔ Users no PDF atualizado.');
   }
   
   // Substituir no conteudo principal
   const partBefore = content.substring(0, slide04PrintIndex);
   const partAfter = content.substring(slide04PrintIndex + 3000);
   content = partBefore + slide04Part + partAfter;
   
   fs.writeFileSync(pagePath, content.split('\n').join(originalLineEnding), 'utf8');
   console.log('✔ Arquivo page.tsx atualizado com as classes de esferas no PDF!');
} else {
   console.log('⚠ Nao foi possivel encontrar a secao SLIDE 04 PRINT no page.tsx');
}
