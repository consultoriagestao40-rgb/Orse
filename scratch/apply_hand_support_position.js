const fs = require('fs');
const filePath = 'c:\\Users\\Slimpe\\Documents\\Antigravity\\app\\propostas\\nova\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Normaliza quebras de linha para LF
let lines = content.replace(/\r\n/g, '\n').split('\n');

let occurrences = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('src="/hand-support.png"')) {
    occurrences.push(i);
  }
}

console.log('Ocorrências da imagem da mão encontradas nas linhas (0-indexed):', occurrences);

if (occurrences.length === 2) {
  // Para cada ocorrência, a linha subsequente ou próxima (com a classe) precisa ser alterada.
  // A linha idx + 2 contém a classe: className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-auto pointer-events-none opacity-60 z-0"
  for (let idx of occurrences) {
    let classLineIdx = -1;
    for (let k = idx; k < idx + 5; k++) {
      if (lines[k] && lines[k].includes('className="absolute bottom-0 left-1/2')) {
        classLineIdx = k;
        break;
      }
    }
    
    if (classLineIdx !== -1) {
      console.log(`Atualizando classe da mão na linha ${classLineIdx + 1}`);
      const indent = lines[classLineIdx].match(/^\s*/)[0];
      lines[classLineIdx] = `${indent}className="absolute right-0 bottom-0 w-[440px] h-auto pointer-events-none opacity-95 z-0 mix-blend-multiply"`;
    } else {
      console.log(`⚠ Não foi possível localizar a linha de classe para a ocorrência na linha ${idx + 1}`);
    }
  }
  
  // Salva o arquivo de volta com quebras de linha CRLF
  fs.writeFileSync(filePath, lines.join('\r\n'), 'utf8');
  console.log('🎉 Posicionamento e mesclagem aplicados com sucesso absoluto!');
} else {
  console.log(`⚠ Esperava encontrar exatamente 2 ocorrências da imagem da mão, mas encontrei ${occurrences.length}.`);
}
