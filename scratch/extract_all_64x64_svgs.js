const fs = require('fs');

try {
  const content = fs.readFileSync('c:\\Users\\Slimpe\\Documents\\Antigravity\\scratch\\page_old_utf8.tsx', 'utf8');
  
  // Encontra todas as tags <svg ... viewBox="0 0 64 64" ...> até </svg>
  const svgRegex = /<svg[^>]*viewBox="0 0 64 64"[^>]*>([\s\S]*?)<\/svg>/g;
  let match;
  let count = 0;
  
  while ((match = svgRegex.exec(content)) !== null) {
    count++;
    console.log(`\n---------------- SVG #${count} ----------------`);
    console.log(match[0].substring(0, 1000)); // Limita a visualização do trecho
  }
  console.log(`\n🎉 Total de SVGs 64x64 encontrados no backup: ${count}`);
} catch (err) {
  console.error('⚠ Erro ao ler arquivo:', err.message);
}
