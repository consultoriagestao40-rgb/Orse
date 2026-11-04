const fs = require('fs');
const path = 'app/ccts/actions.ts';

try {
  let content = fs.readFileSync(path, 'utf8');
  
  // Replace the blocks in both createCCT and updateCCT
  const pattern = /assistenciaMedica: Number\(cctData\.assistenciaMedica\) \|\| 0,\s+assistenciaSocial: Number\(cctData\.assistenciaSocial\) \|\| 0,\s+fundoFormacao: Number\(cctData\.fundoFormacao\) \|\| 0,/g;
  
  content = content.replace(pattern, 'custosSindicato: Number(cctData.custosSindicato) || 0,');
  
  fs.writeFileSync(path, content, 'utf8');
  console.log('Success');
} catch (err) {
  console.error(err);
}
