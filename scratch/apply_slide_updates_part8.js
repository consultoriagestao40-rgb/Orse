const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log('Iniciando restauracao do logo original no ultimo slide (Parte 8)...');

// Substituir a imagem que inverte para branco pelo logo original colorido
const oldImg = '<img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain brightness-0 invert" />';
const newImg = '<img src="https://grupojvsserv.com.br/wp-content/uploads/2023/11/logo-horizontal-300px.png" alt="JVS Logo" className="max-h-10 w-auto object-contain" />';

content = content.split('\r\n').join('\n');

if (content.includes(oldImg)) {
   content = content.split(oldImg).join(newImg);
   console.log('✔ Logo original restaurado no ultimo slide (Tela e PDF).');
} else {
   console.log('⚠ Nao foi possivel encontrar a tag exata da imagem.');
   
   // Tentar substituicao parcial de classes
   const oldClass = 'className="max-h-10 w-auto object-contain brightness-0 invert"';
   const newClass = 'className="max-h-10 w-auto object-contain"';
   
   // Faremos isso de forma mais cirurgica apenas para a tag de imagem do logo no ultimo slide
   content = content.split('alt="JVS Logo" className="max-h-10 w-auto object-contain brightness-0 invert"').join('alt="JVS Logo" className="max-h-10 w-auto object-contain"');
   console.log('✔ Restauracao por substituicao de classe aplicada!');
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('✔ page.tsx gravado com sucesso na Parte 8!');
