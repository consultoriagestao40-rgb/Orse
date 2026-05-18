const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '..', 'app', 'propostas', 'nova', 'page.tsx');
const content = fs.readFileSync(pagePath, 'utf8');

console.log("Comprimento total do arquivo:", content.length);
console.log("Mostrando o final do arquivo (dos últimos 10000 caracteres):");
console.log(content.substring(content.length - 10000));
