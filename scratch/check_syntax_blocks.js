const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'scratch', 'apply_full_sync_refactor_v2.js');
const scriptContent = fs.readFileSync(pagePath, 'utf8');

// Vamos extrair as strings dos blocos do script v2
function extractBlock(varName) {
  const startStr = `const ${varName} = \``;
  const startIdx = scriptContent.indexOf(startStr);
  if (startIdx === -1) return null;
  const contentIdx = startIdx + startStr.length;
  // Encontrar o próximo \` antes de ;
  let endIdx = contentIdx;
  while (endIdx < scriptContent.length) {
    if (scriptContent[endIdx] === '`' && scriptContent[endIdx + 1] === ';') {
      break;
    }
    endIdx++;
  }
  return scriptContent.substring(contentIdx, endIdx);
}

const blocks = [
  'pdfComercialCode',
  'pdfInstitucionalCode',
  'screenComercialCode',
  'screenInstitucionalCode'
];

blocks.forEach(bName => {
  const code = extractBlock(bName);
  if (!code) {
    console.log(`❌ Não foi possível extrair o bloco ${bName}`);
    return;
  }
  
  console.log(`\n--- Analisando Bloco: ${bName} ---`);
  
  // Contar chaves
  let braces = 0;
  let parens = 0;
  let brackets = 0;
  
  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    if (char === '{') braces++;
    if (char === '}') braces--;
    if (char === '(') parens++;
    if (char === ')') parens--;
    if (char === '[') brackets++;
    if (char === ']') brackets--;
  }
  
  console.log(`Chaves ({}): ${braces === 0 ? '✔ Balanceado (0)' : '❌ Desbalanceado (' + braces + ')'}`);
  console.log(`Parênteses (()): ${parens === 0 ? '✔ Balanceado (0)' : '❌ Desbalanceado (' + parens + ')'}`);
  console.log(`Colchetes ([]): ${brackets === 0 ? '✔ Balanceado (0)' : '❌ Desbalanceado (' + brackets + ')'}`);
  
  // Vamos também contar tags div
  const openDivs = (code.match(/<div\b/g) || []).length;
  const closeDivs = (code.match(/<\/div>/g) || []).length;
  console.log(`Divs (<div> vs </div>): abertas ${openDivs}, fechadas ${closeDivs} -> ${openDivs === closeDivs ? '✔ OK' : '❌ Diferença: ' + (openDivs - closeDivs)}`);
});
