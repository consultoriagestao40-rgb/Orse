const fs = require('fs');
const path = 'app/propostas/nova/page.tsx';
let content = fs.readFileSync(path, 'utf8');

const lines = content.split('\n');
console.log('Total linhas:', lines.length);

// Procura todas as linhas com padStart
lines.forEach((l, i) => {
  if (l.includes('padStart')) {
    console.log(`Linha ${i+1}:`, JSON.stringify(l));
  }
});

// Corrige especificamente a linha corrompida (linha ~163, que contém \\R\\$)
const corrompidaIdx = lines.findIndex(l => l.includes('\\R\\$\\{') && l.includes('padStart'));
if (corrompidaIdx >= 0) {
  console.log('\nCorrigindo linha:', corrompidaIdx + 1);
  lines[corrompidaIdx] = "                  revisao: `R${String(fullData.versao).padStart(2, '0')}`,";
  fs.writeFileSync(path, lines.join('\n'), 'utf8');
  console.log('Corrigido!');
} else {
  console.log('Linha corrompida nao encontrada');
}
