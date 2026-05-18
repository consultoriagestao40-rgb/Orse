const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
let lines = fs.readFileSync(pagePath, 'utf8').split('\n');

const errorLines = [5151, 5212, 5413, 5531];

errorLines.forEach(lineNum => {
   console.log(`\n=== LINHA ${lineNum} (Contexto +/- 5 linhas) ===`);
   const start = Math.max(0, lineNum - 6);
   const end = Math.min(lines.length - 1, lineNum + 5);
   for (let i = start; i <= end; i++) {
      console.log(`${i + 1}: ${lines[i]}`);
   }
});
