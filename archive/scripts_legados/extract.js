const fs = require('fs');
const content = fs.readFileSync('old_fpv.tsx', 'utf-16le');
const idx = content.indexOf(`viewMode === 'document'`);
if (idx !== -1) {
    const lines = content.substring(idx).split('\n');
    fs.writeFileSync('extracted.txt', lines.slice(0, 800).join('\n'), 'utf-8');
    console.log('Extraído com sucesso');
} else {
    console.log('Não encontrado');
}
