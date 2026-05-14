const fs = require('fs');
const path = 'lib/pricingEngine.ts';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // 1. Fix the totalBlocoC calculation
  // We'll search for the block between // SOMA TOTAL BLOCO C and const custoTotalDireto
  const startMarker = '// SOMA TOTAL BLOCO C';
  const endMarker = 'const custoTotalDireto';
  
  const startIndex = content.indexOf(startMarker);
  const endIndex = content.indexOf(endMarker);
  
  if (startIndex !== -1 && endIndex !== -1) {
    const newTotalBlocoC = `// SOMA TOTAL BLOCO C
  const totalBlocoC = 
    custoVABruto + custoVTBruto + custosSindicato + 
    vaSobreFerias + cestaBasica + examesMedicos + 
    reservaTecnica + manutencaoEquipamentos + outrosBeneficios - 
    descontoVA - descontoVT;

  `;
    content = content.substring(0, startIndex) + newTotalBlocoC + content.substring(endIndex);
  }

  // 2. Fix the detalheBlocoC object
  content = content.replace(/custosSindicato: assistenciaMedica \+ assistenciaSocial \+ fundoFormacao/g, 'custosSindicato: custosSindicato');
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('Success');
} catch (err) {
  console.error(err);
}
