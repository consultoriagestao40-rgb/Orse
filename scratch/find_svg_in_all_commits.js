const { execSync } = require('child_process');
const fs = require('fs');

try {
  const log = execSync('git log --format=%H -- app/propostas/nova/page.tsx').toString('utf8');
  const commits = log.split('\n').map(c => c.trim()).filter(Boolean);
  
  console.log(`Analisando complexidade de SVGs em ${commits.length} commits...`);
  
  for (const commit of commits) {
    try {
      const fileContent = execSync(`git show ${commit}:app/propostas/nova/page.tsx`, { maxBuffer: 15 * 1024 * 1024 }).toString('utf8');
      
      // Procura viewBox="0 0 64 64"
      if (fileContent.includes('viewBox="0 0 64 64"')) {
        // Encontra os SVGs e verifica a complexidade (tamanho do path)
        const svgRegex = /<svg[^>]*viewBox="0 0 64 64"[^>]*>([\s\S]*?)<\/svg>/g;
        let match;
        let count = 0;
        let complexCount = 0;
        let extracted = '';
        
        while ((match = svgRegex.exec(fileContent)) !== null) {
          count++;
          const svgMarkup = match[0];
          // Se o SVG for rico em detalhes (tamanho maior que 1000 caracteres), indica que é a versão premium
          if (svgMarkup.length > 1000) {
            complexCount++;
            extracted += `\n\n/* ================ SVG PREMIUM #${complexCount} (Original SVG #${count}) ================ */\n` + svgMarkup;
          }
        }
        
        if (complexCount >= 3) {
          console.log(`\n🎉 ENCONTREI OS SVGs PREMIUM NO COMMIT: ${commit}!`);
          console.log(`✓ Possui ${complexCount} SVGs complexos de alta definicao.`);
          fs.writeFileSync(`scratch/svgs_premium_from_${commit}.txt`, extracted, 'utf8');
          console.log(`✓ Gravado svgs_premium_from_${commit}.txt!`);
          break; // Achou!
        }
      }
    } catch (e) {
      // Ignora erros
    }
  }
  console.log('\n🎉 Busca de SVGs complexos concluida!');
} catch (err) {
  console.error('⚠ Erro geral:', err.message);
}
