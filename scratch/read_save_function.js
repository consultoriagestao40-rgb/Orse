const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, '../app/propostas/nova/page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

content = content.split('\r\n').join('\n');

const handleSaveIdx = content.indexOf('const handleSave = async () =>');
if (handleSaveIdx !== -1) {
   console.log('--- FUNCAO handleSave COMPLETA ---');
   console.log(content.substring(handleSaveIdx, handleSaveIdx + 2000));
} else {
   console.log('⚠ Nao encontrou a funcao handleSave');
}
