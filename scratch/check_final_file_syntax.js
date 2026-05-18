const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const lines = fs.readFileSync(pagePath, 'utf8').split('\n');

let braces = 0;
let parens = 0;
let brackets = 0;
let inString = null; // para rastrear se estamos dentro de strings literais em expressões JS

console.log("Iniciando varredura incremental inteligente...");

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    
    // Se estivermos dentro de uma chave (contexto JS)
    if (braces > 0) {
      // Controlar strings literais em JS para evitar contar caracteres dentro delas
      if (inString) {
        if (char === inString && line[j - 1] !== '\\') {
          inString = null;
        }
        continue;
      }
      if ((char === "'" || char === '"' || char === '`') && line[j - 1] !== '\\') {
        inString = char;
        continue;
      }
      
      // Contar parênteses e colchetes apenas se estivermos em JS
      if (char === '(') parens++;
      if (char === ')') parens--;
      if (char === '[') brackets++;
      if (char === ']') brackets--;
    }
    
    // Contar chaves sempre (já que chaves em JSX delimitam a entrada/saída de contextos JS)
    if (char === '{') {
      braces++;
    }
    if (char === '}') {
      braces--;
      // Ao fechar a chave, resetamos o estado de string se ele estiver ativo por algum motivo
      if (braces === 0) {
        inString = null;
      }
    }
  }
  
  if (braces < 0) {
    console.log(`❌ Chaves fechadas a mais na Linha ${i + 1}: ${line.trim()}`);
    console.log(`Estado: Chaves=${braces}, Parênteses=${parens}, Colchetes=${brackets}`);
    break;
  }
  if (parens < 0) {
    console.log(`❌ Parênteses fechados a mais na Linha ${i + 1} em contexto JS: ${line.trim()}`);
    console.log(`Estado: Chaves=${braces}, Parênteses=${parens}, Colchetes=${brackets}`);
    break;
  }
  if (brackets < 0) {
    console.log(`❌ Colchetes fechados a mais na Linha ${i + 1} em contexto JS: ${line.trim()}`);
    console.log(`Estado: Chaves=${braces}, Parênteses=${parens}, Colchetes=${brackets}`);
    break;
  }
  
  // Imprimir checkpoint de depuração a cada 500 linhas
  if ((i + 1) % 500 === 0 || i + 1 === 4350 || i + 1 === 5850) {
    console.log(`Linha ${i + 1}: Chaves=${braces}, Parênteses=${parens}, Colchetes=${brackets}`);
  }
}

console.log("\nVarredura finalizada.");
console.log(`Estado Final: Chaves=${braces}, Parênteses=${parens}, Colchetes=${brackets}`);
