const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Extrai o conteúdo da revisão antiga em UTF-8 nativo
  const buffer = execSync('git show 1c3eeec:app/propostas/nova/page.tsx');
  const content = buffer.toString('utf8');
  
  // Salva em formato UTF-8 puro no workspace
  fs.writeFileSync('c:\\Users\\Slimpe\\Documents\\Antigravity\\scratch\\page_old_utf8.tsx', content, 'utf8');
  console.log('✓ Arquivo de backup salvo perfeitamente em UTF-8!');
} catch (err) {
  console.error('⚠ Erro ao obter conteúdo do Git:', err.message);
}
