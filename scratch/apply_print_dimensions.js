const fs = require('fs');
const filePath = 'c:\\Users\\Slimpe\\Documents\\Antigravity\\app\\propostas\\nova\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Normaliza as quebras de linha para LF
content = content.replace(/\r\n/g, '\n');

// 1. Substituição do bloco @page (por volta da linha 2310)
const targetPage = '                         @page {\n                            size: A4 landscape !important;\n                            margin: 0 !important;\n                         }';
const replacementPage = '                         @page {\n                            size: 297mm 167mm !important;\n                            margin: 0 !important;\n                         }';

if (content.includes(targetPage)) {
  content = content.split(targetPage).join(replacementPage);
  console.log('✓ Bloco @page atualizado para 297mm x 167mm!');
} else {
  console.log('⚠ Não foi possível localizar o bloco @page exato. Tentando busca tolerante.');
  const pageRegex = /@page\s*\{\s*size:\s*A4\s+landscape\s*!important;\s*margin:\s*0\s*!important;\s*\}/i;
  if (pageRegex.test(content)) {
    content = content.replace(pageRegex, '@page {\n                            size: 297mm 167mm !important;\n                            margin: 0 !important;\n                         }');
    console.log('✓ Bloco @page atualizado via Regex tolerante!');
  } else {
    console.log('⚠ Bloco @page não localizado.');
  }
}

// 2. Substituição do bloco .print-slide (por volta da linha 2403)
const targetSlide = '                         .print-slide {\n                            display: flex !important;\n                            page-break-after: always !important;\n                            break-after: page !important;\n                            page-break-inside: avoid !important;\n                            break-inside: avoid !important;\n                            width: 297mm !important;\n                            height: 210mm !important;\n                            max-height: 210mm !important;\n                            box-sizing: border-box !important;\n                            margin: 0 !important;\n                            padding: 2.5rem 3.5rem !important;\n                            position: relative !important;\n                            overflow: hidden !important;\n                            border: none !important;\n                         }';

const replacementSlide = '                         .print-slide {\n                            display: flex !important;\n                            page-break-after: always !important;\n                            break-after: page !important;\n                            page-break-inside: avoid !important;\n                            break-inside: avoid !important;\n                            width: 297mm !important;\n                            height: 167mm !important;\n                            max-height: 167mm !important;\n                            box-sizing: border-box !important;\n                            margin: 0 !important;\n                            padding: 2.5rem 3.5rem !important;\n                            position: relative !important;\n                            overflow: hidden !important;\n                            border: none !important;\n                         }';

if (content.includes(targetSlide)) {
  content = content.split(targetSlide).join(replacementSlide);
  console.log('✓ Bloco .print-slide atualizado para 297mm x 167mm!');
} else {
  console.log('⚠ Não foi possível localizar o bloco .print-slide exato. Tentando busca tolerante.');
  const slideRegex = /\.print-slide\s*\{\s*display:\s*flex\s*!important;[\s\S]*?width:\s*297mm\s*!important;\s*height:\s*210mm\s*!important;[\s\S]*?\}/i;
  if (slideRegex.test(content)) {
    content = content.replace(slideRegex, `.print-slide {
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
                         }`);
    console.log('✓ Bloco .print-slide atualizado via Regex tolerante!');
  } else {
    console.log('⚠ Bloco .print-slide não localizado.');
  }
}

// Retorna as quebras de linha para CRLF
content = content.replace(/\n/g, '\r\n');
fs.writeFileSync(filePath, content, 'utf8');
console.log('🎉 Operação concluída com sucesso!');
