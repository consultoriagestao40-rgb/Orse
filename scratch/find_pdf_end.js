const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

const anchor = '{/* SLIDE 13 PRINT - ACEITE */}';
const idx = content.indexOf(anchor);

if (idx === -1) {
   console.log("❌ Âncora '{/* SLIDE 13 PRINT - ACEITE */}' não encontrada!");
   
   // Vamos procurar qualquer slide de 13 print
   const match = content.match(/SLIDE\s*13/i);
   if (match) {
      console.log("Found match for SLIDE 13 at index:", match.index);
      console.log(content.substring(match.index, match.index + 500));
   } else {
      console.log("No SLIDE 13 match found at all!");
   }
} else {
   console.log("✔ Âncora encontrada no índice:", idx);
   console.log("Visualizando os próximos 2000 caracteres a partir da âncora:");
   console.log(content.substring(idx, idx + 2000));
}
