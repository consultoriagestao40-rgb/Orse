const { execSync } = require('child_process');
const fs = require('fs');

const commits = [
  'bfff556',
  '76a0a71',
  'd08c316',
  '6490846',
  '4796cde',
  '84786cf',
  'db46722'
];

for (const commit of commits) {
  try {
    const fileContent = execSync(`git show ${commit}:app/propostas/nova/page.tsx`, { maxBuffer: 10 * 1024 * 1024 }).toString('utf8');
    
    // Procura o trecho do Slide 05 (contendo LIMPEZA e JARDINAGEM)
    const index = fileContent.indexOf('LIMPEZA');
    if (index !== -1) {
      console.log(`\n================ COMMIT ${commit} ================`);
      const chunk = fileContent.substring(index - 200, index + 3000);
      
      // Procura se tem caminhos de SVG detalhados
      if (chunk.includes('path') && chunk.includes('svg')) {
        console.log(`Achei SVG no commit ${commit}! Gravando trecho em scratch/svg_${commit}.tsx`);
        fs.writeFileSync(`scratch/svg_${commit}.tsx`, chunk, 'utf8');
      } else {
        console.log(`Commit ${commit} não possui caminhos SVG complexos no trecho.`);
      }
    }
  } catch (err) {
    console.log(`Sem sucesso no commit ${commit}:`, err.message);
  }
}
console.log('\n🎉 Busca de historico de SVGs concluida!');
