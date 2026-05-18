const fs = require('fs');
const filePath = 'c:\\Users\\Slimpe\\Documents\\Antigravity\\app\\propostas\\nova\\page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Normaliza quebras de linha para LF
let lines = content.replace(/\r\n/g, '\n').split('\n');

let occurrences = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('photo-1554415707-6e8cfc93fe23')) {
    occurrences.push(i);
  }
}

console.log('Ocorrências encontradas nas linhas (0-indexed):', occurrences);

if (occurrences.length === 2) {
  // Processa de trás para frente para manter os índices corretos das linhas anteriores
  for (let j = occurrences.length - 1; j >= 0; j--) {
    const idx = occurrences[j];
    
    // Identifica as linhas do bloco antigo a serem removidas (idx - 2 a idx + 1)
    // idx - 2: <div
    // idx - 1: className="absolute right-0 bottom-0...
    // idx: style={{ backgroundImage...
    // idx + 1: ></div>
    
    console.log(`Removendo bloco antigo por volta da linha ${idx + 1}:`);
    console.log(' - ' + lines[idx - 2].trim());
    console.log(' - ' + lines[idx - 1].trim());
    console.log(' - ' + lines[idx].trim());
    console.log(' - ' + lines[idx + 1].trim());
    
    // Remove as 4 linhas
    lines.splice(idx - 2, 4);
    
    // Agora, precisamos encontrar onde está `<div className="relative w-full h-[220px] z-20">`
    // Como removemos 4 linhas, a div do contêiner subsequente estará mais acima.
    // Vamos procurar de idx-2 para frente pela div contêiner dos círculos
    let containerIdx = -1;
    for (let k = idx - 2; k < idx + 5; k++) {
      if (lines[k] && lines[k].includes('relative w-full h-[220px] z-20')) {
        containerIdx = k;
        break;
      }
    }
    
    if (containerIdx !== -1) {
      console.log(`Inserindo imagem da mão no contêiner na linha ${containerIdx + 1}`);
      
      // Define a indentação com base na linha encontrada
      const indent = lines[containerIdx].match(/^\s*/)[0];
      
      const imageLines = [
        `${indent}   <img `,
        `${indent}      src="/hand-support.png" `,
        `${indent}      alt="Mão de suporte"`,
        `${indent}      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[240px] h-auto pointer-events-none opacity-60 z-0" `,
        `${indent}   />`
      ];
      
      // Insere as linhas de imagem logo após a abertura da div do contêiner
      lines.splice(containerIdx + 1, 0, ...imageLines);
    } else {
      console.log('⚠ Não foi possível encontrar a div de contêiner dos círculos.');
    }
  }
  
  // Salva o arquivo de volta com quebras de linha CRLF
  fs.writeFileSync(filePath, lines.join('\r\n'), 'utf8');
  console.log('🎉 Operação executada com sucesso absoluto em ambos os slides!');
} else {
  console.log(`⚠ Esperava encontrar exatamente 2 ocorrências, mas encontrei ${occurrences.length}. Nenhuma alteração foi feita.`);
}
