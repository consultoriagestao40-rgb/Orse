const fs = require('fs');
let content = fs.readFileSync('components/PropostaApresentacaoPrint.tsx', 'utf8');

const replacements = {
  '├í': 'á',
  '├º': 'ç',
  '├Á': 'õ',
  '├ú': 'ã',
  '├¬': 'ê',
  '├¡': 'í',
  '├®': 'é',
  '├│': 'ó',
  '├║': 'ú',
  '├ó': 'â',
  '├Ü': 'Ü', // Wait, 'IND├ÜSTRIA' -> INDÚSTRIA -> ├Ü = Ú
  '├ü': 'Á', // '├üdamo' -> Ádamo
  '├ì': 'Í', // 'CONDOM├ìNIOS' -> CONDOMÍNIOS
  '├é': 'Â',
  '├Ç': 'À',
  '├Õ': 'Õ',
  '├Ç': 'À',
  '├ç': 'Ç',
  '├É': 'Ð' // Let's check others if needed
};

// Replace uppercase specifically first
content = content.replace(/├Ü/g, 'Ú');
content = content.replace(/├ü/g, 'Á');
content = content.replace(/├ì/g, 'Í');
content = content.replace(/├é/g, 'Â');
content = content.replace(/├Ç/g, 'À');
content = content.replace(/├Õ/g, 'Õ');
content = content.replace(/├ç/g, 'Ç');
content = content.replace(/├ë/g, 'É'); // OBJETO & ESCOPO T├ëCNICO -> TÉCNICO

for (const [bad, good] of Object.entries(replacements)) {
  content = content.split(bad).join(good);
}

fs.writeFileSync('components/PropostaApresentacaoPrint.tsx', content, 'utf8');
console.log('Fixed encoding in components/PropostaApresentacaoPrint.tsx');
