const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

console.log('Corrigindo a sintaxe do CheckCircle2...');

// Substituir a tag incompleta pela tag corretamente fechada
const oldTag = '<CheckCircle2 size={13} className="text-[#1b4d3e] shrink-0 mt-0.5"';
const newTag = '<CheckCircle2 size={13} className="text-[#1b4d3e] shrink-0 mt-0.5" />';

content = content.split(oldTag).join(newTag);

fs.writeFileSync(pagePath, content, 'utf8');
console.log('✔ Sintaxe corrigida com sucesso!');
